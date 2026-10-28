/* Thab's Lab Pro — scan de code-barres dans la clôture d'un rendez-vous (agenda.html)
   À inclure dans agenda.html, juste avant </body>, APRÈS le gros script de la page :
   <script src="./agenda-scan.js"></script>
   Ajoute un bouton 📷 à côté de « Rechercher dans mon stock… » (clôture + « Ajouter une utilisation stock »). */
(function () {
  if (window.__thabsAgendaScan) return;
  window.__thabsAgendaScan = true;

  var ZX_URL = "https://cdn.jsdelivr.net/npm/zxing-wasm@2.1.0/dist/iife/reader/index.js";
  var ZX_OPTS = { tryHarder: true, tryRotate: true, tryInvert: true, maxNumberOfSymbols: 1 };
  var zxReady = null, stream = null, track = null, timer = null, busy = false, onCodeCb = null;

  /* ---------- styles ---------- */
  var st = document.createElement("style");
  st.textContent = [
    ".tl-scanbtn{flex:0 0 auto;margin-left:8px;padding:0 16px;height:44px;border:1px solid #d9ddd2;border-radius:12px;background:#e7eadf;color:#292824;font:600 14px 'DM Sans',system-ui,sans-serif;cursor:pointer}",
    ".stock-search-wrap.tl-flex{display:flex;flex-wrap:wrap;align-items:flex-start}",
    ".stock-search-wrap.tl-flex>.stock-search-input{flex:1 1 0;min-width:0;font-size:16px}",
    ".stock-search-wrap.tl-flex>.stock-search-results{flex:1 0 100%}",
    ".tl-scan{position:fixed;inset:0;z-index:9999;background:#1d1c19;color:#fff;display:none;flex-direction:column;font-family:'DM Sans',system-ui,sans-serif}",
    ".tl-scan.open{display:flex}",
    ".tl-scan-top{display:flex;justify-content:space-between;align-items:center;padding:calc(16px + env(safe-area-inset-top)) 18px 10px}",
    ".tl-scan-top h3{margin:0;font:500 22px 'Playfair Display',Georgia,serif}",
    ".tl-scan-top button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:100px;padding:11px 18px;font:600 14px inherit;cursor:pointer}",
    ".tl-scan-view{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px 14px}",
    ".tl-reader{position:relative;width:100%;max-width:560px;border-radius:20px;overflow:hidden;background:#000;aspect-ratio:3/4;max-height:56vh;max-height:56dvh}",
    ".tl-reader video{width:100%;height:100%;object-fit:cover;display:block}",
    ".tl-guide{position:absolute;left:10%;right:10%;top:20%;bottom:20%;border:2px solid rgba(255,255,255,.75);border-radius:14px;box-shadow:0 0 0 999px rgba(0,0,0,.28);pointer-events:none}",
    ".tl-tools{display:none;justify-content:center;gap:8px;padding:6px 0}",
    ".tl-tools button{border:0;border-radius:100px;padding:9px 16px;background:rgba(255,255,255,.14);color:#fff;font:600 14px inherit;cursor:pointer}",
    ".tl-tools button.on{background:#aeb8a2;color:#292824}",
    ".tl-msg{padding:12px 20px;text-align:center;color:rgba(255,255,255,.85);font-size:14px;line-height:1.5;min-height:52px}",
    ".tl-bottom{padding:6px 18px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;align-items:center}",
    ".tl-bottom .alt{border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;border-radius:100px;padding:12px 20px;font:600 14px inherit;cursor:pointer}",
    ".tl-manual{display:flex;gap:8px;max-width:560px;width:100%}",
    ".tl-manual input{flex:1;min-width:0;padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font-size:16px}",
    ".tl-manual button{border:0;border-radius:14px;padding:0 20px;background:#aeb8a2;color:#292824;font:600 14px inherit;cursor:pointer}",
    ".tl-toast{position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translate(-50%,20px);z-index:10000;background:#292824;color:#fff;padding:13px 20px;border-radius:100px;font:500 14px 'DM Sans',system-ui,sans-serif;opacity:0;pointer-events:none;transition:.25s;max-width:calc(100vw - 32px);text-align:center}",
    ".tl-toast.show{opacity:1;transform:translate(-50%,0)}"
  ].join("\n");
  document.head.appendChild(st);

  /* ---------- écran scanner ---------- */
  var ov = document.createElement("div");
  ov.className = "tl-scan";
  ov.setAttribute("role", "dialog");
  ov.innerHTML =
    '<div class="tl-scan-top"><h3>Scanner un produit</h3><button type="button" data-x>Fermer</button></div>' +
    '<div class="tl-scan-view"><div class="tl-reader"><video playsinline muted autoplay></video><div class="tl-guide"></div></div></div>' +
    '<div class="tl-tools"><button type="button" data-z="1">1×</button><button type="button" data-z="2">2×</button><button type="button" data-z="3">3×</button><button type="button" data-torch>💡</button></div>' +
    '<div class="tl-msg"></div>' +
    '<div class="tl-bottom"><button class="alt" type="button" data-photo>📸 Prendre une photo du code</button><input type="file" accept="image/*" capture="environment" hidden data-file>' +
    '<form class="tl-manual"><input inputmode="numeric" placeholder="Ou tape le code ici" autocomplete="off"><button>OK</button></form></div>';
  var toastEl = document.createElement("div");
  toastEl.className = "tl-toast";
  function mount() { document.body.appendChild(ov); document.body.appendChild(toastEl); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  var $ = function (s) { return ov.querySelector(s); };
  var video = $("video"), msg = $(".tl-msg");
  function toast(t, ms) { toastEl.textContent = t; toastEl.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 2800); }

  function loadZX() {
    if (window.ZXingWASM) return Promise.resolve();
    if (!zxReady) zxReady = new Promise(function (ok, ko) {
      var s = document.createElement("script"); s.src = ZX_URL; s.onload = ok;
      s.onerror = function () { zxReady = null; ko(new Error("lib")); };
      document.head.appendChild(s);
    });
    return zxReady;
  }
  async function decode(img) { var r = await ZXingWASM.readBarcodes(img, ZX_OPTS); return r && r[0] && r[0].text ? r[0].text : null; }

  function setupTools() {
    var caps = (track && track.getCapabilities) ? track.getCapabilities() : {}, tools = $(".tl-tools"), any = false;
    var zb = Array.prototype.slice.call(tools.querySelectorAll("[data-z]")), tb = tools.querySelector("[data-torch]");
    if (caps.zoom) {
      any = true;
      zb.forEach(function (b) {
        var z = Math.min(Math.max(Number(b.dataset.z), caps.zoom.min || 1), caps.zoom.max || 1);
        b.style.display = "";
        b.onclick = async function () { try { await track.applyConstraints({ advanced: [{ zoom: z }] }); zb.forEach(function (x) { x.classList.toggle("on", x === b); }); } catch (e) {} };
      });
      if (zb[0]) zb[0].classList.add("on");
    } else zb.forEach(function (b) { b.style.display = "none"; });
    if (caps.torch) {
      any = true; var on = false; tb.style.display = ""; tb.classList.remove("on");
      tb.onclick = async function () { on = !on; try { await track.applyConstraints({ advanced: [{ torch: on }] }); tb.classList.toggle("on", on); } catch (e) {} };
    } else tb.style.display = "none";
    tools.style.display = any ? "flex" : "none";
  }

  function loop() {
    clearTimeout(timer);
    var cv = document.createElement("canvas"), ctx = cv.getContext("2d", { willReadFrequently: true }), working = false, n = 0;
    var tick = async function () {
      if (!stream) return;
      if (!working && video.videoWidth && !busy) {
        working = true;
        try {
          var W = video.videoWidth, H = video.videoHeight, full = n++ % 3 === 2, sx = 0, sy = 0, sw = W, sh = H, dw, dh, k;
          if (full) { k = Math.min(1, 1600 / W); dw = Math.round(W * k); dh = Math.round(H * k); }
          else { sw = Math.round(W * 0.84); sh = Math.round(H * 0.6); sx = Math.round((W - sw) / 2); sy = Math.round((H - sh) / 2); k = Math.min(1, 2000 / sw); dw = Math.round(sw * k); dh = Math.round(sh * k); }
          cv.width = dw; cv.height = dh; ctx.drawImage(video, sx, sy, sw, sh, 0, 0, dw, dh);
          var text = await decode(ctx.getImageData(0, 0, dw, dh));
          if (text && stream) { found(text); return; }
        } catch (e) { console.error(e); }
        working = false;
      }
      timer = setTimeout(tick, 120);
    };
    tick();
  }
  async function stop() {
    clearTimeout(timer); timer = null;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null; track = null;
    try { video.pause(); } catch (e) {} video.srcObject = null;
  }
  async function close() { await stop(); ov.classList.remove("open"); }
  async function found(code) {
    if (busy) return; busy = true;
    try { navigator.vibrate && navigator.vibrate(60); } catch (e) {}
    await close();
    var cb = onCodeCb; onCodeCb = null;
    try { if (cb) await cb(String(code).trim()); } finally { busy = false; }
  }
  async function openScanner(cb) {
    onCodeCb = cb; busy = false;
    $(".tl-tools").style.display = "none"; msg.textContent = "Démarrage de la caméra…"; $(".tl-manual input").value = "";
    ov.classList.add("open");
    try {
      await loadZX();
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } } });
      track = stream.getVideoTracks()[0];
      video.srcObject = stream; await video.play();
      try { await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }); } catch (e) {}
      setupTools();
      msg.textContent = "Cadre le code dans le rectangle, à 15–25 cm. Utilise 2× ou 3× pour un petit code.";
      loop();
    } catch (err) {
      console.error(err); await stop();
      msg.textContent = /lib/.test(err && err.message) ? "Impossible de charger le lecteur (connexion ?). Prends une photo du code ou tape-le ci-dessous." : "Caméra indisponible : autorise-la dans Réglages › Safari (ou l'appli). Tu peux aussi prendre une photo du code ou le taper.";
    }
  }
  $("[data-x]").onclick = close;
  $("[data-photo]").onclick = function () { $("[data-file]").click(); };
  $("[data-file]").onchange = async function (e) {
    var f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
    msg.textContent = "Lecture de la photo…";
    try { await loadZX(); var r = await ZXingWASM.readBarcodes(f, ZX_OPTS); if (r && r[0] && r[0].text) found(r[0].text); else msg.textContent = "Aucun code lu sur la photo. Rapproche-toi un peu, évite les reflets, et recommence."; }
    catch (err) { console.error(err); msg.textContent = "Impossible de lire la photo."; }
  };
  $(".tl-manual").onsubmit = function (e) { e.preventDefault(); var v = $(".tl-manual input").value.trim(); if (v) found(v); };

  /* ---------- liaison avec la clôture du rendez-vous ---------- */
  function codeVariants(code) {
    var c = String(code).trim(), out = [c];
    if (/^\d+$/.test(c)) {
      var z = c.replace(/^0+/, ""); out.push(z);
      for (var len = 12; len <= 14; len++) if (z.length <= len) out.push(z.padStart(len, "0"));
    }
    return Array.from(new Set(out));
  }
  async function addScanned(code, inputId, resultsId, addedId) {
    var res = await supabaseClient.from("inventory_items").select("id,name,is_active").in("barcode", codeVariants(code)).limit(1);
    if (res.error) {
      console.error(res.error);
      toast(/barcode/i.test(res.error.message || "") ? "Colonne barcode absente : lance d'abord le SQL fourni." : "Impossible de chercher ce code.");
      return;
    }
    var item = res.data && res.data[0];
    if (!item) { toast("Code " + code + " inconnu : ajoute-le d'abord dans Stock."); return; }
    if (item.is_active === false) { toast("« " + item.name + " » est désactivé."); return; }
    var items = await loadActiveInventory();
    if (!items.some(function (x) { return x.id === item.id; })) { toast("Produit introuvable dans le stock actif."); return; }
    if (completionExtraStock.some(function (x) { return x.item_id === item.id; })) { toast("« " + item.name + " » est déjà dans la liste."); return; }
    completionExtraStock.push({ item_id: item.id, quantity_used: 1 });
    renderExtraStockList(items, addedId);
    toast("✓ « " + item.name + " » ajouté : vérifie la quantité");
  }
  var targets = [["complete-stock-search", "complete-stock-search-results", "complete-extra-stock"], ["post-stock-search", "post-stock-results", "post-stock-added"]];
  function inject() {
    targets.forEach(function (t) {
      var input = document.getElementById(t[0]);
      if (!input || input.dataset.tlScan) return;
      input.dataset.tlScan = "1";
      var wrap = input.closest(".stock-search-wrap"); if (!wrap) return;
      wrap.classList.add("tl-flex");
      var b = document.createElement("button");
      b.type = "button"; b.className = "tl-scanbtn"; b.textContent = "📷 Scanner";
      input.insertAdjacentElement("afterend", b);
      b.onclick = function () { openScanner(function (code) { return addScanned(code, t[0], t[1], t[2]); }); };
    });
  }
  new MutationObserver(inject).observe(document.documentElement, { childList: true, subtree: true });
  inject();
})();
