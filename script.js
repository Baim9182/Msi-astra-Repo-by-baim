/* ==========================================================
   CONFIG
   ========================================================== */
const CONFIG = {
  appName: "MSI ASTRA",

  // Worker URL
  api: {
    baseUrl: "https://msi-astra-worker.muhammadbaimab.workers.dev"
  },

  // Password admin (SHA-256 hash)
  // Default "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
  adminKeyHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",

  webhookSaran: "https://discord.com/api/webhooks/1556123893679525918/CzaMKFNp4eRiVHAGCy9Jzsyfry86SecT40jbwywIuVP15kOB8gBug__MfDcPiVye7iLF",

  developer: {
    name: "Baim",
    username: "@wthf_b6",
    role: "AI-Assisted Developer",
    profileImage: "https://i.ibb.co.com/twHc7kkk/Proyek-Baru-14-B060999.png",
    bannerImage:  "https://i.ibb.co.com/Wpfcnm91/a75a910e72dc11e3d0cab3b195729320.jpg",
    description: "Gw suka minta bantuan AI buat ngoding, cari solusi, debugging, bikin desain, sampai nyari ide.",
    badges: [
      { label:"AI Assisted", icon:"fa-solid fa-robot" },
      { label:"Logic",       icon:"fa-solid fa-brain" },
      { label:"WebView",     icon:"fa-solid fa-globe" },
      { label:"Android",     icon:"fa-brands fa-android" },
      { label:"UI Design",   icon:"fa-solid fa-palette" }
    ]
  },

  contact: {
    whatsapp: "https://wa.me/6281358070254",
    channel:  "https://whatsapp.com/channel/0029VbDBt0sG8l5L7EEaW614"
  },

  quotes: [
    'Jangan takut salah, <span class="qa">takut itu ilusi</span> yang kita bikin sendiri.',
    '<span class="qa">Skill</span> itu bukan bakat, tapi hasil dari ngulik terus-terusan.',
    'Kalau capek, <span class="qa">istirahat</span>, bukan berhenti.',
    'Yang penting <span class="qa">jalan dulu</span>, sempurna mah nanti aja.'
  ]
};

/* ==========================================================
   CONSTANTS
   ========================================================== */
const DEVICE_KEY = "msi_device";
const SESSION_KEY = "msi_session";
const VISITED_KEY = "msi_visited";
const THEME_KEY = "msi_theme";

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

