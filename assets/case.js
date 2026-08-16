/* One case-study sheet, selected by ?p=<slug> against the heroProjects that
   carry a `caseStudy` block. */
(function (window, document) {
  "use strict";

  var el = window.DOM.el;
  var corners = window.DOM.corners;
  var mount = window.DOM.mount;

  var DATA = window.PORTFOLIO_DATA || {};
  var PROFILE = DATA.profile || {};
  var PAGE = "case.html";

  /* Only projects with both a slug and a caseStudy are reachable. */
  var STUDIES = (DATA.heroProjects || []).filter(function (p) {
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
     rendering an empty sheet. */
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

  set("cs-kicker", project.kicker);
  set("cs-title", project.title);
  set("cs-summary", study.summary);
  set("cs-role", study.role || "—");
  /* Same fact, shown in the article where the rail's spec plate is dropped. */
  set("cs-role-inline", study.role || "");
  set("cs-stack", (project.tags || []).slice(0, 3).join(" · ") || "—");

  mount("cs-tags", (project.tags || []).map(function (t) {
    return el("span", { class: "tag tag-outline", text: t });
  }));

  /* The numbers sit above the prose: they're where a recruiter stops, and a
     client's first question is what it actually achieved. */
  mount("cs-metrics", (project.metrics || []).map(function (m) {
    return el("div", { class: "blueprint cs-metric" }, [
      el("div", { class: "cs-metric-value", text: m.value }),
      el("div", { class: "cs-metric-label", text: m.label }),
      corners()
    ]);
  }));

  mount("cs-sections", (study.sections || []).map(function (section, n) {
    return el("section", { class: "cs-section" }, [
      el("div", { class: "cs-section-head" }, [
        el("span", { class: "cs-section-num", text: String(n + 1).padStart(2, "0") }),
        el("h2", { class: "cs-section-title", text: section.label })
      ]),
      (section.paras || []).map(function (p) { return el("p", { text: p }); }),
      (section.bullets || []).length
        ? el("ul", { class: "cs-bullets" }, section.bullets.map(function (b) {
          return el("li", { text: b });
        }))
        : null
    ]);
  }));

  mount("cs-index", STUDIES.map(function (s, k) {
    return el("a", {
      class: k === i ? "is-current" : null,
      href: PAGE + "?p=" + encodeURIComponent(s.slug),
      text: s.title
    });
  }));
  window.DOM.revealCurrent("cs-index");

  var nextLink = document.getElementById("cs-next");
  if (nextLink) {
    nextLink.setAttribute("href", next >= 0 ? PAGE + "?p=" + encodeURIComponent(STUDIES[next].slug) : "index.html#work");
    set("cs-next-label", next >= 0 ? "Next: " + STUDIES[next].title : "Back to selected work");
  }

  /* Removed rather than hidden: .btn sets display:inline-flex, which outranks
     the hidden attribute's UA rule and would leave a dead button on screen. */
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

  var contact = document.getElementById("cs-contact");
  if (contact) {
    contact.setAttribute("href", "mailto:" + (PROFILE.email || "")
      + "?subject=" + encodeURIComponent("About your " + project.title + " work"));
  }

  set("foot-credit", "© " + new Date().getFullYear() + " " + (PROFILE.name || ""));

  window.DOM.reveal([
    ".note-meta", ".note-h1", ".note-lede", ".note-tags",
    ".cs-metrics .cs-metric",
    ".cs-section-head", ".cs-section p", ".cs-bullets li",
    ".note-actions", ".sheet-foot"
  ]);
})(window, document);
