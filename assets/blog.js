/* One note page, selected by ?note=<index> against PORTFOLIO_DATA.notes. */
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

  document.title = (note.title || "Writing") + " | " + (PROFILE.name || "");
  var description = document.querySelector('meta[name="description"]');
  if (description && note.summary) description.setAttribute("content", note.summary);

  set("brand-name", PROFILE.name);
  set("note-code", "log " + pad(i + 1) + " · " + String(note.status || "Note").toLowerCase());
  set("note-tags", (note.tags || []).join(" · "));
  set("note-title", note.title || "Untitled note");
  var lede = set("note-lede", note.summary);
  if (lede && !note.summary) lede.remove();
  set("note-by", "By " + (PROFILE.name || ""));
  set("note-read", words ? "~" + Math.max(1, Math.round(words / 200)) + " min read" : "");

  mount("note-paragraphs", body.map(function (p) {
    return el("p", { text: p });
  }));

  /* Every other note, in order, starting after this one. */
  var others = [];
  for (var k = 1; k < NOTES.length; k++) others.push((i + k) % NOTES.length);
  var index = document.getElementById("note-index");
  if (index) {
    if (others.length) {
      mount(index, [el("span", { class: "k", text: "More notes" })].concat(others.map(function (n) {
        return el("a", { href: PAGE + "?note=" + n }, [
          el("span", { class: "t", text: NOTES[n].title }),
          el("span", { class: "arrow", "aria-hidden": "true", text: "→" })
        ]);
      })));
    } else {
      index.remove();
    }
  }

  var reply = document.getElementById("note-reply");
  if (reply) {
    reply.setAttribute("href", window.DOM.mailtoDraft(
      PROFILE.email, (DATA.contact || {}).noteReply, { note: note.title || "your note" }
    ));
  }
  var replyNote = document.getElementById("note-reply-note");
  if (replyNote && PROFILE.email) {
    mount(replyNote, ["Or write to ", el("a", { href: "mailto:" + PROFILE.email, text: PROFILE.email }), " directly."]);
  }

  set("foot-credit", "© " + new Date().getFullYear() + " " + (PROFILE.name || ""));

  window.DOM.reveal([
    ".note-meta", ".note-title", ".note-lede", ".byline",
    ".note-body p", ".reply", ".more-notes a"
  ]);
})(window, document);
