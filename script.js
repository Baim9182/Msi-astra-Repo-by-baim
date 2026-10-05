/* ==========================================================
   MSI ASTRA v4.0 — Full Dynamic Admin
   ========================================================== */

const CONFIG = {
  api: { baseUrl: "https://msi-astra-worker.muhammadbaimab.workers.dev" },
  adminKeyHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
  webhookSaran: "https://discord.com/api/webhooks/1556123893679525918/CzaMKFNp4eRiVHAGCy9Jzsyfry86SecT40jbwywIuVP15kOB8gBug__MfDcPiVye7iLF"
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
let ADMIN_TAB = "services";
let ADMIN_EDITING = null;
let ACTIVE_THEME = "t1";

const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const esc = (s="") => String(s).replace(/[&<>"']/g,x=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[x]));

const DEFAULT_DATA = {
  preferences: {
    appName: "MSI ASTRA",
    appSubtitle: "WEBVIEW",
    heroBadge: "Online & Ready",
    heroRotate: ["Halo, gw <span class=\"accent\">Baim</span>", "Butuh <span class=\"accent\">jasa custom?</span>"],
    heroSubtitle: "Tempat jasa, aplikasi, dan project digital.",
    heroPrimaryBtn: { label: "Lihat Jasa", icon: "fa-solid fa-store", target: "services" },
    heroWaBtn: { label: "Chat WA", icon: "fa-brands fa-whatsapp" },
    developer: { name: "Baim", username: "@wthf_b6", role: "Developer", profileImage: "", bannerImage: "", description: "", quote: "", currently: "", stats: [], toolkit: [], badges: [] },
    contact: { whatsapp: "", channel: "" },
    dailyLimit: 5
  },
  themes: {
    active: "t1",
    t1: { name: "Monochrome", primary: "#ffffff", secondary: "#a1a1aa", bgImage: "", bgOpacity: 0.15, banner: { image: "", title: "MSI ASTRA", desc: "Digital minimalis" } },
    t2: { name: "Ocean", primary: "#06b6d4", secondary: "#3b82f6", bgImage: "", bgOpacity: 0.25, banner: { image: "", title: "MSI ASTRA", desc: "Deep ocean vibes" } }
  },
  sidebar: [],
  navbar: [],
  pages: {},
  services: [],
  products: [],
  payment: [],
  changelog: [],
  site: { mode: "open", maintenanceMessage: "Website lagi diperbaiki.", maintenanceEta: "" },
  admin: { claimed: false, ownerId: null, claimedAt: null }
};

/* ============ FRAGMENT LOADER ============ */
const FRAGMENT_CACHE = {};
async function loadFragment(name){
  if(FRAGMENT_CACHE[name]) return FRAGMENT_CACHE[name];
  try{
    const r = await fetch(`pages/${name}.html?v=5`);
    if(!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    FRAGMENT_CACHE[name] = html;
    return html;
  }catch(e){
    console.error("[Fragment]", name, e);
    return `<div class="empty" style="margin-top:20px"><i class="fa-solid fa-triangle-exclamation"></i><p>Gagal memuat halaman "${esc(name)}".</p></div>`;
  }
}
function loadingHTML(){
  return `<div style="padding:60px 20px;text-align:center"><i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:var(--primary)"></i><p style="margin-top:14px;color:var(--muted);font-size:12.5px;font-family:var(--font-mono)">LOADING...</p></div>`;
}

/* ============ CLOUD ============ */
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
  d.navbar = Array.isArray(d.navbar) ? d.navbar : [];
  d.pages = d.pages && typeof d.pages === "object" ? d.pages : {};
  d.services = Array.isArray(d.services) ? d.services : [];
  d.products = Array.isArray(d.products) ? d.products : [];
  d.payment = Array.isArray(d.payment) ? d.payment : [];
  d.changelog = Array.isArray(d.changelog) ? d.changelog : [];
  d.site = Object.assign({ mode: "open", maintenanceMessage: "Website lagi diperbaiki.", maintenanceEta: "" }, d.site || {});
  d.admin = Object.assign({ claimed: false, ownerId: null, claimedAt: null }, d.admin || {});
  return d;
}

/* ============ HELPERS ============ */
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
  const fallback = ()=>{ try{ const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText="position:fixed;opacity:0;"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done(); }catch(e){} };
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
  try{ await navigator.clipboard.writeText(h); alert("Hash dicopy:\n\n" + h); }catch(e){ prompt("Copy:", h); }
  return h;
};

/* ============ THEME ============ */
function getActiveThemeKey(){
  try{ const s = localStorage.getItem(THEME_KEY); if(s && CLOUD_DATA?.themes?.[s]) return s; }catch(e){}
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
  if(!banner){ if(img) img.style.display = "none"; if(title) title.textContent = "MSI ASTRA"; return; }
  if(banner.image){
    if(img){ img.style.display = "block"; img.style.opacity = "0"; img.src = banner.image; img.onload = () => img.style.opacity = "1"; }
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
    return `<button class="theme-swatch ${k===active?'selected':''}" data-theme="${k}" style="background:linear-gradient(135deg,${t.primary},${t.secondary})"><i class="fa-solid fa-palette" style="color:${k==='t1'?'#000':'#fff'}"></i><span>${esc(t.name)}</span></button>`;
  }).join("");
  grid.querySelectorAll("[data-theme]").forEach(b => {
    b.onclick = () => { applyTheme(b.dataset.theme); toast("Tema: " + CLOUD_DATA.themes[b.dataset.theme].name, "success"); };
  });
}

/* ============ LAPOR QUOTA ============ */
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
  const h = getLaporHistory();
  return Math.max(0, limit - h.count);
}
function incrementLapor(data){
  const h = getLaporHistory();
  h.count += 1;
  h.items.push({ t: Date.now(), ...data });
  setLaporHistory(h);
}
window.getRemainingLapor = getRemainingLapor;
window.incrementLapor = incrementLapor;

