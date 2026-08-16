/* ─────────────────────────────────────────────────────────────────────────
   REMOTE ANSWERER — the seam between this page and whatever LLM you point it
   at. It owns exactly one job: try the endpoint, and when that doesn't work
   out, get out of the way so the offline engine can answer instead.

   Every failure mode resolves rather than rejects. A visitor should never see
   an error where an answer belongs — they get the offline answer and a caption
   telling them so.
   ───────────────────────────────────────────────────────────────────────── */
(function (window) {
  "use strict";

  var TIMEOUT_MS = 8000;
  /* After this many consecutive failures, stop calling the endpoint for the
     rest of the session. A dead backend shouldn't cost every later question an
     eight-second wait. */
  var GIVE_UP_AFTER = 2;

  function create(options) {
    var endpoint = options.endpoint;
    var offline = options.offline;
    var failures = 0;
    var lastSource = "offline";

    function fallback(q) {
      lastSource = "offline";
      return offline.answer(q);
    }

    function answer(q) {
      if (!endpoint || failures >= GIVE_UP_AFTER) {
        return Promise.resolve(fallback(q));
      }

      var controller = typeof AbortController === "function" ? new AbortController() : null;
      var timer = window.setTimeout(function () {
        if (controller) controller.abort();
      }, TIMEOUT_MS);

      return window.fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: q }),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        if (!res.ok) throw new Error("http " + res.status);
        return res.json();
      }).then(function (data) {
        /* The endpoint answers {ok:false, reason:"rate_limited"|"budget"|…}
           when it declines to spend a call. That is a normal reply, not an
           error — fall back quietly. */
        if (!data || data.ok !== true || typeof data.text !== "string" || !data.text.trim()) {
          throw new Error("declined");
        }
        failures = 0;
        lastSource = "remote";
        return data.text.trim();
      }).catch(function () {
        failures += 1;
        return fallback(q);
      }).then(function (text) {
        window.clearTimeout(timer);
        return text;
      });
    }

    return {
      answer: answer,
      REFUSAL: offline.REFUSAL,
      /* Which engine answered the last question — the UI captions itself from
         this, so the page never claims to be doing something it isn't. */
      source: function () { return lastSource; }
    };
  }

  window.PortfolioAskRemote = { create: create };
})(window);
