/* MSI ASTRA v7.3 - Core Script */
const CONFIG = {
  api: { baseUrl: "https://msi-astra-worker.muhammadbaimab.workers.dev" },
  admin: { username: "wthf_b6", password: "4_rXEgVV5!_t8cq" }
};

const SESSION_KEY = "msi_session";
const TOKEN_KEY = "msi_token";

let CLOUD_DATA = null;
let IS_ADMIN = false;
let AUTH_TOKEN = localStorage.getItem(TOKEN_KEY) || "";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, x => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[x]));

const DEFAULT_DATA = {
  preferences: { appName: "MSI ASTRA", appSubtitle: "WEBVIEW", logo: "", heroBadge: "Online", heroRotate: ["Halo"], heroSubtitle: "", contact: {}, developer: {} },
  themes: { active: "t1", t1: { name: "Dark", primary: "#ffffff", secondary: "#a1a1aa" } },
  sidebar: [], navbar: [], pages: {}, services: [], products: [], payment: [], tools: [], site: { mode: "open" }, changelog: []
};

/* --- CLOUD & API --- */
async function cloudLoad() {
  try {
    const r = await fetch(`${CONFIG.api.baseUrl}/data`);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) { 
    console.warn("Gagal load data", e);
    return null; 
  }
}

async function cloudSave(data) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (AUTH_TOKEN) headers["Authorization"] = "Bearer " + AUTH_TOKEN;
    const r = await fetch(`${CONFIG.api.baseUrl}/save`, { method: "POST", headers, body: JSON.stringify(data) });
    return r.ok;
  } catch (e) { return false; }
}

async function persistCloud() { return CLOUD_DATA ? await cloudSave(CLOUD_DATA) : false; }

function ensureStructure(d) {
  if (!d) d = {};
  ["preferences","themes","sidebar","navbar","pages","services","products","payment","tools","changelog"].forEach(k => {
    if (!d[k]) d[k] = DEFAULT_DATA[k];
  });
  if (!d.site) d.site = DEFAULT_DATA.site;
  return d;
}

/* --- UI HELPERS --- */
function toast(msg, type = "info") {
  const wrap = $("#toastWrap"); if (!wrap) return;
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = `<span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function applyLogo() {
  const logo = CLOUD_DATA?.preferences?.logo;
  ["brand","maint","changelog","admin"].forEach(k => {
    const i = $(`#${k}LogoIcon`), m = $(`#${k}LogoImg`);
    if (i && m) {
      if (logo) { i.style.display = "none"; m.style.display = "block"; m.src = logo; }
      else { i.style.display = "block"; m.style.display = "none"; }
    }
  });
}

function applyTheme() {
  const t = CLOUD_DATA.themes?.t1 || CLOUD_DATA.themes; 
  if (!t || !t.primary) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--secondary", t.secondary || "#a1a1aa");
  if (t.bgImage) root.style.setProperty("--bg-image", `url('${t.bgImage}')`);
  if (t.banner) {
    const img = $("#bannerImg"), title = $("#bannerTitle"), desc = $("#bannerDesc");
    if (t.banner.image && img) { img.src = t.banner.image; img.style.display = "block"; }
    if (title) title.textContent = t.banner.title || "MSI ASTRA";
    if (desc) desc.textContent = t.banner.desc || "";
  }
}

/* --- RENDERERS --- */
function renderPreferences() {
  const p = CLOUD_DATA.preferences;
  document.title = p.appName || "MSI ASTRA";
  const setTxt = (id, v) => { const el = $(id); if (el) el.textContent = v || ""; };
  setTxt("#brandName", p.appName);
  setTxt("#brandSubtitle", p.appSubtitle);
  setTxt("#heroSub", p.heroSubtitle);
  const badge = $("#heroBadge"); if (badge) badge.innerHTML = `<i class="fa-solid fa-circle"></i> ${esc(p.heroBadge)}`;
  
  if (p.heroRotate) {
    const rot = $("#welcomeRotate");
    if (rot) rot.innerHTML = p.heroRotate.map((h, i) => `<div class="welcome-item ${i===0?'active':''}">${h}</div>`).join("");
  }

  const acts = $("#heroActions");
  if (acts) {
    acts.innerHTML = `
      <button class="btn btn-primary" data-nav="services"><i class="fa-solid fa-store"></i> Lihat Jasa</button>
      <a class="btn btn-wa" href="${esc(p.contact?.whatsapp || '#')}" target="_blank"><i class="fa-brands fa-whatsapp"></i> Chat WA</a>
    `;
  }
  applyLogo();
}

