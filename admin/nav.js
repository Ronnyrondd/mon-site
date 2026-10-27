/* Thab's Lab Pro — barre de navigation du bas (iPhone / mobile)
   À inclure sur chaque page admin, juste avant </body> :
   <script src="./admin-nav.js"></script>
   Sur ordinateur, rien ne change : la barre ne s'affiche que sur petit écran. */
(function () {
  if (window.__thabsNav) return;
  window.__thabsNav = true;

  var page = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  if (page === "" || page === "index.html") return; // pas sur la page de connexion

  var MORE_PAGES = ["prestations.html", "stock.html", "horaires.html", "finances.html"];

  var icons = {
    today:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/></svg>',
    agenda:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
    plus:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    clients: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></svg>',
    more:    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/></svg>'
  };

  var tabs = [
    { href: "dashboard.html",  label: "Aujourd'hui", icon: icons.today,   match: ["dashboard.html"] },
    { href: "agenda.html",     label: "Agenda",      icon: icons.agenda,  match: ["agenda.html"] },
    { href: "nouveau-rdv.html",label: "Nouveau",     icon: icons.plus,    match: ["nouveau-rdv.html"], fab: true },
    { href: "clientes.html",   label: "Clientes",    icon: icons.clients, match: ["clientes.html"] },
    { more: true,              label: "Plus",        icon: icons.more,    match: MORE_PAGES }
  ];

  var css = [
    ".tl-nav,.tl-sheet,.tl-sheet-bg{display:none}",
    "@media(max-width:760px){",
    "  body{padding-bottom:calc(84px + env(safe-area-inset-bottom))!important}",
    "  .sidebar{display:none!important}",
    "  .tl-nav{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:150;",
    "    padding:8px 6px calc(8px + env(safe-area-inset-bottom));background:rgba(41,40,36,.97);",
    "    -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid rgba(255,255,255,.08)}",
    "  .tl-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:6px 2px;border:0;background:none;",
    "    color:rgba(255,255,255,.55);font:500 10px/1 'DM Sans',system-ui,sans-serif;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    "  .tl-tab svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}",
    "  .tl-tab.on{color:#fff}",
    "  .tl-tab.on svg{stroke:#c9d3bd}",
    "  .tl-tab.fab span.ic{display:grid;place-items:center;width:46px;height:46px;margin-top:-22px;border-radius:50%;",
    "    background:#aeb8a2;color:#292824;box-shadow:0 8px 20px rgba(0,0,0,.28);border:3px solid #292824}",
    "  .tl-tab.fab span.ic svg{stroke:#292824;width:22px;height:22px;stroke-width:2.2}",
    "  .tl-tab.fab{color:rgba(255,255,255,.75)}",
    "  .tl-sheet-bg{display:block;position:fixed;inset:0;z-index:180;background:rgba(41,40,36,.4);opacity:0;pointer-events:none;transition:opacity .2s}",
    "  .tl-sheet-bg.open{opacity:1;pointer-events:auto}",
    "  .tl-sheet{display:block;position:fixed;left:0;right:0;bottom:0;z-index:190;background:#fffdf9;border-radius:22px 22px 0 0;",
    "    padding:10px 18px calc(24px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .25s ease;box-shadow:0 -20px 50px rgba(0,0,0,.18)}",
    "  .tl-sheet.open{transform:none}",
    "  .tl-grab{width:40px;height:4px;border-radius:4px;background:rgba(41,40,36,.18);margin:4px auto 14px}",
    "  .tl-sheet a,.tl-sheet button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:15px 6px;border:0;background:none;",
    "    border-bottom:1px solid rgba(41,40,36,.08);color:#292824;font:500 15px 'DM Sans',system-ui,sans-serif;text-decoration:none;text-align:left;cursor:pointer}",
    "  .tl-sheet a.on{color:#76806d;font-weight:600}",
    "  .tl-sheet a::after{content:'›';color:#77746d;font-size:20px}",
    "  .tl-sheet button{color:#8a4f47;border-bottom:0}",
    "}"
  ].join("\n");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var nav = document.createElement("nav");
  nav.className = "tl-nav";
  nav.setAttribute("aria-label", "Navigation principale");

  tabs.forEach(function (t) {
    var on = t.match.indexOf(page) !== -1;
    var el = document.createElement(t.more ? "button" : "a");
    el.className = "tl-tab" + (on ? " on" : "") + (t.fab ? " fab" : "");
    if (t.more) { el.type = "button"; } else { el.href = "./" + t.href; }
    var ic = t.fab ? '<span class="ic">' + t.icon + "</span>" : t.icon;
    el.innerHTML = ic + "<span>" + t.label + "</span>";
    if (on && !t.more) el.setAttribute("aria-current", "page");
    if (t.more) el.setAttribute("aria-haspopup", "dialog");
    nav.appendChild(el);
    if (t.more) t.el = el;
  });

  var bg = document.createElement("div");
  bg.className = "tl-sheet-bg";
  var sheet = document.createElement("div");
  sheet.className = "tl-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Autres pages");
  var items = [
    ["prestations.html", "Prestations"],
    ["stock.html", "Stock & matériel"],
    ["horaires.html", "Horaires"],
    ["finances.html", "Finances"]
  ];
  sheet.innerHTML = '<div class="tl-grab"></div>' + items.map(function (i) {
    return '<a href="./' + i[0] + '"' + (page === i[0] ? ' class="on"' : "") + ">" + i[1] + "</a>";
  }).join("") + '<button type="button" data-logout>Se déconnecter</button>';

  function toggle(open) {
    bg.classList.toggle("open", open);
    sheet.classList.toggle("open", open);
  }
  bg.addEventListener("click", function () { toggle(false); });
  sheet.querySelector("[data-logout]").addEventListener("click", function () {
    toggle(false);
    var b = document.getElementById("logout"); // bouton déjà présent sur chaque page
    if (b) b.click(); else location.replace("./");
  });
  tabs[tabs.length - 1].el.addEventListener("click", function () { toggle(!sheet.classList.contains("open")); });

  document.body.appendChild(nav);
  document.body.appendChild(bg);
  document.body.appendChild(sheet);
})();