/* ============ RENDER PREFERENCES ============ */
function renderPreferences(){
  const p = CLOUD_DATA.preferences || {};
  document.title = p.appName || "MSI ASTRA";
  const setTxt = (id,v)=>{ const el=$(id); if(el) el.textContent = v || ""; };
  setTxt("#brandName", p.appName);
  setTxt("#brandSubtitle", p.appSubtitle);
  setTxt("#sidebarBrandName", p.appName);

  // Hero badge
  const badge = $("#heroBadge");
  if(badge){
    badge.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${esc(p.heroBadge || "Online")}</span>`;
  }

  // Hero rotate
  const rot = $("#welcomeRotate");
  if(rot){
    const items = p.heroRotate || [];
    rot.innerHTML = items.map((h,i) => `<div class="welcome-item ${i===0?'active':''}">${h}</div>`).join("");
    if(items.length > 1){
      let idx = 0, prev = 0;
      const els = $$(".welcome-item", rot);
      setInterval(() => {
        const cur = els[prev]; if(!cur) return;
        cur.classList.remove("active"); cur.classList.add("leaving");
        setTimeout(()=>cur.classList.remove("leaving"), 800);
        idx = (idx+1) % els.length;
        els[idx].classList.add("active");
        prev = idx;
      }, 5400);
    }
  }

  setTxt("#heroSub", p.heroSubtitle);

  // Hero actions
  const acts = $("#heroActions");
  if(acts){
    const wa = p.contact?.whatsapp || "#";
    const pb = p.heroPrimaryBtn || {};
    const wb = p.heroWaBtn || {};
    acts.innerHTML = `
      <button class="btn btn-primary" data-nav="${esc(pb.target||'services')}"><i class="${esc(pb.icon||'fa-solid fa-store')}"></i> ${esc(pb.label||'Lihat Jasa')}</button>
      <a class="btn btn-wa" id="homeWaBtn" href="${esc(wa)}" target="_blank" rel="noopener"><i class="${esc(wb.icon||'fa-brands fa-whatsapp')}"></i> ${esc(wb.label||'Chat WA')}</a>
    `;
  }

  // Contact hero
  const d = p.developer || {};
  const c = p.contact || {};
  const setSrc = (id,v)=>{ const el=$(id); if(el) el.src = v||""; };
  setSrc("#contactAvatar", d.profileImage);
  setTxt("#contactName", d.name);
  setTxt("#contactRole", d.role);

  // Contact list
  const cl = $("#contactList");
  if(cl){
    cl.innerHTML = `
      <a class="contact-item" href="${esc(c.whatsapp||'#')}" target="_blank" rel="noopener">
        <div class="contact-icon" style="background:linear-gradient(135deg,#25d366,#1ebe5d)"><i class="fa-brands fa-whatsapp"></i></div>
        <div class="contact-body"><span>WhatsApp</span><small>Chat langsung</small></div>
        <i class="fa-solid fa-chevron-right contact-chevron"></i>
      </a>
      <a class="contact-item" href="${esc(c.channel||'#')}" target="_blank" rel="noopener">
        <div class="contact-icon" style="background:linear-gradient(135deg,#25d366,#128c7e)"><i class="fa-solid fa-bullhorn"></i></div>
        <div class="contact-body"><span>Saluran WhatsApp</span><small>Info & update</small></div>
        <i class="fa-solid fa-chevron-right contact-chevron"></i>
      </a>
      <button class="contact-item" data-sidebar="about">
        <div class="contact-icon" style="background:linear-gradient(135deg,var(--primary),var(--secondary))"><i class="fa-solid fa-user-astronaut"></i></div>
        <div class="contact-body"><span>About Dev</span><small>Profil lengkap</small></div>
        <i class="fa-solid fa-chevron-right contact-chevron"></i>
      </button>
      <button class="contact-item" data-sidebar="lapor">
        <div class="contact-icon" style="background:linear-gradient(135deg,#f59e0b,#f97316)"><i class="fa-solid fa-bullhorn"></i></div>
        <div class="contact-body"><span>Lapor Bug / Saran</span><small>Kirim masukan</small></div>
        <i class="fa-solid fa-chevron-right contact-chevron"></i>
      </button>
    `;
  }

  // Pay confirm button
  const pc = $("#payConfirmBtn");
  if(pc) pc.href = (c.whatsapp||"#") + (c.whatsapp?.includes("?")?"&":"?") + "text=" + encodeURIComponent("Halo, gw udah bayar. Ini bukti transfernya.");
}

/* ============ RENDER SERVICES / PRODUCTS / PAYMENT ============ */
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
      <div class="card-foot"><span class="card-price">${esc(item.price||"-")}</span></div>
    </div>
  </article>`;
}
function emptyState(msg){ return `<div class="empty"><i class="fa-regular fa-folder-open"></i><p>${esc(msg)}</p></div>`; }

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
  if(!list.length){ grid.innerHTML = emptyState("Belum ada produk."); const c=$("#productsCount"); if(c) c.textContent=""; return; }
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
    if(isM) actionHTML = `<button class="pay-action" disabled>Maintenance</button>`;
    else if(isUnavail) actionHTML = `<button class="pay-action" disabled style="opacity:.6">Belum Tersedia</button>`;
    else if(p.type === "qris") actionHTML = `<button class="pay-action" data-pay="qris" data-id="${esc(p.id||'qris')}">Lihat</button>`;
    else if(p.type === "phone") actionHTML = `<button class="pay-action" data-copy="${esc(p.value)}">Salin</button>`;
    else if(p.type === "url") actionHTML = `<a class="pay-action" href="${esc(p.value)}" target="_blank" rel="noopener">Buka</a>`;
    const infoText = p.type === "qris" ? "Semua e-wallet & bank" : (p.value || "-");
    return `<div class="pay-card ${isM||isUnavail ? 'maintenance' : ''}"><div class="pay-icon" style="color:${esc(p.color||'#fff')}"><i class="${esc(p.icon||'fa-solid fa-wallet')}"></i></div><div class="pay-body"><div class="pay-name">${esc(p.name||p.id||'Payment')}${isM?'<span class="badge maintenance">Maint</span>':''}${isUnavail?'<span class="badge unavailable">Off</span>':''}</div><div class="pay-info" style="${p.type==='qris'?'font-family:inherit':''}">${esc(infoText)}</div></div>${actionHTML}</div>`;
  }).join("");
}

/* ============ SIDEBAR & NAVBAR DYNAMIC ============ */
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
    <div class="sidebar-section-label">Menu</div>
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

/* Custom pages — dirender sebagai section tambahan */
function renderCustomPages(){
  const slot = $("#customPagesSlot");
  if(!slot) return;
  const pages = CLOUD_DATA?.pages || {};
  slot.innerHTML = Object.entries(pages).map(([id, p]) => {
    if(p.custom !== true) return "";
    return `<section class="page" id="page-${esc(id)}"><div class="custom-page-content">${p.html || ""}</div></section>`;
  }).join("");
}

/* ============ NAVIGATION ============ */
const BUILTIN_PAGES = { home:1, services:1, payment:1, contact:1 };
function goTo(page){
  const isCustom = !!(CLOUD_DATA?.pages?.[page]?.custom);
  if(!BUILTIN_PAGES[page] && !isCustom) return;
  $$(".page").forEach(p => p.classList.remove("active"));
  $("#page-" + page)?.classList.add("active");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  window.scrollTo({ top:0, behavior:"smooth" });
}

/* ============ FULLPAGE ============ */
async function openFullPage(id){
  const pageConf = CLOUD_DATA?.pages?.[id];
  if(!pageConf) return;
  const fp = $("#fullpage"), title = $("#fullpageTitle"), subtitle = $("#fullpageSubtitle"), body = $("#fullpageBody");
  if(!fp || !title || !body) return;

  title.textContent = pageConf.title || id;
  if(subtitle) subtitle.textContent = pageConf.subtitle || "MSI ASTRA";
  body.innerHTML = loadingHTML();
  fp.classList.add("show");
  document.body.classList.add("no-scroll");

  // Custom page → langsung render HTML
  if(pageConf.custom === true){
    body.innerHTML = pageConf.html || "<p>Konten kosong.</p>";
    const binder = "bind" + id.charAt(0).toUpperCase() + id.slice(1) + "Page";
    if(typeof window[binder] === "function") try{ window[binder](); }catch(e){ console.error(e); }
    return;
  }

  // Built-in → load fragment
  const html = await loadFragment(id);
  body.innerHTML = html;
  const binder = "bind" + id.charAt(0).toUpperCase() + id.slice(1) + "Page";
  if(typeof window[binder] === "function") try{ window[binder](); }catch(e){ console.error(e); }
}
function closeFullPage(){ $("#fullpage")?.classList.remove("show"); document.body.classList.remove("no-scroll"); }