function renderServices() {
  const grid = $("#servicesGrid"), home = $("#homeServices");
  const list = CLOUD_DATA.services || [];
  const html = list.map((s, i) => `
    <article class="card" data-type="service" data-idx="${i}">
      <div class="card-icon"><i class="${esc(s.icon || 'fa-solid fa-box')}"></i></div>
      <div class="card-body">
        <div class="card-title">${esc(s.name)}</div>
        <div class="card-desc">${esc(s.description)}</div>
        <div class="card-price">${esc(s.price)}</div>
      </div>
    </article>`).join("");
  
  if (grid) grid.innerHTML = html || '<div class="empty">Belum ada jasa</div>';
  if (home) home.innerHTML = list.slice(0,3).map((s, i) => `
    <article class="card" data-type="service" data-idx="${i}">
      <div class="card-icon"><i class="${esc(s.icon || 'fa-solid fa-box')}"></i></div>
      <div class="card-body">
        <div class="card-title">${esc(s.name)}</div>
        <div class="card-desc">${esc(s.description)}</div>
        <div class="card-price">${esc(s.price)}</div>
      </div>
    </article>`).join("");
}

function renderProducts() {
  const grid = $("#productsGrid");
  if (!grid) return;
  const list = CLOUD_DATA.products || [];
  grid.innerHTML = list.map((p, i) => `
    <article class="card" data-type="product" data-idx="${i}">
      <div class="card-icon"><i class="${esc(p.icon || 'fa-solid fa-box')}"></i></div>
      <div class="card-body">
        <div class="card-title">${esc(p.name)}</div>
        <div class="card-desc">${esc(p.description)}</div>
        <div class="card-price">${esc(p.price)}</div>
      </div>
    </article>`).join("") || '<div class="empty">Belum ada produk</div>';
}

function renderPayment() {
  const grid = $("#payGrid"); if (!grid) return;
  const list = CLOUD_DATA.payment || [];
  grid.innerHTML = list.map(p => `
    <div class="pay-card">
      <div class="pay-icon" style="color:${esc(p.color || '#fff')}"><i class="${esc(p.icon || 'fa-solid fa-wallet')}"></i></div>
      <div class="pay-body"><div class="pay-name">${esc(p.name)}</div><div class="pay-info">${esc(p.value)}</div></div>
      <button class="pay-action" ${p.type === 'qris' ? `data-pay="qris" data-id="${esc(p.id)}"` : `data-copy="${esc(p.value)}"`}>${p.type === 'qris' ? 'Lihat' : 'Salin'}</button>
    </div>`).join("");
}

function renderSidebar() {
  const nav = $("#sidebarNav"); if (!nav) return;
  const items = CLOUD_DATA.sidebar || [];
  nav.innerHTML = items.filter(f => !f.adminOnly || IS_ADMIN).map(f => `
    <button class="sidebar-item" data-sidebar="${esc(f.id)}">
      <div class="sidebar-item-icon ${esc(f.color || '')}"><i class="fa-solid ${esc(f.icon)}"></i></div>
      <div class="sidebar-item-body"><span>${esc(f.label)}</span><small>${esc(f.desc)}</small></div>
      <i class="fa-solid fa-chevron-right sidebar-chevron"></i>
    </button>`).join("");
}

