/* ==========================================================
   MSI ASTRA v7.0 — Main Script
   Worker: https://admin.muhammadbaimab.workers.dev
   ========================================================== */

const CONFIG = {
  api: { baseUrl: "https://admin.muhammadbaimab.workers.dev" },
  admin: { username: "wthf_b6", password: "4_rXEgVV5!_t8cq" }
};

const SESSION_KEY = "msi_session";
const TOKEN_KEY = "msi_token";
const THEME_KEY = "msi_theme_active";
const LAPOR_KEY = "msi_lapor_history";
const SEEN_CHANGELOG_KEY = "msi_seen_changelog";

let CLOUD_DATA = null;
let IS_ADMIN = false;
let ACTIVE_THEME = "t1";
let CONTACT_LOADED = false;
let AUTH_TOKEN = "";
try { AUTH_TOKEN = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { }

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, x => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[x]));

const DEFAULT_DATA = {
  preferences: {
    appName: "MSI ASTRA", appSubtitle: "WEBVIEW", heroBadge: "Online & Ready",
    logo: "", heroRotate: ['Halo, gw <span class="accent">Baim</span>'],
    heroSubtitle: "Tempat jasa, aplikasi, dan project digital.",
    heroPrimaryBtn: { label: "Lihat Jasa", icon: "fa-solid fa-store", target: "services" },
    heroWaBtn: { label: "Chat WA", icon: "fa-brands fa-whatsapp" },
    developer: { name: "Baim", username: "@wthf_b6", role: "", profileImage: "", bannerImage: "", description: "", quote: [], currently: [], stats: [], toolkit: [], badges: [], projects: [] },
    contact: { whatsapp: "", channel: "" },
    webhookSaran: "", dailyLimit: 5
  },
  themes: { active: "t1", t1: { name: "Monochrome", primary: "#ffffff", secondary: "#a1a1aa", bgImage: "", bgOpacity: 0.15, banner: { image: "", title: "MSI ASTRA", desc: "" } } },
  sidebar: [], navbar: [], pages: {},
  services: [], products: [], payment: [], changelog: [],
  site: { mode: "open", maintenanceMessage: "", maintenanceEta: "" },
  admin: { claimed: false, ownerId: null, claimedAt: null },
  builder: { pages: {}, modules: {} }
};

