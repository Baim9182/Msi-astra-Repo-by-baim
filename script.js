/* ==========================================================
   CONFIG
   ========================================================== */
const CONFIG = {
  appName: "MSI ASTRA",

  //  Pakai Worker sebagai proxy
  api: {
    baseUrl: "https://msi-astra-worker.muhammadbaimab.workers.dev"
  },

  // SHA-256 hash admin key. Default password: "admin123"
  // Ganti: buka console → hashAdminKey("passwordBaru")
  adminKeyHash: "7a88a6de1c012cdb506f4d9479d20d7a85a81a5e5a2c5a502367c7f03b251af3",

  webhookSaran: "https://discord.com/api/webhooks/1556123893679525918/CzaMKFNp4eRiVHAGCy9Jzsyfry86SecT40jbwywIuVP15kOB8gBug__MfDcPiVye7iLF",

  developer: {
    name: "Baim𖣂︎",
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
  },

  quotes: [
    'Jangan takut salah — <span class="qa">takut itu ilusi</span> yang kita bikin sendiri.',
    '<span class="qa">Skill</span> itu bukan bakat, tapi hasil dari ngulik terus-terusan.',
    'AI nggak bakal gantiin lu, tapi <span class="qa">orang yang pake AI</span> bakal gantiin lu.',
    'Koding itu <span class="qa">10% nulis</span>, 90% nyari kenapa error. 🤣',
    'Kalau capek, <span class="qa">istirahat</span> — bukan berhenti.',
    'Yang penting <span class="qa">jalan dulu</span>, sempurna mah nanti aja.',
    'Error itu bukan musuh, tapi <span class="qa">guru paling jujur</span>.',
    'Jangan bandingin progress lu sama orang lain, bandingin sama <span class="qa">diri lu kemarin</span>.'
  ]
};

/* ==========================================================
   CONSTANTS & STATE
   ========================================================== */
const GIST_API = "https://api.github.com/gists";
const DEVICE_KEY = "msi_astra_device";
const SESSION_KEY = "msi_astra_session";
const VISITED_KEY = "msi_astra_visited";
const THEME_KEY = "msi_astra_theme";

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
   CLOUD — GitHub Gist
   ========================================================== */
function cloudReady(){
  return CONFIG.cloud?.gistId && CONFIG.cloud.gistId.length > 5 && !CONFIG.cloud.gistId.includes("PASTE")
      && CONFIG.cloud?.token && CONFIG.cloud.token.length > 10 && !CONFIG.cloud.token.includes("PASTE");
}

async function cloudLoad(){
  if(!cloudReady()) return null;
  try{
    const r = await fetch(`${GIST_API}/${CONFIG.cloud.gistId}`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + CONFIG.cloud.token
      }
    });
    if(!r.ok) throw new Error("HTTP " + r.status);
    const g = await r.json();
    const f = g.files?.[CONFIG.cloud.filename];
    if(!f) throw new Error("File gak ada di Gist");
    let content = f.content;
    if(f.truncated){
      const rr = await fetch(f.raw_url);
      content = await rr.text();
    }
    return JSON.parse(content);
  }catch(e){
    console.warn("[Gist] load error:", e);
    return null;
  }
}

async function cloudSave(data){
  if(!cloudReady()) return false;
  try{
    const r = await fetch(`${GIST_API}/${CONFIG.cloud.gistId}`, {
      method: "PATCH",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + CONFIG.cloud.token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: { [CONFIG.cloud.filename]: { content: JSON.stringify(data, null, 2) } }
      })
    });
    return r.ok;
  }catch(e){
    console.warn("[Gist] save error:", e);
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
  if(s.includes("tidak") || s.includes("unavailable") || s === "off") cls = "unavailable";
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
  try{ await navigator.clipboard.writeText(h); alert("Hash dicopy ke clipboard:\n\n" + h); }
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
   ADMIN AUTH (MAIN + BACKUP KEY)
   ========================================================== */
function setSession(type="main", bkId=null){
  try{
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      deviceId: DEVICE_ID,
      type: type,
      bkId: bkId,
      exp: Date.now() + (7 * 86400000)
    }));
  }catch(e){}
}

function clearSession(){
  try{ localStorage.removeItem(SESSION_KEY); }catch(e){}
}

function getSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }catch(e){ return null; }
}

