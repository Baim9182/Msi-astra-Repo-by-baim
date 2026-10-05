/* ==========================================================
   MSI ASTRA v2.0 — Multi-File Version
   ========================================================== */
const CONFIG = {
  appName: "MSI ASTRA",

  api: {
    baseUrl: "https://msi-astra-worker.muhammadbaimab.workers.dev"
  },

  adminKeyHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",

  webhookSaran: "https://discord.com/api/webhooks/1556123893679525918/CzaMKFNp4eRiVHAGCy9Jzsyfry86SecT40jbwywIuVP15kOB8gBug__MfDcPiVye7iLF",

  dailyLimit: 5,

  developer: {
    name: "Baim",
    username: "@wthf_b6",
    role: "AI-Assisted Developer",
    profileImage: "https://i.ibb.co.com/twHc7kkk/Proyek-Baru-14-B060999.png",
    bannerImage:  "https://i.ibb.co.com/Wpfcnm91/a75a910e72dc11e3d0cab3b195729320.jpg",
    description: "Gw suka minta bantuan AI buat ngoding, cari solusi, debugging, bikin desain, sampai nyari ide. Gw mungkin belum jago semuanya, tapi gw suka belajar sambil jalan.",
    badges: [
      { label:"AI Assisted", icon:"fa-solid fa-robot" },
      { label:"Logic",       icon:"fa-solid fa-brain" },
      { label:"WebView",     icon:"fa-solid fa-globe" },
      { label:"Android",     icon:"fa-brands fa-android" },
      { label:"UI Design",   icon:"fa-solid fa-palette" },
      { label:"Problem Solving", icon:"fa-solid fa-lightbulb" }
    ]
  },

  contact: {
    whatsapp: "https://wa.me/6281358070254",
    channel:  "https://whatsapp.com/channel/0029VbDBt0sG8l5L7EEaW614"
  }
};

/* ==========================================================
   CONSTANTS
   ========================================================== */
const DEVICE_KEY  = "msi_device";
const SESSION_KEY = "msi_session";
const THEME_KEY   = "msi_theme";
const LAPOR_KEY   = "msi_lapor_history";
const SEEN_CHANGELOG_KEY = "msi_seen_changelog";

let DEVICE_ID = "";
try{
  DEVICE_ID = localStorage.getItem(DEVICE_KEY);
  if(!DEVICE_ID){
    DEVICE_ID = "dev_" + Math.random().toString(36).slice(2,12) + Date.now().toString(36);
    localStorage.setItem(DEVICE_KEY, DEVICE_ID);
  }
}catch(e){ DEVICE_ID = "temp_" + Date.now(); }

let CLOUD_DATA = null;
let IS_ADMIN = false;
let ADMIN_TAB = "services";
let ADMIN_EDITING = null;
let BANNER_INDEX = 0;
let BANNER_TIMER = null;

