/* The portfolio page. Draws index.html from window.PORTFOLIO_DATA. */
(function (window, document) {
  "use strict";

  var el = window.DOM.el;
  var svg = window.DOM.svg;
  var pad = window.DOM.pad;
  var mount = window.DOM.mount;
  var duration = window.DOM.duration;
  var monthIndex = window.DOM.monthIndex;
  var ART = window.PortfolioArt;

  var DATA = window.PORTFOLIO_DATA || {};
  var PROFILE = DATA.profile || {};

  var SUGGESTIONS = [
    "What is he building at Cognecto?",
    "Which projects used computer vision?",
    "Is he available for freelance work?",
    "What has he written about lately?"
  ];

  /* Two captions, because the page must not claim to be doing something it
     isn't. Which one shows depends on which engine actually answered — see
     assets/ask-config.js. */
  var ASK_NOTE_OFFLINE = "";
  var ASK_NOTE_REMOTE = "Answers come from an assistant that reads only this page — it won't answer anything else.";
  var ASK_EMPTY = "Ask anything about my work, experience or projects — what I built at Cognecto, how the "
    + "voter-segmentation engine works, which stacks I've shipped. I only answer from what's on this page.";

  function set(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text || "";
    return node;
  }

  function href(id, url) {
    var node = document.getElementById(id);
    if (!node) return;
    if (url) node.setAttribute("href", url);
    else node.remove();
  }

  function noteHref(note, i) {
    return (note.href || "blog.html") + "?note=" + i;
  }

  function startOf(period) {
    return String(period || "").split(/[—–-]/)[0].trim();
  }

  /* ── Experience, flattened ───────────────────────────────────────────────
     The data groups several posts at one company into a single stint. The
     page draws every post as its own checkpoint, newest first — the run is
     the sequence of posts, and a promotion is a checkpoint like any other. */

  function postPlace(place, orgPlace) {
    if (!place) return orgPlace || "";
    if (/remote/i.test(place) || !orgPlace) return place;
    return place + " · " + String(orgPlace).split(",")[0].trim();
  }

  function flatPosts() {
    var out = [];
    (DATA.experience || []).forEach(function (e) {
      if (e.roles && e.roles.length) {
        e.roles.forEach(function (r) {
          out.push({
            role: r.role, intern: /intern/i.test(r.type || ""), org: e.org, logo: e.logo,
            period: r.period, place: postPlace(r.place, e.place),
            bullets: r.bullets || [], tags: r.tags || []
          });
        });
      } else {
        out.push({
          role: String(e.role || "").replace(/,?\s*intern$/i, ""), intern: /intern$/i.test(e.role || ""),
          org: e.org, logo: e.logo, period: e.period, place: e.place,
          bullets: e.bullets || [], tags: e.tags || []
        });
      }
    });
    return out;
  }

  /* ── top bar ──────────────────────────────────────────────────────────── */

  function renderTopbar() {
    var name = document.getElementById("brand-name");
    if (name) {
      mount(name, [
        el("span", { class: "full", text: PROFILE.name }),
        el("span", { class: "short", text: window.DOM.shortName(PROFILE.name) })
      ]);
    }
    var now = new Date();
    set("brand-run", "run " + now.getFullYear() + "." + pad(now.getMonth() + 1));
    href("top-resume", PROFILE.resumeUrl);
  }

  /* ── hero ─────────────────────────────────────────────────────────────── */

  function renderHero() {
    var posts = flatPosts();
    var live = posts.filter(function (p) { return /present|now|current/i.test(p.period || ""); })[0];

    var status = document.getElementById("hero-status");
    if (status) {
      if (live) {
        mount(status, [el("i", { "aria-hidden": "true" }), el("span", { class: "status-lead", text: "training · " }),
          live.role + " at " + live.org]);
      } else {
        status.remove();
      }
    }
    set("hero-kicker", (PROFILE.kicker || []).join(" · "));
    mount("hero-title", window.DOM.accentTail(PROFILE.headline, PROFILE.headlineAccent));
    set("hero-pitch", PROFILE.pitch);
    set("hero-summary", PROFILE.summary);
    href("hero-mail", PROFILE.email ? "mailto:" + PROFILE.email : "#contact");
    href("hero-github", PROFILE.github);
    href("hero-linkedin", PROFILE.linkedin);
  }

  /* ── the loss curve ───────────────────────────────────────────────────────
     One checkpoint per post, plus education as checkpoint 00, placed on a
     timeline by start date. The curve itself is decoration — a seeded,
     noisy exponential, so it looks the same on every visit — but every dot
     and every date on it comes from the data. */

  var PLOT = { left: 56, right: 540, top: 36, bottom: 262, width: 580, height: 300 };

  function lossCurve(t) {
    var k = 3.2;
    return 37 + 191 * (1 - Math.exp(-k * t)) / (1 - Math.exp(-k));
  }

  function seeded(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647 - 0.5;
    };
  }

  function pathOf(xs, ys) {
    return xs.map(function (x, i) {
      return (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1);
    }).join(" ");
  }

  function renderLoss() {
    var figure = document.getElementById("loss");
    var edu = DATA.education;
    var points = [];
    if (edu && edu.started) {
      points.push({ date: edu.started, label: edu.short || edu.degree || "" });
    }
    flatPosts().reverse().forEach(function (p) {
      var label = p.role + (p.intern ? " intern" : "") + " · " + p.org;
      var live = /present|now|current/i.test(p.period || "");
      points.push({ date: startOf(p.period), label: live ? label + " — still training" : label });
    });
    points = points.filter(function (p) { return monthIndex(p.date) !== null; });
    if (!points.length) {
      if (figure) figure.remove();
      return;
    }

    var today = new Date();
    var firstYear = Number(String(points[0].date).slice(0, 4));
    var m0 = firstYear * 12;
    var m1 = Math.max(today.getFullYear() * 12 + today.getMonth(), monthIndex(points[points.length - 1].date) + 1);
    var span = PLOT.right - PLOT.left;
    function xAt(m) { return PLOT.left + (m - m0) / (m1 - m0) * span; }

    /* 61 samples of a noisy decay; val sits above train and closes the gap. */
    var rand = seeded(20220801);
    var xs = [], train = [], val = [];
    for (var i = 0; i <= 60; i++) {
      var t = i / 60;
      var smooth = lossCurve(t);
      xs.push(PLOT.left + t * span);
      train.push(smooth + rand() * 12 * (1 - 0.45 * t));
      val.push(smooth - (27 - 10 * t) + rand() * 10);
    }
    function trainAt(x) {
      var f = (x - PLOT.left) / span * 60;
      var a = Math.max(0, Math.min(60, Math.floor(f)));
      var b = Math.min(60, a + 1);
      return train[a] + (train[b] - train[a]) * (f - a);
    }

    var grid = [36, 92, 148, 205, 262].map(function (y, n) {
      return svg("line", { x1: PLOT.left, y1: y, x2: PLOT.right, y2: y, class: n % 2 ? "minor" : null });
    });

    var years = [];
    var lastYear = Math.floor(m1 / 12);
    for (var y = firstYear; y <= lastYear; y++) {
      var x = xAt(y * 12);
      if (x > PLOT.right) break;
      years.push(svg("text", {
        x: x, y: 290, class: "axis" + ((y - firstYear) % 2 ? " minor" : ""),
        "text-anchor": y === firstYear ? "start" : (x > PLOT.right - 30 ? "end" : "middle"),
        text: String(y)
      }));
    }

    var last = points.length - 1;
    var dots = [], nums = [];
    points.forEach(function (p, n) {
      var cx = xAt(monthIndex(p.date));
      var cy = trainAt(cx);
      var isNow = n === last;
      dots.push(svg("circle", { cx: cx.toFixed(1), cy: cy.toFixed(1), r: isNow ? 6 : 5, class: "ck" + (isNow ? " is-now" : "") }));
      var lx = n === 0 ? cx + 12 : (isNow ? Math.min(cx - 8, PLOT.right - 16) : cx - 7);
      var ly = n === 0 ? cy - 7 : (isNow ? cy + 24 : cy - 14);
      nums.push(svg("text", { x: lx.toFixed(1), y: ly.toFixed(1), class: "ck-num", text: pad(n) }));
    });

    mount("loss-plot", svg("svg", {
      viewBox: "0 0 " + PLOT.width + " " + PLOT.height, role: "img",
      "aria-label": "A loss curve falling from " + firstYear + " to " + lastYear
        + ", with " + points.length + " checkpoints marking each step"
    }, [
      svg("g", { class: "grid" }, grid),
      svg("text", { x: 10, y: 40, class: "axis y", text: "idea" }),
      svg("text", { x: 10, y: 266, class: "axis y", text: "prod" }),
      years,
      svg("path", { class: "val", d: pathOf(xs, val) }),
      svg("path", { class: "train", d: pathOf(xs, train), pathLength: 1200 }),
      dots,
      nums
    ]));

    mount("loss-caption", points.map(function (p, n) {
      return el("div", { class: "ck-row" + (n === last ? " is-now" : "") }, [
        el("span", { class: "n", text: pad(n) }),
        el("span", { class: "d", text: p.date }),
        el("span", { class: "l", text: p.label })
      ]);
    }));
  }

  /* ── the strip under the hero ─────────────────────────────────────────── */

  function renderStats() {
    var stats = DATA.stats || [];
    if (!stats.length) {
      var strip = document.getElementById("stats");
      if (strip) strip.remove();
      return;
    }
    mount("stats", stats.map(function (s) {
      return el("div", { class: "stat" }, [
        el("div", { class: "stat-value" }, [
          s.value,
          s.small ? el("small", { text: s.small }) : null,
          s.accent ? el("span", { class: "accent", text: s.accent }) : null
        ]),
        el("div", { class: "stat-label", text: s.label })
      ]);
    }));
  }

  /* ── 01 · checkpoints ─────────────────────────────────────────────────── */

  function logoTile(src, org) {
    if (!src) return null;
    return el("span", { class: "logo-tile" }, el("img", { src: src, alt: org + " logo", width: 44, height: 44, loading: "lazy" }));
  }

  function ckptBody(title, org, bullets, logo) {
    return el("div", { class: "ckpt-body" }, [
      el("div", { class: "ckpt-head" }, [
        logoTile(logo, org),
        el("h3", { class: "ckpt-title" }, [title, " ", el("span", { class: "org", text: "· " + org })])
      ]),
      bullets.length === 1
        ? el("p", { text: bullets[0] })
        : el("ul", { class: "prose-list" }, bullets.map(function (b) { return el("li", { text: b }); }))
    ]);
  }

  function renderExperience() {
    var posts = flatPosts();
    var items = posts.map(function (p, i) {
      var span = duration(p.period);
      return el("article", { class: "ckpt" + (i === 0 ? " is-latest" : "") }, [
        el("div", { class: "ckpt-meta" }, [
          el("span", { class: "ckpt-code", text: "ckpt-" + pad(posts.length - i) + (i === 0 ? " · latest" : "") }),
          el("span", { text: p.period + (span ? " · " + span : "") }),
          el("span", { class: "place", text: p.place })
        ]),
        ckptBody(p.role + (p.intern ? ", Intern" : ""), p.org, p.bullets, p.logo),
        el("div", { class: "ckpt-tags" }, p.tags.map(function (t) { return el("span", { text: t }); }))
      ]);
    });

    var edu = DATA.education;
    if (edu) {
      items.push(el("article", { class: "ckpt" }, [
        el("div", { class: "ckpt-meta" }, [
          el("span", { class: "ckpt-code", text: "ckpt-00 · init" }),
          el("span", { text: edu.period }),
          el("span", { class: "place", text: edu.place })
        ]),
        ckptBody(edu.degree, edu.school, edu.summary ? [edu.summary] : [], edu.logo),
        el("div", { class: "ckpt-tags" })
      ]));
    }
    mount("exp-list", items);
  }

  /* ── 02 · eval ────────────────────────────────────────────────────────── */

  function artPanel(name) {
    var drawing = ART && name ? ART.figure(name) : null;
    return drawing ? el("figure", { class: "art" }, drawing) : null;
  }

  function renderWork() {
    mount("work-list", (DATA.heroProjects || []).map(function (h) {
      /* A project earns a case-study link by having a caseStudy block. No
         block, no link — depth can be added one project at a time. */
      var hasCase = h.caseStudy && h.slug;
      var actions = [];
      if (hasCase) {
        actions.push(el("a", {
          class: "btn btn-accent btn-sm", href: "case.html?p=" + encodeURIComponent(h.slug),
          text: "Read the case study →"
        }));
      }
      if (h.linkHref) {
        actions.push(el("a", {
          class: "btn btn-sm " + (hasCase ? "btn-line" : "btn-accent"),
          href: h.linkHref, target: "_blank", rel: "noopener", text: h.linkLabel || "Visit ↗"
        }));
      }
      if (h.note) actions.push(el("span", { class: "eval-note", text: h.note }));

      return el("article", { class: "eval" }, [
        el("div", { class: "eval-main" }, [
          el("span", { class: "eval-kicker", text: h.kicker }),
          el("h3", { class: "eval-title", text: h.title }),
          (h.paras || []).map(function (p) { return el("p", { class: "eval-para", text: p }); }),
          (h.tags || []).length ? el("div", { class: "eval-stack", text: h.tags.join(" · ") }) : null,
          actions.length ? el("div", { class: "eval-actions" }, actions) : null
        ]),
        el("div", { class: "eval-side" }, [
          artPanel(h.art),
          (h.metrics || []).length ? el("div", { class: "eval-metrics" }, h.metrics.map(function (m) {
            return el("div", { class: "metric" }, [
              el("div", { class: "metric-value", text: m.value }),
              el("div", { class: "metric-label", text: m.label })
            ]);
          })) : null
        ])
      ]);
    }));
  }

  /* ── 03 · ablations ───────────────────────────────────────────────────── */

  function renderProjects() {
    mount("project-rows", (DATA.projects || []).map(function (p, i) {
      return el("div", { class: "abl-row" }, [
        el("span", { class: "abl-run" }, [
          ART && ART.icon(p.icon) ? el("span", { class: "icon-tile" }, ART.icon(p.icon)) : null,
          el("span", { class: "abl-num", text: "r-" + pad(i + 1) })
        ]),
        el("div", { class: "abl-proj" }, [
          el("span", { class: "abl-title", text: p.title }),
          el("span", { class: "abl-detail", text: p.detail })
        ]),
        el("span", { class: "abl-stack", text: p.stack }),
        el("span", { class: "abl-result", text: p.metric }),
        p.link
          ? el("a", { class: "abl-link", href: p.link, target: "_blank", rel: "noopener", text: (p.linkLabel || "Open") + " ↗" })
          : el("span")
      ]);
    }));
  }

  /* ── 04 · weights ─────────────────────────────────────────────────────── */

  function renderSpecs() {
    var specs = (DATA.specs || []).filter(function (s) {
      return !(DATA.education && /^education$/i.test(s.label));
    });
    mount("specs-list", specs.map(function (s) {
      return el("div", { class: "weight" }, [
        el("dt", { text: s.label }),
        el("dd", { text: s.value })
      ]);
    }));
  }

  /* ── 05 · logs ────────────────────────────────────────────────────────── */

  function renderNotes() {
    mount("notes-grid", (DATA.notes || []).map(function (n, i) {
      var tags = (n.tags || []).slice(0, 2).join(", ");
      return el("a", { class: "log", href: noteHref(n, i) }, [
        el("span", { class: "log-label" }, [
          n.status || "Note",
          tags ? el("span", { class: "tags", text: " · " + tags }) : null
        ]),
        el("span", { class: "log-title", text: n.title }),
        el("span", { class: "log-summary", text: n.summary }),
        el("span", { class: "log-more", text: "Read the note →" })
      ]);
    }));
  }

  /* ── 06 · inference: ask about me ─────────────────────────────────────── */

  function renderAsk() {
    var offline = window.PortfolioAsk.create(DATA);
    /* With no endpoint configured — the shipped default, a fork, or a file://
       open — this collapses to the offline engine and nothing else runs. */
    var assistant = (window.PortfolioAskRemote && window.ASK_ENDPOINT)
      ? window.PortfolioAskRemote.create({ endpoint: window.ASK_ENDPOINT, offline: offline })
      : {
        answer: function (q) { return Promise.resolve(offline.answer(q)); },
        source: function () { return "offline"; }
      };
    var log = document.getElementById("ask-log");
    var form = document.getElementById("ask-form");
    var input = document.getElementById("ask-input");
    var send = document.getElementById("ask-send");
    var note = document.getElementById("ask-note");
    var messages = [];
    var busy = false;

    if (!log || !form) return;
    note.textContent = ASK_NOTE_OFFLINE;

    function draw(thinking) {
      var children = [];
      if (!messages.length) children.push(el("div", { class: "ask-empty", text: ASK_EMPTY }));
      messages.forEach(function (m) {
        children.push(el("div", { class: "msg " + (m.role === "user" ? "is-user" : "is-bot") }, [
          el("span", { class: "msg-who", text: m.role === "user" ? "you" : "model" }),
          el("div", { class: "msg-body", text: m.text })
        ]));
      });
      if (thinking) children.push(el("div", { class: "ask-thinking", text: "running inference…" }));
      mount(log, children);
      log.scrollTop = log.scrollHeight;
    }

    function ask(question) {
      var q = String(question || "").trim();
      if (!q || busy) return;
      busy = true;
      send.disabled = true;
      messages.push({ role: "user", text: q });
      input.value = "";
      draw(true);

      /* 420ms is a floor, not a delay. An offline answer is already in hand and
         landing it instantly reads as canned; a remote one may take longer and
         keeps the thinking line up for as long as it needs. */
      var started = new Date().getTime();
      assistant.answer(q).then(function (text) {
        var wait = Math.max(0, 420 - (new Date().getTime() - started));
        window.setTimeout(function () {
          messages.push({ role: "assistant", text: text });
          busy = false;
          send.disabled = false;
          note.textContent = assistant.source() === "remote" ? ASK_NOTE_REMOTE : ASK_NOTE_OFFLINE;
          draw(false);
        }, wait);
      });
    }

    mount("ask-chips", SUGGESTIONS.map(function (label) {
      return el("button", {
        type: "button", class: "chip", text: label,
        onclick: function () { ask(label); }
      });
    }));

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });

    draw(false);
  }

  /* ── 07 · serve: contact ──────────────────────────────────────────────── */

  function renderContact() {
    var contact = DATA.contact || {};
    mount("contact-heading", window.DOM.accentTail(contact.heading, contact.headingAccent));
    set("contact-body", contact.body);

    var availability = document.getElementById("contact-availability");
    if (availability) {
      if (contact.availability) availability.textContent = contact.availability;
      else availability.remove();
    }

    var user = PROFILE.githubUser || String(PROFILE.github || "").split("/").filter(Boolean).pop();
    mount("contact-links", [
      PROFILE.email ? el("a", { href: "mailto:" + PROFILE.email, text: PROFILE.email }) : null,
      PROFILE.phone ? el("a", { href: "tel:" + String(PROFILE.phone).replace(/\s/g, ""), text: PROFILE.phone }) : null,
      PROFILE.github ? el("a", { href: PROFILE.github, target: "_blank", rel: "noopener", text: "github.com/" + user }) : null,
      PROFILE.linkedin ? el("a", { href: PROFILE.linkedin, target: "_blank", rel: "noopener", text: "LinkedIn" }) : null
    ]);

    var form = document.getElementById("contact-form");
    var formNote = document.getElementById("form-note");
    var submit = document.getElementById("contact-submit");
    var fallback = document.getElementById("form-fallback");
    if (!form) return;

    var key = contact.formKey;

    /* Without a key there is no delivery service, so the form can only hand
       off to the visitor's mail app — say so plainly rather than implying the
       message reaches him directly. */
    function idleNote() {
      return key
        ? "Sent straight to " + (PROFILE.email || "") + "."
        : "Opens your mail app with the message ready to send.";
    }
    formNote.textContent = idleNote();

    function mailtoFor(f) {
      return "mailto:" + (PROFILE.email || "")
        + "?subject=" + encodeURIComponent("Portfolio enquiry from " + (f.get("name") || ""))
        + "&body=" + encodeURIComponent((f.get("message") || "") + "\n\n— " + (f.get("name") || "")
          + " (" + (f.get("email") || "") + ")");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      if (f.get("botcheck")) return; // honeypot tripped

      if (!key) {
        window.location.href = mailtoFor(f);
        formNote.textContent = "Opening your mail app. If nothing happened, write to "
          + (PROFILE.email || "") + " directly.";
        return;
      }

      submit.disabled = true;
      fallback.setAttribute("hidden", "");
      formNote.textContent = "Sending…";

      window.fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: key,
          subject: "Portfolio enquiry from " + (f.get("name") || ""),
          from_name: f.get("name") || "",
          name: f.get("name") || "",
          email: f.get("email") || "",
          message: f.get("message") || ""
        })
      }).then(function (res) {
        return res.json();
      }).then(function (data) {
        if (!data || data.success !== true) throw new Error("rejected");
        form.reset();
        formNote.textContent = "Thanks — that's with me. I'll reply to "
          + (f.get("email") || "you") + ".";
      }).catch(function () {
        /* Never strand a written message. The mail-app route becomes the
           offered alternative, with the address stated in full so it can be
           copied by hand if that fails too. */
        formNote.textContent = "That didn't send — the form service may be down. "
          + "Use the button below, or write to " + (PROFILE.email || "") + " directly.";
        fallback.setAttribute("href", mailtoFor(f));
        fallback.removeAttribute("hidden");
      }).then(function () {
        submit.disabled = false;
      });
    });
  }

  function renderFooter() {
    var place = (PROFILE.kicker || []).slice(-1)[0];
    set("foot-credit", "© " + new Date().getFullYear() + " " + (PROFILE.name || "") + (place ? " · " + place : ""));
  }

  /* ── the top bar marks where you are ──────────────────────────────────── */

  function trackSections() {
    var links = Array.prototype.slice.call(document.querySelectorAll("#topnav a"));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var ticking = false;
    var MARKER = 160;

    function update() {
      ticking = false;
      var index = -1;
      sections.forEach(function (section, i) {
        if (section && section.getBoundingClientRect().top <= MARKER) index = i;
      });
      /* The last section can never scroll its top to the marker. */
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        index = sections.length - 1;
      }
      links.forEach(function (a, i) {
        a.classList.toggle("is-current", i === index);
        if (i === index) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* Which blocks rise into view. Grouped so each list staggers from its own
     first item rather than continuing a count from the section above. */
  function revealSections() {
    window.DOM.reveal([
      ".hero-copy > *",
      ".loss",
      ".stats .stat",
      ".sec-head",
      ".ckpt",
      ".eval",
      ".art",
      ".abl-row",
      ".weight",
      ".log",
      ".ask",
      ".serve-copy", ".serve-form"
    ]);
  }

  renderTopbar();
  renderHero();
  renderLoss();
  renderStats();
  renderExperience();
  renderWork();
  renderProjects();
  renderSpecs();
  renderNotes();
  renderAsk();
  renderContact();
  renderFooter();
  trackSections();
  revealSections();
})(window, document);
