/* ==========================================================
   MSI ASTRA v3.2 — 2 Tema Edition
   ========================================================== */

/* ==========================================================
   FEATURE REGISTRY
   ========================================================== */
const FEATURES = [
  { id: "about",  label: "About Dev",              desc: "Kenalan dikit",   icon: "fa-user-astronaut", color: "",        adminOnly: false },
  { id: "lapor",  label: "Lapor Bug / Saran / Ide", desc: "Kirim masukan lu", icon: "fa-bullhorn",       color: "orange",  adminOnly: false },
  { id: "order",  label: "Order APK / Web Auto",   desc: "Bikin project lu", icon: "fa-rocket",         color: "green",   adminOnly: false },
  { id: "admin",  label: "Admin Tools",            desc: "Kelola website",   icon: "fa-sliders",        color: "purple",  adminOnly: true  }
];

/* ==========================================================
   CONFIG
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
    description: "Gw suka minta bantuan AI buat ngoding, cari solusi, debugging, bikin desain, sampai nyari ide. Gw masih belajar sambil jalan.",
    quote: "code, create, repeat — digital realm",
    currently: "building MSI ASTRA",
    stats: [
      { num: "3+",   label: "Years Exp" },
      { num: "15+",  label: "Projects" },
      { num: "24/7", label: "Creative" }
    ],
    toolkit: [
      { name: "JavaScript", icon: "fa-brands fa-js",     cls: "t-js" },
      { name: "React",      icon: "fa-brands fa-react",  cls: "t-react" },
      { name: "Python",     icon: "fa-brands fa-python", cls: "t-py" },
      { name: "Node.js",    icon: "fa-brands fa-node",   cls: "t-node" },
      { name: "CSS3",       icon: "fa-brands fa-css3",   cls: "t-css" },
      { name: "Android",    icon: "fa-brands fa-android",cls: "t-flutter" },
      { name: "Linux",      icon: "fa-brands fa-linux",  cls: "t-linux" },
      { name: "Git",        icon: "fa-brands fa-git",    cls: "t-git" }
    ],
    badges: [
      { label: "AI Assisted",     icon: "fa-solid fa-robot" },
      { label: "Logic",           icon: "fa-solid fa-brain" },
      { label: "WebView",         icon: "fa-solid fa-globe" },
      { label: "UI Design",       icon: "fa-solid fa-palette" },
      { label: "Problem Solving", icon: "fa-solid fa-lightbulb" }
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
const DEVICE_KEY = "msi_device";
const SESSION_KEY = "msi_session";
const THEME_KEY = "msi_theme_active";
const LAPOR_KEY = "msi_lapor_history";
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
let ACTIVE_THEME = "t1";

const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const esc = (s="") => String(s).replace(/[&<>"']/g,x=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[x]));

const DEFAULT_DATA = {
  services: [],
  products: [],
  payment: [],
  themes: {
    active: "t1",
    t1: {
      name: "Monochrome",
      primary: "#ffffff",
      secondary: "#a1a1aa",
      bgImage: "",
      bgOpacity: 0.15,
      banner: { image: "", title: "MSI ASTRA", desc: "Digital minimalis, clean & profesional" }
    },
    t2: {
      name: "Ocean",
      primary: "#06b6d4",
      secondary: "#3b82f6",
      bgImage: "",
      bgOpacity: 0.25,
      banner: { image: "", title: "MSI ASTRA", desc: "Deep ocean vibes" }
    }
  },
  changelog: [],
  site: {
    mode: "open",
    maintenanceMessage: "Kami sedang melakukan perbaikan. Balik lagi nanti ya!",
    maintenanceEta: ""
  },
  admin: { claimed: false, ownerId: null, claimedAt: null }
};

/* ==========================================================
   FRAGMENT LOADER
   ========================================================== */
const FRAGMENT_CACHE = {};