/* ============ FRAGMENT LOADER ============ */
const FRAGMENT_CACHE = {};
async function loadFragment(name) {
  if (FRAGMENT_CACHE[name]) return FRAGMENT_CACHE[name];
  try {
    const r = await fetch(`pages/${name}.html?v=10`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    FRAGMENT_CACHE[name] = html;
    return html;
  } catch (e) {
    return `<div class="empty" style="margin-top:20px"><i class="fa-solid fa-triangle-exclamation"></i><p>Gagal memuat "${esc(name)}".</p></div>`;
  }
}

function loadingHTML() {
  return `<div style="padding:60px 20px;text-align:center"><i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:var(--primary)"></i><p style="margin-top:14px;color:var(--muted);font-size:12.5px;font-family:var(--font-mono)">LOADING...</p></div>`;
}

function executeScripts(container) {
  container.querySelectorAll("script").forEach(oldScript => {
    const newScript = document.createElement("script");
    [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

/* ============ CLOUD ============ */
async function cloudLoad() {
  if (!CONFIG.api?.baseUrl) return null;
  try {
    const r = await fetch(`${CONFIG.api.baseUrl}/data`);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } catch (e) { console.warn("[Cloud load]", e); return null; }
}

async function cloudSave(data) {
  if (!CONFIG.api?.baseUrl) return false;
  try {
    const headers = { "Content-Type": "application/json" };
    if (AUTH_TOKEN) headers["Authorization"] = "Bearer " + AUTH_TOKEN;
    const r = await fetch(`${CONFIG.api.baseUrl}/save`, { method: "POST", headers, body: JSON.stringify(data) });
    if (r.status === 401) { toast("Session expired. Login ulang.", "error"); clearSession(); return false; }
    if (!r.ok) return false;
    const j = await r.json();
    return j.ok === true;
  } catch (e) { console.warn("[Cloud save]", e); return false; }
}

async function persistCloud() {
  if (!CLOUD_DATA) return false;
  return await cloudSave(CLOUD_DATA);
}

async function cloudVersions() {
  if (!CONFIG.api?.baseUrl || !AUTH_TOKEN) return [];
  try {
    const r = await fetch(`${CONFIG.api.baseUrl}/versions`, { headers: { "Authorization": "Bearer " + AUTH_TOKEN } });
    if (!r.ok) return [];
    return await r.json();
  } catch (e) { return []; }
}

async function cloudRestore(id) {
  if (!CONFIG.api?.baseUrl || !AUTH_TOKEN) return null;
  try {
    const r = await fetch(`${CONFIG.api.baseUrl}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + AUTH_TOKEN },
      body: JSON.stringify({ id })
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.ok ? j.data : null;
  } catch (e) { return null; }
}

function ensureStructure(d) {
  if (!d) d = {};
  const def = DEFAULT_DATA;
  d.preferences = Object.assign({}, def.preferences, d.preferences || {});
  d.preferences.developer = Object.assign({}, def.preferences.developer, d.preferences.developer || {});
  d.preferences.contact = Object.assign({}, def.preferences.contact, d.preferences.contact || {});
  if (typeof d.preferences.logo !== "string") d.preferences.logo = "";
  d.themes = { active: "t1", t1: Object.assign({}, def.themes.t1, d.themes?.t1 || {}) };
  d.sidebar = Array.isArray(d.sidebar) ? d.sidebar : [];
  d.navbar = Array.isArray(d.navbar) ? d.navbar : def.navbar;
  d.pages = d.pages && typeof d.pages === "object" ? d.pages : {};
  d.services = Array.isArray(d.services) ? d.services : [];
  d.products = Array.isArray(d.products) ? d.products : [];
  d.payment = Array.isArray(d.payment) ? d.payment : [];
  d.changelog = Array.isArray(d.changelog) ? d.changelog : [];
  d.site = Object.assign({ mode: "open", maintenanceMessage: "", maintenanceEta: "" }, d.site || {});
  d.admin = Object.assign({ claimed: false, ownerId: null, claimedAt: null }, d.admin || {});
  d.builder = d.builder || {};
  d.builder.pages = d.builder.pages || {};
  d.builder.modules = d.builder.modules || {};
  return d;
}

/* ============ HELPERS ============ */
function toast(msg, type = "info") {
  const wrap = $("#toastWrap"); if (!wrap) return;
  const el = document.createElement("div");
  el.className = "toast " + type;
  const icons = { success: "fa-solid fa-circle-check", error: "fa-solid fa-circle-exclamation", info: "fa-solid fa-circle-info" };
  el.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 2800);
}

function copyText(text) {
  const done = () => toast("Disalin.", "success");
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done();
    } catch (e) { }
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}

function hexToRgba(hex, a) {
  if (!hex) return `rgba(255,255,255,${a})`;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.substring(0, 2), 16) || 255;
  const g = parseInt(h.substring(2, 4), 16) || 255;
  const b = parseInt(h.substring(4, 6), 16) || 255;
  return `rgba(${r},${g},${b},${a})`;
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  let cls = "available";
  if (s.includes("tidak") || s.includes("unavailable")) cls = "unavailable";
  else if (s.includes("pre")) cls = "preorder";
  else if (s.includes("coming")) cls = "comingsoon";
  else if (s.includes("maintenance")) cls = "maintenance";
  return `<span class="badge ${cls}">${esc(status || "Tersedia")}</span>`;
}

/* ============ LOGO ============ */
function applyLogo() {
  const logo = CLOUD_DATA?.preferences?.logo || "";
  const slots = [
    { icon: "#brandLogoIcon", img: "#brandLogoImg" },
    { icon: "#maintLogoIcon", img: "#maintLogoImg" },
    { icon: "#changelogLogoIcon", img: "#changelogLogoImg" },
    { icon: "#adminLogoIcon", img: "#adminLogoImg" }
  ];
  slots.forEach(s => {
    const iconEl = $(s.icon), imgEl = $(s.img);
    if (!iconEl || !imgEl) return;
    if (logo) { iconEl.style.display = "none"; imgEl.style.display = "block"; if (imgEl.src !== logo) imgEl.src = logo; }
    else { iconEl.style.display = ""; imgEl.style.display = "none"; }
  });
  let fav = $("#dynamicFavicon");
  if (!fav) { fav = document.createElement("link"); fav.id = "dynamicFavicon"; fav.rel = "icon"; document.head.appendChild(fav); }
  fav.href = logo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2360a5fa'/%3E%3Ctext x='50' y='68' font-size='52' text-anchor='middle' fill='%23000' font-weight='800'%3EA%3C/text%3E%3C/svg%3E";
}

/* ============ THEME ============ */
function getActiveThemeKey() { return "t1"; }
function applyTheme() {
  const t = CLOUD_DATA?.themes?.t1;
  if (!t) return;
  ACTIVE_THEME = "t1";
  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary || "#ffffff");
  root.style.setProperty("--secondary", t.secondary || "#a1a1aa");
  root.style.setProperty("--primary-soft", hexToRgba(t.primary || "#ffffff", 0.15));
  root.style.setProperty("--primary-glow", hexToRgba(t.primary || "#ffffff", 0.4));
  root.style.setProperty("--bg-image", t.bgImage ? `url('${t.bgImage}')` : "none");
  root.style.setProperty("--bg-opacity", t.bgOpacity || 0.15);
  try { localStorage.setItem(THEME_KEY, "t1"); } catch (e) { }
  renderBanner(t.banner);
}

function renderBanner(banner) {
  const img = $("#bannerImg"), title = $("#bannerTitle"), desc = $("#bannerDesc");
  if (!banner) { if (img) img.style.display = "none"; if (title) title.textContent = "MSI ASTRA"; return; }
  if (banner.image) { if (img) { img.style.display = "block"; img.style.opacity = "0"; img.src = banner.image; img.onload = () => img.style.opacity = "1"; } }
  else if (img) img.style.display = "none";
  if (title) title.textContent = banner.title || "MSI ASTRA";
  if (desc) desc.textContent = banner.desc || "";
}

function renderThemeGrid() {
  const grid = $("#themeGrid"); if (!grid) return;
  const t = CLOUD_DATA?.themes?.t1; if (!t) return;
  grid.innerHTML = `<button class="theme-swatch selected" data-theme="t1" style="background:linear-gradient(135deg,${t.primary},${t.secondary})"><i class="fa-solid fa-palette" style="color:#000"></i><span>${esc(t.name)}</span></button>`;
}

function applyThemeButtonVisibility() {
  const b1 = $("#themeBtn"); if (b1) b1.style.display = "none";
  const b2 = $("#themeQuickBtn"); if (b2) b2.style.display = "none";
}

/* ============ LAPOR QUOTA ============ */
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getLaporHistory() {
  try {
    const raw = localStorage.getItem(LAPOR_KEY);
    if (!raw) return { date: getTodayKey(), count: 0, items: [] };
    const h = JSON.parse(raw);
    if (h.date !== getTodayKey()) return { date: getTodayKey(), count: 0, items: [] };
    return h;
  } catch (e) { return { date: getTodayKey(), count: 0, items: [] }; }
}
function setLaporHistory(h) { try { localStorage.setItem(LAPOR_KEY, JSON.stringify(h)); } catch (e) { } }
function getRemainingLapor() {
  const limit = CLOUD_DATA?.preferences?.dailyLimit || 5;
  return Math.max(0, limit - getLaporHistory().count);
}
function incrementLapor(data) {
  const h = getLaporHistory(); h.count += 1; h.items.push({ t: Date.now(), ...data }); setLaporHistory(h);
}

/* ============ PREFERENCES ============ */
function renderPreferences() {
  const p = CLOUD_DATA.preferences || {};
  document.title = p.appName || "MSI ASTRA";
  const setTxt = (id, v) => { const el = $(id); if (el) el.textContent = v || ""; };
  setTxt("#brandName", p.appName);
  setTxt("#brandSubtitle", p.appSubtitle);
  setTxt("#sidebarBrandName", p.appName);

  const badge = $("#heroBadge");
  if (badge) badge.innerHTML = `<i class="fa-solid fa-circle"></i> <span>${esc(p.heroBadge || "Online")}</span>`;

  const rot = $("#welcomeRotate");
  if (rot) {
    const items = p.heroRotate || [];
    rot.innerHTML = items.map((h, i) => `<div class="welcome-item ${i === 0 ? "active" : ""}">${h}</div>`).join("");
    if (items.length > 1) {
      let idx = 0, prev = 0;
      const els = $$(".welcome-item", rot);
      setInterval(() => {
        const cur = els[prev]; if (!cur) return;
        cur.classList.remove("active"); cur.classList.add("leaving");
        setTimeout(() => cur.classList.remove("leaving"), 800);
        idx = (idx + 1) % els.length;
        els[idx].classList.add("active"); prev = idx;
      }, 5400);
    }
  }

  setTxt("#heroSub", p.heroSubtitle);

  const acts = $("#heroActions");
  if (acts) {
    const wa = p.contact?.whatsapp || "#";
    const pb = p.heroPrimaryBtn || {};
    const wb = p.heroWaBtn || {};
    acts.innerHTML = `
      <button class="btn btn-primary" data-nav="${esc(pb.target || 'services')}"><i class="${esc(pb.icon || 'fa-solid fa-store')}"></i> ${esc(pb.label || 'Lihat Jasa')}</button>
      <a class="btn btn-wa" id="homeWaBtn" href="${esc(wa)}" target="_blank" rel="noopener"><i class="${esc(wb.icon || 'fa-brands fa-whatsapp')}"></i> ${esc(wb.label || 'Chat WA')}</a>
    `;
  }

  const pc = $("#payConfirmBtn");
  const c = p.contact || {};
  if (pc) pc.href = (c.whatsapp || "#") + (c.whatsapp?.includes("?") ? "&" : "?") + "text=" + encodeURIComponent("Halo, gw udah bayar. Ini bukti transfernya.");

  applyLogo();
}

/* ============ SERVICES / PRODUCTS / PAYMENT ============ */
function cardHTML(item, idx, type) {
  return `<article class="card" data-type="${type}" data-idx="${idx}" tabindex="0" role="button"><div class="card-icon"><i class="${esc(item.icon || 'fa-solid fa-box')}"></i></div><div class="card-body"><div class="card-head"><div class="card-title">${esc(item.name)}</div>${statusBadge(item.status)}</div><p class="card-desc">${esc(item.description || "")}</p><div class="card-foot"><span class="card-price">${esc(item.price || "-")}</span></div></div></article>`;
}

function emptyState(msg) { return `<div class="empty"><i class="fa-regular fa-folder-open"></i><p>${esc(msg)}</p></div>`; }

function renderServices() {
  const grid = $("#servicesGrid"), homeGrid = $("#homeServices");
  const list = CLOUD_DATA?.services || [];
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = emptyState("Belum ada jasa.");
    if (homeGrid) homeGrid.innerHTML = "";
    const c = $("#servicesCount"); if (c) c.textContent = "";
    return;
  }
  grid.innerHTML = list.map((s, i) => cardHTML(s, i, "service")).join("");
  if (homeGrid) homeGrid.innerHTML = list.slice(0, 3).map((s, i) => cardHTML(s, i, "service")).join("");
  const c = $("#servicesCount"); if (c) c.textContent = list.length + " item";
}

function renderProducts() {
  const grid = $("#productsGrid");
  const list = CLOUD_DATA?.products || [];
  if (!grid) return;
  if (!list.length) { grid.innerHTML = emptyState("Belum ada produk."); const c = $("#productsCount"); if (c) c.textContent = ""; return; }
  grid.innerHTML = list.map((p, i) => cardHTML(p, i, "product")).join("");
  const c = $("#productsCount"); if (c) c.textContent = list.length + " item";
}

function renderPayment() {
  const grid = $("#payGrid"); if (!grid) return;
  const list = CLOUD_DATA?.payment || [];
  if (!list.length) { grid.innerHTML = emptyState("Belum ada metode pembayaran."); return; }

  grid.innerHTML = list.map(p => {
    const st = (p.status || "available").toLowerCase();
    const isM = st === "maintenance";
    const isUnavail = st === "unavailable";

    let actionHTML = "";
    if (isM) actionHTML = `<button class="pay-action" disabled>Maintenance</button>`;
    else if (isUnavail) actionHTML = `<button class="pay-action" disabled style="opacity:.6">Belum Tersedia</button>`;
    else if (p.type === "qris") actionHTML = `<button class="pay-action" data-pay="qris" data-id="${esc(p.id || 'qris')}">Lihat</button>`;
    else if (p.type === "phone") actionHTML = `<button class="pay-action" data-copy="${esc(p.value)}">Salin</button>`;
    else if (p.type === "url") actionHTML = `<a class="pay-action" href="${esc(p.value)}" target="_blank" rel="noopener">Buka</a>`;

    const infoText = p.type === "qris" ? "Semua e-wallet & bank" : (p.value || "-");

    return `<div class="pay-card ${isM || isUnavail ? 'maintenance' : ''}"><div class="pay-icon" style="color:${esc(p.color || '#fff')}"><i class="${esc(p.icon || 'fa-solid fa-wallet')}"></i></div><div class="pay-body"><div class="pay-name">${esc(p.name || p.id || 'Payment')}${isM ? '<span class="badge maintenance">Maintenance</span>' : ''}${isUnavail ? '<span class="badge unavailable">Off</span>' : ''}</div><div class="pay-info" style="${p.type === 'qris' ? 'font-family:inherit' : ''}">${esc(infoText)}</div></div>${actionHTML}</div>`;
  }).join("");
}

/* ============ SIDEBAR / NAVBAR ============ */
function renderSidebar() {
  const nav = $("#sidebarNav"); if (!nav) return;
  const items = CLOUD_DATA?.sidebar || [];
  const userItems = items.filter(f => !f.adminOnly);
  const adminItems = items.filter(f => f.adminOnly);
  const renderItem = (f) => `<button class="sidebar-item" data-sidebar="${esc(f.id)}"${f.adminOnly ? ` id="sidebarAdminBtn" style="display:${IS_ADMIN ? 'flex' : 'none'}"` : ''}><div class="sidebar-item-icon ${esc(f.color || '')}"><i class="fa-solid ${esc(f.icon)}"></i></div><div class="sidebar-item-body"><span>${esc(f.label)}</span><small>${esc(f.desc || "")}</small></div><i class="fa-solid fa-chevron-right sidebar-chevron"></i></button>`;
  nav.innerHTML = `${userItems.map(renderItem).join("")}${adminItems.length ? `<div class="sidebar-section-label" id="adminSectionLabel" style="display:${IS_ADMIN ? 'block' : 'none'}">Admin</div>${adminItems.map(renderItem).join("")}` : ''}`;
}

function renderNavbar() {
  const nav = $("#mainNav"); if (!nav) return;
  const items = CLOUD_DATA?.navbar || [];
  nav.innerHTML = items.map((n, i) => `<button class="nav-item ${i === 0 ? 'active' : ''}" data-page="${esc(n.page)}"><i class="fa-solid ${esc(n.icon)}"></i><span>${esc(n.label)}</span></button>`).join("");
}

/* ============ BLOCK RENDERER ============ */
function renderBlock(b) {
  const d = b.data || {};
  const align = d.align || "left";
  const style = `text-align:${align}`;

  switch (b.type) {
    case "heading": {
      const sm = { sm: "18px", md: "24px", lg: "32px", xl: "42px" };
      return `<h2 style="font-size:${sm[d.size] || '24px'};${style};margin:20px 0 12px;font-weight:800;letter-spacing:-.4px">${esc(d.text || "")}</h2>`;
    }
    case "text":
      return `<p style="${style};font-size:14px;line-height:1.7;color:var(--muted);margin:10px 0">${esc(d.text || "").replace(/\n/g, "<br>")}</p>`;
    case "image":
      if (!d.src) return "";
      return `<div style="${style};margin:16px 0"><img src="${esc(d.src)}" alt="${esc(d.alt || "")}" style="max-width:100%;border-radius:${d.rounded ? '14px' : '0'};${d.width ? `width:${esc(d.width)}` : ''}"></div>`;
    case "button": {
      const cls = d.style === "ghost" ? "btn-ghost" : d.style === "wa" ? "btn-wa" : "btn-primary";
      return `<div style="${style};margin:14px 0"><a class="btn ${cls}" href="${esc(d.href || '#')}" target="_blank" rel="noopener"><i class="${esc(d.icon || 'fa-solid fa-arrow-right')}"></i> ${esc(d.label || "Klik")}</a></div>`;
    }
    case "hero": {
      const ctas = (d.ctas || []).map(c => `<a class="btn ${c.style === 'wa' ? 'btn-wa' : 'btn-primary'}" href="${esc(c.href || '#')}" target="_blank" rel="noopener"><i class="${esc(c.icon || 'fa-solid fa-arrow-right')}"></i> ${esc(c.label || 'Klik')}</a>`).join("");
      return `<div class="hero" style="margin:16px 0"><div class="hero-badge"><i class="fa-solid fa-circle"></i> <span>${esc(d.badge || "Info")}</span></div><h1 style="font-size:clamp(24px,6vw,32px);font-weight:800;letter-spacing:-1px;line-height:1.15;margin-bottom:10px">${esc(d.title || "")}</h1><p class="hero-sub">${esc(d.subtitle || "")}</p><div class="hero-actions">${ctas}</div></div>`;
    }
    case "card-grid": {
      const cards = (d.cards || []).map(c => `<article class="card" style="cursor:default"><div class="card-icon"><i class="${esc(c.icon || 'fa-solid fa-box')}"></i></div><div class="card-body"><div class="card-head"><div class="card-title">${esc(c.title || "")}</div>${c.price ? `<span class="card-price">${esc(c.price)}</span>` : ''}</div><p class="card-desc">${esc(c.desc || "")}</p></div></article>`).join("");
      return `<div class="cards" style="margin:14px 0">${cards}</div>`;
    }
    case "table": {
      const hs = (d.headers || []).map(h => `<th style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;font-size:11px;text-transform:uppercase;color:var(--muted);font-family:var(--font-mono)">${esc(h)}</th>`).join("");
      const rs = (d.rows || []).map(row => `<tr>${row.map(cell => `<td style="padding:10px 12px;border-bottom:1px solid var(--border);font-size:13px">${esc(cell)}</td>`).join("")}</tr>`).join("");
      return `<div style="overflow-x:auto;margin:16px 0;border:1px solid var(--border);border-radius:12px"><table style="width:100%;border-collapse:collapse"><thead><tr>${hs}</tr></thead><tbody>${rs}</tbody></table></div>`;
    }
    case "form": {
      const fields = (d.fields || []).map(f => {
        if (f.type === "textarea") return `<div class="field"><label>${esc(f.label || "")}</label><textarea name="${esc(f.name || f.label)}" placeholder="${esc(f.placeholder || "")}" rows="3"></textarea></div>`;
        if (f.type === "select") return `<div class="field"><label>${esc(f.label || "")}</label><select name="${esc(f.name || f.label)}">${(f.options || []).map(o => `<option>${esc(o)}</option>`).join("")}</select></div>`;
        return `<div class="field"><label>${esc(f.label || "")}</label><input type="${esc(f.type || 'text')}" name="${esc(f.name || f.label)}" placeholder="${esc(f.placeholder || "")}"></div>`;
      }).join("");
      return `<form style="margin:16px 0;display:flex;flex-direction:column;gap:12px" onsubmit="event.preventDefault();window._builderFormSubmit(this,'${esc(d.submitTo || "whatsapp")}')">${fields}<button class="btn btn-primary" type="submit">${esc(d.submitLabel || "Kirim")}</button></form>`;
    }
    case "announcement": {
      const colors = { info: "#60a5fa", success: "#4ade80", warning: "#fbbf24", error: "#f87171" };
      const c = colors[d.type] || colors.info;
      return `<div style="padding:14px 18px;border-radius:14px;background:${c}14;border:1px solid ${c}40;color:${c};font-size:13px;margin:14px 0;display:flex;align-items:flex-start;gap:10px"><i class="fa-solid fa-circle-info" style="margin-top:2px"></i><div>${esc(d.text || "")}</div></div>`;
    }
    case "divider":
      return `<hr style="margin:22px 0;border:none;border-top:1px ${d.style === 'dashed' ? 'dashed' : 'solid'} var(--border)">`;
    case "spacer":
      return `<div style="height:${parseInt(d.height) || 24}px"></div>`;
    case "list": {
      const items = (d.items || []).map(it => `<li>${esc(it)}</li>`).join("");
      return d.ordered ? `<ol style="padding-left:22px;margin:14px 0;color:var(--muted);line-height:1.8;font-size:13.5px">${items}</ol>` : `<ul style="padding-left:22px;margin:14px 0;color:var(--muted);line-height:1.8;font-size:13.5px">${items}</ul>`;
    }
    case "quote":
      return `<blockquote style="border-left:3px solid var(--primary);padding:10px 16px;margin:14px 0;color:var(--muted);font-style:italic">${esc(d.text || "")}${d.author ? `<div style="font-size:11px;margin-top:6px;color:var(--muted-2);font-family:var(--font-mono)">— ${esc(d.author)}</div>` : ''}</blockquote>`;
    case "code":
      return `<pre style="background:rgba(0,0,0,.5);padding:16px;border-radius:12px;border:1px solid var(--border);overflow-x:auto;font-family:var(--font-mono);font-size:12px;color:var(--text);margin:14px 0"><code>${esc(d.text || "")}</code></pre>`;
    default:
      return "";
  }
}

function renderBuilderPage(page) {
  if (!page || !Array.isArray(page.blocks)) return "";
  return page.blocks.map(renderBlock).join("");
}

window._builderFormSubmit = function (form, submitTo) {
  const data = {};
  new FormData(form).forEach((v, k) => data[k] = v);
  const wa = CLOUD_DATA?.preferences?.contact?.whatsapp || "";
  const msg = Object.entries(data).map(([k, v]) => `*${k}*: ${v}`).join("\n");
  if (submitTo === "whatsapp" && wa) {
    window.open(wa + (wa.includes("?") ? "&" : "?") + "text=" + encodeURIComponent(msg), "_blank");
  } else if (CLOUD_DATA?.preferences?.webhookSaran) {
    fetch(CLOUD_DATA.preferences.webhookSaran, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "MSI Form", content: "**Form**\n" + msg }) }).then(() => toast("Terkirim.", "success")).catch(() => toast("Gagal.", "error"));
  }
};

function isModuleEnabledForPage(pageId) {
  const modules = CLOUD_DATA?.builder?.modules || {};
  for (const m of Object.values(modules)) {
    if ((m.pageIds || []).includes(pageId)) return m.enabled !== false;
  }
  return true;
}

function renderCustomPages() {
  const slot = $("#customPagesSlot"); if (!slot) return;
  const pages = CLOUD_DATA?.pages || {};
  const builderPages = CLOUD_DATA?.builder?.pages || {};

  const legacyHTML = Object.entries(pages).map(([id, p]) => {
    if (p.custom !== true || p.builder === true) return "";
    return `<section class="page" id="page-${esc(id)}"><div>${p.html || ""}</div></section>`;
  }).join("");

  const builderHTML = Object.entries(builderPages).map(([id, p]) => {
    if (p.status !== "published") return "";
    if (p.visible === false) return "";
    if (p.adminOnly === true && !IS_ADMIN) return "";
    if (!isModuleEnabledForPage(id)) return "";
    return `<section class="page" id="page-${esc(id)}"><div style="padding:8px 0">${renderBuilderPage(p)}</div></section>`;
  }).join("");

  slot.innerHTML = legacyHTML + builderHTML;
}

async function renderContactPage() {
  const slot = $("#contactSlot"); if (!slot) return;
  if (!CONTACT_LOADED) {
    slot.innerHTML = loadingHTML();
    const html = await loadFragment("contact");
    slot.innerHTML = html;
    executeScripts(slot);
    CONTACT_LOADED = true;
  } else { executeScripts(slot); }
}

/* ============ NAVIGATION ============ */
const BUILTIN_PAGES = { home: 1, services: 1, payment: 1, contact: 1 };

function pageExists(id) {
  if (BUILTIN_PAGES[id]) return true;
  if (CLOUD_DATA?.pages?.[id]?.custom === true) return true;
  const bp = CLOUD_DATA?.builder?.pages?.[id];
  if (bp && bp.status === "published" && bp.visible !== false) {
    if (bp.adminOnly === true && !IS_ADMIN) return false;
    if (!isModuleEnabledForPage(id)) return false;
    return true;
  }
  return false;
}

function goTo(page) {
  if (!pageExists(page)) return;
  $$(".page").forEach(p => p.classList.remove("active"));
  $("#page-" + page)?.classList.add("active");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (page === "contact") renderContactPage();
}

async function openFullPage(id) {
  const builderPage = CLOUD_DATA?.builder?.pages?.[id];
  if (builderPage && builderPage.status === "published") {
    const fp = $("#fullpage"), title = $("#fullpageTitle"), subtitle = $("#fullpageSubtitle"), body = $("#fullpageBody");
    if (!fp || !title || !body) return;
    title.textContent = builderPage.title || id;
    if (subtitle) subtitle.textContent = builderPage.subtitle || "MSI ASTRA";
    body.innerHTML = `<div>${renderBuilderPage(builderPage)}</div>`;
    fp.classList.add("show");
    document.body.classList.add("no-scroll");
    return;
  }
  const pageConf = CLOUD_DATA?.pages?.[id] || { title: id.replace(/[-_]/g, " "), subtitle: "MSI ASTRA", custom: false };
  const fp = $("#fullpage"), title = $("#fullpageTitle"), subtitle = $("#fullpageSubtitle"), body = $("#fullpageBody");
  if (!fp || !title || !body) return;
  title.textContent = pageConf.title || id;
  if (subtitle) subtitle.textContent = pageConf.subtitle || "MSI ASTRA";
  body.innerHTML = loadingHTML();
  fp.classList.add("show");
  document.body.classList.add("no-scroll");
  if (pageConf.custom === true) { body.innerHTML = pageConf.html || "<p>Konten kosong.</p>"; executeScripts(body); return; }
  const html = await loadFragment(id);
  body.innerHTML = html;
  executeScripts(body);
}

function closeFullPage() {
  $("#fullpage")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* ============ MAINTENANCE / CHANGELOG ============ */
function checkMaintenance() {
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const overlay = $("#userMaintOverlay"); if (!overlay) return;
  if (mode === "maintenance" && !IS_ADMIN) {
    $("#userMaintMsg").textContent = site.maintenanceMessage || "Website lagi diperbaiki.";
    const eta = $("#userMaintEta");
    if (eta) eta.textContent = site.maintenanceEta ? "Estimasi: " + site.maintenanceEta : "";
    overlay.classList.add("show");
    document.body.classList.add("no-scroll");
  } else {
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  }
}

function checkChangelog() {
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const list = CLOUD_DATA?.changelog || [];
  if (mode !== "update" || !list.length) return;
  const latest = list[0];
  if (!latest || !latest.version) return;
  let seen = null;
  try { seen = localStorage.getItem(SEEN_CHANGELOG_KEY); } catch (e) { }
  if (seen === latest.version) return;
  const overlay = $("#changelogOverlay");
  $("#changelogVersion").textContent = "v" + latest.version;
  $("#changelogDate").textContent = latest.date || "";
  const changes = Array.isArray(latest.changes) ? latest.changes : (typeof latest.changes === "string" ? latest.changes.split("\n").filter(Boolean) : []);
  $("#changelogList").innerHTML = changes.map(ch => `<div class="changelog-item"><i class="fa-solid fa-check"></i><span>${esc(ch)}</span></div>`).join("") || "<p style='font-size:12px;color:var(--muted)'>Tidak ada detail.</p>";
  overlay.classList.add("show");
  document.body.classList.add("no-scroll");
  $("#changelogClose").onclick = () => {
    try { localStorage.setItem(SEEN_CHANGELOG_KEY, latest.version); } catch (e) { }
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  };
}

/* ============ ADMIN AUTH ============ */
function setSession(token) {
  const data = { user: CONFIG.admin.username, exp: Date.now() + 30 * 86400000 };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (e) { }
  if (token) { AUTH_TOKEN = token; try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { } }
}

function getSessionData() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (e) { return null; }
}

function checkIsAdmin() {
  try {
    const s = getSessionData();
    if (!s || !s.user || s.user !== CONFIG.admin.username || !s.exp || Date.now() >= s.exp) { IS_ADMIN = false; return false; }
    IS_ADMIN = true;
    return true;
  } catch (e) { IS_ADMIN = false; return false; }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) { }
  try { localStorage.removeItem(TOKEN_KEY); } catch (e) { }
  AUTH_TOKEN = "";
  IS_ADMIN = false;
}

async function performAdminLogin(username, password) {
  const u = String(username || "").trim();
  const p = String(password || "");
  if (!u || !p) return { ok: false, reason: "Username & password wajib diisi." };

  try {
    const r = await fetch(`${CONFIG.api.baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    if (r.status === 200) {
      const j = await r.json();
      if (j.ok && j.token) { setSession(j.token); IS_ADMIN = true; return { ok: true, serverSide: true }; }
    } else if (r.status === 401) {
      return { ok: false, reason: "Username atau password salah." };
    }
  } catch (e) { }

  if (u !== CONFIG.admin.username || p !== CONFIG.admin.password) return { ok: false, reason: "Username atau password salah." };
  setSession("");
  IS_ADMIN = true;
  return { ok: true, serverSide: false };
}

function openAdminLogin() {
  const modal = $("#adminLoginModal"); if (!modal) return;
  modal.classList.add("show");
  setTimeout(() => $("#adminUsernameInput")?.focus(), 150);
}

function closeAdminLogin() {
  $("#adminLoginModal")?.classList.remove("show");
  const userInp = $("#adminUsernameInput");
  const passInp = $("#adminKeyInput");
  if (userInp) userInp.value = "";
  if (passInp) passInp.value = "";
  const err = $("#adminLoginErr"); if (err) err.style.display = "none";
}

function initAdminLogin() {
  const closeBtn = $("#adminLoginClose");
  const modal = $("#adminLoginModal");
  const btn = $("#adminLoginSubmit");
  const err = $("#adminLoginErr");
  const userInp = $("#adminUsernameInput");
  const passInp = $("#adminKeyInput");
  if (!closeBtn || !modal || !btn || !userInp || !passInp) return;

  closeBtn.onclick = closeAdminLogin;
  modal.onclick = e => { if (e.target.id === "adminLoginModal") closeAdminLogin(); };

  const submit = async () => {
    const username = userInp.value.trim();
    const password = passInp.value;
    if (!username || !password) { if (err) { err.textContent = "Isi username & password."; err.style.display = "block"; } return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    if (err) err.style.display = "none";
    const res = await performAdminLogin(username, password);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-unlock"></i> Masuk';
    if (res.ok) {
      closeAdminLogin();
      toast("Welcome, Admin!" + (res.serverSide ? " (server-auth)" : ""), "success");
      applyAdminMode();
      checkMaintenance();
      checkChangelog();
      setTimeout(() => openAdminPanel(), 300);
    } else {
      if (err) { err.textContent = res.reason || "Gagal."; err.style.display = "block"; }
    }
  };

  userInp.addEventListener("keydown", e => { if (e.key === "Enter") passInp.focus(); });
  passInp.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  btn.onclick = submit;
}

function applyAdminMode() {
  const adminBtn = $("#sidebarAdminBtn");
  const adminLabel = $("#adminSectionLabel");
  if (adminBtn) adminBtn.style.display = IS_ADMIN ? "flex" : "none";
  if (adminLabel) adminLabel.style.display = IS_ADMIN ? "block" : "none";
}

/* ============ SIDEBAR ============ */
function openSidebar() {
  $("#sidebar")?.classList.add("show");
  $("#sidebarOverlay")?.classList.add("show");
  $("#sidebarToggle")?.classList.add("active");
  document.body.classList.add("no-scroll");
}

function closeSidebar() {
  $("#sidebar")?.classList.remove("show");
  $("#sidebarOverlay")?.classList.remove("show");
  $("#sidebarToggle")?.classList.remove("active");
  document.body.classList.remove("no-scroll");
}

function initSidebar() {
  $("#sidebarToggle")?.addEventListener("click", openSidebar);
  $("#sidebarClose")?.addEventListener("click", closeSidebar);
  $("#sidebarOverlay")?.addEventListener("click", closeSidebar);
}

function openThemePanel() { renderThemeGrid(); $("#themePanel").classList.add("show"); }

/* ============ ADMIN PANEL ============ */
async function openAdminPanel() {
  if (!IS_ADMIN) {
    await cloudLoad().then(d => { if (d) { CLOUD_DATA = ensureStructure(d); checkIsAdmin(); } });
  }
  if (!IS_ADMIN) { toast("Akses ditolak. Login dulu ya.", "error"); openAdminLogin(); return; }
  const fresh = await cloudLoad();
  if (fresh) CLOUD_DATA = ensureStructure(fresh);
  if (!checkIsAdmin()) { toast("Session expired. Login ulang.", "error"); applyAdminMode(); openAdminLogin(); return; }
  const modal = $("#adminPanelModal"), box = $("#adminPanelBox");
  if (!modal || !box) return;
  modal.classList.add("show");
  box.innerHTML = loadingHTML();
  const html = await loadFragment("admin");
  box.innerHTML = html;
  executeScripts(box);
}

function closeAdminPanel() { $("#adminPanelModal").classList.remove("show"); }

/* ============ DETAIL MODAL ============ */
function openDetail(type, idx) {
  const list = type === "service" ? (CLOUD_DATA?.services || []) : (CLOUD_DATA?.products || []);
  const item = list[idx]; if (!item) return;
  $("#modalIcon").innerHTML = `<i class="${esc(item.icon || 'fa-solid fa-box')}"></i>`;
  $("#modalTitle").textContent = item.name;
  $("#modalBadge").innerHTML = statusBadge(item.status);
  $("#modalPrice").textContent = item.price || "-";
  $("#modalDesc").textContent = item.description || "";
  const wa = CLOUD_DATA?.preferences?.contact?.whatsapp || "#";
  const msg = `Halo, gw mau tanya soal "${item.name}"`;
  $("#modalWa").href = wa + (wa.includes("?") ? "&" : "?") + "text=" + encodeURIComponent(msg);
  $("#detailModal").classList.add("show");
}

/* ============ CLOCK ============ */
function startClock() {
  const tEl = $("#clockTime"), sEl = $("#clockSec");
  if (!tEl || !sEl) return;
  const tick = () => {
    const d = new Date();
    tEl.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    sEl.textContent = ":" + String(d.getSeconds()).padStart(2, "0");
  };
  tick();
  setInterval(tick, 1000);
}

function handleSidebarClick(target) {
  if (target === "admin") { if (IS_ADMIN) openAdminPanel(); else openAdminLogin(); return; }
  openFullPage(target);
}

/* ============ GENERAL EVENTS ============ */
function initGeneralEvents() {
  const bm = $("#brandMark");
  if (bm) {
    let clicks = 0, timer = null;
    bm.addEventListener("click", () => {
      if (IS_ADMIN) return;
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => clicks = 0, 1200);
      if (clicks >= 5) { clicks = 0; openAdminLogin(); }
    });
  }

  document.addEventListener("click", e => {
    if (e.target.closest("#fullpageBack")) { closeFullPage(); return; }
    const sbTrigger = e.target.closest("[data-sidebar]");
    if (sbTrigger && !sbTrigger.closest(".sidebar")) { handleSidebarClick(sbTrigger.dataset.sidebar); return; }
    const sbItem = e.target.closest(".sidebar .sidebar-item[data-sidebar]");
    if (sbItem) { const target = sbItem.dataset.sidebar; closeSidebar(); setTimeout(() => handleSidebarClick(target), 250); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav) { goTo(nav.dataset.nav); return; }
    const navItem = e.target.closest(".nav-item[data-page]");
    if (navItem) { goTo(navItem.dataset.page); return; }
    const card = e.target.closest(".card[data-type]");
    if (card) { openDetail(card.dataset.type, Number(card.dataset.idx)); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { e.stopPropagation(); copyText(cp.dataset.copy); return; }
    const qris = e.target.closest('[data-pay="qris"]');
    if (qris) {
      const img = $("#qrisImg");
      const id = qris.dataset.id || "qris";
      const pay = (CLOUD_DATA?.payment || []).find(p => p.id === id);
      if (img && pay) { img.src = pay.value; img.style.display = "block"; }
      $("#qrisModal").classList.add("show");
      return;
    }
  });

  $("#modalClose")?.addEventListener("click", () => $("#detailModal").classList.remove("show"));
  $("#qrisClose")?.addEventListener("click", () => $("#qrisModal").classList.remove("show"));
  $("#detailModal")?.addEventListener("click", e => { if (e.target.id === "detailModal") e.target.classList.remove("show"); });
  $("#qrisModal")?.addEventListener("click", e => { if (e.target.id === "qrisModal") e.target.classList.remove("show"); });
  $("#adminPanelModal")?.addEventListener("click", e => { if (e.target.id === "adminPanelModal") closeAdminPanel(); });

  $("#userMaintRefresh")?.addEventListener("click", async () => {
    toast("Cek status...", "info");
    const data = await cloudLoad();
    if (data) { CLOUD_DATA = ensureStructure(data); applyTheme(); refreshAll(); checkMaintenance(); checkChangelog(); }
    else toast("Gagal.", "error");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
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

function refreshAll() {
  renderPreferences();
  renderServices();
  renderProducts();
  renderPayment();
  renderSidebar();
  renderNavbar();
  renderCustomPages();
  renderContactPage();
  applyAdminMode();
  applyLogo();
  applyThemeButtonVisibility();
}

/* ============ GLOBAL ============ */
Object.assign(window, {
  $, $$, esc, toast, copyText, hexToRgba, applyLogo,
  getRemainingLapor, incrementLapor, loadFragment, persistCloud,
  cloudLoad, cloudSave, cloudVersions, cloudRestore,
  ensureStructure, applyTheme, renderPreferences, refreshAll,
  renderSidebar, renderNavbar, renderCustomPages, renderContactPage,
  renderBlock, renderBuilderPage,
  applyAdminMode, applyThemeButtonVisibility, checkMaintenance, checkChangelog, openFullPage,
  closeFullPage, openAdminPanel, closeAdminPanel, openAdminLogin,
  closeAdminLogin, setSession, getSessionData, checkIsAdmin, clearSession
});
window.getCloudData = () => CLOUD_DATA;
window.setCloudData = (d) => { CLOUD_DATA = d; };
window.isAdmin = () => IS_ADMIN;

/* ============ INIT ============ */
(async function init() {
  try {
    startClock();
    initSidebar();
    initAdminLogin();
    initGeneralEvents();
    const data = await cloudLoad();
    CLOUD_DATA = ensureStructure(data || DEFAULT_DATA);
    checkIsAdmin();
    applyTheme();
    refreshAll();
    applyAdminMode();
    checkMaintenance();
    checkChangelog();
  } catch (err) { console.error("[MSI ASTRA] Init error:", err); }
})();