function checkIsAdmin(){
  const a = CLOUD_DATA?.admin || {};
  const s = getSession();

  if(!s || s.deviceId !== DEVICE_ID || Date.now() >= s.exp){
    IS_ADMIN = false;
    return false;
  }

  if(s.type === "backup"){
    const bk = (a.backupKeys || []).find(x => x.id === s.bkId);
    const valid = !!(bk && bk.active && bk.hash);
    IS_ADMIN = valid;
    if(!valid) clearSession();
    return IS_ADMIN;
  }

  IS_ADMIN = !!(a.claimed && a.ownerId === DEVICE_ID);
  return IS_ADMIN;
}

async function performAdminClaim(key){
  const hash = await sha256(key);
  const a = CLOUD_DATA?.admin || {};

  if(hash === CONFIG.adminKeyHash){
    if(a.claimed && a.ownerId !== DEVICE_ID){
      return { ok:false, reason:"Key utama sudah dipakai di device lain." };
    }
    CLOUD_DATA.admin = CLOUD_DATA.admin || {};
    CLOUD_DATA.admin.claimed = true;
    CLOUD_DATA.admin.ownerId = DEVICE_ID;
    CLOUD_DATA.admin.claimedAt = new Date().toISOString();
    setSession("main", null);
    const ok = await persistCloud();
    if(!ok) return { ok:false, reason:"Gagal simpan ke cloud." };
    IS_ADMIN = true;
    return { ok:true, type:"main" };
  }

  const bks = a.backupKeys || [];
  for(const bk of bks){
    if(bk.hash && bk.hash === hash){
      if(!bk.active){
        return { ok:false, reason:`${bk.label} sedang dinonaktifkan.` };
      }
      setSession("backup", bk.id);
      IS_ADMIN = true;
      return { ok:true, type:"backup", label: bk.label };
    }
  }

  return { ok:false, reason:"Key salah." };
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

    const res = await performAdminClaim(val);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-unlock"></i> Masuk';

    if(res.ok){
      closeAdminLogin();
      if(res.type === "main"){
        toast("Welcome, Admin Utama! 🎉","success");
      } else {
        toast(`Welcome via ${res.label}! 🎉`,"success");
      }
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
  website:  "Website",
  backupKey:"Backup Key"
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
    { k:"id", l:"ID Unik (qris/gopay/dll)", type:"text" },
    { k:"name", l:"Nama Payment", type:"text" },
    { k:"icon", l:"Icon (Font Awesome)", type:"text" },
    { k:"color", l:"Warna (hex, contoh #25d366)", type:"text" },
    { k:"type", l:"Tipe", type:"select", opts:["qris","phone","url"] },
    { k:"value", l:"Value (nomor/URL/URL gambar)", type:"textarea" },
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
        ${isNew ? "➕ Tambah" : "✏️ Edit"} ${ADMIN_LABELS[tab]}
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
      toast(ok ? "Tersimpan ke cloud." : "Tersimpan lokal (cloud error).", ok ? "success" : "info");
    };
    return;
  }

  const tab = ADMIN_TAB;
  const isWebsite = tab === "website";
  const isBackup = tab === "backupKey";
  const list = (isWebsite || isBackup) ? [] : (CLOUD_DATA[tab] || []);
  const siteMode = (CLOUD_DATA?.site?.mode || "open").toLowerCase();
  const isM = siteMode === "maintenance";

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

    ${isWebsite ? renderWebsiteTab(box)
      : isBackup ? renderBackupKeysTab()
      : `
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
              <button data-edit="${i}" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
              <button class="del" data-del="${i}" aria-label="Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`).join("")
        : `<div class="empty" style="padding:24px"><p>Belum ada data</p></div>`}
      </div>
    `}

    <div style="display:flex;gap:6px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
      <button class="btn btn-ghost" data-act="sync" style="flex:1;font-size:11px;padding:9px">
        <i class="fa-solid fa-rotate"></i> Sync
      </button>
      <button class="btn btn-ghost" data-act="export" style="flex:1;font-size:11px;padding:9px">
        <i class="fa-solid fa-download"></i> Export
      </button>
    </div>
  `;

  box.querySelector("[data-act='close']").onclick = closeAdminPanel;
  box.querySelector("[data-act='logout']").onclick = () => {
    const s = getSession();
    const isBackup = s?.type === "backup";
    const msg = isBackup
      ? "Logout dari sesi backup key ini?"
      : "Logout admin? Device ini bakal kehilangan akses admin utama.";
    if(!confirm(msg)) return;
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

  if(isBackup){
    bindBackupKeyHandlers(box);
  }

  if(!isWebsite && !isBackup){
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
      await persistCloud();
      refreshAll();
      renderAdminPanel();
      toast("Dihapus.","success");
    });
  }

  box.querySelector("[data-act='sync']").onclick = async () => {
    const data = await cloudLoad();
    if(!data){ toast("Gagal sync.","error"); return; }
    CLOUD_DATA = data;
    ensureBackupKeys();
    refreshAll();
    checkIsAdmin();
    applyAdminMode();
    checkMaintenance();
    renderAdminPanel();
    toast("Synced dari cloud.","success");
  };
  box.querySelector("[data-act='export']").onclick = () => {
    const blob = new Blob([JSON.stringify(CLOUD_DATA, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "msi-astra-data.json";
    a.click();
  };
}

function renderWebsiteTab(box){
  const site = CLOUD_DATA?.site || {};
  const mode = (site.mode || "open").toLowerCase();
  const isM = mode === "maintenance";

  setTimeout(() => {
    const toggleBtn = box.querySelector("#maintToggle");
    if(toggleBtn){
      toggleBtn.onclick = async () => {
        const target = isM ? "open" : "maintenance";
        CLOUD_DATA.site = CLOUD_DATA.site || {};
        CLOUD_DATA.site.mode = target;
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        const ok = await persistCloud();
        if(ok) toast(target === "maintenance" ? "Maintenance AKTIF" : "Website ONLINE","success");
        else toast("Gagal simpan.","error");
        renderAdminPanel();
        checkMaintenance();
      };
    }
    const saveMsg = box.querySelector("#saveMaintMsg");
    if(saveMsg){
      saveMsg.onclick = async () => {
        const msg = box.querySelector("#maintMsgInput").value.trim();
        const eta = box.querySelector("#maintEtaInput").value.trim();
        CLOUD_DATA.site = CLOUD_DATA.site || {};
        CLOUD_DATA.site.maintenanceMessage = msg || "Website lagi diperbaiki.";
        CLOUD_DATA.site.maintenanceEta = eta;
        saveMsg.disabled = true;
        saveMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
        const ok = await persistCloud();
        saveMsg.disabled = false;
        saveMsg.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pesan';
        toast(ok ? "Pesan disimpan." : "Gagal simpan.", ok ? "success" : "error");
        checkMaintenance();
      };
    }
  }, 0);

  return `
    <div class="maint-banner">
      <i class="fa-solid fa-circle"></i>
      Status Website: <b style="margin-left:4px">${isM ? "MAINTENANCE" : "ONLINE"}</b>
    </div>

    <button class="btn ${isM ? 'btn-wa' : 'btn-primary'} btn-block" id="maintToggle" style="margin-bottom:16px">
      ${isM ? '<i class="fa-solid fa-power-off"></i> Kembalikan Website ONLINE'
            : '<i class="fa-solid fa-screwdriver-wrench"></i> Aktifkan Maintenance Mode'}
    </button>

    <div style="font-size:11.5px;font-weight:600;margin-bottom:8px;color:var(--muted);letter-spacing:.4px;text-transform:uppercase">
      Pesan Maintenance
    </div>
    <div class="field">
      <textarea id="maintMsgInput" rows="3" placeholder="Pesan yang muncul buat user...">${esc(site.maintenanceMessage || "")}</textarea>
    </div>
    <div class="field" style="margin-top:10px">
      <label>Estimasi (opsional)</label>
      <input type="text" id="maintEtaInput" value="${esc(site.maintenanceEta || "")}" placeholder="Contoh: ± 30 menit">
    </div>
    <button class="btn btn-ghost btn-block" id="saveMaintMsg" style="margin-top:12px">
      <i class="fa-solid fa-floppy-disk"></i> Simpan Pesan
    </button>
    <p style="font-size:10.5px;color:var(--muted-2);margin-top:12px;line-height:1.5;text-align:center">
      <i class="fa-solid fa-circle-info"></i> 
      Saat maintenance aktif, user lihat popup blocking. Lu tetap bisa akses normal.
    </p>
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

function renderBackupKeysTab(){
  const admin = CLOUD_DATA?.admin || {};
  const bks = admin.backupKeys || [];

  return `
    <div style="font-size:11.5px;color:var(--muted);margin-bottom:14px;line-height:1.6">
      <i class="fa-solid fa-info-circle" style="color:var(--primary)"></i>
      Backup key dipakai kalau lu butuh akses admin dari device lain atau kasih ke orang kepercayaan.
      Set password dulu, lalu <b style="color:var(--primary)">aktifkan</b> kalau mau dipakai.
    </div>
    ${bks.map((bk, i) => {
      const hasHash = !!bk.hash;
      const isActive = bk.active && hasHash;
      return `
      <div class="admin-item" style="flex-direction:column;align-items:stretch;gap:10px;padding:14px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;
            background:${isActive ? 'rgba(34,197,94,0.15)' : 'var(--surface-3)'};
            color:${isActive ? '#4ade80' : '#6b7280'};font-size:14px;
            border:1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'var(--border)'}">
            <i class="fa-solid fa-key"></i>
          </div>
          <div style="flex:1;min-width:0">
            <b style="font-size:13px;display:block;margin-bottom:2px">${esc(bk.label)}</b>
            <small style="font-size:10.5px;color:var(--muted)">
              ${!hasHash
                ? '<i class="fa-solid fa-circle-exclamation" style="color:#fbbf24"></i> Belum ada password'
                : isActive
                  ? '<i class="fa-solid fa-circle-check" style="color:#4ade80"></i> Aktif — bisa dipakai login'
                  : '<i class="fa-solid fa-circle-xmark" style="color:#6b7280"></i> Password siap (OFF)'
              }
            </small>
          </div>
          <span class="badge ${isActive ? 'available' : 'unavailable'}">
            ${isActive ? 'AKTIF' : 'OFF'}
          </span>
        </div>

        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost" data-setbk="${i}" style="flex:1;font-size:11px;padding:8px 6px">
            <i class="fa-solid fa-key"></i> ${hasHash ? 'Ganti Password' : 'Set Password'}
          </button>
          ${hasHash ? `
            <button class="btn ${isActive ? 'btn-wa' : 'btn-primary'}" data-togglebk="${i}" style="flex:1;font-size:11px;padding:8px 6px">
              ${isActive
                ? '<i class="fa-solid fa-power-off"></i> Matikan'
                : '<i class="fa-solid fa-play"></i> Aktifkan'}
            </button>
          ` : ''}
        </div>

        ${hasHash ? `
          <button class="btn btn-ghost" data-delbk="${i}" style="font-size:10.5px;padding:6px;color:#f87171;border-color:rgba(248,113,113,0.3)">
            <i class="fa-solid fa-trash"></i> Hapus Password
          </button>
        ` : ''}
      </div>`;
    }).join("")}
  `;
}

function bindBackupKeyHandlers(box){
  box.querySelectorAll("[data-setbk]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.setbk);
    const bk = CLOUD_DATA.admin.backupKeys[i];
    const pwd = prompt(`Masukkan password untuk ${bk.label}:\n(minimal 4 karakter)`);
    if(pwd === null) return;
    if(pwd.length < 4){ toast("Minimal 4 karakter.","error"); return; }

    const hash = await sha256(pwd);
    CLOUD_DATA.admin.backupKeys[i].hash = hash;
    CLOUD_DATA.admin.backupKeys[i].active = false;
    const ok = await persistCloud();
    if(ok){
      toast(`Password ${bk.label} diset. Status masih OFF.`,"success");
      renderAdminPanel();
    } else {
      CLOUD_DATA.admin.backupKeys[i].hash = "";
      toast("Gagal simpan.","error");
    }
  });

  box.querySelectorAll("[data-togglebk]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.togglebk);
    const bk = CLOUD_DATA.admin.backupKeys[i];
    if(!bk.hash){ toast("Set password dulu.","error"); return; }

    const newState = !bk.active;
    CLOUD_DATA.admin.backupKeys[i].active = newState;

    b.disabled = true;
    b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const ok = await persistCloud();

    if(ok){
      toast(newState ? `${bk.label} sekarang AKTIF` : `${bk.label} dimatikan.`,"success");
      renderAdminPanel();
    } else {
      CLOUD_DATA.admin.backupKeys[i].active = !newState;
      toast("Gagal simpan.","error");
      renderAdminPanel();
    }
  });

  box.querySelectorAll("[data-delbk]").forEach(b => b.onclick = async () => {
    const i = Number(b.dataset.delbk);
    const bk = CLOUD_DATA.admin.backupKeys[i];
    if(!confirm(`Hapus password ${bk.label}? Sesi yang lagi pakai key ini bakal logout.`)) return;

    CLOUD_DATA.admin.backupKeys[i].hash = "";
    CLOUD_DATA.admin.backupKeys[i].active = false;
    const ok = await persistCloud();
    if(ok){
      toast(`${bk.label} dihapus.`,"success");
      renderAdminPanel();
    } else {
      toast("Gagal simpan.","error");
    }
  });
}

/* ==========================================================
   WELCOME
   ========================================================== */
function showWelcome(){
  const adminBtn = $("#welcomeAdminBtn");
  const a = CLOUD_DATA?.admin || {};
  if(adminBtn) adminBtn.style.display = a.claimed ? "none" : "flex";
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

  document.addEventListener("keydown", e => {
    if(e.key === "Enter"){
      const card = document.activeElement?.closest?.(".card[data-type]");
      if(card) openDetail(card.dataset.type, Number(card.dataset.idx));
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
    if(data){
      CLOUD_DATA = data;
      ensureBackupKeys();
      refreshAll();
      checkMaintenance();
    } else toast("Gagal cek. Coba lagi.","error");
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
      toast("Saran lu kekirim. Makasih! 🙏","success");
      setTimeout(()=>resetBtn.click(), 800);
    } else {
      toast("Webhook belum diisi.","error");
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
      title: "📬  Saran Baru Masuk",
      description: "Ada masukan baru dari user.",
      color: 0x6c7cff,
      author: { name: "MSI ASTRA • Form Saran", icon_url: d.profileImage },
      thumbnail: { url: d.profileImage },
      fields: [
        { name: "👤  Pengirim", value: "```" + (payload.nama || "Anonim").slice(0,90) + "```", inline: true },
        { name: "🏷️  Kategori", value: "```" + (payload.kategori || "-").slice(0,90) + "```", inline: true },
        { name: "⚡  Quick Tag", value: payload.tag ? `> 🏷️ **${payload.tag}**` : "> _Tidak ada tag_", inline: false },
        { name: "💬  Isi Pesan", value: "```\n" + (payload.pesan || "").slice(0,1000) + "\n```", inline: false }
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
   RELOCATE SUGGEST (landscape)
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
   ENSURE BACKUP KEYS
   ========================================================== */
function ensureBackupKeys(){
  if(!CLOUD_DATA) return;
  CLOUD_DATA.admin = CLOUD_DATA.admin || { claimed: false, ownerId: null };
  if(!Array.isArray(CLOUD_DATA.admin.backupKeys) || CLOUD_DATA.admin.backupKeys.length < 2){
    CLOUD_DATA.admin.backupKeys = [
      { id: "bk1", label: "Backup 1", hash: "", active: false },
      { id: "bk2", label: "Backup 2", hash: "", active: false }
    ];
  }
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
        site: { mode: "open", maintenanceMessage: "Website lagi diperbaiki." },
        admin: { claimed: false, ownerId: null }
      };
    }

    CLOUD_DATA.services = CLOUD_DATA.services || [];
    CLOUD_DATA.products = CLOUD_DATA.products || [];
    CLOUD_DATA.payment  = CLOUD_DATA.payment  || [];
    CLOUD_DATA.site     = CLOUD_DATA.site     || { mode: "open" };
    CLOUD_DATA.admin    = CLOUD_DATA.admin    || { claimed: false, ownerId: null };

    ensureBackupKeys();

    checkIsAdmin();
    applyAdminMode();

    refreshAll();

    const visited = (()=>{ try{ return localStorage.getItem(VISITED_KEY) === "1"; }catch(e){ return false; } })();
    const a = CLOUD_DATA.admin;
    const needsWelcome = !visited || !a.claimed;

    if(needsWelcome){
      showWelcome();
    } else {
      checkMaintenance();
    }

  }catch(err){
    console.error("[MSI ASTRA] Init error:", err);
  }
})();
