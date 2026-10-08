(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var G = window.gsap && !RM ? window.gsap : null;
  if (G && window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);

  // year
  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();

  // nav border on scroll
  var nav = $("#nav");
  addEventListener("scroll", function () { nav.classList.toggle("scrolled", scrollY > 8); }, { passive: true });

  // mobile menu
  var menuBtn = $("#menuBtn"), mobileMenu = $("#mobileMenu");
  menuBtn.addEventListener("click", function () {
    var open = mobileMenu.style.display === "flex";
    mobileMenu.style.display = open ? "none" : "flex";
    menuBtn.setAttribute("aria-expanded", open ? "false" : "true");
  });
  $$("#mobileMenu a").forEach(function (a) {
    a.addEventListener("click", function () { mobileMenu.style.display = "none"; menuBtn.setAttribute("aria-expanded", "false"); });
  });

  // trust marquee
  var track = $("#trustTrack");
  if (track) {
    var items = ["PayFast", "Yoco", "Ozow", "SnapScan", "Pudo lockers", "The Courier Guy", "PAXI", "Peach Payments", "Stitch"];
    var html = items.map(function (t) { return '<span class="chip"><span class="d" style="width:7px;height:7px;border-radius:50%;background:var(--gold);display:inline-block"></span> ' + t + '</span>'; }).join("");
    track.innerHTML = html + html;
  }

  // pricing: monthly / annual toggle
  var monthlyBtn = $("#billMonthly"), annualBtn = $("#billAnnual");
  function setBilling(annual) {
    monthlyBtn.classList.toggle("on", !annual); annualBtn.classList.toggle("on", annual);
    monthlyBtn.setAttribute("aria-pressed", String(!annual)); annualBtn.setAttribute("aria-pressed", String(annual));
    $$("[data-price]").forEach(function (el) { el.textContent = annual ? el.getAttribute("data-annual") : el.getAttribute("data-monthly"); });
    $$("[data-per]").forEach(function (el) { el.textContent = annual ? "/mo, billed yearly" : "/month"; });
  }
  if (monthlyBtn && annualBtn) {
    monthlyBtn.addEventListener("click", function () { setBilling(false); });
    annualBtn.addEventListener("click", function () { setBilling(true); });
  }

  // count-up helper
  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-count")) || 0, suf = el.getAttribute("data-suffix") || "";
    if (!G) { el.textContent = to + suf; return; }
    var o = { v: 0 };
    G.to(o, { v: to, duration: 1.1, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v) + suf; } });
  }

  // ---------- NO GSAP (or reduced motion): show everything, finish counters ----------
  if (!G) {
    $$("[data-count]").forEach(countUp);
    return;
  }

  // ---------- GSAP motion ----------
  // 1. hero load timeline (one orchestrated moment)
  var tl = G.timeline({ defaults: { ease: "expo.out" } });
  tl.from("nav .nav-in", { y: -14, opacity: 0, duration: 0.4 })
    .from("[data-load].made-chip, .made-chip[data-load]", { y: 14, opacity: 0, duration: 0.4 }, "-=0.1")
    .from(".hero-title", { y: 26, opacity: 0, duration: 0.6 }, "-=0.2")
    .from(".seam-draw", { scaleX: 0, transformOrigin: "left center", duration: 0.7 }, "-=0.35")
    .from(".lede[data-load]", { y: 16, opacity: 0, duration: 0.5 }, "-=0.5")
    .from(".hero-cta[data-load]", { y: 14, opacity: 0, duration: 0.45 }, "-=0.35")
    .from(".hero-stats[data-load]", { y: 14, opacity: 0, duration: 0.45 }, "-=0.3")
    .from(".hero-visual", { y: 24, opacity: 0, scale: 0.97, duration: 0.7 }, "-=0.8")
    .add(function () { $$("[data-count]").forEach(countUp); }, "-=0.4");

  // 2. floating chips: entrance + gentle continuous float
  G.utils.toArray(".fchip").forEach(function (el, i) {
    G.from(el, { opacity: 0, scale: 0.8, duration: 0.5, delay: 0.9 + i * 0.12, ease: "back.out(1.7)" });
    G.to(el, { y: "+=8", duration: 2 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.2 });
  });

  // 3. pointer parallax tilt on the hero visual
  var tilt = $(".hero-visual"); var inner = $(".tilt-inner", tilt);
  if (tilt && inner && !matchMedia("(pointer:coarse)").matches) {
    var rx = G.quickTo(inner, "rotationX", { duration: 0.6, ease: "power3.out" });
    var ry = G.quickTo(inner, "rotationY", { duration: 0.6, ease: "power3.out" });
    tilt.addEventListener("pointermove", function (e) {
      var r = tilt.getBoundingClientRect();
      ry((e.clientX - r.left - r.width / 2) / r.width * 12);
      rx(-(e.clientY - r.top - r.height / 2) / r.height * 12);
    });
    tilt.addEventListener("pointerleave", function () { rx(0); ry(0); });
  }

  // 4. scroll reveals (from a visible baseline, once)
  G.utils.toArray("[data-reveal]").forEach(function (el) {
    G.from(el, { opacity: 0, y: 24, duration: 0.6, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true } });
  });
  // bento cells stagger within the grid
  if ($(".bento")) {
    G.from(".bento .bcell", { opacity: 0, y: 28, duration: 0.5, stagger: 0.07, ease: "power2.out",
      scrollTrigger: { trigger: ".bento", start: "top 78%", once: true } });
  }
  // mini-store dots pop
  if ($(".mini-store")) {
    G.from(".ms-dot", { opacity: 0, scale: 0.6, stagger: 0.08, duration: 0.4, ease: "back.out(2)",
      scrollTrigger: { trigger: ".mini-store", start: "top 90%", once: true } });
  }
  // whatsapp chat bubbles
  if ($(".wa-chat")) {
    G.from(".wa-chat .wb", { opacity: 0, y: 12, stagger: 0.18, duration: 0.4, ease: "power2.out",
      scrollTrigger: { trigger: ".wa-chat", start: "top 85%", once: true } });
  }

  // 5. magnetic primary buttons
  $$(".mag").forEach(function (btn) {
    var mx = G.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
    var my = G.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.4);
    });
    btn.addEventListener("pointerleave", function () { mx(0); my(0); });
  });

  // 6. subtle 3D tilt on showcase cards
  $$("[data-tiltcard]").forEach(function (card) {
    if (matchMedia("(pointer:coarse)").matches) return;
    var rx = G.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
    var ry = G.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
    card.style.transformStyle = "preserve-3d";
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      ry((e.clientX - r.left - r.width / 2) / r.width * 10);
      rx(-(e.clientY - r.top - r.height / 2) / r.height * 10);
    });
    card.addEventListener("pointerleave", function () { rx(0); ry(0); });
  });
})();