const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const esc = (s="") => String(s).replace(/[&<>"']/g,x=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[x]));

const DEFAULT_DATA = {
  services: [],
  products: [],
  payment: [],
  banners: [],
  changelog: [],
  site: {
    mode: "open",
    maintenanceMessage: "Kami sedang melakukan perbaikan. Balik lagi nanti ya!",
    maintenanceEta: "",
    changelogVersion: ""
  },
  admin: { claimed: false, ownerId: null, claimedAt: null }
};

/* ==========================================================
   FRAGMENT LOADER — auto-cache HTML pages
   ========================================================== */
const FRAGMENT_CACHE = {};

async function loadFragment(name){
  if(FRAGMENT_CACHE[name]) return FRAGMENT_CACHE[name];
  try{
    const r = await fetch(`pages/${name}.html?v=2`);
    if(!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    FRAGMENT_CACHE[name] = html;
    return html;
  }catch(e){
    console.error("[Fragment] load error:", name, e);
    return `<div class="empty" style="margin-top:20px">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <p>Gagal memuat halaman "${esc(name)}".</p>
    </div>`;
  }
}

function loadingHTML(){
  return `<div style="padding:60px 20px;text-align:center">
    <i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:var(--primary)"></i>
    <p style="margin-top:14px;color:var(--muted);font-size:12.5px">Memuat halaman...</p>
  </div>`;
}

/* ==========================================================
   CLOUD via WORKER
   ========================================================== */
async function cloudLoad(){
  if(!CONFIG.api?.baseUrl) return null;
  try{
    const r = await fetch(`${CONFIG.api.baseUrl}/data`, { method: "GET" });
    if(!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }catch(e){
    console.warn("[Cloud] load error:", e);
    return null;
  }
}

async function cloudSave(data){
  if(!CONFIG.api?.baseUrl) return false;
  try{
    const r = await fetch(`${CONFIG.api.baseUrl}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if(!r.ok) return false;
    const j = await r.json();
    return j.ok === true;
  }catch(e){
    console.warn("[Cloud] save error:", e);
    return false;
  }
}

async function persistCloud(){
  if(!CLOUD_DATA) return false;
  return await cloudSave(CLOUD_DATA);
}

function ensureStructure(data){
  if(!data) data = {};
  data.services = Array.isArray(data.services) ? data.services : [];
  data.products = Array.isArray(data.products) ? data.products : [];
  data.payment  = Array.isArray(data.payment)  ? data.payment  : [];
  data.banners  = Array.isArray(data.banners)  ? data.banners  : [];
  data.changelog= Array.isArray(data.changelog)? data.changelog: [];
  data.site     = data.site || { mode: "open", maintenanceMessage: "Website lagi diperbaiki.", maintenanceEta: "", changelogVersion: "" };
  data.admin    = data.admin || { claimed: false, ownerId: null, claimedAt: null };
  return data;
}

/* ==========================================================
   HELPERS
   ========================================================== */
async function sha256(txt){
  const buf = new TextEncoder().encode(txt);
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2,"0")).join("");
}

function toast(msg, type="info"){
  const wrap = $("#toastWrap");
  if(!wrap) return;
  const el = document.createElement("div");
  el.className = "toast " + type;
  const icons = { success:"fa-solid fa-circle-check", error:"fa-solid fa-circle-exclamation", info:"fa-solid fa-circle-info" };
  el.innerHTML = `<i class="${icons[type]||icons.info}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(()=>el.remove(), 300); }, 2800);
}

function copyText(text){
  const done = ()=>toast("Berhasil disalin.","success");
  const fallback = ()=>{
    try{
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText="position:fixed;opacity:0;";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove(); done();
    }catch(e){ toast("Gagal menyalin.","error"); }
  };
  if(navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else fallback();
}

function statusBadge(status){
  const s = (status||"").toLowerCase();
  let cls = "available";
  if(s.includes("tidak") || s.includes("unavailable")) cls = "unavailable";
  else if(s.includes("pre")) cls = "preorder";
  else if(s.includes("coming")) cls = "comingsoon";
  else if(s.includes("maintenance")) cls = "maintenance";
  return `<span class="badge ${cls}">${esc(status||"Tersedia")}</span>`;
}

window.hashAdminKey = async function(pass){
  const p = pass || prompt("Password baru:");
  if(!p) return;
  const h = await sha256(p);
  console.log("%cHash: " + h, "color:#6c7cff;font-weight:bold");
  try{ await navigator.clipboard.writeText(h); alert("Hash dicopy:\n\n" + h); }
  catch(e){ prompt("Copy manual:", h); }
  return h;
};

/* ==========================================================
   LAPOR — DAILY LIMIT
   ========================================================== */
function getTodayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getLaporHistory(){
  try{
    const raw = localStorage.getItem(LAPOR_KEY);
    if(!raw) return { date: getTodayKey(), count: 0, items: [] };
    const h = JSON.parse(raw);
    if(h.date !== getTodayKey()) return { date: getTodayKey(), count: 0, items: [] };
    return h;
  }catch(e){ return { date: getTodayKey(), count: 0, items: [] }; }
}
function setLaporHistory(h){
  try{ localStorage.setItem(LAPOR_KEY, JSON.stringify(h)); }catch(e){}
}
function getRemainingLapor(){
  const h = getLaporHistory();
  return Math.max(0, CONFIG.dailyLimit - h.count);
}
function incrementLapor(data){
  const h = getLaporHistory();
  h.count += 1;
  h.items.push({ t: Date.now(), ...data });
  setLaporHistory(h);
}

/* ==========================================================
   BANNER CAROUSEL
   ========================================================== */
function renderBannerCarousel(){
  const track = $("#bannerTrack");
  const dots = $("#bannerDots");
  if(!track || !dots) return;

  const list = CLOUD_DATA?.banners || [];

  if(!list.length){
    track.innerHTML = `
      <div class="banner-slide active">
        <div class="banner-slide-content">
          <div class="banner-slide-title">Selamat Datang di MSI ASTRA</div>
          <div class="banner-slide-desc">Jasa, produk digital, dan project custom</div>
        </div>
      </div>`;
    dots.innerHTML = "";
    return;
  }

  track.innerHTML = list.map((b, i) => `
    <div class="banner-slide ${i===0?'active':''}">
      ${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.title||'')}" onerror="this.style.display='none'">` : ''}
      <div class="banner-slide-content">
        ${b.title ? `<div class="banner-slide-title">${esc(b.title)}</div>` : ''}
        ${b.description ? `<div class="banner-slide-desc">${esc(b.description)}</div>` : ''}
      </div>
    </div>
  `).join("");

  dots.innerHTML = list.map((_, i) =>
    `<div class="banner-dot ${i===0?'active':''}" data-dot="${i}"></div>`
  ).join("");

  BANNER_INDEX = 0;
  if(BANNER_TIMER) clearInterval(BANNER_TIMER);
  if(list.length > 1){
    BANNER_TIMER = setInterval(() => {
      BANNER_INDEX = (BANNER_INDEX + 1) % list.length;
      updateBannerPosition();
    }, 4500);
  }

  dots.querySelectorAll("[data-dot]").forEach(d => {
    d.onclick = () => {
      BANNER_INDEX = Number(d.dataset.dot);
      updateBannerPosition();
      if(BANNER_TIMER) clearInterval(BANNER_TIMER);
      BANNER_TIMER = setInterval(() => {
        BANNER_INDEX = (BANNER_INDEX + 1) % list.length;
        updateBannerPosition();
      }, 4500);
    };
  });
}

function updateBannerPosition(){
  const track = $("#bannerTrack");
  const dots = $$("#bannerDots .banner-dot");
  const slides = $$("#bannerTrack .banner-slide");
  if(!track) return;
  track.style.transform = `translateX(-${BANNER_INDEX * 100}%)`;
  slides.forEach((s, i) => s.classList.toggle("active", i === BANNER_INDEX));
  dots.forEach((d, i) => d.classList.toggle("active", i === BANNER_INDEX));
}

/* ==========================================================
   RENDER MAIN PAGES
   ========================================================== */
function cardHTML(item, idx, type){
  return `
  <article class="card" data-type="${type}" data-idx="${idx}" tabindex="0" role="button">
    <div class="card-icon"><i class="${esc(item.icon||'fa-solid fa-box')}"></i></div>
    <div class="card-body">
      <div class="card-head">
        <div class="card-title">${esc(item.name)}</div>
        ${statusBadge(item.status)}
      </div>
      <p class="card-desc">${esc(item.description||"")}</p>
      <div class="card-foot">
        <span class="card-price">${esc(item.price||"-")}</span>
      </div>
    </div>
  </article>`;
}

function emptyState(msg){
  return `<div class="empty"><i class="fa-regular fa-folder-open"></i><p>${esc(msg)}</p></div>`;
}

function renderServices(){
  const grid = $("#servicesGrid");
  const homeGrid = $("#homeServices");
  const list = CLOUD_DATA?.services || [];
  if(!grid) return;
  if(!list.length){
    grid.innerHTML = emptyState("Belum ada jasa.");
    if(homeGrid) homeGrid.innerHTML = "";
    const c = $("#servicesCount"); if(c) c.textContent = "";
    return;
  }
  grid.innerHTML = list.map((s,i)=>cardHTML(s,i,"service")).join("");
  if(homeGrid) homeGrid.innerHTML = list.slice(0,3).map((s,i)=>cardHTML(s,i,"service")).join("");
  const c = $("#servicesCount"); if(c) c.textContent = list.length + " item";
}

function renderProducts(){
  const grid = $("#productsGrid");
  const list = CLOUD_DATA?.products || [];
  if(!grid) return;
  if(!list.length){
    grid.innerHTML = emptyState("Belum ada produk.");
    const c = $("#productsCount"); if(c) c.textContent = "";
    return;
  }
  grid.innerHTML = list.map((p,i)=>cardHTML(p,i,"product")).join("");
  const c = $("#productsCount"); if(c) c.textContent = list.length + " item";
}

function renderPayment(){
  const grid = $("#payGrid");
  if(!grid) return;
  const list = CLOUD_DATA?.payment || [];
  if(!list.length){ grid.innerHTML = emptyState("Belum ada metode pembayaran."); return; }

  grid.innerHTML = list.map(p => {
    const st = (p.status||"available").toLowerCase();
    const isM = st === "maintenance";
    const isUnavail = st === "unavailable";

    let actionHTML = "";
    if(isM){
      actionHTML = `<button class="pay-action" disabled>Maintenance</button>`;
    } else if(isUnavail){
      actionHTML = `<button class="pay-action" disabled style="opacity:.6">Belum Tersedia</button>`;
    } else if(p.type === "qris"){
      actionHTML = `<button class="pay-action" data-pay="qris" data-id="${esc(p.id||'qris')}">Lihat</button>`;
    } else if(p.type === "phone"){
      actionHTML = `<button class="pay-action" data-copy="${esc(p.value)}">Salin</button>`;
    } else if(p.type === "url"){
      actionHTML = `<a class="pay-action" href="${esc(p.value)}" target="_blank" rel="noopener">Buka</a>`;
    }

    const infoText = p.type === "qris" ? "Semua e-wallet & bank" : (p.value || "-");

    return `
    <div class="pay-card ${isM||isUnavail ? 'maintenance' : ''}">
      <div class="pay-icon" style="color:${esc(p.color||'#fff')}">
        <i class="${esc(p.icon||'fa-solid fa-wallet')}"></i>
      </div>
      <div class="pay-body">
        <div class="pay-name">
          ${esc(p.name||p.id||'Payment')}
          ${isM ? '<span class="badge maintenance">Maintenance</span>' : ''}
          ${isUnavail ? '<span class="badge unavailable">Off</span>' : ''}
        </div>
        <div class="pay-info" style="${p.type==='qris'?'font-family:inherit':''}">${esc(infoText)}</div>
      </div>
      ${actionHTML}
    </div>`;
  }).join("");
}

function renderContact(){
  const d = CONFIG.developer;
  const c = CONFIG.contact;
  const setSrc = (id,val)=>{ const el=$(id); if(el) el.src=val||""; };
  const setTxt = (id,val)=>{ const el=$(id); if(el) el.textContent=val; };
  const setHref = (id,val)=>{ const el=$(id); if(el) el.href=val; };

  setSrc("#contactAvatar", d.profileImage);
  setTxt("#contactName", d.name);
  setTxt("#contactRole", d.role);
  setHref("#contactWa", c.whatsapp);
  setHref("#contactChannel", c.channel);
  setHref("#homeWaBtn", c.whatsapp);
  setHref("#payConfirmBtn", c.whatsapp + (c.whatsapp.includes("?")?"&":"?") +
    "text=" + encodeURIComponent("Halo, gw udah bayar. Ini bukti transfernya."));
}

function refreshAll(){
  renderBannerCarousel();
  renderServices();
  renderProducts();
  renderPayment();
  renderContact();
}

/* ==========================================================
   MAINTENANCE / CHANGELOG
   ========================================================== */
function checkMaintenance(){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const overlay = $("#userMaintOverlay");
  if(!overlay) return;

  if(mode === "maintenance" && !IS_ADMIN){
    $("#userMaintMsg").textContent = site.maintenanceMessage || "Website lagi diperbaiki.";
    const eta = $("#userMaintEta");
    if(eta) eta.textContent = site.maintenanceEta ? "Estimasi: " + site.maintenanceEta : "";
    overlay.classList.add("show");
    document.body.classList.add("no-scroll");
  } else {
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
}

function checkChangelog(){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const list = CLOUD_DATA?.changelog || [];

  if(mode !== "update" || !list.length) return;

  const latest = list[0];
  if(!latest || !latest.version) return;

  let seen = null;
  try{ seen = localStorage.getItem(SEEN_CHANGELOG_KEY); }catch(e){}
  if(seen === latest.version) return;

  const overlay = $("#changelogOverlay");
  $("#changelogVersion").textContent = "v" + latest.version;
  $("#changelogDate").textContent = latest.date || "";

  const changes = Array.isArray(latest.changes) ? latest.changes :
                  (typeof latest.changes === "string" ? latest.changes.split("\n").filter(Boolean) : []);

  $("#changelogList").innerHTML = changes.map(ch => `
    <div class="changelog-item">
      <i class="fa-solid fa-circle-check"></i>
      <span>${esc(ch)}</span>
    </div>
  `).join("") || "<p style='font-size:12px;color:var(--muted)'>Tidak ada detail.</p>";

  overlay.classList.add("show");
  document.body.classList.add("no-scroll");

  $("#changelogClose").onclick = () => {
    try{ localStorage.setItem(SEEN_CHANGELOG_KEY, latest.version); }catch(e){}
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  };
}

/* ==========================================================
   ADMIN AUTH
   ========================================================== */
function checkIsAdmin(){
  const a = CLOUD_DATA?.admin || {};
  try{
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if(!s || s.deviceId !== DEVICE_ID || Date.now() >= s.exp){
      IS_ADMIN = false;
      return false;
    }
    if(!a.claimed || a.ownerId !== DEVICE_ID){
      try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
      IS_ADMIN = false;
      return false;
    }
    IS_ADMIN = true;
    return true;
  }catch(e){
    IS_ADMIN = false;
    return false;
  }
}

function setSession(){
  try{
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      deviceId: DEVICE_ID,
      exp: Date.now() + (7 * 86400000)
    }));
  }catch(e){}
}

function clearSession(){
  try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
}

async function performAdminLogin(key){
  const hash = await sha256(key);
  if(hash !== CONFIG.adminKeyHash){
    return { ok:false, reason:"Key salah." };
  }
  const a = CLOUD_DATA?.admin || {};
  if(a.claimed && a.ownerId && a.ownerId !== DEVICE_ID){
    return { ok:false, reason:"Key sudah dipakai di device lain." };
  }
  CLOUD_DATA.admin = CLOUD_DATA.admin || {};
  CLOUD_DATA.admin.claimed = true;
  CLOUD_DATA.admin.ownerId = DEVICE_ID;
  CLOUD_DATA.admin.claimedAt = new Date().toISOString();

  const saved = await persistCloud();
  if(!saved){
    CLOUD_DATA.admin.claimed = false;
    CLOUD_DATA.admin.ownerId = null;
    CLOUD_DATA.admin.claimedAt = null;
    return { ok:false, reason:"Gagal simpan ke cloud. Cek Worker." };
  }
  setSession();
  IS_ADMIN = true;
  return { ok:true };
}

function openAdminLogin(){
  $("#adminLoginModal").classList.add("show");
  setTimeout(()=>$("#adminKeyInput")?.focus(), 150);
}
function closeAdminLogin(){
  $("#adminLoginModal").classList.remove("show");
  const inp = $("#adminKeyInput"); if(inp) inp.value = "";
  const err = $("#adminLoginErr"); if(err) err.style.display = "none";
}

function initAdminLogin(){
  const closeBtn = $("#adminLoginClose");
  const modal = $("#adminLoginModal");
  const inp = $("#adminKeyInput");
  const btn = $("#adminLoginSubmit");
  const err = $("#adminLoginErr");
  if(!closeBtn || !modal || !inp || !btn) return;

  closeBtn.onclick = closeAdminLogin;
  modal.onclick = e => { if(e.target.id === "adminLoginModal") closeAdminLogin(); };
  inp.addEventListener("keydown", e => { if(e.key === "Enter") btn.click(); });

  btn.onclick = async () => {
    const val = inp.value.trim();
    if(!val){ err.textContent = "Key gak boleh kosong."; err.style.display="block"; return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifikasi...';
    err.style.display = "none";

    const res = await performAdminLogin(val);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-unlock"></i> Masuk';

    if(res.ok){
      closeAdminLogin();
      toast("Welcome, Admin!","success");
      applyAdminMode();
      checkMaintenance();
      checkChangelog();
      setTimeout(()=>openAdminPanel(), 300);
    } else {
      err.textContent = res.reason || "Gagal login.";
      err.style.display = "block";
    }
  };
}

function applyAdminMode(){
  const adminBtn = $("#sidebarAdminBtn");
  const adminLabel = $("#adminSectionLabel");
  if(IS_ADMIN){
    if(adminBtn) adminBtn.style.display = "flex";
    if(adminLabel) adminLabel.style.display = "block";
  } else {
    if(adminBtn) adminBtn.style.display = "none";
    if(adminLabel) adminLabel.style.display = "none";
  }
}

/* ==========================================================
   SIDEBAR
   ========================================================== */
function openSidebar(){
  $("#sidebar")?.classList.add("show");
  $("#sidebarOverlay")?.classList.add("show");
  document.body.classList.add("no-scroll");
}
function closeSidebar(){
  $("#sidebar")?.classList.remove("show");
  $("#sidebarOverlay")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

function initSidebar(){
  $("#sidebarToggle")?.addEventListener("click", openSidebar);
  $("#sidebarClose")?.addEventListener("click", closeSidebar);
  $("#sidebarOverlay")?.addEventListener("click", closeSidebar);

  $$("[data-sidebar]").forEach(el => {
    el.addEventListener("click", () => {
      const target = el.dataset.sidebar;
      closeSidebar();
      setTimeout(()=>{
        if(target === "admin") openAdminPanel();
        else openFullPage(target);
      }, 250);
    });
  });

  $("#themeBtn")?.addEventListener("click", ()=>$("#themePanel").classList.add("show"));
  $("#themeClose")?.addEventListener("click", ()=>$("#themePanel").classList.remove("show"));
  $("#themePanel")?.addEventListener("click", e=>{ if(e.target.id==="themePanel") e.target.classList.remove("show"); });
  $("#themeGrid")?.addEventListener("click", e=>{
    const sw = e.target.closest(".theme-swatch");
    if(!sw) return;
    applyTheme(sw.dataset.theme);
    toast("Tema diubah.","success");
  });
}

/* ==========================================================
   FULLPAGE — About / Lapor / Order
   ========================================================== */
const FULLPAGE_TITLES = {
  about: "About Dev",
  lapor: "Lapor Bug / Saran / Ide",
  order: "Order APK / Web Auto"
};

const FULLPAGE_BINDERS = {
  about: bindAboutPage,
  lapor: bindLaporPage,
  order: bindOrderPage
};

async function openFullPage(type){
  if(!FULLPAGE_TITLES[type]) return;

  const fp = $("#fullpage");
  const title = $("#fullpageTitle");
  const body = $("#fullpageBody");
  if(!fp || !title || !body) return;

  title.textContent = FULLPAGE_TITLES[type];
  body.innerHTML = loadingHTML();

  fp.classList.add("show");
  document.body.classList.add("no-scroll");

  const html = await loadFragment(type);
  body.innerHTML = html;

  const binder = FULLPAGE_BINDERS[type];
  if(typeof binder === "function") binder();
}

function closeFullPage(){
  $("#fullpage")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ---- ABOUT PAGE BINDER ---- */
function bindAboutPage(){
  // Tidak ada event khusus. Konten di-render dari HTML fragment.
}

/* ---- LAPOR PAGE BINDER ---- */
function bindLaporPage(){
  const form = $("#laporForm");
  if(!form) return;

  const nameEl = $("#lfName");
  const catEl = $("#lfCategory");
  const msgEl = $("#lfMessage");
  const countEl = $("#lfCount");
  const submitBtn = $("#lfSubmit");

  try{
    const lastName = localStorage.getItem("msi_lapor_name") || "";
    if(lastName) nameEl.value = lastName;
  }catch(e){}

  const updateCount = () => {
    const len = msgEl.value.length;
    countEl.textContent = len + " / 800";
    countEl.classList.toggle("warn", len >= 600 && len < 750);
    countEl.classList.toggle("danger", len >= 750);
  };
  msgEl.addEventListener("input", updateCount);
  updateCount();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const remaining = getRemainingLapor();
    if(remaining <= 0){
      toast("Kuota pesan hari ini habis.","error");
      return;
    }
    const nama = nameEl.value.trim();
    if(!nama){
      toast("Isi nama/username dulu ya.","error");
      nameEl.focus();
      return;
    }
    const pesan = msgEl.value.trim();
    if(pesan.length < 5){
      toast("Pesan minimal 5 karakter.","error");
      msgEl.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kirim...';
    const kategori = catEl.value;
    try{ localStorage.setItem("msi_lapor_name", nama); }catch(e){}

    const ok = await sendLaporToDiscord({ nama, kategori, pesan });

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-brands fa-discord"></i> Kirim Pesan';

    if(ok){
      incrementLapor({ nama, kategori, pesan: pesan.slice(0,100) });
      toast("Pesan kekirim. Makasih!","success");
      setTimeout(()=>openFullPage("lapor"), 500);
    } else {
      toast("Gagal kirim pesan.","error");
    }
  });
}

async function sendLaporToDiscord(payload){
  const url = (CONFIG.webhookSaran || "").trim();
  if(!url || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(url)) return false;

  const d = CONFIG.developer;
  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const tanggal = `${String(now.getDate()).padStart(2,"0")} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  const body = {
    username: (d.name || "MSI ASTRA").slice(0, 80),
    avatar_url: d.profileImage,
    allowed_mentions: { parse: [] },
    embeds: [{
      title: "Pesan Baru dari User",
      description: "Ada masukan baru masuk.",
      color: 0x6c7cff,
      author: { name: "MSI ASTRA • Lapor", icon_url: d.profileImage },
      thumbnail: { url: d.profileImage },
      fields: [
        { name: "Pengirim", value: "```" + payload.nama.slice(0,90) + "```", inline: true },
        { name: "Kategori", value: "```" + (payload.kategori||"-").slice(0,90) + "```", inline: true },
        { name: "Isi Pesan", value: "```\n" + payload.pesan.slice(0,1000) + "\n```", inline: false }
      ],
      footer: { text: `MSI ASTRA App • ${tanggal}`, icon_url: d.profileImage },
      timestamp: now.toISOString()
    }]
  };

  const jsonStr = JSON.stringify(body);
  if(navigator.sendBeacon){
    try{
      const blob = new Blob([jsonStr], { type: "application/json" });
      if(navigator.sendBeacon(url, blob)) return true;
    }catch(e){}
  }
  try{
    fetch(url, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"text/plain" }, body: jsonStr }).catch(()=>{});
    return true;
  }catch(e){ return false; }
}

/* ---- ORDER PAGE BINDER ---- */
function bindOrderPage(){
  // Static content — no events
}

/* ==========================================================
   ADMIN PANEL — Load dari fragment
   ========================================================== */
async function openAdminPanel(){
  if(!IS_ADMIN){ toast("Akses ditolak.","error"); return; }
  ADMIN_EDITING = null;
  const modal = $("#adminPanelModal");
  const box = $("#adminPanelBox");
  if(!modal || !box) return;

  modal.classList.add("show");
  box.innerHTML = loadingHTML();

  const html = await loadFragment("admin");
  box.innerHTML = html;

  renderAdminPanel();
}

function closeAdminPanel(){
  $("#adminPanelModal").classList.remove("show");
  ADMIN_EDITING = null;
}

const ADMIN_LABELS = {
  services: "Jasa",
  products: "Produk",
  payment:  "Payment",
  banners:  "Banner",
  changelog:"Changelog",
  website:  "Website"
};

const ADMIN_FIELDS = {
  services: [
    { k:"name", l:"Nama Jasa", type:"text" },
    { k:"description", l:"Deskripsi", type:"textarea" },
    { k:"price", l:"Harga", type:"text" },
    { k:"status", l:"Status", type:"select", opts:["Tersedia","Tidak Tersedia","Pre-Order","Coming Soon"] },
    { k:"icon", l:"Icon (Font Awesome class)", type:"text" }
  ],
  products: [
    { k:"name", l:"Nama Produk", type:"text" },
    { k:"description", l:"Deskripsi", type:"textarea" },
    { k:"price", l:"Harga", type:"text" },
    { k:"status", l:"Status", type:"select", opts:["Tersedia","Tidak Tersedia","Pre-Order","Coming Soon"] },
    { k:"icon", l:"Icon (Font Awesome class)", type:"text" }
  ],
  payment: [
    { k:"id", l:"ID Unik", type:"text" },
    { k:"name", l:"Nama Payment", type:"text" },
    { k:"icon", l:"Icon (Font Awesome)", type:"text" },
    { k:"color", l:"Warna (hex)", type:"text" },
    { k:"type", l:"Tipe", type:"select", opts:["qris","phone","url"] },
    { k:"value", l:"Value", type:"textarea" },
    { k:"status", l:"Status", type:"select", opts:["available","unavailable","maintenance"] }
  ],
  banners: [
    { k:"title", l:"Judul Banner", type:"text" },
    { k:"description", l:"Deskripsi", type:"text" },
    { k:"image", l:"URL Gambar", type:"text" },
    { k:"link", l:"Link (opsional)", type:"text" }
  ],
  changelog: [
    { k:"version", l:"Versi (contoh: 1.0.1)", type:"text" },
    { k:"date", l:"Tanggal (contoh: 5 Okt 2026)", type:"text" },
    { k:"changes", l:"Perubahan (pisahkan dengan enter)", type:"textarea" }
  ]
};

function renderAdminPanel(){
  const box = $("#adminPanelBox");
  if(!box) return;

  // Render tabs
  const tabsEl = box.querySelector("#adminTabs");
  if(tabsEl){
    tabsEl.innerHTML = Object.entries(ADMIN_LABELS).map(([k,v]) =>
      `<button data-tab="${k}" class="${k===ADMIN_TAB?'active':''}">${v}</button>`
    ).join("");
    tabsEl.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
      ADMIN_TAB = b.dataset.tab;
      ADMIN_EDITING = null;
      renderAdminPanel();
    });
  }

  // Bind shell actions
  const closeBtn = box.querySelector("[data-act='close']");
  if(closeBtn) closeBtn.onclick = closeAdminPanel;

  const logoutBtn = box.querySelector("[data-act='logout']");
  if(logoutBtn){
    logoutBtn.onclick = async () => {
      if(!confirm("Logout admin? Device lain bakal bisa login lagi.")) return;
      if(CLOUD_DATA?.admin){
        CLOUD_DATA.admin.claimed = false;
        CLOUD_DATA.admin.ownerId = null;
        CLOUD_DATA.admin.claimedAt = null;
        await persistCloud();
      }
      clearSession();
      IS_ADMIN = false;
      closeAdminPanel();
      applyAdminMode();
      checkMaintenance();
      toast("Logout berhasil.","success");
    };
  }

  const syncBtn = box.querySelector("[data-act='sync']");
  if(syncBtn){
    syncBtn.onclick = async () => {
      const data = await cloudLoad();
      if(!data){ toast("Gagal sync.","error"); return; }
      CLOUD_DATA = ensureStructure(data);
      refreshAll();
      checkIsAdmin();
      applyAdminMode();
      checkMaintenance();
      renderAdminPanel();
      toast("Synced.","success");
    };
  }

  const exportBtn = box.querySelector("[data-act='export']");
  if(exportBtn){
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify(CLOUD_DATA, null, 2)], { type:"application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "msi-astra-data.json";
      a.click();
    };
  }

  // Render content
  const content = box.querySelector("#adminContent");
  if(!content) return;

  if(ADMIN_EDITING !== null){
    renderAdminForm(content);
  } else {
    renderAdminList(content);
  }
}

function renderAdminList(content){
  const tab = ADMIN_TAB;
  const isWebsite = tab === "website";
  const list = isWebsite ? [] : (CLOUD_DATA[tab] || []);

  if(isWebsite){
    content.innerHTML = renderWebsiteTabHTML();
    bindWebsiteTab(content);
    return;
  }

  content.innerHTML = `
    <button class="btn btn-primary btn-block" data-act="add" style="margin-bottom:12px">
      <i class="fa-solid fa-plus"></i> Tambah ${ADMIN_LABELS[tab]}
    </button>
    <div style="max-height:340px;overflow-y:auto;padding-right:4px">
      ${list.length ? list.map((it, i) => `
        <div class="admin-item">
          <div class="admin-item-info">
            <b>${esc(it.name || it.title || it.version || it.id || "-")}</b>
            <small>${esc(it.status || it.price || it.date || it.description || "")}</small>
          </div>
          <div class="admin-item-btns">
            <button data-edit="${i}"><i class="fa-solid fa-pen"></i></button>
            <button class="del" data-del="${i}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("")
      : `<div class="empty" style="padding:24px"><p>Belum ada data</p></div>`}
    </div>
  `;

  const addBtn = content.querySelector("[data-act='add']");
  if(addBtn) addBtn.onclick = () => {
    ADMIN_EDITING = { tab, idx: -1 };
    renderAdminPanel();
  };

  content.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
    ADMIN_EDITING = { tab, idx: Number(b.dataset.edit) };
    renderAdminPanel();
  });

  content.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.del);
    const it = CLOUD_DATA[tab][i];
    const name = it?.name || it?.title || it?.version || "item";
    if(!confirm(`Hapus "${name}"?`)) return;
    CLOUD_DATA[tab].splice(i, 1);
    const ok = await persistCloud();
    refreshAll();
    renderAdminPanel();
    toast(ok ? "Dihapus." : "Gagal hapus.", ok ? "success" : "error");
  });
}

function renderAdminForm(content){
  const tab = ADMIN_EDITING.tab;
  const fields = ADMIN_FIELDS[tab] || [];
  const isNew = ADMIN_EDITING.idx < 0;
  const item = isNew ? {} : (CLOUD_DATA[tab]?.[ADMIN_EDITING.idx] || {});

  content.innerHTML = `
    <div class="modal-title" style="margin-bottom:14px">
      ${isNew ? "Tambah" : "Edit"} ${ADMIN_LABELS[tab]}
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto;padding-right:4px">
      ${fields.map(f => {
        const v = item[f.k] ?? "";
        if(f.type === "textarea"){
          return `<div class="field"><label>${esc(f.l)}</label>
            <textarea data-field="${f.k}" rows="3">${esc(Array.isArray(v)?v.join("\n"):v)}</textarea></div>`;
        }
        if(f.type === "select"){
          return `<div class="field"><label>${esc(f.l)}</label>
            <select data-field="${f.k}">
              ${f.opts.map(o => `<option value="${esc(o)}" ${o===v?"selected":""}>${esc(o)}</option>`).join("")}
            </select></div>`;
        }
        return `<div class="field"><label>${esc(f.l)}</label>
          <input type="text" data-field="${f.k}" value="${esc(v)}"></div>`;
      }).join("")}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-ghost" data-act="cancel" style="flex:1">Batal</button>
      <button class="btn btn-primary" data-act="save" style="flex:2">
        <i class="fa-solid fa-floppy-disk"></i> Simpan
      </button>
    </div>
  `;

  content.querySelectorAll("[data-act='cancel']").forEach(b => b.onclick = () => {
    ADMIN_EDITING = null;
    renderAdminPanel();
  });

  content.querySelector("[data-act='save']").onclick = async () => {
    const obj = {};
    fields.forEach(f => {
      const el = content.querySelector(`[data-field="${f.k}"]`);
      let val = el ? el.value.trim() : "";
      if(f.k === "changes" && val){
        obj[f.k] = val.split("\n").map(x => x.trim()).filter(Boolean);
      } else {
        obj[f.k] = val;
      }
    });
    if(!obj.name && !obj.title && !obj.version){
      toast("Field wajib belum diisi.","error"); return;
    }

    const btn = content.querySelector("[data-act='save']");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simpan...';

    if(isNew) CLOUD_DATA[tab].push(obj);
    else CLOUD_DATA[tab][ADMIN_EDITING.idx] = obj;

    const ok = await persistCloud();
    refreshAll();
    ADMIN_EDITING = null;
    renderAdminPanel();
    toast(ok ? "Tersimpan." : "Gagal simpan ke cloud.", ok ? "success" : "error");
  };
}

function renderWebsiteTabHTML(){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();

  const modeInfo = {
    open: { label: "ONLINE", color: "#4ade80", icon: "fa-circle-check", desc: "Website bisa diakses semua orang" },
    maintenance: { label: "MAINTENANCE", color: "#fbbf24", icon: "fa-screwdriver-wrench", desc: "User lihat popup maintenance, admin bypass" },
    update: { label: "UPDATE", color: "#6c7cff", icon: "fa-rocket", desc: "User lihat popup changelog, admin normal" }
  };
  const info = modeInfo[mode] || modeInfo.open;

  return `
    <div class="maint-banner" style="background:${info.color}15;border-color:${info.color}40;color:${info.color}">
      <i class="fa-solid ${info.icon}"></i>
      Status: <b style="margin-left:4px">${info.label}</b>
    </div>
    <p style="font-size:11.5px;color:var(--muted);margin-bottom:14px;line-height:1.6">${esc(info.desc)}</p>

    <div style="font-size:11.5px;font-weight:600;margin-bottom:8px;color:var(--muted);letter-spacing:.4px;text-transform:uppercase">
      Mode Website
    </div>
    <div style="display:flex;gap:6px;margin-bottom:16px">
      <button class="btn ${mode==='open'?'btn-primary':'btn-ghost'}" data-mode="open" style="flex:1;font-size:11px;padding:10px 6px">
        <i class="fa-solid fa-circle-check"></i> Open
      </button>
      <button class="btn ${mode==='maintenance'?'btn-wa':'btn-ghost'}" data-mode="maintenance" style="flex:1;font-size:11px;padding:10px 6px">
        <i class="fa-solid fa-screwdriver-wrench"></i> Maint
      </button>
      <button class="btn ${mode==='update'?'btn-primary':'btn-ghost'}" data-mode="update" style="flex:1;font-size:11px;padding:10px 6px">
        <i class="fa-solid fa-rocket"></i> Update
      </button>
    </div>

    <div class="field">
      <label><i class="fa-solid fa-comment"></i> Pesan Maintenance</label>
      <textarea id="maintMsgInput" rows="3" placeholder="Pesan yang muncul buat user...">${esc(site.maintenanceMessage || "")}</textarea>
    </div>
    <div class="field" style="margin-top:10px">
      <label><i class="fa-solid fa-clock"></i> Estimasi (opsional)</label>
      <input type="text" id="maintEtaInput" value="${esc(site.maintenanceEta || "")}" placeholder="Contoh: 30 menit">
    </div>
    <button class="btn btn-primary btn-block" id="saveSiteBtn" style="margin-top:14px">
      <i class="fa-solid fa-floppy-disk"></i> Simpan
    </button>
  `;
}

function bindWebsiteTab(content){
  content.querySelectorAll("[data-mode]").forEach(b => {
    b.onclick = async () => {
      const target = b.dataset.mode;
      CLOUD_DATA.site = CLOUD_DATA.site || {};
      CLOUD_DATA.site.mode = target;
      const ok = await persistCloud();
      if(ok){
        toast("Mode: " + target.toUpperCase(), "success");
        renderAdminPanel();
        checkMaintenance();
        checkChangelog();
      } else {
        toast("Gagal simpan.","error");
      }
    };
  });

  const saveBtn = content.querySelector("#saveSiteBtn");
  if(saveBtn){
    saveBtn.onclick = async () => {
      const msg = content.querySelector("#maintMsgInput").value.trim();
      const eta = content.querySelector("#maintEtaInput").value.trim();
      CLOUD_DATA.site = CLOUD_DATA.site || {};
      CLOUD_DATA.site.maintenanceMessage = msg || "Website lagi diperbaiki.";
      CLOUD_DATA.site.maintenanceEta = eta;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simpan...';
      const ok = await persistCloud();
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan';
      toast(ok ? "Pesan disimpan." : "Gagal simpan.", ok ? "success" : "error");
      checkMaintenance();
    };
  }
}

/* ==========================================================
   DETAIL MODAL
   ========================================================== */
function openDetail(type, idx){
  const list = type === "service" ? (CLOUD_DATA?.services||[]) : (CLOUD_DATA?.products||[]);
  const item = list[idx];
  if(!item) return;
  $("#modalIcon").innerHTML = `<i class="${esc(item.icon||'fa-solid fa-box')}"></i>`;
  $("#modalTitle").textContent = item.name;
  $("#modalBadge").innerHTML = statusBadge(item.status);
  $("#modalPrice").textContent = item.price || "-";
  $("#modalDesc").textContent = item.description || "";
  const wa = CONFIG.contact.whatsapp;
  const msg = `Halo, gw mau tanya soal "${item.name}"`;
  $("#modalWa").href = wa + (wa.includes("?")?"&":"?") + "text=" + encodeURIComponent(msg);
  $("#detailModal").classList.add("show");
}

/* ==========================================================
   THEME
   ========================================================== */
const THEMES = {
  default:{ name:"Default", primary:"#6c7cff", secondary:"#8b5cf6" },
  blue:   { name:"Blue",    primary:"#3b82f6", secondary:"#06b6d4" },
  purple: { name:"Purple",  primary:"#a855f7", secondary:"#8b5cf6" },
  red:    { name:"Red",     primary:"#ef4444", secondary:"#f97316" },
  green:  { name:"Green",   primary:"#10b981", secondary:"#22c55e" },
  gold:   { name:"Gold",    primary:"#d4a72c", secondary:"#b8860b" }
};

function hexToRgba(hex, a){
  const h = hex.replace("#","");
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

function applyTheme(key){
  const t = THEMES[key] || THEMES.default;
  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--secondary", t.secondary);
  root.style.setProperty("--primary-soft", hexToRgba(t.primary, 0.14));
  root.style.setProperty("--primary-glow", hexToRgba(t.primary, 0.4));
  try{ localStorage.setItem(THEME_KEY, key); }catch(e){}
  $$(".theme-swatch").forEach(el => el.classList.toggle("selected", el.dataset.theme === key));
}

function renderThemeGrid(){
  const grid = $("#themeGrid");
  if(!grid) return;
  grid.innerHTML = Object.entries(THEMES).map(([k,t]) => `
    <button class="theme-swatch" data-theme="${k}"
      style="background:linear-gradient(135deg,${t.primary},${t.secondary})">${esc(t.name)}</button>
  `).join("");
}

/* ==========================================================
   NAVIGATION
   ========================================================== */
const PAGE_TITLES = { home:1, services:1, payment:1, contact:1 };
function goTo(page){
  if(!PAGE_TITLES[page]) return;
  $$(".page").forEach(p => p.classList.remove("active"));
  $("#page-" + page)?.classList.add("active");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  window.scrollTo({ top:0, behavior:"smooth" });
}

/* ==========================================================
   CLOCK & ROTATORS
   ========================================================== */
function startClock(){
  const tEl = $("#clockTime"), sEl = $("#clockSec");
  if(!tEl || !sEl) return;
  const tick = () => {
    const d = new Date();
    tEl.textContent = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    sEl.textContent = ":" + String(d.getSeconds()).padStart(2,"0");
  };
  tick();
  setInterval(tick, 1000);
}

function createRotator(id, interval, outDur){
  const c = $("#" + id);
  if(!c) return;
  const items = [...c.children];
  if(items.length < 2) return;
  let idx = 0, prev = 0;
  setInterval(() => {
    const cur = items[prev];
    if(!cur) return;
    cur.classList.remove("active"); cur.classList.add("leaving");
    setTimeout(()=>cur.classList.remove("leaving"), outDur);
    idx = (idx+1) % items.length;
    items[idx].classList.add("active");
    prev = idx;
  }, interval);
}

/* ==========================================================
   GENERAL EVENTS
   ========================================================== */
function initGeneralEvents(){
  $$(".nav-item").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.page)));

  document.addEventListener("click", e => {
    if(e.target.closest("#fullpageBack")){ closeFullPage(); return; }

    const nav = e.target.closest("[data-nav]");
    if(nav){ goTo(nav.dataset.nav); return; }

    const card = e.target.closest(".card[data-type]");
    if(card){ openDetail(card.dataset.type, Number(card.dataset.idx)); return; }

    const cp = e.target.closest("[data-copy]");
    if(cp){ e.stopPropagation(); copyText(cp.dataset.copy); return; }

    const qris = e.target.closest('[data-pay="qris"]');
    if(qris){
      const img = $("#qrisImg");
      const id = qris.dataset.id || "qris";
      const pay = (CLOUD_DATA?.payment||[]).find(p => p.id === id);
      if(img && pay){ img.src = pay.value; img.style.display = "block"; }
      $("#qrisModal").classList.add("show");
      return;
    }
  });

  $("#modalClose")?.addEventListener("click", ()=>$("#detailModal").classList.remove("show"));
  $("#qrisClose")?.addEventListener("click", ()=>$("#qrisModal").classList.remove("show"));
  $("#detailModal")?.addEventListener("click", e=>{ if(e.target.id==="detailModal") e.target.classList.remove("show"); });
  $("#qrisModal")?.addEventListener("click", e=>{ if(e.target.id==="qrisModal") e.target.classList.remove("show"); });
  $("#adminPanelModal")?.addEventListener("click", e=>{ if(e.target.id==="adminPanelModal") closeAdminPanel(); });

  $("#userMaintRefresh")?.addEventListener("click", async () => {
    toast("Cek status...","info");
    const data = await cloudLoad();
    if(data){
      CLOUD_DATA = ensureStructure(data);
      refreshAll();
      checkMaintenance();
      checkChangelog();
    } else toast("Gagal cek.","error");
  });

  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      $("#detailModal")?.classList.remove("show");
      $("#qrisModal")?.classList.remove("show");
      $("#themePanel")?.classList.remove("show");
      closeAdminLogin();
      closeAdminPanel();
      closeFullPage();
      closeSidebar();
    }
  });
}

/* ==========================================================
   INIT
   ========================================================== */
(async function init(){
  try{
    document.title = CONFIG.appName;

    let savedTheme = "default";
    try{ savedTheme = localStorage.getItem(THEME_KEY) || "default"; }catch(e){}
    renderThemeGrid();
    applyTheme(savedTheme);

    startClock();
    createRotator("welcomeRotate", 5400, 800);

    initSidebar();
    initAdminLogin();
    initGeneralEvents();

    const data = await cloudLoad();
    CLOUD_DATA = ensureStructure(data || DEFAULT_DATA);

    checkIsAdmin();
    applyAdminMode();
    refreshAll();

    checkMaintenance();
    checkChangelog();

  }catch(err){
    console.error("[MSI ASTRA] Init error:", err);
  }
})();