async function loadFragment(name){
  if(FRAGMENT_CACHE[name]) return FRAGMENT_CACHE[name];
  try{
    const r = await fetch(`pages/${name}.html?v=4`);
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
    <p style="margin-top:14px;color:var(--muted);font-size:12.5px;font-family:var(--font-mono)">LOADING...</p>
  </div>`;
}

/* ==========================================================
   CLOUD
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
  data.changelog= Array.isArray(data.changelog)? data.changelog: [];
  data.site     = data.site || { mode: "open", maintenanceMessage: "Website lagi diperbaiki.", maintenanceEta: "" };
  data.admin    = data.admin || { claimed: false, ownerId: null, claimedAt: null };
  data.themes   = data.themes || DEFAULT_DATA.themes;
  if(!data.themes.t1) data.themes.t1 = DEFAULT_DATA.themes.t1;
  if(!data.themes.t2) data.themes.t2 = DEFAULT_DATA.themes.t2;
  if(!data.themes.active) data.themes.active = "t1";
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

function hexToRgba(hex, a){
  if(!hex) return "rgba(255,255,255," + a + ")";
  let h = hex.replace("#","");
  if(h.length === 3) h = h.split("").map(c=>c+c).join("");
  const r = parseInt(h.substring(0,2),16) || 255;
  const g = parseInt(h.substring(2,4),16) || 255;
  const b = parseInt(h.substring(4,6),16) || 255;
  return `rgba(${r},${g},${b},${a})`;
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
   THEME SYSTEM — 2 tema, banner per tema
   ========================================================== */
function getActiveThemeKey(){
  try{
    const saved = localStorage.getItem(THEME_KEY);
    if(saved && CLOUD_DATA?.themes?.[saved]) return saved;
  }catch(e){}
  return CLOUD_DATA?.themes?.active || "t1";
}

function applyTheme(key){
  if(!CLOUD_DATA?.themes?.[key]) key = "t1";
  ACTIVE_THEME = key;
  const t = CLOUD_DATA.themes[key];

  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary || "#ffffff");
  root.style.setProperty("--secondary", t.secondary || "#a1a1aa");
  root.style.setProperty("--primary-soft", hexToRgba(t.primary || "#ffffff", 0.1));
  root.style.setProperty("--primary-glow", hexToRgba(t.primary || "#ffffff", 0.3));
  root.style.setProperty("--bg-image", t.bgImage ? `url('${t.bgImage}')` : "none");
  root.style.setProperty("--bg-opacity", t.bgOpacity || 0.15);

  try{ localStorage.setItem(THEME_KEY, key); }catch(e){}

  // Update banner
  renderBanner(t.banner);

  // Update swatch selection
  $$(".theme-swatch").forEach(el => el.classList.toggle("selected", el.dataset.theme === key));
}

function renderBanner(banner){
  const img = $("#bannerImg");
  const title = $("#bannerTitle");
  const desc = $("#bannerDesc");

  if(!banner){
    if(img) img.style.display = "none";
    if(title) title.textContent = "MSI ASTRA";
    if(desc) desc.textContent = "Digital project & jasa custom";
    return;
  }

  if(banner.image){
    if(img){
      img.style.display = "block";
      img.style.opacity = "0";
      img.src = banner.image;
      img.onload = () => { img.style.opacity = "1"; };
    }
  } else if(img){
    img.style.display = "none";
  }

  if(title) title.textContent = banner.title || "MSI ASTRA";
  if(desc) desc.textContent = banner.desc || "";
}

function renderThemeGrid(){
  const grid = $("#themeGrid");
  if(!grid) return;
  const themes = CLOUD_DATA?.themes || DEFAULT_DATA.themes;
  const active = getActiveThemeKey();

  grid.innerHTML = ["t1","t2"].map(k => {
    const t = themes[k];
    if(!t) return "";
    return `
      <button class="theme-swatch ${k===active?'selected':''}" data-theme="${k}"
        style="background:linear-gradient(135deg,${t.primary},${t.secondary})">
        <i class="fa-solid fa-palette" style="color:${k==='t1'?'#000':'#fff'}"></i>
        <span>${esc(t.name)}</span>
      </button>
    `;
  }).join("");

  grid.querySelectorAll("[data-theme]").forEach(b => {
    b.onclick = () => {
      applyTheme(b.dataset.theme);
      toast("Tema: " + CLOUD_DATA.themes[b.dataset.theme].name, "success");
    };
  });
}

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

window.getRemainingLapor = getRemainingLapor;
window.incrementLapor = incrementLapor;

/* ==========================================================
   RENDER MAIN
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
function renderSidebarItems(){
  const nav = $(".sidebar-nav");
  if(!nav) return;

  const userItems = FEATURES.filter(f => !f.adminOnly);
  const adminItems = FEATURES.filter(f => f.adminOnly);

  const renderItem = (f) => `
    <button class="sidebar-item" data-sidebar="${esc(f.id)}"${f.adminOnly ? ' id="sidebarAdminBtn" style="display:none"' : ''}>
      <div class="sidebar-item-icon ${f.color||''}">
        <i class="fa-solid ${esc(f.icon)}"></i>
      </div>
      <div class="sidebar-item-body">
        <span>${esc(f.label)}</span>
        <small>${esc(f.desc)}</small>
      </div>
      <i class="fa-solid fa-chevron-right sidebar-chevron"></i>
    </button>
  `;

  nav.innerHTML = `
    <div class="sidebar-section-label">Menu</div>
    ${userItems.map(renderItem).join("")}
    ${adminItems.length ? `
      <div class="sidebar-section-label" id="adminSectionLabel" style="display:none">Admin</div>
      ${adminItems.map(renderItem).join("")}
    ` : ''}
  `;
}

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
  renderSidebarItems();
  $("#sidebarToggle")?.addEventListener("click", openSidebar);
  $("#sidebarClose")?.addEventListener("click", closeSidebar);
  $("#sidebarOverlay")?.addEventListener("click", closeSidebar);

  // Theme button
  $("#themeBtn")?.addEventListener("click", openThemePanel);
  $("#themeQuickBtn")?.addEventListener("click", openThemePanel);
  $("#themeClose")?.addEventListener("click", ()=>$("#themePanel").classList.remove("show"));
  $("#themePanel")?.addEventListener("click", e=>{ if(e.target.id==="themePanel") e.target.classList.remove("show"); });
}

function openThemePanel(){
  renderThemeGrid();
  $("#themePanel").classList.add("show");
}

/* ==========================================================
   FULLPAGE
   ========================================================== */
async function openFullPage(type){
  const feature = FEATURES.find(f => f.id === type && !f.adminOnly);
  if(!feature) return;

  const fp = $("#fullpage");
  const title = $("#fullpageTitle");
  const subtitle = $("#fullpageSubtitle");
  const body = $("#fullpageBody");
  if(!fp || !title || !body) return;

  title.textContent = feature.label;
  if(subtitle) subtitle.textContent = "MSI ASTRA · " + feature.desc.toUpperCase();
  body.innerHTML = loadingHTML();

  fp.classList.add("show");
  document.body.classList.add("no-scroll");

  const html = await loadFragment(type);
  body.innerHTML = html;

  const binderName = "bind" + type.charAt(0).toUpperCase() + type.slice(1) + "Page";
  if(typeof window[binderName] === "function"){
    try{ window[binderName](); }
    catch(e){ console.error("[Binder] error:", e); }
  }
}

function closeFullPage(){
  $("#fullpage")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ==========================================================
   LAPOR SEND
   ========================================================== */
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
      color: 0x06b6d4,
      author: { name: "MSI ASTRA • Lapor", icon_url: d.profileImage },
      thumbnail: { url: d.profileImage },
      fields: [
        { name: "Pengirim", value: "```" + (payload.nama||"Anonim").slice(0,90) + "```", inline: true },
        { name: "Kategori", value: "```" + (payload.kategori||"-").slice(0,90) + "```", inline: true },
        { name: "Isi Pesan", value: "```\n" + (payload.pesan||"").slice(0,1000) + "\n```", inline: false }
      ],
      footer: { text: `MSI ASTRA · ${tanggal}`, icon_url: d.profileImage },
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

window.sendLaporToDiscord = sendLaporToDiscord;

/* ==========================================================
   ADMIN PANEL
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
  themes:   "Tema",
  website:  "Website"
};

const ADMIN_FIELDS = {
  services: [
    { k:"name", l:"Nama Jasa", type:"text" },
    { k:"description", l:"Deskripsi", type:"textarea" },
    { k:"price", l:"Harga", type:"text" },
    { k:"status", l:"Status", type:"select", opts:["Tersedia","Tidak Tersedia","Pre-Order","Coming Soon"] },
    { k:"icon", l:"Icon (Font Awesome)", type:"text" }
  ],
  products: [
    { k:"name", l:"Nama Produk", type:"text" },
    { k:"description", l:"Deskripsi", type:"textarea" },
    { k:"price", l:"Harga", type:"text" },
    { k:"status", l:"Status", type:"select", opts:["Tersedia","Tidak Tersedia","Pre-Order","Coming Soon"] },
    { k:"icon", l:"Icon (Font Awesome)", type:"text" }
  ],
  payment: [
    { k:"id", l:"ID Unik", type:"text" },
    { k:"name", l:"Nama Payment", type:"text" },
    { k:"icon", l:"Icon (Font Awesome)", type:"text" },
    { k:"color", l:"Warna (hex)", type:"text" },
    { k:"type", l:"Tipe", type:"select", opts:["qris","phone","url"] },
    { k:"value", l:"Value", type:"textarea" },
    { k:"status", l:"Status", type:"select", opts:["available","unavailable","maintenance"] }
  ]
};

function renderAdminPanel(){
  const box = $("#adminPanelBox");
  if(!box) return;

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
      applyTheme(getActiveThemeKey());
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

  if(tab === "themes"){ renderThemesTab(content); return; }
  if(tab === "website"){ renderWebsiteTab(content); return; }

  const list = CLOUD_DATA[tab] || [];

  content.innerHTML = `
    <button class="btn btn-primary btn-block" data-act="add" style="margin-bottom:12px">
      <i class="fa-solid fa-plus"></i> Tambah ${ADMIN_LABELS[tab]}
    </button>
    <div style="max-height:340px;overflow-y:auto;padding-right:4px">
      ${list.length ? list.map((it, i) => `
        <div class="admin-item">
          <div class="admin-item-info">
            <b>${esc(it.name || it.id || "-")}</b>
            <small>${esc(it.status || it.price || it.value || "")}</small>
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
    const name = it?.name || "item";
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
    <div class="field-group">
      ${fields.map(f => {
        const v = item[f.k] ?? "";
        if(f.type === "textarea"){
          return `<div class="field"><label>${esc(f.l)}</label>
            <textarea data-field="${f.k}" rows="3">${esc(v)}</textarea></div>`;
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
      obj[f.k] = el ? el.value.trim() : "";
    });
    if(!obj.name){ toast("Nama wajib diisi.","error"); return; }

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

/* ---- THEMES TAB ---- */
function renderThemesTab(content){
  const themes = CLOUD_DATA.themes;
  const active = themes.active || "t1";

  content.innerHTML = `
    <div class="maint-banner" style="background:var(--primary-soft);border-color:var(--primary);color:var(--primary);font-family:var(--font-mono)">
      <i class="fa-solid fa-info-circle"></i>
      Atur warna, background & banner per tema
    </div>

    <div style="font-size:10.5px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-mono)">
      Tema Default Aktif
    </div>
    <div style="display:flex;gap:6px;margin-bottom:16px">
      ${["t1","t2"].map(k => `
        <button class="btn ${active===k?'btn-primary':'btn-ghost'}" data-default="${k}" style="flex:1;font-size:11.5px;padding:10px">
          <i class="fa-solid fa-palette"></i> ${esc(themes[k].name)}
        </button>
      `).join("")}
    </div>

    <div style="display:flex;flex-direction:column;gap:14px">
      ${["t1","t2"].map(k => renderThemeEditor(k, themes[k])).join("")}
    </div>
  `;

  content.querySelectorAll("[data-default]").forEach(b => b.onclick = async () => {
    CLOUD_DATA.themes.active = b.dataset.default;
    const ok = await persistCloud();
    if(ok){ toast("Default: " + CLOUD_DATA.themes[b.dataset.default].name, "success"); renderAdminPanel(); }
    else toast("Gagal simpan.","error");
  });

  // Bind per theme
  ["t1","t2"].forEach(k => bindThemeEditor(content, k));
}

function renderThemeEditor(key, t){
  return `
    <div style="padding:14px;border-radius:14px;background:var(--surface-3);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,${t.primary},${t.secondary})"></div>
          <b style="font-size:13px">${esc(t.name)}</b>
        </div>
        <button class="btn btn-ghost btn-sm" data-preview="${key}">
          <i class="fa-solid fa-eye"></i> Preview
        </button>
      </div>

      <div class="field" style="margin-bottom:10px">
        <label>Nama Tema</label>
        <input type="text" data-theme-name="${key}" value="${esc(t.name)}">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div class="field">
          <label>Warna Primary</label>
          <input type="text" data-theme-primary="${key}" value="${esc(t.primary)}" placeholder="#ffffff">
        </div>
        <div class="field">
          <label>Warna Secondary</label>
          <input type="text" data-theme-secondary="${key}" value="${esc(t.secondary)}" placeholder="#a1a1aa">
        </div>
      </div>

      <div class="field" style="margin-bottom:10px">
        <label>Background Image URL</label>
        <input type="text" data-theme-bg="${key}" value="${esc(t.bgImage||"")}" placeholder="https://...">
      </div>

      <div class="field" style="margin-bottom:12px">
        <label>Background Opacity (0 - 1)</label>
        <input type="number" step="0.05" min="0" max="1" data-theme-opacity="${key}" value="${t.bgOpacity||0.15}">
      </div>

      <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-mono)">
        Banner Tema
      </div>

      <div class="field" style="margin-bottom:8px">
        <label>Judul Banner</label>
        <input type="text" data-banner-title="${key}" value="${esc(t.banner?.title||"")}">
      </div>
      <div class="field" style="margin-bottom:8px">
        <label>Deskripsi Banner</label>
        <input type="text" data-banner-desc="${key}" value="${esc(t.banner?.desc||"")}">
      </div>
      <div class="field" style="margin-bottom:12px">
        <label>URL Gambar Banner</label>
        <input type="text" data-banner-image="${key}" value="${esc(t.banner?.image||"")}" placeholder="https://...">
      </div>

      <button class="btn btn-primary btn-block" data-save-theme="${key}">
        <i class="fa-solid fa-floppy-disk"></i> Simpan Tema ${esc(t.name)}
      </button>
    </div>
  `;
}

function bindThemeEditor(content, key){
  const preview = content.querySelector(`[data-preview="${key}"]`);
  if(preview) preview.onclick = () => {
    applyTheme(key);
    toast("Preview: " + CLOUD_DATA.themes[key].name, "success");
  };

  const saveBtn = content.querySelector(`[data-save-theme="${key}"]`);
  if(saveBtn) saveBtn.onclick = async () => {
    const t = CLOUD_DATA.themes[key];
    t.name = content.querySelector(`[data-theme-name="${key}"]`).value.trim() || t.name;
    t.primary = content.querySelector(`[data-theme-primary="${key}"]`).value.trim() || t.primary;
    t.secondary = content.querySelector(`[data-theme-secondary="${key}"]`).value.trim() || t.secondary;
    t.bgImage = content.querySelector(`[data-theme-bg="${key}"]`).value.trim();
    t.bgOpacity = parseFloat(content.querySelector(`[data-theme-opacity="${key}"]`).value) || 0.15;
    t.banner = {
      title: content.querySelector(`[data-banner-title="${key}"]`).value.trim(),
      desc: content.querySelector(`[data-banner-desc="${key}"]`).value.trim(),
      image: content.querySelector(`[data-banner-image="${key}"]`).value.trim()
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simpan...';
    const ok = await persistCloud();
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Tema ' + esc(t.name);

    if(ok){
      toast("Tema tersimpan.","success");
      if(ACTIVE_THEME === key) applyTheme(key);
      renderAdminPanel();
    } else {
      toast("Gagal simpan.","error");
    }
  };
}

/* ---- WEBSITE TAB ---- */
function renderWebsiteTab(content){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();

  const modeInfo = {
    open:        { label: "ONLINE",      color: "#4ade80", icon: "fa-circle-check",         desc: "Website bisa diakses semua orang" },
    maintenance: { label: "MAINTENANCE", color: "#fbbf24", icon: "fa-screwdriver-wrench",   desc: "User lihat popup maintenance, admin bypass" },
    update:      { label: "UPDATE",      color: "#6c7cff", icon: "fa-rocket",               desc: "User lihat popup changelog, admin normal" }
  };
  const info = modeInfo[mode] || modeInfo.open;

  content.innerHTML = `
    <div class="maint-banner" style="background:${info.color}15;border-color:${info.color}40;color:${info.color}">
      <i class="fa-solid ${info.icon}"></i>
      Status: <b style="margin-left:4px">${info.label}</b>
    </div>
    <p style="font-size:11.5px;color:var(--muted);margin-bottom:14px;line-height:1.6">${esc(info.desc)}</p>

    <div style="font-size:10.5px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-mono)">
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

  content.querySelectorAll("[data-mode]").forEach(b => {
    b.onclick = async () => {
      CLOUD_DATA.site = CLOUD_DATA.site || {};
      CLOUD_DATA.site.mode = b.dataset.mode;
      const ok = await persistCloud();
      if(ok){ toast("Mode: " + b.dataset.mode.toUpperCase(), "success"); renderAdminPanel(); checkMaintenance(); checkChangelog(); }
      else toast("Gagal simpan.","error");
    };
  });

  const saveBtn = content.querySelector("#saveSiteBtn");
  if(saveBtn) saveBtn.onclick = async () => {
    CLOUD_DATA.site = CLOUD_DATA.site || {};
    CLOUD_DATA.site.maintenanceMessage = content.querySelector("#maintMsgInput").value.trim() || "Website lagi diperbaiki.";
    CLOUD_DATA.site.maintenanceEta = content.querySelector("#maintEtaInput").value.trim();
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simpan...';
    const ok = await persistCloud();
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan';
    toast(ok ? "Pesan disimpan." : "Gagal simpan.", ok ? "success" : "error");
    checkMaintenance();
  };
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
   NAV
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

    const sidebarTrigger = e.target.closest("[data-sidebar]");
    if(sidebarTrigger && !sidebarTrigger.closest(".sidebar")){
      const target = sidebarTrigger.dataset.sidebar;
      if(target === "admin"){ if(IS_ADMIN) openAdminPanel(); }
      else openFullPage(target);
      return;
    }

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

  document.addEventListener("click", e => {
    const item = e.target.closest(".sidebar .sidebar-item[data-sidebar]");
    if(!item) return;
    const target = item.dataset.sidebar;
    closeSidebar();
    setTimeout(()=>{
      if(target === "admin") openAdminPanel();
      else openFullPage(target);
    }, 250);
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
      applyTheme(getActiveThemeKey());
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

    startClock();
    createRotator("welcomeRotate", 5400, 800);

    initSidebar();
    initAdminLogin();
    initGeneralEvents();

    const data = await cloudLoad();
    CLOUD_DATA = ensureStructure(data || DEFAULT_DATA);

    checkIsAdmin();
    applyAdminMode();

    // Apply theme AFTER data loaded
    applyTheme(getActiveThemeKey());

    refreshAll();

    checkMaintenance();
    checkChangelog();

  }catch(err){
    console.error("[MSI ASTRA] Init error:", err);
  }
})();
