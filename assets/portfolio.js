/* The portfolio sheet. Draws index.html from window.PORTFOLIO_DATA. */
(function (window, document) {
  "use strict";

  var el = window.DOM.el;
  var corners = window.DOM.corners;
  var pad = window.DOM.pad;
  var mount = window.DOM.mount;

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

  function noteHref(note, i) {
    return (note.href || "blog.html") + "?note=" + i;
  }

  /* ── 00 · intro ───────────────────────────────────────────────────────── */

  function renderHero() {
    set("rail-name", PROFILE.name);
    set("hero-title", PROFILE.headline);
    set("hero-pitch", PROFILE.pitch);
    set("hero-summary", PROFILE.summary);

    var resume = document.getElementById("rail-resume");
    if (resume && PROFILE.resumeUrl) resume.setAttribute("href", PROFILE.resumeUrl);

    var heroResume = document.getElementById("hero-resume");
    if (heroResume && PROFILE.resumeUrl) heroResume.setAttribute("href", PROFILE.resumeUrl);
    var heroMail = document.getElementById("hero-mail");
    if (heroMail) heroMail.setAttribute("href", "mailto:" + (PROFILE.email || ""));

    mount("hero-kicker", (PROFILE.kicker || []).map(function (k) {
      return el("span", { text: k });
    }));

    var cards = (DATA.titleBlocks || []).map(function (b) {
      return el("div", { class: "blueprint spec-card" }, [
        el("div", { class: "spec-label", text: b.label }),
        el("div", { class: "spec-title", text: b.title }),
        el("div", { class: "spec-meta", text: b.meta }),
        corners()
      ]);
    });

    var pub = DATA.publication;
    if (pub) {
      cards.push(el("div", { class: "blueprint spec-card is-pub" }, [
        el("div", { class: "spec-label", text: pub.label }),
        el("div", { class: "spec-title", text: pub.title }),
        el("div", { class: "spec-meta", text: pub.meta }),
        corners()
      ]));
    }
    mount("hero-grid", cards);
  }

  /* ── 01 · selected work ───────────────────────────────────────────────── */

  function renderWork() {
    mount("work-list", (DATA.heroProjects || []).map(function (h) {
      var body = [
        el("div", { class: "hp-kicker", text: h.kicker }),
        el("h3", { class: "hp-title", text: h.title }),
        (h.paras || []).map(function (p) { return el("p", { class: "hp-para", text: p }); }),
        el("div", { class: "hp-tags" }, (h.tags || []).map(function (t) {
          return el("span", { class: "tag tag-outline", text: t });
        }))
      ];
      /* A project earns a case-study link by having a caseStudy block. No
         block, no link — depth can be added one project at a time. */
      var actions = [];
      if (h.caseStudy && h.slug) {
        actions.push(el("a", {
          class: "btn btn-primary blueprint",
          href: "case.html?p=" + encodeURIComponent(h.slug)
        }, ["Read the case study →", corners()]));
      }
      if (h.linkHref) {
        actions.push(el("a", {
          class: h.caseStudy ? "btn btn-secondary" : "btn btn-primary blueprint",
          href: h.linkHref, target: "_blank", rel: "noopener"
        }, h.caseStudy ? [h.linkLabel || "Visit ↗"] : [h.linkLabel || "Visit ↗", corners()]));
      }
      if (actions.length) body.push(el("div", { class: "hp-actions" }, actions));

      var side = (h.metrics || []).map(function (m) {
        return el("div", { class: "hp-metric" }, [
          el("div", { class: "hp-metric-value", text: m.value }),
          el("div", { class: "hp-metric-label", text: m.label })
        ]);
      });
      if (h.note) side.push(el("div", { class: "hp-note", text: h.note }));

      return el("article", { class: "blueprint hero-project" }, [
        el("div", null, body),
        el("div", { class: "hp-side" }, side),
        corners()
      ]);
    }));
  }

  /* ── 02 · more projects — one row open at a time ──────────────────────── */

  function renderProjects() {
    var panels = [];
    var open = null;

    function paint() {
      panels.forEach(function (p, i) {
        var isOpen = open === i;
        p.panel.style.maxHeight = isOpen ? p.panel.scrollHeight + "px" : "0px";
        p.panel.style.opacity = isOpen ? "1" : "0";
        p.sign.textContent = isOpen ? "−" : "+";
        p.button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    mount("project-rows", (DATA.projects || []).map(function (p, i) {
      var sign = el("span", { class: "row-sign", text: "+" });
      var panelId = "project-panel-" + i;

      var button = el("button", {
        type: "button", class: "row-btn", "aria-expanded": "false", "aria-controls": panelId,
        onclick: function () { open = open === i ? null : i; paint(); }
      }, [
        el("span", { class: "row-num", text: "P-" + pad(i + 1) }),
        el("span", { class: "row-titles" }, [
          el("span", { class: "row-title", text: p.title }),
          el("span", { class: "row-stack", text: p.stack })
        ]),
        sign
      ]);

      var panel = el("div", { class: "row-panel", id: panelId }, [
        el("div", { class: "row-panel-inner" }, [
          el("span"),
          el("div", null, [
            el("p", { class: "row-detail", text: p.detail }),
            el("div", { class: "row-links" }, [
              el("span", { class: "tag tag-accent", text: p.metric }),
              p.link ? el("a", { href: p.link, target: "_blank", rel: "noopener" },
                (p.linkLabel || "Open") + " ↗") : null
            ])
          ])
        ])
      ]);

      panels.push({ panel: panel, sign: sign, button: button });
      return el("div", { class: "row" }, [button, panel]);
    }));

    /* A panel's height is measured, so re-measure when the text reflows. */
    window.addEventListener("resize", function () {
      if (open !== null) paint();
    });
  }

  /* ── 03 · experience ──────────────────────────────────────────────────── */

  function renderExperience() {
    mount("exp-list", (DATA.experience || []).map(function (e) {
      return el("div", { class: "blueprint exp" }, [
        el("div", null, [
          el("div", { class: "exp-org", text: e.org }),
          el("div", { class: "exp-period", text: e.period }),
          el("div", { class: "exp-place", text: e.place })
        ]),
        el("div", null, [
          el("div", { class: "exp-role", text: e.role }),
          el("ul", { class: "exp-bullets" }, (e.bullets || []).map(function (b) {
            return el("li", { text: b });
          })),
          el("div", { class: "exp-tags" }, (e.tags || []).map(function (t) {
            return el("span", { class: "tag tag-outline", text: t });
          }))
        ]),
        corners()
      ]);
    }));
  }

  /* ── 04 · skills ──────────────────────────────────────────────────────── */

  function renderSpecs() {
    mount("specs-body", (DATA.specs || []).map(function (s) {
      return el("tr", null, [
        el("td", { text: s.label }),
        el("td", { text: s.value })
      ]);
    }));
  }

  /* ── 05 · writing ─────────────────────────────────────────────────────── */

  function renderNotes() {
    mount("notes-grid", (DATA.notes || []).map(function (n, i) {
      return el("a", { class: "blueprint note-card", href: noteHref(n, i) }, [
        el("span", { class: "note-label", text: "Note " + pad(i + 1) + " · " + (n.status || "Draft") }),
        el("span", { class: "note-title", text: n.title }),
        el("span", { class: "note-summary", text: n.summary }),
        corners()
      ]);
    }));
  }

  /* ── github plate ─────────────────────────────────────────────────────── */

  function renderGithub() {
    var link = document.getElementById("gh-link");
    if (link && PROFILE.github) {
      link.setAttribute("href", PROFILE.github);
      link.textContent = "@" + (PROFILE.githubUser || "") + " ↗";
    }
    var chart = document.getElementById("gh-chart");
    if (chart && PROFILE.githubUser) {
      chart.src = "https://ghchart.rshah.org/5980a6/" + PROFILE.githubUser;
      chart.alt = "GitHub contribution graph for @" + PROFILE.githubUser;
    }
  }

  /* ── 06 · ask about me ────────────────────────────────────────────────── */

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
          el("span", { class: "msg-who", text: m.role === "user" ? "You" : "Assistant" }),
          el("div", { class: "msg-body", text: m.text })
        ]));
      });
      if (thinking) children.push(el("div", { class: "ask-thinking", text: "Reading the sheet…" }));
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
         keeps "Reading the sheet…" up for as long as it needs. */
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
        type: "button", class: "tag tag-outline ask-chip", text: label,
        onclick: function () { ask(label); }
      });
    }));

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });

    draw(false);
  }

  /* ── 07 · contact ─────────────────────────────────────────────────────── */

  function renderContact() {
    var contact = DATA.contact || {};
    set("contact-heading", contact.heading);
    set("contact-body", contact.body);

    var availability = document.getElementById("contact-availability");
    if (availability) {
      if (contact.availability) availability.textContent = contact.availability;
      else availability.remove();
    }

    var email = document.getElementById("contact-email");
    if (email) {
      email.setAttribute("href", "mailto:" + (PROFILE.email || ""));
      email.textContent = PROFILE.email || "";
    }
    var phone = document.getElementById("contact-phone");
    if (phone) {
      phone.setAttribute("href", "tel:" + String(PROFILE.phone || "").replace(/\s/g, ""));
      phone.textContent = PROFILE.phone || "";
    }
    var linkedin = document.getElementById("contact-linkedin");
    if (linkedin && PROFILE.linkedin) linkedin.setAttribute("href", PROFILE.linkedin);

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
    var year = new Date().getFullYear();
    set("foot-credit", "© " + year + " " + (PROFILE.name || "") + " · " + (PROFILE.sheet || "Sheet 01 of 01"));
    mount("foot-links", [
      PROFILE.github ? el("a", { href: PROFILE.github, target: "_blank", rel: "noopener", text: "GitHub" }) : null,
      PROFILE.linkedin ? el("a", { href: PROFILE.linkedin, target: "_blank", rel: "noopener", text: "LinkedIn" }) : null,
      PROFILE.resumeUrl ? el("a", { href: PROFILE.resumeUrl, target: "_blank", rel: "noopener", text: "Résumé" }) : null
    ]);
  }

  /* ── the rail marks where you are on the sheet ────────────────────────── */

  function trackSections() {
    var links = Array.prototype.slice.call(document.querySelectorAll("#rail-nav a"));
    var sections = links.map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    });
    var strip = links.length ? links[0].parentElement : null;
    var ticking = false;
    var handsOff = 0;

    /* The line the pinned bar sits above: a section counts as "current" once
       its top crosses this. Matches the scroll-margin-top in blueprint.css. */
    var MARKER = 140;

    /* Where we are as a fraction across the whole index — 2.4 means "40% of
       the way through section 02". This is what lets the strip glide with the
       scroll instead of snapping only at section boundaries. */
    function position() {
      var index = 0;
      sections.forEach(function (section, i) {
        if (section && section.getBoundingClientRect().top <= MARKER) index = i;
      });

      var current = sections[index];
      var next = sections[index + 1];
      if (!current) return index;

      var top = current.getBoundingClientRect().top;
      var span = next ? next.getBoundingClientRect().top - top : current.offsetHeight;
      if (!(span > 0)) return index;
      return index + Math.min(1, Math.max(0, (MARKER - top) / span));
    }

    function centreOf(link) { return link.offsetLeft + link.offsetWidth / 2; }

    function update() {
      ticking = false;
      var at = position();
      var index = Math.floor(at);
      links.forEach(function (a, i) { a.classList.toggle("is-current", i === index); });

      /* Only the narrow layout lays the index out as a scrolling strip; on the
         desktop sidebar there is nothing to scroll and this no-ops. */
      if (!strip || strip.scrollWidth <= strip.clientWidth) return;
      if (new Date().getTime() < handsOff) return;

      /* Interpolate between this entry's centre and the next one's, so the
         strip travels right as you scroll down and left as you scroll up
         rather than jumping once per section. */
      var a = links[index];
      var b = links[index + 1] || a;
      var centre = centreOf(a) + (centreOf(b) - centreOf(a)) * (at - index);
      var target = centre - strip.clientWidth / 2;

      /* Late in a long section the interpolation is most of the way to the
         next entry, which can carry the highlighted one off the left edge.
         The marker must never leave the strip, so it wins over the glide. */
      var pad = 12;
      var mustSeeRight = a.offsetLeft + a.offsetWidth + pad - strip.clientWidth;
      var mustSeeLeft = a.offsetLeft - pad;
      if (mustSeeRight <= mustSeeLeft) {
        target = Math.min(Math.max(target, mustSeeRight), mustSeeLeft);
      } else {
        target = mustSeeLeft; // entry wider than the strip — pin its left edge
      }

      strip.scrollLeft = Math.max(0, Math.min(strip.scrollWidth - strip.clientWidth, target));
    }

    /* While a thumb is on the strip it owns the strip. Auto-follow resumes a
       beat after the swipe ends. */
    if (strip) {
      strip.addEventListener("touchstart", function () { handsOff = Infinity; }, { passive: true });
      strip.addEventListener("touchend", function () {
        handsOff = new Date().getTime() + 1500;
      }, { passive: true });
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  renderHero();
  renderWork();
  renderProjects();
  renderExperience();
  renderSpecs();
  renderNotes();
  renderGithub();
  renderAsk();
  renderContact();
  renderFooter();
  trackSections();
})(window, document);
