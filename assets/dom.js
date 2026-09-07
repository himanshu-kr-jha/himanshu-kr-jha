/* Tiny DOM builder shared by index.html and blog.html.
   Everything goes through textContent, so content from portfolio-data.js is
   never parsed as markup. */
(function (window) {
  "use strict";

  function append(node, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (c) { append(node, c); });
      return;
    }
    node.appendChild(child.nodeType ? child : document.createTextNode(String(child)));
  }

  /* el("a", {class: "btn", href: url, text: "Label"}, children) */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.indexOf("on") === 0 && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    append(node, children);
    return node;
  }

  /* The four registration marks every .blueprint object wears. */
  function corners() {
    return ["tl", "tr", "bl", "br"].map(function (pos) {
      return el("i", { class: "corner " + pos });
    });
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  /* Months since the epoch, from a "2026.01" token. Null for anything else,
     which is how `duration` decides it cannot answer. */
  function monthIndex(token) {
    var m = String(token).match(/(\d{4})\s*[.\-\/]\s*(\d{1,2})/);
    return m ? Number(m[1]) * 12 + (Number(m[2]) - 1) : null;
  }

  /* How long a stint ran, from the period alone: "2026.01 — 2026.07" → "7 mos",
     "2026.08 — present" → counted to today, so it stays true without anyone
     remembering to edit it.

     Both endpoints count. January to July is seven months to everyone who
     isn't a computer, and this number sits next to a job title, not in a
     ledger.

     Returns "" for a period it cannot parse — a stint written in some other
     format then shows no duration, rather than a confidently wrong one. */
  function duration(period, now) {
    if (!period) return "";
    var parts = String(period).split(/[—–-]/);
    if (parts.length < 2) return "";

    var start = monthIndex(parts[0]);
    if (start === null) return "";

    var end;
    if (/present|now|current/i.test(parts[1])) {
      var today = now || new Date();
      end = today.getFullYear() * 12 + today.getMonth();
    } else {
      end = monthIndex(parts[1]);
    }
    if (end === null || end < start) return "";

    var months = end - start + 1;
    var years = Math.floor(months / 12);
    var rest = months % 12;
    var out = [];
    if (years) out.push(years + (years === 1 ? " yr" : " yrs"));
    if (rest || !years) out.push(rest + (rest === 1 ? " mo" : " mos"));
    return out.join(" ");
  }

  /* Builds a mailto: with the message already written, from a template in
     portfolio-data.js. Returns "" without an address, so a caller can tell the
     difference between "no link" and "a link that goes nowhere". */
  function mailtoDraft(email, template, fills) {
    if (!email) return "";
    var subject = (template && template.subject) || "";
    var body = (template && template.body) || "";
    Object.keys(fills || {}).forEach(function (key) {
      var token = new RegExp("\\{" + key + "\\}", "g");
      subject = subject.replace(token, fills[key]);
      body = body.replace(token, fills[key]);
    });
    var query = [];
    if (subject) query.push("subject=" + encodeURIComponent(subject));
    if (body) query.push("body=" + encodeURIComponent(body));
    return "mailto:" + email + (query.length ? "?" + query.join("&") : "");
  }

  /* On narrow screens the rail index is a horizontal strip; if the current
     entry sits past its right edge you land on a page with no visible marker
     of where you are. Centre it once, on load. */
  function revealCurrent(container) {
    var node = typeof container === "string" ? document.getElementById(container) : container;
    var current = node && node.querySelector(".is-current");
    if (!current || node.scrollWidth <= node.clientWidth) return;
    node.scrollLeft = Math.max(0, current.offsetLeft - (node.clientWidth - current.offsetWidth) / 2);
  }

  function mount(target, children) {
    var node = typeof target === "string" ? document.getElementById(target) : target;
    if (!node) return null;
    node.textContent = "";
    append(node, children);
    return node;
  }

  /* ── Scroll reveal ──────────────────────────────────────────────────────
     Blocks rise into place as they enter the viewport, and reset once they
     have fully left, so scrolling back up plays them again rather than
     landing on a page that has already finished moving.

     The hidden state is applied by a class this function adds, never by the
     stylesheet alone — with JavaScript off or unsupported, nothing is ever
     hidden. Anyone who has asked their system for less motion is skipped
     entirely, before a single element is touched. */
  function reveal(selectors) {
    var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm || typeof IntersectionObserver !== "function") return;

    document.documentElement.classList.add("reveal-ready");

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        /* Two thresholds, deliberately asymmetric: a block arrives once it is
           meaningfully on screen, but only resets when it is completely gone,
           so nothing fades while you can still read it. */
        if (entry.intersectionRatio >= 0.12) entry.target.classList.add("is-in");
        else if (!entry.isIntersecting) entry.target.classList.remove("is-in");
      });
    }, { threshold: [0, 0.12] });

    selectors.forEach(function (selector) {
      var nodes = document.querySelectorAll(selector);
      Array.prototype.forEach.call(nodes, function (node, i) {
        node.setAttribute("data-reveal", "");
        /* Capped so a long list staggers without the last item lagging. */
        node.style.setProperty("--reveal-i", String(Math.min(i, 5)));
        observer.observe(node);
      });
    });
  }

  window.DOM = {
    el: el, corners: corners, pad: pad, mount: mount, append: append,
    revealCurrent: revealCurrent, reveal: reveal, mailtoDraft: mailtoDraft,
    duration: duration
  };
})(window);