/* ============ MAINTENANCE / CHANGELOG ============ */
function checkMaintenance(){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const overlay = $("#userMaintOverlay"); if(!overlay) return;
  if(mode === "maintenance" && !IS_ADMIN){
    $("#userMaintMsg").textContent = site.maintenanceMessage || "Website lagi diperbaiki.";
    const eta = $("#userMaintEta");
    if(eta) eta.textContent = site.maintenanceEta ? "Estimasi: " + site.maintenanceEta : "";
    overlay.classList.add("show"); document.body.classList.add("no-scroll");
  } else {
    overlay.classList.remove("show"); document.body.classList.remove("no-scroll");
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
  const changes = Array.isArray(latest.changes) ? latest.changes : (typeof latest.changes === "string" ? latest.changes.split("\n").filter(Boolean) : []);
  $("#changelogList").innerHTML = changes.map(ch => `<div class="changelog-item"><i class="fa-solid fa-circle-check"></i><span>${esc(ch)}</span></div>`).join("") || "<p style='font-size:12px;color:var(--muted)'>Tidak ada detail.</p>";
  overlay.classList.add("show"); document.body.classList.add("no-scroll");
  $("#changelogClose").onclick = () => {
    try{ localStorage.setItem(SEEN_CHANGELOG_KEY, latest.version); }catch(e){}
    overlay.classList.remove("show"); document.body.classList.remove("no-scroll");
  };
}

/* ============ ADMIN AUTH ============ */
function checkIsAdmin(){
  const a = CLOUD_DATA?.admin || {};
  try{
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if(!s || s.deviceId !== DEVICE_ID || Date.now() >= s.exp){ IS_ADMIN = false; return false; }
    if(!a.claimed || a.ownerId !== DEVICE_ID){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} IS_ADMIN = false; return false; }
    IS_ADMIN = true; return true;
  }catch(e){ IS_ADMIN = false; return false; }
}
function setSession(){ try{ localStorage.setItem(SESSION_KEY, JSON.stringify({ deviceId: DEVICE_ID, exp: Date.now() + (7 * 86400000) })); }catch(e){} }
function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }

async function performAdminLogin(key){
  const hash = await sha256(key);
  if(hash !== CONFIG.adminKeyHash) return { ok:false, reason:"Key salah." };
  const a = CLOUD_DATA?.admin || {};
  if(a.claimed && a.ownerId && a.ownerId !== DEVICE_ID) return { ok:false, reason:"Key sudah dipakai di device lain." };
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
  setSession(); IS_ADMIN = true;
  return { ok:true };
}

