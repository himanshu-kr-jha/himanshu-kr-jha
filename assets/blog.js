/* One note sheet, selected by ?note=<index> against PORTFOLIO_DATA.notes. */
(function (window, document) {
  "use strict";

  var el = window.DOM.el;
  var pad = window.DOM.pad;
  var mount = window.DOM.mount;

  var DATA = window.PORTFOLIO_DATA || {};
  var PROFILE = DATA.profile || {};
  var NOTES = DATA.notes || [];
  var PAGE = "blog.html";

  function set(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text || "";
    return node;
  }

  function currentIndex() {
    try {
      var q = parseInt(new URLSearchParams(window.location.search).get("note"), 10);
      if (!isNaN(q) && q >= 0 && q < NOTES.length) return q;
    } catch (e) { /* no URLSearchParams, or no query — fall through to 0 */ }
    return 0;
  }

  var i = currentIndex();
  var note = NOTES[i] || {};
  var body = note.body || [];
  var words = body.join(" ").split(/\s+/).filter(Boolean).length;
  var next = NOTES.length > 1 ? (i + 1) % NOTES.length : -1;

  document.title = (note.title || "Writing") + " | " + (PROFILE.name || "");

  set("note-label", "Note " + pad(i + 1));
  set("note-status", note.status || "Draft");
  set("note-title", note.title || "Untitled note");
  set("note-lede", note.summary);
  set("filed-under", (note.tags || []).slice(0, 2).join(" · ") || "Engineering");
  var readTime = words ? "~" + Math.max(1, Math.round(words / 200)) + " min" : "—";
  set("read-time", readTime);
  /* Same fact, shown in the article where the rail's spec plate is dropped. */
  set("read-time-inline", words ? readTime + " read" : "");

  mount("note-tags", (note.tags || []).map(function (t) {
    return el("span", { class: "tag tag-outline", text: t });
  }));

  mount("note-paragraphs", body.map(function (p) {
    return el("p", { text: p });
  }));

  mount("note-index", NOTES.map(function (n, k) {
    return el("a", {
      class: k === i ? "is-current" : null,
      href: PAGE + "?note=" + k,
      text: n.title
    });
  }));
  window.DOM.revealCurrent("note-index");

  var nextLink = document.getElementById("note-next");
  if (nextLink) {
    nextLink.setAttribute("href", next >= 0 ? PAGE + "?note=" + next : "index.html#writing");
    set("note-next-label", next >= 0 ? "Next: " + NOTES[next].title : "More writing");
  }

  var reply = document.getElementById("note-reply");
  if (reply) {
    reply.setAttribute("href", "mailto:" + (PROFILE.email || "")
      + "?subject=" + encodeURIComponent("Re: " + (note.title || "your note")));
  }

  set("foot-credit", "© " + new Date().getFullYear() + " " + (PROFILE.name || ""));
})(window, document);