function renderNavbar() {
  const nav = $("#mainNav"); if (!nav) return;
  const items = CLOUD_DATA.navbar || [];
  nav.innerHTML = items.map((n, i) => `
    <button class="nav-item ${i===0?'active':''}" data-page="${esc(n.page)}">
      <i class="fa-solid ${esc(n.icon)}"></i><span>${esc(n.label)}</span>
    </button>`).join("");
}

/* --- NAVIGATION --- */
function goTo(pageId) {
  const target = $("#page-" + pageId);
  if (!target) { openFullPage(pageId); return; }
  $$(".page").forEach(p => p.classList.remove("active"));
  target.classList.add("active");
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === pageId));
  window.scrollTo(0,0);
}

async function openFullPage(id) {
  const fp = $("#fullpage"), title = $("#fullpageTitle"), body = $("#fullpageBody");
  if (!fp || !title || !body) return;
  const conf = CLOUD_DATA.pages?.[id] || { title: id, subtitle: "MSI ASTRA" };
  title.textContent = conf.title;
  body.innerHTML = `<div style="padding:60px 20px;text-align:center"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
  fp.classList.add("show");
  document.body.classList.add("no-scroll");

  if (conf.custom) {
    body.innerHTML = conf.html || "Kosong";
  } else {
    try {
      const r = await fetch(`pages/${id}.html?v=` + Date.now());
      if(!r.ok) throw new Error("File not found");
      body.innerHTML = await r.text();
      body.querySelectorAll("script").forEach(s => {
        const n = document.createElement("script");
        [...s.attributes].forEach(a => n.setAttribute(a.name, a.value));
        n.textContent = s.textContent;
        s.parentNode.replaceChild(n, s);
      });
    } catch(e) {
      body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted)">Halaman <b>${id}.html</b> tidak ditemukan di folder pages.</div>`;
    }
  }
}

function closeFullPage() {
  $("#fullpage")?.classList.remove("show");
  document.body.classList.remove("no-scroll");
}

/* --- ADMIN AUTH & PANEL --- */
function checkIsAdmin() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (s && s.user === CONFIG.admin.username && Date.now() < s.exp) IS_ADMIN = true;
  } catch(e) { IS_ADMIN = false; }
  return IS_ADMIN;
}

function applyAdminMode() {
  renderSidebar();
}

function openAdminLogin() { $("#adminLoginModal").classList.add("show"); }
function closeAdminLogin() { $("#adminLoginModal").classList.remove("show"); }