function openAdminLogin(){ $("#adminLoginModal").classList.add("show"); setTimeout(()=>$("#adminKeyInput")?.focus(), 150); }
function closeAdminLogin(){
  $("#adminLoginModal").classList.remove("show");
  const inp = $("#adminKeyInput"); if(inp) inp.value = "";
  const err = $("#adminLoginErr"); if(err) err.style.display = "none";
}
function initAdminLogin(){
  const closeBtn = $("#adminLoginClose"), modal = $("#adminLoginModal"), inp = $("#adminKeyInput"), btn = $("#adminLoginSubmit"), err = $("#adminLoginErr");
  if(!closeBtn || !modal || !inp || !btn) return;
  closeBtn.onclick = closeAdminLogin;
  modal.onclick = e => { if(e.target.id === "adminLoginModal") closeAdminLogin(); };
  inp.addEventListener("keydown", e => { if(e.key === "Enter") btn.click(); });
  btn.onclick = async () => {
    const val = inp.value.trim();
    if(!val){ err.textContent = "Key kosong."; err.style.display="block"; return; }
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    err.style.display = "none";
    const res = await performAdminLogin(val);
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-unlock"></i> Masuk';
    if(res.ok){
      closeAdminLogin(); toast("Welcome, Admin!","success");
      applyAdminMode(); checkMaintenance(); checkChangelog();
      setTimeout(()=>openAdminPanel(), 300);
    } else { err.textContent = res.reason || "Gagal."; err.style.display = "block"; }
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

/* ============ SIDEBAR OPEN/CLOSE ============ */
function openSidebar(){ $("#sidebar")?.classList.add("show"); $("#sidebarOverlay")?.classList.add("show"); document.body.classList.add("no-scroll"); }
function closeSidebar(){ $("#sidebar")?.classList.remove("show"); $("#sidebarOverlay")?.classList.remove("show"); document.body.classList.remove("no-scroll"); }
function initSidebar(){
  $("#sidebarToggle")?.addEventListener("click", openSidebar);
  $("#sidebarClose")?.addEventListener("click", closeSidebar);
  $("#sidebarOverlay")?.addEventListener("click", closeSidebar);
  $("#themeBtn")?.addEventListener("click", openThemePanel);
  $("#themeQuickBtn")?.addEventListener("click", openThemePanel);
  $("#themeClose")?.addEventListener("click", ()=>$("#themePanel").classList.remove("show"));
  $("#themePanel")?.addEventListener("click", e=>{ if(e.target.id==="themePanel") e.target.classList.remove("show"); });
}
function openThemePanel(){ renderThemeGrid(); $("#themePanel").classList.add("show"); }

/* ============ ADMIN PANEL ============ */
async function openAdminPanel(){
  if(!IS_ADMIN){ toast("Akses ditolak.","error"); return; }
  ADMIN_EDITING = null;
  const modal = $("#adminPanelModal"), box = $("#adminPanelBox");
  if(!modal || !box) return;
  modal.classList.add("show");
  box.innerHTML = loadingHTML();
  const html = await loadFragment("admin");
  box.innerHTML = html;
  renderAdminPanel();
}
function closeAdminPanel(){ $("#adminPanelModal").classList.remove("show"); ADMIN_EDITING = null; }

const ADMIN_LABELS = {
  services: "Jasa",
  products: "Produk",
  payment:  "Payment",
  themes:   "Tema",
  sidebar:  "Sidebar",
  navbar:   "Navbar",
  pages:    "Pages",
  prefs:    "Preferensi",
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
  ],
  sidebar: [
    { k:"id", l:"ID (unik, lowercase)", type:"text" },
    { k:"label", l:"Label", type:"text" },
    { k:"desc", l:"Deskripsi singkat", type:"text" },
    { k:"icon", l:"Icon (fa-xxx)", type:"text" },
    { k:"color", l:"Warna Ikon", type:"select", opts:["","orange","green","purple"] },
    { k:"adminOnly", l:"Admin Only?", type:"select", opts:["false","true"] },
    { k:"type", l:"Tipe", type:"select", opts:["page","builtin"] },
    { k:"target", l:"Target (ID page / 'admin')", type:"text" }
  ],
  navbar: [
    { k:"id", l:"ID Unik", type:"text" },
    { k:"label", l:"Label", type:"text" },
    { k:"icon", l:"Icon (fa-xxx)", type:"text" },
    { k:"page", l:"Target Page", type:"text" }
  ],
  pages: [
    { k:"id", l:"ID Page (unik)", type:"text" },
    { k:"title", l:"Judul", type:"text" },
    { k:"subtitle", l:"Subjudul", type:"text" },
    { k:"custom", l:"Custom HTML?", type:"select", opts:["true","false"] },
    { k:"html", l:"HTML Content (kalau custom=true)", type:"textarea" }
  ]
};

function renderAdminPanel(){
  const box = $("#adminPanelBox"); if(!box) return;
  const tabsEl = box.querySelector("#adminTabs");
  if(tabsEl){
    tabsEl.innerHTML = Object.entries(ADMIN_LABELS).map(([k,v]) => `<button data-tab="${k}" class="${k===ADMIN_TAB?'active':''}">${v}</button>`).join("");
    tabsEl.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { ADMIN_TAB = b.dataset.tab; ADMIN_EDITING = null; renderAdminPanel(); });
  }
  box.querySelector("[data-act='close']") && (box.querySelector("[data-act='close']").onclick = closeAdminPanel);
  box.querySelector("[data-act='logout']") && (box.querySelector("[data-act='logout']").onclick = async () => {
    if(!confirm("Logout admin?")) return;
    if(CLOUD_DATA?.admin){ CLOUD_DATA.admin.claimed = false; CLOUD_DATA.admin.ownerId = null; CLOUD_DATA.admin.claimedAt = null; await persistCloud(); }
    clearSession(); IS_ADMIN = false; closeAdminPanel(); applyAdminMode(); checkMaintenance();
    toast("Logout.","success");
  });
  box.querySelector("[data-act='sync']") && (box.querySelector("[data-act='sync']").onclick = async () => {
    const data = await cloudLoad();
    if(!data){ toast("Gagal sync.","error"); return; }
    CLOUD_DATA = ensureStructure(data);
    applyTheme(getActiveThemeKey());
    refreshAll();
    checkIsAdmin(); applyAdminMode(); checkMaintenance();
    renderAdminPanel();
    toast("Synced.","success");
  });
  box.querySelector("[data-act='export']") && (box.querySelector("[data-act='export']").onclick = () => {
    const blob = new Blob([JSON.stringify(CLOUD_DATA, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "msi-astra-data.json"; a.click();
  });

  const content = box.querySelector("#adminContent"); if(!content) return;

  if(ADMIN_EDITING !== null){ renderAdminForm(content); return; }

  // Tabs special
  if(ADMIN_TAB === "themes") return renderThemesTab(content);
  if(ADMIN_TAB === "prefs") return renderPrefsTab(content);
  if(ADMIN_TAB === "website") return renderWebsiteTab(content);
  if(ADMIN_TAB === "pages") return renderPagesTab(content);
  if(ADMIN_TAB === "sidebar") return renderSidebarTab(content);
  if(ADMIN_TAB === "navbar") return renderNavbarTab(content);

  renderAdminList(content);
}

function renderAdminList(content){
  const tab = ADMIN_TAB;
  const list = CLOUD_DATA[tab] || [];
  content.innerHTML = `
    <button class="btn btn-primary btn-block" data-act="add" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Tambah ${ADMIN_LABELS[tab]}</button>
    <div style="max-height:340px;overflow-y:auto;padding-right:4px">
      ${list.length ? list.map((it,i) => `
        <div class="admin-item">
          <div class="admin-item-info">
            <b>${esc(it.name || it.label || it.id || "-")}</b>
            <small>${esc(it.status || it.price || it.desc || it.value || "")}</small>
          </div>
          <div class="admin-item-btns">
            <button data-edit="${i}"><i class="fa-solid fa-pen"></i></button>
            <button class="del" data-del="${i}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("") : `<div class="empty" style="padding:24px"><p>Belum ada data</p></div>`}
    </div>`;
  content.querySelector("[data-act='add']").onclick = () => { ADMIN_EDITING = { tab, idx: -1 }; renderAdminPanel(); };
  content.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { ADMIN_EDITING = { tab, idx: Number(b.dataset.edit) }; renderAdminPanel(); });
  content.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.del);
    const it = CLOUD_DATA[tab][i];
    const name = it?.name || it?.label || it?.id || "item";
    if(!confirm(`Hapus "${name}"?`)) return;
    CLOUD_DATA[tab].splice(i, 1);
    const ok = await persistCloud();
    refreshAll(); renderAdminPanel();
    toast(ok ? "Dihapus." : "Gagal.", ok ? "success" : "error");
  });
}

function renderAdminForm(content){
  const tab = ADMIN_EDITING.tab;
  const fields = ADMIN_FIELDS[tab] || [];
  const isNew = ADMIN_EDITING.idx < 0;
  const item = isNew ? {} : (CLOUD_DATA[tab]?.[ADMIN_EDITING.idx] || {});

  content.innerHTML = `
    <div class="modal-title" style="margin-bottom:14px">${isNew ? "Tambah" : "Edit"} ${ADMIN_LABELS[tab]}</div>
    <div class="field-group">
      ${fields.map(f => {
        const v = item[f.k] ?? "";
        if(f.type === "textarea"){
          return `<div class="field"><label>${esc(f.l)}</label><textarea data-field="${f.k}" rows="3">${esc(v)}</textarea></div>`;
        }
        if(f.type === "select"){
          return `<div class="field"><label>${esc(f.l)}</label><select data-field="${f.k}">${f.opts.map(o => `<option value="${esc(o)}" ${o==v?"selected":""}>${esc(o)}</option>`).join("")}</select></div>`;
        }
        return `<div class="field"><label>${esc(f.l)}</label><input type="text" data-field="${f.k}" value="${esc(v)}"></div>`;
      }).join("")}
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-ghost" data-act="cancel" style="flex:1">Batal</button>
      <button class="btn btn-primary" data-act="save" style="flex:2"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>
    </div>`;

  content.querySelectorAll("[data-act='cancel']").forEach(b => b.onclick = () => { ADMIN_EDITING = null; renderAdminPanel(); });
  content.querySelector("[data-act='save']").onclick = async () => {
    const obj = {};
    fields.forEach(f => {
      const el = content.querySelector(`[data-field="${f.k}"]`);
      let v = el ? el.value.trim() : "";
      if(f.k === "adminOnly" || f.k === "custom") v = v === "true";
      obj[f.k] = v;
    });
    // Untuk pages, key di object bukan array
    if(tab === "pages"){
      if(!obj.id){ toast("ID wajib.","error"); return; }
      const oldId = (!isNew && ADMIN_EDITING.oldId) || null;
      const newId = obj.id;
      const data = { title: obj.title || newId, subtitle: obj.subtitle || "", custom: obj.custom, html: obj.html || "" };
      if(oldId && oldId !== newId) delete CLOUD_DATA.pages[oldId];
      CLOUD_DATA.pages[newId] = data;
    } else {
      if(!obj.name && !obj.label && !obj.id){ toast("Field wajib.","error"); return; }
      if(isNew) CLOUD_DATA[tab].push(obj);
      else CLOUD_DATA[tab][ADMIN_EDITING.idx] = obj;
    }
    const btn = content.querySelector("[data-act='save']");
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const ok = await persistCloud();
    refreshAll(); renderSidebar(); renderNavbar(); renderCustomPages();
    ADMIN_EDITING = null; renderAdminPanel();
    toast(ok ? "Tersimpan." : "Gagal.", ok ? "success" : "error");
  };
}

/* ---- THEMES TAB ---- */
function renderThemesTab(content){
  const themes = CLOUD_DATA.themes;
  const active = themes.active || "t1";
  content.innerHTML = `
    <div style="font-size:10.5px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-mono)">Tema Default Aktif</div>
    <div style="display:flex;gap:6px;margin-bottom:16px">
      ${["t1","t2"].map(k => `<button class="btn ${active===k?'btn-primary':'btn-ghost'}" data-default="${k}" style="flex:1;font-size:11.5px;padding:10px"><i class="fa-solid fa-palette"></i> ${esc(themes[k].name)}</button>`).join("")}
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      ${["t1","t2"].map(k => renderThemeEditor(k, themes[k])).join("")}
    </div>`;
  content.querySelectorAll("[data-default]").forEach(b => b.onclick = async () => {
    CLOUD_DATA.themes.active = b.dataset.default;
    const ok = await persistCloud();
    if(ok){ toast("Default updated.","success"); renderAdminPanel(); }
  });
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
        <button class="btn btn-ghost btn-sm" data-preview="${key}"><i class="fa-solid fa-eye"></i> Preview</button>
      </div>
      <div class="field" style="margin-bottom:10px"><label>Nama Tema</label><input type="text" data-theme-name="${key}" value="${esc(t.name)}"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div class="field"><label>Primary</label><input type="text" data-theme-primary="${key}" value="${esc(t.primary)}"></div>
        <div class="field"><label>Secondary</label><input type="text" data-theme-secondary="${key}" value="${esc(t.secondary)}"></div>
      </div>
      <div class="field" style="margin-bottom:10px"><label>Background URL</label><input type="text" data-theme-bg="${key}" value="${esc(t.bgImage||"")}"></div>
      <div class="field" style="margin-bottom:12px"><label>BG Opacity (0-1)</label><input type="number" step="0.05" min="0" max="1" data-theme-opacity="${key}" value="${t.bgOpacity||0.15}"></div>
      <div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-mono)">Banner</div>
      <div class="field" style="margin-bottom:8px"><label>Judul</label><input type="text" data-banner-title="${key}" value="${esc(t.banner?.title||"")}"></div>
      <div class="field" style="margin-bottom:8px"><label>Deskripsi</label><input type="text" data-banner-desc="${key}" value="${esc(t.banner?.desc||"")}"></div>
      <div class="field" style="margin-bottom:12px"><label>URL Gambar Banner</label><input type="text" data-banner-image="${key}" value="${esc(t.banner?.image||"")}"></div>
      <button class="btn btn-primary btn-block" data-save-theme="${key}"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>
    </div>`;
}

function bindThemeEditor(content, key){
  content.querySelector(`[data-preview="${key}"]`)?.addEventListener("click", () => { applyTheme(key); toast("Preview: " + CLOUD_DATA.themes[key].name, "success"); });
  content.querySelector(`[data-save-theme="${key}"]`)?.addEventListener("click", async (e) => {
    const t = CLOUD_DATA.themes[key];
    t.name = content.querySelector(`[data-theme-name="${key}"]`).value.trim() || t.name;
    t.primary = content.querySelector(`[data-theme-primary="${key}"]`).value.trim() || t.primary;
    t.secondary = content.querySelector(`[data-theme-secondary="${key}"]`).value.trim() || t.secondary;
    t.bgImage = content.querySelector(`[data-theme-bg="${key}"]`).value.trim();
    t.bgOpacity = parseFloat(content.querySelector(`[data-theme-opacity="${key}"]`).value) || 0.15;
    t.banner = { title: content.querySelector(`[data-banner-title="${key}"]`).value.trim(), desc: content.querySelector(`[data-banner-desc="${key}"]`).value.trim(), image: content.querySelector(`[data-banner-image="${key}"]`).value.trim() };
    const btn = e.target.closest("button"); btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const ok = await persistCloud();
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan';
    if(ok){ toast("Tema updated.","success"); if(ACTIVE_THEME === key) applyTheme(key); renderAdminPanel(); }
  });
}

/* ---- PREFS TAB ---- */
function renderPrefsTab(content){
  const p = CLOUD_DATA.preferences;
  const d = p.developer;
  content.innerHTML = `
    <div class="field" style="margin-bottom:10px"><label>App Name</label><input type="text" data-pref="appName" value="${esc(p.appName)}"></div>
    <div class="field" style="margin-bottom:10px"><label>App Subtitle</label><input type="text" data-pref="appSubtitle" value="${esc(p.appSubtitle)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Hero Badge</label><input type="text" data-pref="heroBadge" value="${esc(p.heroBadge)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Hero Subtitle</label><input type="text" data-pref="heroSubtitle" value="${esc(p.heroSubtitle)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Hero Rotate (pisahkan dengan |)</label><textarea data-pref="heroRotate" rows="3">${esc((p.heroRotate||[]).join(" | "))}</textarea></div>
    <div class="field" style="margin-bottom:10px"><label>Developer Name</label><input type="text" data-pref="devName" value="${esc(d.name)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Username</label><input type="text" data-pref="devUsername" value="${esc(d.username)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Role</label><input type="text" data-pref="devRole" value="${esc(d.role)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Avatar URL</label><input type="text" data-pref="devProfile" value="${esc(d.profileImage)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Description</label><textarea data-pref="devDesc" rows="3">${esc(d.description)}</textarea></div>
    <div class="field" style="margin-bottom:10px"><label>Quote</label><input type="text" data-pref="devQuote" value="${esc(d.quote)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Currently</label><input type="text" data-pref="devCurrently" value="${esc(d.currently)}"></div>
    <div class="field" style="margin-bottom:10px"><label>WhatsApp URL</label><input type="text" data-pref="wa" value="${esc(p.contact.whatsapp)}"></div>
    <div class="field" style="margin-bottom:10px"><label>Channel URL</label><input type="text" data-pref="channel" value="${esc(p.contact.channel)}"></div>
    <div class="field" style="margin-bottom:14px"><label>Daily Limit Lapor</label><input type="number" data-pref="dailyLimit" value="${p.dailyLimit||5}"></div>
    <button class="btn btn-primary btn-block" data-act="save-prefs"><i class="fa-solid fa-floppy-disk"></i> Simpan Preferensi</button>`;

  content.querySelector("[data-act='save-prefs']").onclick = async (e) => {
    const g = (k) => content.querySelector(`[data-pref="${k}"]`).value.trim();
    p.appName = g("appName") || p.appName;
    p.appSubtitle = g("appSubtitle");
    p.heroBadge = g("heroBadge");
    p.heroSubtitle = g("heroSubtitle");
    p.heroRotate = g("heroRotate").split("|").map(x => x.trim()).filter(Boolean);
    d.name = g("devName");
    d.username = g("devUsername");
    d.role = g("devRole");
    d.profileImage = g("devProfile");
    d.description = g("devDesc");
    d.quote = g("devQuote");
    d.currently = g("devCurrently");
    p.contact.whatsapp = g("wa");
    p.contact.channel = g("channel");
    p.dailyLimit = parseInt(g("dailyLimit")) || 5;
    const btn = e.target; btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const ok = await persistCloud();
    renderPreferences(); renderCustomPages();
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Preferensi';
    toast(ok ? "Preferensi disimpan." : "Gagal.", ok ? "success" : "error");
  };
}

/* ---- PAGES TAB ---- */
function renderPagesTab(content){
  const pages = CLOUD_DATA.pages || {};
  const ids = Object.keys(pages);
  content.innerHTML = `
    <button class="btn btn-primary btn-block" data-act="add-page" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Tambah Page</button>
    <div style="max-height:340px;overflow-y:auto;padding-right:4px">
      ${ids.length ? ids.map(id => {
        const p = pages[id];
        return `<div class="admin-item">
          <div class="admin-item-info">
            <b>${esc(p.title || id)}</b>
            <small>${esc(id)} · ${p.custom ? "CUSTOM" : "BUILTIN"}</small>
          </div>
          <div class="admin-item-btns">
            <button data-edit-page="${esc(id)}"><i class="fa-solid fa-pen"></i></button>
            ${p.custom ? `<button class="del" data-del-page="${esc(id)}"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
        </div>`;
      }).join("") : `<div class="empty" style="padding:24px"><p>Belum ada page.</p></div>`}
    </div>`;

  content.querySelector("[data-act='add-page']").onclick = () => {
    const id = prompt("ID page (contoh: galeri):");
    if(!id || !/^[a-z0-9_-]+$/.test(id)){ toast("ID harus lowercase.", "error"); return; }
    if(CLOUD_DATA.pages[id]){ toast("ID udah dipakai.", "error"); return; }
    CLOUD_DATA.pages[id] = { title: id, subtitle: "", custom: true, html: "<p>Edit HTML di sini...</p>" };
    persistCloud().then(() => { renderCustomPages(); renderAdminPanel(); });
  };

  content.querySelectorAll("[data-edit-page]").forEach(b => b.onclick = () => {
    const id = b.dataset.editPage;
    const p = CLOUD_DATA.pages[id];
    ADMIN_EDITING = { tab: "pages", idx: -1, oldId: id };
    const contentBox = $("#adminPanelBox").querySelector("#adminContent");
    contentBox.innerHTML = `
      <div class="modal-title" style="margin-bottom:14px">Edit Page: ${esc(id)}</div>
      <div class="field-group">
        <div class="field"><label>ID</label><input type="text" data-pf="id" value="${esc(id)}"></div>
        <div class="field"><label>Judul</label><input type="text" data-pf="title" value="${esc(p.title||"")}"></div>
        <div class="field"><label>Subjudul</label><input type="text" data-pf="subtitle" value="${esc(p.subtitle||"")}"></div>
        <div class="field"><label>Custom HTML?</label><select data-pf="custom"><option value="true" ${p.custom?"selected":""}>true</option><option value="false" ${!p.custom?"selected":""}>false</option></select></div>
        <div class="field"><label>HTML Content</label><textarea data-pf="html" rows="8">${esc(p.html||"")}</textarea></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-ghost" data-act="cancel" style="flex:1">Batal</button>
        <button class="btn btn-primary" data-act="save-page" style="flex:2"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>
      </div>`;
    contentBox.querySelector("[data-act='cancel']").onclick = () => { ADMIN_EDITING = null; renderAdminPanel(); };
    contentBox.querySelector("[data-act='save-page']").onclick = async () => {
      const newId = contentBox.querySelector("[data-pf='id']").value.trim();
      const data = {
        title: contentBox.querySelector("[data-pf='title']").value.trim(),
        subtitle: contentBox.querySelector("[data-pf='subtitle']").value.trim(),
        custom: contentBox.querySelector("[data-pf='custom']").value === "true",
        html: contentBox.querySelector("[data-pf='html']").value
      };
      if(newId !== id) delete CLOUD_DATA.pages[id];
      CLOUD_DATA.pages[newId] = data;
      const ok = await persistCloud();
      ADMIN_EDITING = null;
      renderCustomPages();
      renderAdminPanel();
      toast(ok ? "Tersimpan." : "Gagal.", ok ? "success" : "error");
    };
  });

  content.querySelectorAll("[data-del-page]").forEach(b => b.onclick = async () => {
    const id = b.dataset.delPage;
    if(!confirm(`Hapus page "${id}"?`)) return;
    delete CLOUD_DATA.pages[id];
    const ok = await persistCloud();
    renderCustomPages(); renderAdminPanel();
    toast(ok ? "Dihapus." : "Gagal.", ok ? "success" : "error");
  });
}

/* ---- SIDEBAR TAB ---- */
function renderSidebarTab(content){
  const items = CLOUD_DATA.sidebar || [];
  content.innerHTML = `
    <button class="btn btn-primary btn-block" data-act="add" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Tambah Sidebar Item</button>
    <div style="max-height:340px;overflow-y:auto;padding-right:4px">
      ${items.length ? items.map((it,i) => `
        <div class="admin-item">
          <div class="admin-item-info">
            <b>${esc(it.label)}</b>
            <small>${esc(it.id)} · ${it.adminOnly ? "ADMIN" : "USER"} · → ${esc(it.target||"-")}</small>
          </div>
          <div class="admin-item-btns">
            <button data-edit="${i}"><i class="fa-solid fa-pen"></i></button>
            <button class="del" data-del="${i}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("") : `<div class="empty" style="padding:24px"><p>Belum ada.</p></div>`}
    </div>`;
  content.querySelector("[data-act='add']").onclick = () => { ADMIN_EDITING = { tab:"sidebar", idx:-1 }; renderAdminPanel(); };
  content.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { ADMIN_EDITING = { tab:"sidebar", idx: Number(b.dataset.edit) }; renderAdminPanel(); });
  content.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.del);
    if(!confirm(`Hapus "${CLOUD_DATA.sidebar[i].label}"?`)) return;
    CLOUD_DATA.sidebar.splice(i, 1);
    const ok = await persistCloud();
    renderSidebar(); applyAdminMode(); renderAdminPanel();
    toast(ok ? "Dihapus." : "Gagal.", ok ? "success" : "error");
  });
}

