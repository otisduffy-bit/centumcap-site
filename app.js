(function () {
  "use strict";

  var C = window.CC_CONFIG || {};
  var F = C.forms || {};
  var P = C.prefill || {};
  var KEY = "cc_profile_v1";

  function readProfile() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function saveProfile(role) { try { localStorage.setItem(KEY, JSON.stringify({ role: role, at: new Date().toISOString() })); } catch (e) {} }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function mailto(subject) { return "mailto:" + (C.dealDeskEmail || "Oduffy@centumcap.com") + "?subject=" + encodeURIComponent(subject); }
  function pick(url, subject) { return url ? url : mailto(subject); }
  function withParam(url, param, value) {
    if (!url || !param || !value) return url;
    return url + (url.indexOf("?") > -1 ? "&" : "?") + encodeURIComponent(param) + "=" + encodeURIComponent(value);
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function copyText(text, btn) {
    var done = function () { if (btn) { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1600); } };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { window.prompt("Copy this link:", text); }); }
    else { window.prompt("Copy this link:", text); }
  }

  /* ---------- Menu + reveal ---------- */
  var toggle = document.getElementById("menuToggle");
  var nav = document.getElementById("primaryNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a, button").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }
  var reveals = document.querySelectorAll("[data-reveal]");
  if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Borrower document upload link ---------- */
  var du = document.getElementById("doc-upload-link");
  if (du && C.docUploadUrl) { du.href = C.docUploadUrl; du.target = "_blank"; du.rel = "noopener"; }

  /* ---------- First-visit gate ---------- */
  var ROLES = [
    { k: "investor", n: "Investor / Principal", d: "Buying for my own account, fund, or family office" },
    { k: "institution", n: "REIT / Institution", d: "Acquisitions team at a REIT, fund, or operator" },
    { k: "broker", n: "Broker", d: "Representing a buyer or a seller" },
    { k: "owner", n: "Owner / Seller / Assignor", d: "I have an asset or a contract to place" }
  ];
  var modal, dialog, required = false, lastFocus = null, currentRole = null;

  function btnLink(url, subject, label, cls) {
    var external = !!url;
    return '<a class="btn ' + cls + '" href="' + esc(pick(url, subject)) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";
  }

  function view(step, role) {
    var closeBtn = required ? "" : '<button class="cc-x" data-action="close" aria-label="Close">&times;</button>';
    if (step === "roles") {
      return closeBtn +
        '<p class="eyebrow">Deal Board access</p>' +
        '<h2 id="ccGateTitle">Who are you, and what are you hunting?</h2>' +
        '<p class="cc-sub">Every deal on this board is off-market. Tell us who you are and your buy box once, and you see new opportunities first.</p>' +
        '<div class="role-grid">' + ROLES.map(function (r) {
          return '<button class="role" data-action="role" data-role="' + r.k + '"><b>' + r.n + "</b><span>" + r.d + "</span></button>";
        }).join("") + "</div>";
    }
    var back = '<button class="cc-back" data-action="back">&larr; Back</button>';
    var done = '<button class="btn btn-line" data-action="done">I\'ve submitted &mdash; show me the board</button>';
    if (role === "broker") {
      var clientLink = F.registration || new URL("marketplace.html", location.href).href;
      return closeBtn + back +
        '<h2 id="ccGateTitle">Brokers register with their client</h2>' +
        '<p class="cc-sub">Your client registers first, then you register as their broker. That links you both to every deal you request.</p>' +
        '<ol class="cc-steps">' +
        '<li><span><b>Send your client the registration link.</b> They tell us their buy box.<br><button class="btn btn-line" data-action="copy" data-copy="' + esc(clientLink) + '">Copy client link</button></span></li>' +
        '<li><span><b>Register as the broker.</b> Add your license and your client\'s name and email.<br>' + btnLink(F.broker, "Broker registration", "Open broker form", "btn-gold") + "</span></li>" +
        "</ol>" +
        '<div class="cc-actions">' + done + "</div>" +
        '<p class="cc-fine">Forms open in a new tab. Come back here when you\'re done.</p>';
    }
    if (role === "owner") {
      return closeBtn + back +
        '<h2 id="ccGateTitle">Place your opportunity</h2>' +
        '<p class="cc-sub">Assignments, off-market sales, LP equity, notes, or REO. Your contract details and your minimum price stay internal. They are never published on this site.</p>' +
        '<div class="cc-actions">' + btnLink(F.submitDeal, "Submit a deal", "Open the submission form", "btn-gold") + done + "</div>" +
        '<p class="cc-fine">The form opens in a new tab. Come back here when you\'re done.</p>';
    }
    return closeBtn + back +
      '<h2 id="ccGateTitle">Register your buy box</h2>' +
      '<p class="cc-sub">About two minutes: who you are, what you buy, your price range, your markets, and the deal types you want &mdash; assignments, off-market, LP equity, notes, REO.</p>' +
      '<div class="cc-actions">' + btnLink(F.registration, "Buy box registration", "Open registration form", "btn-gold") + done + "</div>" +
      '<p class="cc-fine">The form opens in a new tab. Come back here when you\'re done.</p>';
  }

  function render(step, role) {
    currentRole = role || null;
    dialog.innerHTML = view(step, role);
    var first = dialog.querySelector("button, a");
    if (first) first.focus();
  }

  function closeGate() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openGate(role, mustRegister) {
    required = !!mustRegister;
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "cc-modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "ccGateTitle");
      dialog = document.createElement("div");
      dialog.className = "cc-dialog";
      modal.appendChild(dialog);
      document.body.appendChild(modal);

      modal.addEventListener("click", function (e) {
        if (e.target === modal && !required) { closeGate(); return; }
        var t = e.target.closest("[data-action]");
        if (!t) return;
        var a = t.getAttribute("data-action");
        if (a === "role") { render("form", t.getAttribute("data-role")); }
        else if (a === "back") { render("roles"); }
        else if (a === "close") { closeGate(); }
        else if (a === "copy") { copyText(t.getAttribute("data-copy"), t); }
        else if (a === "done") { saveProfile(currentRole || "unknown"); required = false; closeGate(); var s = document.querySelector(".promo-strip"); if (s) s.remove(); }
      });
      document.addEventListener("keydown", function (e) {
        if (!modal.classList.contains("open")) return;
        if (e.key === "Escape" && !required) { closeGate(); return; }
        if (e.key === "Tab") {
          var f = dialog.querySelectorAll("button, a[href]");
          if (!f.length) return;
          var firstEl = f[0], lastEl = f[f.length - 1];
          if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
          else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
        }
      });
    }
    lastFocus = document.activeElement;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (role) render("form", role); else render("roles");
  }

  document.querySelectorAll("[data-open-gate]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openGate(el.getAttribute("data-open-gate") || null, false);
    });
  });

  var profile = readProfile();
  if (profile) { var strip = document.querySelector(".promo-strip"); if (strip) strip.remove(); }
  if (document.body.getAttribute("data-gate") === "required" && !profile) { openGate(null, true); }

  /* ---------- Deal board ---------- */
  var board = document.getElementById("deal-list");
  if (board) {
    var EVENTS = [
      { k: "all", n: "All", d: "Every live opportunity" },
      { k: "assignment", n: "Assignments", d: "Contracts in place, assigned to you" },
      { k: "offmarket", n: "Off-Market", d: "Owner-direct, never listed" },
      { k: "lp", n: "LP Equity", d: "Limited-partner capital in a sponsor deal" },
      { k: "note", n: "Note Sales", d: "Performing and non-performing" },
      { k: "reo", n: "REO", d: "Bank-owned, lender-direct" }
    ];
    var ASSETS = [
      { k: "all", n: "All assets" }, { k: "industrial", n: "Industrial" }, { k: "multifamily", n: "Multifamily" },
      { k: "retail", n: "Retail / NNN" }, { k: "medical", n: "Medical / Dental / Vet" }, { k: "office", n: "Office" },
      { k: "hospitality", n: "Hospitality" }, { k: "land", n: "Land" }, { k: "storage", n: "Self-Storage" }, { k: "other", n: "Other" }
    ];
    var EVENT_NAME = { assignment: "Assignment", offmarket: "Off-Market", lp: "LP Equity", note: "Note Sale", reo: "REO" };
    var ASSET_NAME = {}; ASSETS.forEach(function (a) { ASSET_NAME[a.k] = a.n; });
    var STATUS_NAME = { active: "Active", loi: "Under LOI", closed: "Closed" };

    var demo = qs("demo") === "1";
    var deals = demo ? (window.CC_DEMO_DEALS || []) : (window.CC_DEALS || []);
    var evKey = qs("event") || "all";
    var asKey = qs("asset") || "all";
    if (!EVENTS.some(function (e) { return e.k === evKey; })) evKey = "all";
    if (!ASSETS.some(function (a) { return a.k === asKey; })) asKey = "all";

    var eventsEl = document.getElementById("events");
    var chipsEl = document.getElementById("chips");
    var listEl = document.getElementById("deal-list");

    function fmtDate(s) {
      var d = new Date(s + "T00:00:00");
      return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    function count(k) { return deals.filter(function (d) { return k === "all" || d.event === k; }).length; }

    function draw() {
      eventsEl.innerHTML = EVENTS.map(function (e) {
        return '<button class="event" data-ev="' + e.k + '" aria-pressed="' + (e.k === evKey) + '"><span class="n">' + count(e.k) + ' live</span><b>' + e.n + '</b><span class="d">' + e.d + "</span></button>";
      }).join("");
      chipsEl.innerHTML = ASSETS.map(function (a) {
        return '<button class="chip" data-as="' + a.k + '" aria-pressed="' + (a.k === asKey) + '">' + a.n + "</button>";
      }).join("");

      var rows = deals.filter(function (d) {
        return (evKey === "all" || d.event === evKey) && (asKey === "all" || d.asset === asKey);
      });

      var out = "";
      if (demo) out += '<p class="demo-note">DEMO MODE &mdash; sample listings for layout preview only. These are not real opportunities.</p>';
      if (rows.length) {
        out += '<div class="board"><div class="deal head"><div>Deal ID</div><div>Event</div><div>Opportunity</div><div>Size</div><div>Ask</div><div>Access</div></div>';
        out += rows.map(function (d) {
          var principal = "ncnda.html?deal=" + encodeURIComponent(d.id) + "&as=principal";
          var broker = "ncnda.html?deal=" + encodeURIComponent(d.id) + "&as=broker";
          return '<div class="deal">' +
            '<div class="c-id"><span class="id">' + esc(d.id) + '</span><span class="posted">' + esc(fmtDate(d.posted)) + "</span></div>" +
            '<div><span class="pill gold">' + esc(EVENT_NAME[d.event] || d.event) + "</span></div>" +
            '<div class="c-main"><b>' + esc(d.headline) + "</b><span>" + esc(ASSET_NAME[d.asset] || d.asset) + " &middot; " + esc(d.market) + "</span></div>" +
            '<div class="c-fig"><span class="k">Size</span>' + esc(d.size) + "</div>" +
            '<div class="c-fig"><span class="k">Ask</span>' + esc(d.ask) + "</div>" +
            '<div class="c-act"><span class="pill">' + (d.access === "broker" ? "Brokers welcome" : "Principals only") + " &middot; " + esc(STATUS_NAME[d.status] || d.status) + "</span>" +
            (d.status === "closed" ? "" : '<a class="btn btn-gold" href="' + principal + '">Request access</a>' +
              (d.access === "broker" ? '<a class="btn btn-line" href="' + broker + '">Broker access</a>' : "")) +
            "</div></div>";
        }).join("") + "</div>";
      } else if (!deals.length) {
        out += '<div class="opps-empty"><span class="eyebrow">The board is loading</span><h3>New opportunities post here first.</h3><p>We are loading the first deals now. Register your buy box and we reach out the moment something fits what you are hunting &mdash; before it is posted anywhere.</p><button class="btn btn-gold" data-open-gate>Register your buy box</button></div>';
      } else {
        out += '<div class="opps-empty"><span class="eyebrow">No match yet</span><h3>Nothing on the board fits these filters right now.</h3><p>Tell us your buy box and we come to you when it does.</p><button class="btn btn-gold" data-open-gate>Register your buy box</button></div>';
      }
      listEl.innerHTML = out;
      listEl.querySelectorAll("[data-open-gate]").forEach(function (el) {
        el.addEventListener("click", function () { openGate(null, false); });
      });
    }

    eventsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ev]"); if (!b) return; evKey = b.getAttribute("data-ev"); draw();
    });
    chipsEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-as]"); if (!b) return; asKey = b.getAttribute("data-as"); draw();
    });
    draw();
  }

  /* ---------- NCNDA page ---------- */
  var root = document.getElementById("ncnda-root");
  if (root) {
    var deal = qs("deal") || "";
    var as = qs("as") === "broker" ? "broker" : "principal";

    var box = document.getElementById("deal-box");
    if (deal && box) {
      box.hidden = false;
      document.getElementById("deal-id").textContent = deal;
      document.getElementById("deal-copy").addEventListener("click", function () { copyText(deal, this); });
    }
    var banner = document.getElementById("draft-banner");
    if (banner) banner.hidden = !!C.ncndaApproved;

    function show(which) {
      ["principal", "broker"].forEach(function (k) {
        document.getElementById("doc-" + k).hidden = (k !== which);
        document.querySelector('[data-doc="' + k + '"]').setAttribute("aria-pressed", k === which);
      });
    }
    root.querySelectorAll("[data-doc]").forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-doc")); });
    });
    show(as);

    var sp = document.getElementById("sign-principal");
    var sb = document.getElementById("sign-broker");
    var pUrl = withParam(F.ncndaPrincipal, P.ncndaPrincipal, deal);
    var bUrl = withParam(F.ncndaBroker, P.ncndaBroker, deal);
    sp.href = pick(pUrl, "NCNDA signature " + deal);
    sb.href = pick(bUrl, "Broker NCNDA signature " + deal);
    if (pUrl) { sp.target = "_blank"; sp.rel = "noopener"; }
    if (bUrl) { sb.target = "_blank"; sb.rel = "noopener"; }

    var book = document.getElementById("book-link");
    if (book) { if (C.meetingUrl) { book.href = C.meetingUrl; book.target = "_blank"; book.rel = "noopener"; } else { book.parentNode.hidden = true; } }

    var cc = document.getElementById("client-link-btn");
    if (cc) {
      cc.addEventListener("click", function () {
        var link = location.href.split(/[?#]/)[0] + "?" + (deal ? "deal=" + encodeURIComponent(deal) + "&" : "") + "as=principal";
        copyText(link, cc);
      });
    }
  }

  /* ---------- Submit a deal page ---------- */
  var submitRoot = document.getElementById("submit-root");
  if (submitRoot) {
    var cardBody = document.getElementById("submit-card-body");
    var start = document.getElementById("submit-start");
    if (C.embedSubmitDeal && cardBody) {
      cardBody.innerHTML = '<iframe class="submit-frame" title="Submit a deal" src="' + esc(C.embedSubmitDeal) + '"></iframe>';
    } else if (start) {
      start.href = pick(F.submitDeal, "Submit a deal");
      if (F.submitDeal) { start.target = "_blank"; start.rel = "noopener"; }
      else { start.textContent = "Email Us Your Deal"; }
    }
  }
})();