const $  = (s,c=document)=>c.querySelector(s);
const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
const esc = (s="") => String(s).replace(/[&<>"']/g,x=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[x]));

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
  const iconMap = {
    success:"fa-solid fa-circle-check",
    error:"fa-solid fa-circle-exclamation",
    info:"fa-solid fa-circle-info"
  };
  el.innerHTML = `<i class="${iconMap[type]||iconMap.info}"></i><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(()=>el.remove(), 280); }, 2600);
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
   RENDER
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

function renderAbout(){
  const d = CONFIG.developer;
  const c = CONFIG.contact;
  const setSrc = (id,val)=>{ const el=$(id); if(el) el.src=val||""; };
  const setTxt = (id,val)=>{ const el=$(id); if(el) el.textContent=val; };
  const setHref = (id,val)=>{ const el=$(id); if(el) el.href=val; };

  setSrc("#devBanner", d.bannerImage);
  setSrc("#devAvatar", d.profileImage);
  setTxt("#devName", d.name);
  setTxt("#devUsername", d.username);
  setTxt("#devRole", d.role);
  setTxt("#devDesc", d.description);

  const badgesEl = $("#devBadges");
  if(badgesEl){
    badgesEl.innerHTML = (d.badges||[])
      .map(b=>`<span class="chip"><i class="${esc(b.icon)}"></i>${esc(b.label)}</span>`).join("");
  }
  setHref("#devWaBtn", c.whatsapp);
  setHref("#devChannelBtn", c.channel);
  setHref("#homeWaBtn", c.whatsapp);
  setHref("#payConfirmBtn", c.whatsapp + (c.whatsapp.includes("?")?"&":"?") +
    "text=" + encodeURIComponent("Halo, gw udah bayar. Ini bukti transfernya."));
}

function renderQuotes(){
  const wrap = $("#quoteRotator");
  if(!wrap) return;
  const quotes = CONFIG.quotes || [];
  if(!quotes.length){ wrap.innerHTML = ""; return; }
  wrap.innerHTML = quotes.map((q,i)=>`
    <div class="quote-item${i===0?' active':''}">
      <i class="fa-solid fa-quote-left qi"></i><p>${q}</p>
    </div>
  `).join("");
  const items = $$(".quote-item", wrap);
  if(items.length < 2) return;
  let idx = 0, prev = 0;
  setInterval(()=>{
    const cur = items[prev]; if(!cur) return;
    cur.classList.remove("active"); cur.classList.add("leaving");
    setTimeout(()=>cur.classList.remove("leaving"), 800);
    idx = (idx+1) % items.length;
    items[idx].classList.add("active"); prev = idx;
  }, 5500);
}

function refreshAll(){
  renderServices();
  renderProducts();
  renderPayment();
  renderAbout();
}

/* ==========================================================
   MAINTENANCE
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
    document.body.style.overflow = "hidden";
  } else {
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }
}

/* ==========================================================
   ADMIN AUTH — SIMPLE 1 KEY
   ========================================================== */
function checkIsAdmin(){
  try{
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if(!s || s.deviceId !== DEVICE_ID || Date.now() >= s.exp){
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
  setSession();
  IS_ADMIN = true;
  return { ok:true };
}

/* ==========================================================
   ADMIN LOGIN UI
   ========================================================== */
function openAdminLogin(){
  $("#adminLoginModal").classList.add("show");
  setTimeout(()=>$("#adminKeyInput")?.focus(), 100);
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
      setTimeout(()=>openAdminPanel(), 300);
    } else {
      err.textContent = res.reason || "Gagal login.";
      err.style.display = "block";
    }
  };
}

function applyAdminMode(){
  const fab = $("#adminFab");
  if(IS_ADMIN){
    if(fab) fab.style.display = "grid";
    const wBtn = $("#welcomeAdminBtn");
    if(wBtn) wBtn.style.display = "none";
  } else {
    if(fab) fab.style.display = "none";
  }
}

/* ==========================================================
   ADMIN PANEL
   ========================================================== */
function openAdminPanel(){
  if(!IS_ADMIN){ toast("Akses ditolak.","error"); return; }
  ADMIN_EDITING = null;
  $("#adminPanelModal").classList.add("show");
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
  ]
};

function renderAdminPanel(){
  const box = $("#adminPanelBox");
  if(!box) return;

  if(ADMIN_EDITING !== null){
    const tab = ADMIN_EDITING.tab;
    if(tab === "website"){ renderWebsiteForm(box); return; }

    const fields = ADMIN_FIELDS[tab] || [];
    const isNew = ADMIN_EDITING.idx < 0;
    const item = isNew ? {} : (CLOUD_DATA[tab]?.[ADMIN_EDITING.idx] || {});

    box.innerHTML = `
      <button class="modal-close" data-act="cancel"><i class="fa-solid fa-xmark"></i></button>
      <div class="modal-title" style="margin-bottom:14px">
        ${isNew ? "Tambah" : "Edit"} ${ADMIN_LABELS[tab]}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;max-height:60vh;overflow-y:auto;padding-right:4px">
        ${fields.map(f => {
          const v = item[f.k] ?? "";
          if(f.type === "textarea"){
            return `<div class="field"><label>${esc(f.l)}</label>
              <textarea data-field="${f.k}" rows="2">${esc(v)}</textarea></div>`;
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
      </div>`;

    box.querySelectorAll("[data-act='cancel']").forEach(b => b.onclick = () => {
      ADMIN_EDITING = null;
      renderAdminPanel();
    });

    box.querySelector("[data-act='save']").onclick = async () => {
      const obj = {};
      fields.forEach(f => {
        const el = box.querySelector(`[data-field="${f.k}"]`);
        obj[f.k] = el ? el.value.trim() : "";
      });
      if(!obj.name){ toast("Nama wajib diisi.","error"); return; }

      const btn = box.querySelector("[data-act='save']");
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
    return;
  }

  const tab = ADMIN_TAB;
  const isWebsite = tab === "website";
  const list = isWebsite ? [] : (CLOUD_DATA[tab] || []);

  box.innerHTML = `
    <button class="modal-close" data-act="close"><i class="fa-solid fa-xmark"></i></button>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;padding-right:36px">
      <div class="modal-title"><i class="fa-solid fa-sliders" style="color:var(--primary)"></i> Admin Panel</div>
      <button class="btn btn-ghost" data-act="logout" style="padding:6px 10px;font-size:10.5px">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    </div>

    <div class="admin-tabs">
      ${Object.entries(ADMIN_LABELS).map(([k,v]) =>
        `<button data-tab="${k}" class="${k===tab?'active':''}">${v}</button>`
      ).join("")}
    </div>

    ${isWebsite ? renderWebsiteTab() : `
      <button class="btn btn-primary btn-block" data-act="add" style="margin-bottom:12px">
        <i class="fa-solid fa-plus"></i> Tambah ${ADMIN_LABELS[tab]}
      </button>
      <div style="max-height:280px;overflow-y:auto;padding-right:4px">
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
    `}

    <div style="display:flex;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
      <button class="btn btn-ghost" data-act="sync" style="flex:1;font-size:11px;padding:9px">
        <i class="fa-solid fa-rotate"></i> Sync
      </button>
    </div>
  `;

  box.querySelector("[data-act='close']").onclick = closeAdminPanel;
  box.querySelector("[data-act='logout']").onclick = () => {
    if(!confirm("Logout admin?")) return;
    clearSession();
    IS_ADMIN = false;
    closeAdminPanel();
    applyAdminMode();
    checkMaintenance();
    toast("Logout berhasil.","success");
  };

  box.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
    ADMIN_TAB = b.dataset.tab;
    ADMIN_EDITING = null;
    renderAdminPanel();
  });

  if(!isWebsite){
    const addBtn = box.querySelector("[data-act='add']");
    if(addBtn) addBtn.onclick = () => {
      ADMIN_EDITING = { tab, idx: -1 };
      renderAdminPanel();
    };
    box.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
      ADMIN_EDITING = { tab, idx: Number(b.dataset.edit) };
      renderAdminPanel();
    });
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      const i = Number(b.dataset.del);
      const name = CLOUD_DATA[tab][i]?.name || "item";
      if(!confirm(`Hapus "${name}"?`)) return;
      CLOUD_DATA[tab].splice(i, 1);
      const ok = await persistCloud();
      refreshAll();
      renderAdminPanel();
      toast(ok ? "Dihapus." : "Gagal hapus.", ok ? "success" : "error");
    });
  }

  box.querySelector("[data-act='sync']").onclick = async () => {
    const data = await cloudLoad();
    if(!data){ toast("Gagal sync.","error"); return; }
    CLOUD_DATA = data;
    refreshAll();
    checkIsAdmin();
    applyAdminMode();
    checkMaintenance();
    renderAdminPanel();
    toast("Synced.","success");
  };
}

function renderWebsiteTab(){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const isM = mode === "maintenance";

  setTimeout(() => {
    const toggleBtn = document.querySelector("#maintToggle");
    if(toggleBtn){
      toggleBtn.onclick = async () => {
        const target = isM ? "open" : "maintenance";
        CLOUD_DATA.site = CLOUD_DATA.site || {};
        CLOUD_DATA.site.mode = target;
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>...';
        const ok = await persistCloud();
        toast(ok ? (target === "maintenance" ? "Maintenance AKTIF" : "Website ONLINE") : "Gagal simpan.", ok ? "success" : "error");
        renderAdminPanel();
        checkMaintenance();
      };
    }
  }, 0);

  return `
    <div class="maint-banner">
      <i class="fa-solid fa-circle"></i>
      Status: <b style="margin-left:4px">${isM ? "MAINTENANCE" : "ONLINE"}</b>
    </div>
    <button class="btn ${isM ? 'btn-wa' : 'btn-primary'} btn-block" id="maintToggle">
      ${isM ? '<i class="fa-solid fa-power-off"></i> Kembalikan ONLINE' 
            : '<i class="fa-solid fa-screwdriver-wrench"></i> Aktifkan Maintenance'}
    </button>
  `;
}

function renderWebsiteForm(box){
  box.innerHTML = `
    <button class="modal-close" data-act="cancel"><i class="fa-solid fa-xmark"></i></button>
    <div class="modal-title" style="margin-bottom:14px">Pengaturan Website</div>
    <p style="font-size:12px;color:var(--muted)">Tab Website gak butuh form edit.</p>
    <button class="btn btn-ghost btn-block" data-act="cancel" style="margin-top:14px">Tutup</button>
  `;
  box.querySelectorAll("[data-act='cancel']").forEach(b => b.onclick = () => {
    ADMIN_EDITING = null;
    renderAdminPanel();
  });
}

/* ==========================================================
   WELCOME
   ========================================================== */
function showWelcome(){
  const adminBtn = $("#welcomeAdminBtn");
  if(adminBtn) adminBtn.style.display = "flex";
  const ov = $("#welcomeOverlay");
  if(ov){ ov.classList.add("show"); document.body.style.overflow = "hidden"; }
}

function hideWelcome(){
  const ov = $("#welcomeOverlay");
  if(ov) ov.classList.remove("show");
  document.body.style.overflow = "";
  try{ localStorage.setItem(VISITED_KEY, "1"); }catch(e){}
}

function initWelcome(){
  const enter = $("#welcomeEnter");
  if(enter) enter.onclick = () => { hideWelcome(); checkMaintenance(); };
  const adminBtn = $("#welcomeAdminBtn");
  if(adminBtn) adminBtn.onclick = () => { hideWelcome(); openAdminLogin(); };
}

/* ==========================================================
   GENERAL EVENTS
   ========================================================== */
function initGeneralEvents(){
  $$(".nav-item").forEach(btn => btn.addEventListener("click", () => goTo(btn.dataset.page)));

  document.addEventListener("click", e => {
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

  $("#adminFab")?.addEventListener("click", openAdminPanel);
  $("#adminPanelModal")?.addEventListener("click", e=>{ if(e.target.id==="adminPanelModal") closeAdminPanel(); });

  $("#userMaintRefresh")?.addEventListener("click", async () => {
    toast("Cek status...","info");
    const data = await cloudLoad();
    if(data){ CLOUD_DATA = data; refreshAll(); checkMaintenance(); }
    else toast("Gagal cek.","error");
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

  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      $("#detailModal")?.classList.remove("show");
      $("#qrisModal")?.classList.remove("show");
      $("#themePanel")?.classList.remove("show");
      closeAdminLogin();
      closeAdminPanel();
    }
  });
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
  root.style.setProperty("--primary-glow", hexToRgba(t.primary, 0.35));
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
   NAV
   ========================================================== */
const PAGE_TITLES = { home:1, services:1, payment:1, about:1 };
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
   SUGGEST FORM
   ========================================================== */
function initSuggest(){
  const form = $("#suggestForm");
  if(!form) return;

  const nameEl = $("#sfName");
  const catEl = $("#sfCategory");
  const msgEl = $("#sfMessage");
  const countEl = $("#sfCount");
  const tagsEl = $("#quickTags");
  const resetBtn = $("#sfReset");
  const submitBtn = $("#sfSubmit");

  let selectedTag = "";

  const updateCount = ()=>{
    const len = msgEl.value.length;
    countEl.textContent = len + " / 500";
    countEl.classList.toggle("warn", len >= 400 && len < 480);
    countEl.classList.toggle("danger", len >= 480);
  };
  msgEl.addEventListener("input", updateCount);
  updateCount();

  tagsEl.addEventListener("click", e=>{
    const tag = e.target.closest(".quick-tag");
    if(!tag) return;
    if(tag.classList.contains("active")){
      tag.classList.remove("active");
      selectedTag = "";
    } else {
      $$(".quick-tag", tagsEl).forEach(t=>t.classList.remove("active"));
      tag.classList.add("active");
      selectedTag = tag.dataset.tag;
    }
  });

  resetBtn.addEventListener("click", ()=>{
    nameEl.value = "";
    catEl.selectedIndex = 0;
    msgEl.value = "";
    selectedTag = "";
    $$(".quick-tag", tagsEl).forEach(t=>t.classList.remove("active"));
    updateCount();
    toast("Form direset.","info");
  });

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const nama = (nameEl.value || "").trim() || "Anonim";
    const kategori = catEl.value;
    const pesan = (msgEl.value || "").trim();
    if(pesan.length < 3){ toast("Pesan minimal 3 karakter.","error"); msgEl.focus(); return; }

    submitBtn.disabled = true;
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kirim...';

    const ok = await sendSaranToDiscord({ nama, kategori, tag: selectedTag, pesan });

    submitBtn.disabled = false;
    submitBtn.innerHTML = original;

    if(ok){
      toast("Saran kekirim. Makasih!","success");
      setTimeout(()=>resetBtn.click(), 800);
    }
  });
}

async function sendSaranToDiscord(payload){
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
      title: "Saran Baru Masuk",
      description: "Ada masukan baru dari user.",
      color: 0x6c7cff,
      author: { name: "MSI ASTRA • Form Saran", icon_url: d.profileImage },
      thumbnail: { url: d.profileImage },
      fields: [
        { name: "Pengirim", value: "```" + (payload.nama || "Anonim").slice(0,90) + "```", inline: true },
        { name: "Kategori", value: "```" + (payload.kategori || "-").slice(0,90) + "```", inline: true },
        { name: "Quick Tag", value: payload.tag ? `> **${payload.tag}**` : "> _Tidak ada tag_", inline: false },
        { name: "Isi Pesan", value: "```\n" + (payload.pesan || "").slice(0,1000) + "\n```", inline: false }
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

/* ==========================================================
   RELOCATE SUGGEST
   ========================================================== */
function relocateSuggest(){
  const isLandscape = window.matchMedia('(orientation: landscape) and (max-height: 600px)').matches;
  const card = document.getElementById('suggestCard');
  const slotP = document.getElementById('suggestSlotPortrait');
  const slotL = document.getElementById('sideSuggestSlot');
  if(!card || !slotP || !slotL) return;
  const target = isLandscape ? slotL : slotP;
  if(card.parentElement !== target) target.appendChild(card);
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
    renderQuotes();
    createRotator("welcomeRotate", 5400, 800);
    createRotator("heroDescRotate", 5400, 700);
    initWelcome();
    initAdminLogin();
    initGeneralEvents();
    initSuggest();
    relocateSuggest();
    window.addEventListener('resize', relocateSuggest);
    window.addEventListener('orientationchange', () => setTimeout(relocateSuggest, 100));

    const data = await cloudLoad();
    if(data){
      CLOUD_DATA = data;
    } else {
      CLOUD_DATA = {
        services: [],
        products: [],
        payment: [],
        site: { mode: "open" }
      };
    }

    CLOUD_DATA.services = CLOUD_DATA.services || [];
    CLOUD_DATA.products = CLOUD_DATA.products || [];
    CLOUD_DATA.payment  = CLOUD_DATA.payment  || [];
    CLOUD_DATA.site     = CLOUD_DATA.site     || { mode: "open" };

    checkIsAdmin();
    applyAdminMode();
    refreshAll();

    const visited = (()=>{ try{ return localStorage.getItem(VISITED_KEY) === "1"; }catch(e){ return false; } })();

    if(!visited){
      showWelcome();
    } else {
      checkMaintenance();
    }

  }catch(err){
    console.error("[MSI ASTRA] Init error:", err);
  }
})();