/* ---- NAVBAR TAB ---- */
function renderNavbarTab(content){
  const items = CLOUD_DATA.navbar || [];
  content.innerHTML = `
    <button class="btn btn-primary btn-block" data-act="add" style="margin-bottom:12px"><i class="fa-solid fa-plus"></i> Tambah Navbar Item</button>
    <div style="max-height:340px;overflow-y:auto;padding-right:4px">
      ${items.length ? items.map((it,i) => `
        <div class="admin-item">
          <div class="admin-item-info">
            <b>${esc(it.label)}</b>
            <small>${esc(it.id)} · → ${esc(it.page)}</small>
          </div>
          <div class="admin-item-btns">
            <button data-edit="${i}"><i class="fa-solid fa-pen"></i></button>
            <button class="del" data-del="${i}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`).join("") : `<div class="empty" style="padding:24px"><p>Belum ada.</p></div>`}
    </div>`;
  content.querySelector("[data-act='add']").onclick = () => { ADMIN_EDITING = { tab:"navbar", idx:-1 }; renderAdminPanel(); };
  content.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { ADMIN_EDITING = { tab:"navbar", idx: Number(b.dataset.edit) }; renderAdminPanel(); });
  content.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.del);
    if(!confirm(`Hapus "${CLOUD_DATA.navbar[i].label}"?`)) return;
    CLOUD_DATA.navbar.splice(i, 1);
    const ok = await persistCloud();
    renderNavbar(); renderAdminPanel();
    toast(ok ? "Dihapus." : "Gagal.", ok ? "success" : "error");
  });
}

/* ---- WEBSITE TAB ---- */
function renderWebsiteTab(content){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const modeInfo = {
    open: { label: "ONLINE", color: "#4ade80", icon: "fa-circle-check", desc: "Website online" },
    maintenance: { label: "MAINTENANCE", color: "#fbbf24", icon: "fa-screwdriver-wrench", desc: "User lihat maintenance popup" },
    update: { label: "UPDATE", color: "#6c7cff", icon: "fa-rocket", desc: "User lihat changelog popup" }
  };
  const info = modeInfo[mode] || modeInfo.open;
  content.innerHTML = `
    <div class="maint-banner" style="background:${info.color}15;border-color:${info.color}40;color:${info.color}"><i class="fa-solid ${info.icon}"></i> Status: <b style="margin-left:4px">${info.label}</b></div>
    <p style="font-size:11.5px;color:var(--muted);margin-bottom:14px">${esc(info.desc)}</p>
    <div style="font-size:10.5px;font-weight:700;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-mono)">Mode Website</div>
    <div style="display:flex;gap:6px;margin-bottom:16px">
      <button class="btn ${mode==='open'?'btn-primary':'btn-ghost'}" data-mode="open" style="flex:1;font-size:11px;padding:10px 6px"><i class="fa-solid fa-circle-check"></i> Open</button>
      <button class="btn ${mode==='maintenance'?'btn-wa':'btn-ghost'}" data-mode="maintenance" style="flex:1;font-size:11px;padding:10px 6px"><i class="fa-solid fa-screwdriver-wrench"></i> Maint</button>
      <button class="btn ${mode==='update'?'btn-primary':'btn-ghost'}" data-mode="update" style="flex:1;font-size:11px;padding:10px 6px"><i class="fa-solid fa-rocket"></i> Update</button>
    </div>
    <div class="field"><label>Pesan Maintenance</label><textarea id="maintMsgInput" rows="3">${esc(site.maintenanceMessage || "")}</textarea></div>
    <div class="field" style="margin-top:10px"><label>Estimasi</label><input type="text" id="maintEtaInput" value="${esc(site.maintenanceEta || "")}" placeholder="30 menit"></div>
    <button class="btn btn-primary btn-block" id="saveSiteBtn" style="margin-top:14px"><i class="fa-solid fa-floppy-disk"></i> Simpan</button>`;

  content.querySelectorAll("[data-mode]").forEach(b => b.onclick = async () => {
    CLOUD_DATA.site.mode = b.dataset.mode;
    const ok = await persistCloud();
    if(ok){ toast("Mode: " + b.dataset.mode.toUpperCase(), "success"); renderAdminPanel(); checkMaintenance(); checkChangelog(); }
  });
  content.querySelector("#saveSiteBtn").onclick = async (e) => {
    CLOUD_DATA.site.maintenanceMessage = content.querySelector("#maintMsgInput").value.trim() || "Website lagi diperbaiki.";
    CLOUD_DATA.site.maintenanceEta = content.querySelector("#maintEtaInput").value.trim();
    const btn = e.target; btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const ok = await persistCloud();
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan';
    toast(ok ? "Disimpan." : "Gagal.", ok ? "success" : "error");
    checkMaintenance();
  };
}

/* ============ DETAIL MODAL ============ */
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

/* ============ CLOCK ============ */
function startClock(){
  const tEl = $("#clockTime"), sEl = $("#clockSec"); if(!tEl || !sEl) return;
  const tick = () => {
    const d = new Date();
    tEl.textContent = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    sEl.textContent = ":" + String(d.getSeconds()).padStart(2,"0");
  };
  tick(); setInterval(tick, 1000);
}

/* ============ GENERAL EVENTS ============ */
function initGeneralEvents(){
  document.addEventListener("click", e => {
    if(e.target.closest("#fullpageBack")){ closeFullPage(); return; }

    // Sidebar trigger
    const sbTrigger = e.target.closest("[data-sidebar]");
    if(sbTrigger && !sbTrigger.closest(".sidebar")){
      const target = sbTrigger.dataset.sidebar;
      handleSidebarClick(target);
      return;
    }

    // Sidebar item
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
      refreshAll(); renderSidebar(); renderNavbar(); renderCustomPages(); renderPreferences();
      checkMaintenance(); checkChangelog();
    } else toast("Gagal.","error");
  });

  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      $("#detailModal")?.classList.remove("show");
      $("#qrisModal")?.classList.remove("show");
      $("#themePanel")?.classList.remove("show");
      closeAdminLogin(); closeAdminPanel(); closeFullPage(); closeSidebar();
    }
  });
}

function handleSidebarClick(target){
  if(target === "admin"){ if(IS_ADMIN) openAdminPanel(); return; }
  // Kalau ada di pages → fullpage
  if(CLOUD_DATA?.pages?.[target]){ openFullPage(target); return; }
  // Kalau built-in fragment
  openFullPage(target);
}

/* ============ REFRESH ALL ============ */
function refreshAll(){
  renderPreferences();
  renderServices();
  renderProducts();
  renderPayment();
  renderSidebar();
  renderNavbar();
  renderCustomPages();
}

/* ============ FRAGMENT BINDERS ============ */
window.bindAboutPage = function(){
  const d = CLOUD_DATA.preferences?.developer || {};
  const c = CLOUD_DATA.preferences?.contact || {};
  const setTxt = (id,v)=>{ const el=$(id); if(el) el.textContent = v || ""; };
  const setSrc = (id,v)=>{ const el=$(id); if(el) el.src = v || ""; };
  const setHref = (id,v)=>{ const el=$(id); if(el) el.href = v || "#"; };
  setTxt("#aboutNameText", d.name);
  setTxt("#aboutUsernameText", d.username);
  setTxt("#aboutQuote", d.quote);
  setTxt("#aboutDesc", d.description);
  setTxt("#aboutCurrently", d.currently);
  setSrc("#aboutAvatar", d.profileImage);
  const statsEl = $("#aboutStats");
  if(statsEl) statsEl.innerHTML = (d.stats||[]).map(s => `<div class="about-stat"><div class="about-stat-num">${esc(s.num)}</div><div class="about-stat-label">${esc(s.label)}</div></div>`).join("");
  const tkEl = $("#aboutToolkit");
  if(tkEl) tkEl.innerHTML = (d.toolkit||[]).map(t => `<div class="about-tool ${esc(t.cls)}"><i class="${esc(t.icon)}"></i> ${esc(t.name)}</div>`).join("");
  setHref("#aboutWaBtn", c.whatsapp);
  setHref("#aboutChannelBtn", c.channel);
  $$(".about-tab").forEach(t => t.onclick = () => { $$(".about-tab").forEach(x => x.classList.remove("active")); t.classList.add("active"); });
};

window.bindLaporPage = function(){
  const form = $("#laporForm"); if(!form) return;
  const nameEl = $("#lfName"), catEl = $("#lfCategory"), msgEl = $("#lfMessage"), countEl = $("#lfCount"), submitBtn = $("#lfSubmit");

  try{
    const lastName = localStorage.getItem("msi_lapor_name") || "";
    if(lastName){ nameEl.value = lastName; $("#laporUserDisplay").textContent = "@" + lastName; }
  }catch(e){}

  const updateQuota = () => {
    const rem = getRemainingLapor();
    const limit = CLOUD_DATA.preferences?.dailyLimit || 5;
    const q = $("#laporQuotaValue");
    if(q) q.textContent = rem + "/" + limit;
    if(rem <= 0){ submitBtn.disabled = true; submitBtn.style.opacity = "0.5"; }
  };
  updateQuota();

  msgEl.addEventListener("input", () => { countEl.textContent = msgEl.value.length; });
  nameEl.addEventListener("input", () => {
    const v = nameEl.value.trim();
    $("#laporUserDisplay").textContent = v ? "@" + v : "@-";
  });

  const t0 = Date.now();
  setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000);
    const m = Math.floor(s/60), ss = s % 60;
    const el = $("#laporSession");
    if(el) el.textContent = "Sesi " + String(m).padStart(2,"0") + ":" + String(ss).padStart(2,"0");
  }, 1000);

  submitBtn.onclick = async () => {
    if(getRemainingLapor() <= 0){ toast("Kuota habis.","error"); return; }
    const nama = nameEl.value.trim();
    if(!nama){ toast("Isi nama dulu.","error"); nameEl.focus(); return; }
    const pesan = msgEl.value.trim();
    if(pesan.length < 5){ toast("Min 5 karakter.","error"); msgEl.focus(); return; }
    submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    try{ localStorage.setItem("msi_lapor_name", nama); }catch(e){}
    const ok = await sendLaporToDiscord({ nama, kategori: catEl.value, pesan });
    if(ok){
      incrementLapor({ nama, kategori: catEl.value, pesan: pesan.slice(0,100) });
      toast("Terkirim. Makasih!","success");
      msgEl.value = ""; countEl.textContent = "0"; updateQuota();
    } else toast("Gagal kirim.","error");
    submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
  };
};

window.bindOrderPage = function(){
  const wa = CLOUD_DATA.preferences?.contact?.whatsapp || "#";
  const all = [
    ...(CLOUD_DATA.services||[]).map(s => ({ ...s, _cat: "jasa", _catLabel: "Jasa" })),
    ...(CLOUD_DATA.products||[]).map(p => ({ ...p, _cat: "produk", _catLabel: "Produk" }))
  ];
  const statEl = $("#orderStatProducts");
  if(statEl) statEl.textContent = all.length + "+";

  let cat = "all", search = "";

  const render = () => {
    const c = $("#orderProducts"); if(!c) return;
    const filtered = all.filter(p => {
      if(cat !== "all" && p._cat !== cat) return false;
      if(search){ const hay = (p.name + " " + (p.description||"")).toLowerCase(); if(!hay.includes(search.toLowerCase())) return false; }
      return true;
    });
    if(!filtered.length){ c.innerHTML = `<div class="empty" style="padding:30px"><i class="fa-regular fa-folder-open"></i><p>Belum ada produk.</p></div>`; return; }
    c.innerHTML = filtered.map(p => {
      const msg = encodeURIComponent(`Halo, gw mau order "${p.name}". Bisa dijelasin detailnya?`);
      const link = wa + (wa.includes("?")?"&":"?") + "text=" + msg;
      return `<div class="order-product">
        <div class="order-product-head">
          <div class="order-product-icon" style="color:var(--primary)"><i class="${esc(p.icon||'fa-solid fa-box')}"></i></div>
          <div class="order-product-badges"><span class="order-product-badge cat"><i class="fa-solid fa-tag"></i> ${esc(p._catLabel)}</span></div>
        </div>
        <div class="order-product-title">${esc(p.name)}</div>
        <div class="order-product-desc">${esc(p.description||"")}</div>
        <div class="order-product-features">
          <div class="order-product-feature"><i class="fa-solid fa-check"></i> Harga terjangkau</div>
          <div class="order-product-feature"><i class="fa-solid fa-check"></i> Proses cepat</div>
        </div>
        <div class="order-product-foot">
          <div><div class="order-product-price">${esc(p.price||"-")}</div></div>
          <a class="order-product-cta" href="${esc(link)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Order</a>
        </div>
      </div>`;
    }).join("");
  };
  render();

  $$("#orderCats .order-cat").forEach(b => b.onclick = () => {
    $$("#orderCats .order-cat").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); cat = b.dataset.cat; render();
  });
  $("#orderSearch")?.addEventListener("input", e => { search = e.target.value.trim(); render(); });
};

/* sendLaporToDiscord — expose ke window */
window.sendLaporToDiscord = async function(payload){
  const url = (CONFIG.webhookSaran || "").trim();
  if(!url || !/^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(url)) return false;
  const d = CLOUD_DATA.preferences?.developer || {};
  const now = new Date();
  const body = {
    username: (d.name || "MSI ASTRA").slice(0, 80),
    avatar_url: d.profileImage,
    allowed_mentions: { parse: [] },
    embeds: [{
      title: "Pesan Baru dari User",
      color: 0x06b6d4,
      fields: [
        { name: "Pengirim", value: "```" + (payload.nama||"Anonim").slice(0,90) + "```", inline: true },
        { name: "Kategori", value: "```" + (payload.kategori||"-").slice(0,90) + "```", inline: true },
        { name: "Isi Pesan", value: "```\n" + (payload.pesan||"").slice(0,1000) + "\n```", inline: false }
      ],
      timestamp: now.toISOString()
    }]
  };
  const jsonStr = JSON.stringify(body);
  if(navigator.sendBeacon){ try{ const blob = new Blob([jsonStr], { type:"application/json" }); if(navigator.sendBeacon(url, blob)) return true; }catch(e){} }
  try{ fetch(url, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"text/plain" }, body: jsonStr }).catch(()=>{}); return true; }catch(e){ return false; }
};

/* ============ INIT ============ */
(async function init(){
  try{
    startClock();
    initSidebar();
    initAdminLogin();
    initGeneralEvents();

    const data = await cloudLoad();
    CLOUD_DATA = ensureStructure(data || DEFAULT_DATA);

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