// Menggunakan Full Page untuk Admin Panel
async function openAdminPanel() {
  const fp = $("#fullpage"), title = $("#fullpageTitle"), subtitle = $("#fullpageSubtitle"), body = $("#fullpageBody");
  if (!fp || !title || !body) return;
  
  title.textContent = "ADMIN TOOLS";
  if(subtitle) subtitle.textContent = "Pusat Kendali Website";
  
  body.innerHTML = `<div style="padding:60px 20px;text-align:center"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
  fp.classList.add("show");
  document.body.classList.add("no-scroll");

  try {
    const r = await fetch(`pages/admin.html?v=` + Date.now());
    body.innerHTML = await r.text();
    body.querySelectorAll("script").forEach(s => {
      const n = document.createElement("script");
      [...s.attributes].forEach(a => n.setAttribute(a.name, a.value));
      n.textContent = s.textContent;
      s.parentNode.replaceChild(n, s);
    });
  } catch(e) {
    body.innerHTML = `<div style="padding:20px;color:red;text-align:center">Gagal memuat admin.html</div>`;
  }
}

function checkMaintenance() {
  const mode = CLOUD_DATA.site?.mode || "open";
  const ov = $("#userMaintOverlay");
  if (mode === "maintenance" && !IS_ADMIN) {
    $("#userMaintMsg").textContent = CLOUD_DATA.site.maintenanceMessage || "";
    ov.classList.add("show");
  } else {
    ov.classList.remove("show");
  }
}

/* --- INIT --- */
async function refreshAll() {
  renderPreferences();
  renderServices();
  renderProducts();
  renderPayment();
  renderSidebar();
  renderNavbar();
  applyTheme();
  applyAdminMode();
  checkMaintenance();
}

window.$ = $; window.$$ = $$; window.esc = esc; window.toast = toast;
window.getCloudData = () => CLOUD_DATA;
window.setCloudData = d => CLOUD_DATA = d;
window.persistCloud = persistCloud;
window.cloudLoad = cloudLoad;
window.refreshAll = refreshAll;
window.applyLogo = applyLogo;
window.closeAdminPanel = closeFullPage;
window.clearSession = () => { localStorage.removeItem(SESSION_KEY); IS_ADMIN = false; applyAdminMode(); };

(async function init() {
  const data = await cloudLoad();
  CLOUD_DATA = ensureStructure(data);
  
  checkIsAdmin();
  await refreshAll();

  // Events
  $("#sidebarToggle").onclick = () => { $("#sidebar").classList.add("show"); $("#sidebarOverlay").classList.add("show"); };
  $("#sidebarClose").onclick = () => { $("#sidebar").classList.remove("show"); $("#sidebarOverlay").classList.remove("show"); };
  $("#sidebarOverlay").onclick = () => { $("#sidebar").classList.remove("show"); $("#sidebarOverlay").classList.remove("show"); };
  $("#fullpageBack").onclick = closeFullPage;
  $("#adminLoginClose").onclick = closeAdminLogin;

  document.body.addEventListener("click", e => {
    const sb = e.target.closest("[data-sidebar]");
    if (sb) { 
      $("#sidebar").classList.remove("show"); $("#sidebarOverlay").classList.remove("show"); 
      const id = sb.dataset.sidebar;
      if(id === "admin") { if(IS_ADMIN) openAdminPanel(); else openAdminLogin(); }
      else openFullPage(id);
      return; 
    }
    const nav = e.target.closest("[data-page]");
    if (nav) { goTo(nav.dataset.page); return; }
    const navBtn = e.target.closest("[data-nav]");
    if (navBtn) { goTo(navBtn.dataset.nav); return; }
    
    const card = e.target.closest(".card[data-type]");
    if (card) { 
      const idx = card.dataset.idx;
      const item = card.dataset.type === 'service' ? CLOUD_DATA.services[idx] : CLOUD_DATA.products[idx];
      $("#modalTitle").textContent = item.name;
      $("#modalDesc").textContent = item.description;
      $("#modalPrice").textContent = item.price;
      $("#detailModal").classList.add("show");
      return; 
    }
    if (e.target.closest("#modalClose")) $("#detailModal").classList.remove("show");
    if (e.target.closest("#qrisClose")) $("#qrisModal").classList.remove("show");

    const copy = e.target.closest("[data-copy]");
    if (copy) {
      navigator.clipboard.writeText(copy.dataset.copy);
      toast("Disalin", "success");
      return;
    }
    const qris = e.target.closest("[data-pay='qris']");
    if (qris) {
      const p = CLOUD_DATA.payment.find(x => x.id === qris.dataset.id);
      if(p && p.value) { $("#qrisImg").src = p.value; $("#qrisModal").classList.add("show"); }
      return;
    }

    if (e.target.closest("#brandMark") && !IS_ADMIN) {
      window._tapCount = (window._tapCount || 0) + 1;
      if (window._tapCount >= 5) { openAdminLogin(); window._tapCount = 0; }
      setTimeout(() => window._tapCount = 0, 1500);
    }
  });

  $("#adminLoginSubmit").onclick = async () => {
    const u = $("#adminUsernameInput").value;
    const p = $("#adminKeyInput").value;
    if (u === CONFIG.admin.username && p === CONFIG.admin.password) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: u, exp: Date.now() + 30*86400000 }));
      IS_ADMIN = true;
      closeAdminLogin();
      toast("Login Berhasil", "success");
      applyAdminMode();
      checkMaintenance();
      openAdminPanel();
    } else {
      $("#adminLoginErr").textContent = "Username atau password salah";
      $("#adminLoginErr").style.display = "block";
    }
  };
})();
