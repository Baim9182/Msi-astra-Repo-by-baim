/* ==========================================================
   MSI ASTRA v5.3 — Auto-Discovery Edition
   Nambah fitur baru = bikin pages/<id>.html + tambah sidebar di admin
   ========================================================== */

const CONFIG = {
  api: { baseUrl: "https://msi-astra-worker.muhammadbaimab.workers.dev" },
  adminKeyHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
};

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
let ACTIVE_THEME = "t1";
let CONTACT_LOADED = false;

const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const esc = (s="") => String(s).replace(/[&<>"']/g,x=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[x]));

const DEFAULT_DATA = {
  preferences: {
    appName: "MSI ASTRA", appSubtitle: "WEBVIEW", heroBadge: "Online & Ready",
    heroRotate: ['Halo, gw <span class="accent">Baim</span>','Butuh <span class="accent">jasa custom?</span>'],
    heroSubtitle: "Tempat jasa, aplikasi, dan project digital.",
    heroPrimaryBtn: { label: "Lihat Jasa", icon: "fa-solid fa-store", target: "services" },
    heroWaBtn: { label: "Chat WA", icon: "fa-brands fa-whatsapp" },
    developer: {
      name: "Baim", username: "@wthf_b6", role: "Developer",
      profileImage: "", description: "", quote: "", currently: "",
      stats: [], toolkit: [], badges: []
    },
    contact: { whatsapp: "", channel: "" },
    webhookSaran: "", dailyLimit: 5
  },
  themes: {
    active: "t1",
    t1: { name: "Monochrome", primary: "#ffffff", secondary: "#a1a1aa", bgImage: "", bgOpacity: 0.15, banner: { image: "", title: "MSI ASTRA", desc: "Digital minimalis" } },
    t2: { name: "Ocean", primary: "#06b6d4", secondary: "#3b82f6", bgImage: "", bgOpacity: 0.25, banner: { image: "", title: "MSI ASTRA", desc: "Deep ocean vibes" } }
  },
  sidebar: [], navbar: [], pages: {},
  services: [], products: [], payment: [], changelog: [],
  site: { mode: "open", maintenanceMessage: "Website lagi diperbaiki.", maintenanceEta: "" },
  admin: { claimed: false, ownerId: null, claimedAt: null }
};

/* ==========================================================
   FRAGMENT LOADER
   ========================================================== */
const FRAGMENT_CACHE = {};

async function loadFragment(name){
  if(FRAGMENT_CACHE[name]) return FRAGMENT_CACHE[name];
  try{
    const r = await fetch(`pages/${name}.html?v=9`);
    if(!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    FRAGMENT_CACHE[name] = html;
    return html;
  }catch(e){
    console.error("[Fragment]", name, e);
    return `<div class="empty" style="margin-top:20px">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <p>Gagal memuat halaman "${esc(name)}".</p>
      <p style="font-size:11px;color:var(--muted-2);margin-top:8px;font-family:var(--font-mono)">
        Pastikan file <b>pages/${esc(name)}.html</b> ada.
      </p>
    </div>`;
  }
}

function loadingHTML(){
  return `<div style="padding:60px 20px;text-align:center">
    <i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:var(--primary)"></i>
    <p style="margin-top:14px;color:var(--muted);font-size:12.5px;font-family:var(--font-mono)">LOADING...</p>
  </div>`;
}

function executeScripts(container){
  container.querySelectorAll("script").forEach(oldScript => {
    const newScript = document.createElement("script");
    [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

/* ==========================================================
   CLOUD
   ========================================================== */
async function cloudLoad(){
  if(!CONFIG.api?.baseUrl) return null;
  try{
    const r = await fetch(`${CONFIG.api.baseUrl}/data`);
    if(!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  }catch(e){ console.warn("[Cloud load]", e); return null; }
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
  }catch(e){ console.warn("[Cloud save]", e); return false; }
}

async function persistCloud(){
  if(!CLOUD_DATA) return false;
  return await cloudSave(CLOUD_DATA);
}

function ensureStructure(d){
  if(!d) d = {};
  const def = DEFAULT_DATA;
  d.preferences = Object.assign({}, def.preferences, d.preferences || {});
  d.preferences.developer = Object.assign({}, def.preferences.developer, d.preferences.developer || {});
  d.preferences.contact = Object.assign({}, def.preferences.contact, d.preferences.contact || {});
  d.themes = Object.assign({}, def.themes, d.themes || {});
  if(!d.themes.t1) d.themes.t1 = def.themes.t1;
  if(!d.themes.t2) d.themes.t2 = def.themes.t2;
  d.sidebar = Array.isArray(d.sidebar) ? d.sidebar : [];
  d.navbar = Array.isArray(d.navbar) ? d.navbar : def.navbar;
  d.pages = d.pages && typeof d.pages === "object" ? d.pages : {};
  d.services = Array.isArray(d.services) ? d.services : [];
  d.products = Array.isArray(d.products) ? d.products : [];
  d.payment = Array.isArray(d.payment) ? d.payment : [];
  d.changelog = Array.isArray(d.changelog) ? d.changelog : [];
  d.site = Object.assign({ mode: "open", maintenanceMessage: "Website lagi diperbaiki.", maintenanceEta: "" }, d.site || {});
  d.admin = Object.assign({ claimed: false, ownerId: null, claimedAt: null }, d.admin || {});
  return d;
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
  const wrap = $("#toastWrap"); if(!wrap) return;
  const el = document.createElement("div");
  el.className = "toast " + type;
  const icons = { success:"fa-solid fa-circle-check", error:"fa-solid fa-circle-exclamation", info:"fa-solid fa-circle-info" };
  el.innerHTML = `<i class="${icons[type]||icons.info}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(()=>el.remove(), 300); }, 2800);
}

function copyText(text){
  const done = ()=>toast("Disalin.","success");
  const fallback = ()=>{
    try{
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      done();
    }catch(e){}
  };
  if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}

function hexToRgba(hex, a){
  if(!hex) return `rgba(255,255,255,${a})`;
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
  catch(e){ prompt("Copy:", h); }
  return h;
};

/* ==========================================================
   THEME
   ========================================================== */
function getActiveThemeKey(){
  try{
    const s = localStorage.getItem(THEME_KEY);
    if(s && CLOUD_DATA?.themes?.[s]) return s;
  }catch(e){}
  return CLOUD_DATA?.themes?.active || "t1";
}

function applyTheme(key){
  if(!CLOUD_DATA?.themes?.[key]) key = "t1";
  ACTIVE_THEME = key;
  const t = CLOUD_DATA.themes[key];
  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary || "#fff");
  root.style.setProperty("--secondary", t.secondary || "#a1a1aa");
  root.style.setProperty("--primary-soft", hexToRgba(t.primary || "#fff", 0.1));
  root.style.setProperty("--primary-glow", hexToRgba(t.primary || "#fff", 0.3));
  root.style.setProperty("--bg-image", t.bgImage ? `url('${t.bgImage}')` : "none");
  root.style.setProperty("--bg-opacity", t.bgOpacity || 0.15);
  try{ localStorage.setItem(THEME_KEY, key); }catch(e){}
  renderBanner(t.banner);
  $$(".theme-swatch").forEach(el => el.classList.toggle("selected", el.dataset.theme === key));
}

function renderBanner(banner){
  const img = $("#bannerImg"), title = $("#bannerTitle"), desc = $("#bannerDesc");
  if(!banner){
    if(img) img.style.display = "none";
    if(title) title.textContent = "MSI ASTRA";
    return;
  }
  if(banner.image){
    if(img){
      img.style.display = "block";
      img.style.opacity = "0";
      img.src = banner.image;
      img.onload = () => img.style.opacity = "1";
    }
  } else if(img) img.style.display = "none";
  if(title) title.textContent = banner.title || "MSI ASTRA";
  if(desc) desc.textContent = banner.desc || "";
}

function renderThemeGrid(){
  const grid = $("#themeGrid"); if(!grid) return;
  const themes = CLOUD_DATA?.themes || DEFAULT_DATA.themes;
  const active = getActiveThemeKey();
  grid.innerHTML = ["t1","t2"].map(k => {
    const t = themes[k]; if(!t) return "";
    return `<button class="theme-swatch ${k===active?'selected':''}" data-theme="${k}"
      style="background:linear-gradient(135deg,${t.primary},${t.secondary})">
      <i class="fa-solid fa-palette" style="color:${k==='t1'?'#000':'#fff'}"></i>
      <span>${esc(t.name)}</span>
    </button>`;
  }).join("");
  grid.querySelectorAll("[data-theme]").forEach(b => {
    b.onclick = () => {
      applyTheme(b.dataset.theme);
      toast("Tema: " + CLOUD_DATA.themes[b.dataset.theme].name, "success");
    };
  });
}

/* ==========================================================
   LAPOR QUOTA
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

function setLaporHistory(h){ try{ localStorage.setItem(LAPOR_KEY, JSON.stringify(h)); }catch(e){} }

function getRemainingLapor(){
  const limit = CLOUD_DATA?.preferences?.dailyLimit || 5;
  return Math.max(0, limit - getLaporHistory().count);
}

function incrementLapor(data){
  const h = getLaporHistory();
  h.count += 1;
  h.items.push({ t: Date.now(), ...data });
  setLaporHistory(h);
}

/* ==========================================================
   RENDER PREFERENCES
   ========================================================== */
function renderPreferences(){
  const p = CLOUD_DATA.preferences || {};
  document.title = p.appName || "MSI ASTRA";
  const setTxt = (id,v)=>{ const el=$(id); if(el) el.textContent = v || ""; };
  setTxt("#brandName", p.appName);
  setTxt("#brandSubtitle", p.appSubtitle);
  setTxt("#sidebarBrandName", p.appName);

  const badge = $("#heroBadge");
  if(badge) badge.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${esc(p.heroBadge || "Online")}</span>`;

  const rot = $("#welcomeRotate");
  if(rot){
    const items = p.heroRotate || [];
    rot.innerHTML = items.map((h,i) => `<div class="welcome-item ${i===0?'active':''}">${h}</div>`).join("");
    if(items.length > 1){
      let idx = 0, prev = 0;
      const els = $$(".welcome-item", rot);
      setInterval(() => {
        const cur = els[prev]; if(!cur) return;
        cur.classList.remove("active");
        cur.classList.add("leaving");
        setTimeout(()=>cur.classList.remove("leaving"), 800);
        idx = (idx+1) % els.length;
        els[idx].classList.add("active");
        prev = idx;
      }, 5400);
    }
  }

  setTxt("#heroSub", p.heroSubtitle);

  const acts = $("#heroActions");
  if(acts){
    const wa = p.contact?.whatsapp || "#";
    const pb = p.heroPrimaryBtn || {};
    const wb = p.heroWaBtn || {};
    acts.innerHTML = `
      <button class="btn btn-primary" data-nav="${esc(pb.target||'services')}">
        <i class="${esc(pb.icon||'fa-solid fa-store')}"></i> ${esc(pb.label||'Lihat Jasa')}
      </button>
      <a class="btn btn-wa" id="homeWaBtn" href="${esc(wa)}" target="_blank" rel="noopener">
        <i class="${esc(wb.icon||'fa-brands fa-whatsapp')}"></i> ${esc(wb.label||'Chat WA')}
      </a>
    `;
  }

  const pc = $("#payConfirmBtn");
  const c = p.contact || {};
  if(pc) pc.href = (c.whatsapp||"#") + (c.whatsapp?.includes("?")?"&":"?") + "text=" + encodeURIComponent("Halo, gw udah bayar. Ini bukti transfernya.");
}

/* ==========================================================
   RENDER SERVICES / PRODUCTS / PAYMENT
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
  const grid = $("#servicesGrid"), homeGrid = $("#homeServices");
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
  const grid = $("#payGrid"); if(!grid) return;
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

/* ==========================================================
   RENDER SIDEBAR & NAVBAR
   ========================================================== */
function renderSidebar(){
  const nav = $("#sidebarNav"); if(!nav) return;
  const items = CLOUD_DATA?.sidebar || [];
  const userItems = items.filter(f => !f.adminOnly);
  const adminItems = items.filter(f => f.adminOnly);

  const renderItem = (f) => `
    <button class="sidebar-item" data-sidebar="${esc(f.id)}"${f.adminOnly ? ' id="sidebarAdminBtn" style="display:none"' : ''}>
      <div class="sidebar-item-icon ${esc(f.color||'')}"><i class="fa-solid ${esc(f.icon)}"></i></div>
      <div class="sidebar-item-body">
        <span>${esc(f.label)}</span>
        <small>${esc(f.desc||"")}</small>
      </div>
      <i class="fa-solid fa-chevron-right sidebar-chevron"></i>
    </button>`;

  nav.innerHTML = `
    ${userItems.map(renderItem).join("")}
    ${adminItems.length ? `<div class="sidebar-section-label" id="adminSectionLabel" style="display:none">Admin</div>${adminItems.map(renderItem).join("")}` : ''}
  `;
}

function renderNavbar(){
  const nav = $("#mainNav"); if(!nav) return;
  const items = CLOUD_DATA?.navbar || [];
  nav.innerHTML = items.map((n,i) => `
    <button class="nav-item ${i===0?'active':''}" data-page="${esc(n.page)}">
      <i class="fa-solid ${esc(n.icon)}"></i>
      <span>${esc(n.label)}</span>
    </button>
  `).join("");
}

function renderCustomPages(){
  const slot = $("#customPagesSlot"); if(!slot) return;
  const pages = CLOUD_DATA?.pages || {};
  slot.innerHTML = Object.entries(pages).map(([id, p]) => {
    if(p.custom !== true) return "";
    return `<section class="page" id="page-${esc(id)}"><div>${p.html || ""}</div></section>`;
  }).join("");
}

/* ==========================================================
   RENDER CONTACT PAGE — Auto-load fragment
   ========================================================== */
async function renderContactPage(){
  const slot = $("#contactSlot");
  if(!slot) return;

  if(!CONTACT_LOADED){
    slot.innerHTML = loadingHTML();
    const html = await loadFragment("contact");
    slot.innerHTML = html;
    executeScripts(slot);
    CONTACT_LOADED = true;
  } else {
    executeScripts(slot);
  }
}

/* ==========================================================
   NAVIGATION
   ========================================================== */
const BUILTIN_PAGES = { home:1, services:1, payment:1, contact:1 };

function goTo(page){
  const isCustom = !!(CLOUD_DATA?.pages?.[page]?.custom);
  if(!BUILTIN_PAGES[page] && !isCustom) return;

  $$(".page").forEach(p => p.classList.remove("active"));
  $("#page-" + page)?.classList.add("active");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  window.scrollTo({ top:0, behavior:"smooth" });

  if(page === "contact") renderContactPage();
}

/* ==========================================================
   FULLPAGE — Auto Load Any Page
   ========================================================== */
async function openFullPage(id){
  const pageConf = CLOUD_DATA?.pages?.[id] || {
    title: id.replace(/[-_]/g, " "),
    subtitle: "MSI ASTRA",
    custom: false
  };

  const fp = $("#fullpage");
  const title = $("#fullpageTitle");
  const subtitle = $("#fullpageSubtitle");
  const body = $("#fullpageBody");
  if(!fp || !title || !body) return;

  title.textContent = pageConf.title || id;
  if(subtitle) subtitle.textContent = pageConf.subtitle || "MSI ASTRA";

  body.innerHTML = loadingHTML();
  fp.classList.add("show");
  document.body.classList.add("no-scroll");

  if(pageConf.custom === true){
    body.innerHTML = pageConf.html || "<p>Konten kosong.</p>";
    executeScripts(body);
    return;
  }

  const html = await loadFragment(id);
  body.innerHTML = html;
  executeScripts(body);
}

function closeFullPage(){
  $("#fullpage")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ==========================================================
   MAINTENANCE / CHANGELOG
   ========================================================== */
function checkMaintenance(){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const overlay = $("#userMaintOverlay"); if(!overlay) return;

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
   ADMIN AUTH — SINGLE DEVICE
   ========================================================== */
function checkIsAdmin(){
  const a = CLOUD_DATA?.admin || {};
  try{
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if(!s || s.deviceId !== DEVICE_ID || Date.now() >= s.exp){ IS_ADMIN = false; return false; }
    if(!a.claimed || !a.ownerId || a.ownerId !== DEVICE_ID){
      try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
      IS_ADMIN = false;
      return false;
    }
    IS_ADMIN = true;
    return true;
  }catch(e){ IS_ADMIN = false; return false; }
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
  if(hash !== CONFIG.adminKeyHash) return { ok:false, reason:"Key salah." };

  const fresh = await cloudLoad();
  const a = fresh?.admin || CLOUD_DATA?.admin || {};

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
    return { ok:false, reason:"Gagal simpan ke cloud." };
  }

  await new Promise(r => setTimeout(r, 400));
  const verify = await cloudLoad();
  if(!verify?.admin?.ownerId || verify.admin.ownerId !== DEVICE_ID){
    try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
    IS_ADMIN = false;
    return { ok:false, reason:"Device lain udah claim duluan." };
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
    if(!val){ err.textContent = "Key kosong."; err.style.display="block"; return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
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
      err.textContent = res.reason || "Gagal.";
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
   SIDEBAR OPEN/CLOSE
   ========================================================== */
function openSidebar(){
  $("#sidebar")?.classList.add("show");
  $("#sidebarOverlay")?.classList.add("show");
  $("#sidebarToggle")?.classList.add("active");
  document.body.classList.add("no-scroll");
}

function closeSidebar(){
  $("#sidebar")?.classList.remove("show");
  $("#sidebarOverlay")?.classList.remove("show");
  $("#sidebarToggle")?.classList.remove("active");
  document.body.classList.remove("no-scroll");
}

function initSidebar(){
  $("#sidebarToggle")?.addEventListener("click", openSidebar);
  $("#sidebarClose")?.addEventListener("click", closeSidebar);
  $("#sidebarOverlay")?.addEventListener("click", closeSidebar);
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
   ADMIN PANEL
   ========================================================== */
async function openAdminPanel(){
  if(!IS_ADMIN){ toast("Akses ditolak.","error"); return; }

  const fresh = await cloudLoad();
  if(fresh) CLOUD_DATA = ensureStructure(fresh);

  if(!checkIsAdmin()){
    toast("Session admin udah gak valid.","error");
    applyAdminMode();
    openAdminLogin();
    return;
  }

  const modal = $("#adminPanelModal");
  const box = $("#adminPanelBox");
  if(!modal || !box) return;

  modal.classList.add("show");
  box.innerHTML = loadingHTML();
  const html = await loadFragment("admin");
  box.innerHTML = html;
  executeScripts(box);
}

function closeAdminPanel(){
  $("#adminPanelModal").classList.remove("show");
}

/* ==========================================================
   DETAIL MODAL
   ========================================================== */
function openDetail(type, idx){
  const list = type === "service" ? (CLOUD_DATA?.services||[]) : (CLOUD_DATA?.products||[]);
  const item = list[idx]; if(!item) return;

  $("#modalIcon").innerHTML = `<i class="${esc(item.icon||'fa-solid fa-box')}"></i>`;
  $("#modalTitle").textContent = item.name;
  $("#modalBadge").innerHTML = statusBadge(item.status);
  $("#modalPrice").textContent = item.price || "-";
  $("#modalDesc").textContent = item.description || "";

  const wa = CLOUD_DATA?.preferences?.contact?.whatsapp || "#";
  const msg = `Halo, gw mau tanya soal "${item.name}"`;
  $("#modalWa").href = wa + (wa.includes("?")?"&":"?") + "text=" + encodeURIComponent(msg);
  $("#detailModal").classList.add("show");
}

/* ==========================================================
   CLOCK
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

/* ==========================================================
   SIDEBAR CLICK HANDLER
   ========================================================== */
function handleSidebarClick(target){
  if(target === "admin"){
    if(IS_ADMIN) openAdminPanel();
    else openAdminLogin();
    return;
  }
  // Auto-load: pages/<target>.html
  openFullPage(target);
}

/* ==========================================================
   GENERAL EVENTS
   ========================================================== */
function initGeneralEvents(){
  // Brand mark 5x tap → admin login
  const bm = $("#brandMark");
  if(bm){
    let clicks = 0, timer = null;
    bm.addEventListener("click", () => {
      if(IS_ADMIN) return;
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => clicks = 0, 1200);
      if(clicks >= 5){
        clicks = 0;
        openAdminLogin();
      }
    });
  }

  document.addEventListener("click", e => {
    if(e.target.closest("#fullpageBack")){ closeFullPage(); return; }

    const sbTrigger = e.target.closest("[data-sidebar]");
    if(sbTrigger && !sbTrigger.closest(".sidebar")){
      handleSidebarClick(sbTrigger.dataset.sidebar);
      return;
    }

    const sbItem = e.target.closest(".sidebar .sidebar-item[data-sidebar]");
    if(sbItem){
      const target = sbItem.dataset.sidebar;
      closeSidebar();
      setTimeout(()=>handleSidebarClick(target), 250);
      return;
    }

    const nav = e.target.closest("[data-nav]");
    if(nav){ goTo(nav.dataset.nav); return; }

    const navItem = e.target.closest(".nav-item[data-page]");
    if(navItem){ goTo(navItem.dataset.page); return; }

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
      applyTheme(getActiveThemeKey());
      refreshAll();
      checkMaintenance();
      checkChangelog();
    } else toast("Gagal.","error");
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
   REFRESH ALL
   ========================================================== */
function refreshAll(){
  renderPreferences();
  renderServices();
  renderProducts();
  renderPayment();
  renderSidebar();
  renderNavbar();
  renderCustomPages();
  renderContactPage();
}

/* ==========================================================
   EXPOSE GLOBAL HELPERS
   ========================================================== */
Object.assign(window, {
  $, $$, esc, toast, copyText, hexToRgba,
  getRemainingLapor, incrementLapor, loadFragment, persistCloud,
  cloudLoad, ensureStructure, applyTheme, renderPreferences, refreshAll,
  renderSidebar, renderNavbar, renderCustomPages, renderContactPage,
  applyAdminMode, checkMaintenance, checkChangelog, openFullPage,
  closeFullPage, openAdminPanel, closeAdminPanel, openAdminLogin
});
window.getCloudData = () => CLOUD_DATA;
window.setCloudData = (d) => { CLOUD_DATA = d; };
window.isAdmin = () => IS_ADMIN;

/* ==========================================================
   INIT
   ========================================================== */
(async function init(){
  try{
    startClock();
    initSidebar();
    initAdminLogin();
    initGeneralEvents();

    const data = await cloudLoad();
    CLOUD_DATA = ensureStructure(data || DEFAULT_DATA);

    const fresh = await cloudLoad();
    if(fresh) CLOUD_DATA = ensureStructure(fresh);

    checkIsAdmin();
    applyAdminMode();

    applyTheme(getActiveThemeKey());
    refreshAll();

    checkMaintenance();
    checkChangelog();
  }catch(err){
    console.error("[MSI ASTRA] Init error:", err);
  }
})();
