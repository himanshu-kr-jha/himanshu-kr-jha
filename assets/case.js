/* One case-study page, selected by ?p=<slug> against the heroProjects that
   carry a `caseStudy` block. */
(function (window, document) {
  "use strict";

  var el = window.DOM.el;
  var pad = window.DOM.pad;
  var mount = window.DOM.mount;

  var DATA = window.PORTFOLIO_DATA || {};
  var PROFILE = DATA.profile || {};
  var PAGE = "case.html";
  var PROJECTS = DATA.heroProjects || [];

  /* Only projects with both a slug and a caseStudy are reachable. */
  var STUDIES = PROJECTS.filter(function (p) {
    return p.slug && p.caseStudy;
  });

  function set(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text || "";
    return node;
  }

  function currentIndex() {
    try {
      var slug = new URLSearchParams(window.location.search).get("p");
      for (var i = 0; i < STUDIES.length; i++) {
        if (STUDIES[i].slug === slug) return i;
      }
    } catch (e) { /* no URLSearchParams, or no query — fall through to 0 */ }
    return 0;
  }

  /* Nothing to show at all — send the reader somewhere useful rather than
     rendering an empty page. */
  if (!STUDIES.length) {
    window.location.replace("index.html#work");
    return;
  }

  var i = currentIndex();
  var project = STUDIES[i];
  var study = project.caseStudy;
  var next = STUDIES.length > 1 ? (i + 1) % STUDIES.length : -1;

  document.title = project.title + " — case study | " + (PROFILE.name || "");
  var description = document.querySelector('meta[name="description"]');
  if (description && study.summary) description.setAttribute("content", study.summary);

  /* The same number the project carries on the portfolio's eval list. */
  set("cs-code", "eval " + pad(PROJECTS.indexOf(project) + 1) + " · case study");
  set("cs-kicker", project.kicker);
  set("cs-title", project.title);
  var summary = set("cs-summary", study.summary);
  if (summary && !study.summary) summary.remove();
  set("brand-name", PROFILE.name);

  /* Role and stack in words, then the numbers — they're where a recruiter
     stops, and a client's first question is what it actually achieved. */
  var facts = [];
  if (study.role) facts.push(el("div", null, [el("dt", { text: "Role" }), el("dd", { text: study.role })]));
  if ((project.tags || []).length) {
    facts.push(el("div", null, [el("dt", { text: "Stack" }), el("dd", { text: project.tags.join(" · ") })]));
  }
  (project.metrics || []).forEach(function (m, k) {
    facts.push(el("div", { class: k === 0 ? "is-lead" : null }, [
      el("dt", { text: m.label }),
      el("dd", { class: "num", text: m.value })
    ]));
  });
  mount("cs-facts", facts);

  function slugOf(label, n) {
    return (String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section") + "-" + n;
  }

  /* "Deterministic over adaptive. A partitioner that…" — the first sentence
     is the decision, set in bold; the rest is the reason. */
  function decision(text) {
    var m = String(text).match(/^(.+?[.!?])\s+(.+)$/);
    return m ? [el("strong", { text: m[1] }), " " + m[2]] : [text];
  }

  var sections = study.sections || [];
  mount("cs-toc", [el("span", { class: "toc-label", text: "On this page" })].concat(sections.map(function (s, n) {
    return el("a", { href: "#" + slugOf(s.label, n + 1), text: pad(n + 1) + " " + s.label });
  })));

  var drawing = window.PortfolioArt && project.art ? window.PortfolioArt.figure(project.art) : null;
  mount("cs-sections", [drawing ? el("figure", { class: "art case-art" }, drawing) : null].concat(sections.map(function (section, n) {
    var isDecisions = /decision/i.test(section.label);
    var isOutcome = /outcome|result/i.test(section.label);
    var bullets = section.bullets || [];
    return el("section", {
      class: "cs-section" + (isOutcome ? " is-outcome" : ""),
      id: slugOf(section.label, n + 1)
    }, [
      el("h2", { class: "cs-h2" }, [el("span", { class: "n", text: pad(n + 1) }), section.label]),
      (section.paras || []).map(function (p) { return el("p", { text: p }); }),
      bullets.length
        ? (isDecisions
          ? el("ol", { class: "decisions" }, bullets.map(function (b) { return el("li", null, decision(b)); }))
          : el("ul", null, bullets.map(function (b) { return el("li", { text: b }); })))
        : null
    ]);
  })));

  var note = set("cs-note", project.note);
  if (note && !project.note) note.remove();

  var nextLink = document.getElementById("cs-next");
  if (nextLink) {
    if (next >= 0) {
      nextLink.setAttribute("href", PAGE + "?p=" + encodeURIComponent(STUDIES[next].slug));
      set("cs-next-kicker", next === 0 ? "Back to the first case study" : "Next case study");
      set("cs-next-label", STUDIES[next].title + " →");
    } else {
      set("cs-next-kicker", "Portfolio");
      set("cs-next-label", "All selected work →");
    }
  }

  var live = document.getElementById("cs-live");
  if (live) {
    if (project.linkHref) {
      live.setAttribute("href", project.linkHref);
      live.textContent = project.linkLabel || "Visit the live site ↗";
      live.removeAttribute("hidden");
    } else {
      live.remove();
    }
  }

  /* Opens with the message already drafted, so the visitor isn't handed a
     blank compose window — and the address is printed beside it, because a
     mailto: does nothing at all for anyone without a mail app configured. */
  var contact = document.getElementById("cs-contact");
  if (contact) {
    contact.setAttribute("href", window.DOM.mailtoDraft(
      PROFILE.email, (DATA.contact || {}).enquiry, { project: project.title }
    ));
  }
  var contactNote = document.getElementById("cs-contact-note");
  if (contactNote && PROFILE.email) {
    mount(contactNote, ["Or write to ", el("a", { href: "mailto:" + PROFILE.email, text: PROFILE.email }), " directly."]);
  }

  /* The table of contents follows the reader down the page. */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll("#cs-toc a"));
  var targets = tocLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  var ticking = false;
  function track() {
    ticking = false;
    var index = -1;
    targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top <= 200) index = k; });
    tocLinks.forEach(function (a, k) { a.classList.toggle("is-current", k === index); });
  }
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(track);
  }, { passive: true });
  track();

  set("foot-credit", "© " + new Date().getFullYear() + " " + (PROFILE.name || ""));

  window.DOM.reveal([
    ".case-kicker", ".case-title", ".case-summary", ".case-facts > div",
    ".case-art", ".cs-section",
    ".case-cta-copy", ".next-link"
  ]);
})(window, document);
