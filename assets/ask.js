/* ─────────────────────────────────────────────────────────────────────────
   THE ON-PAGE ASSISTANT — answers only from portfolio-data.js.

   The design calls for an assistant that reads this page and nothing else.
   There is no API key on a static host, so the answering runs entirely in the
   browser: the same dossier the original prompt would have carried is indexed
   here, a question picks an intent, the intent's records are ranked by term
   overlap, and the answer is composed from the matched records' own words.

   The one rule that never bends: if nothing in the dossier answers the
   question, say so with REFUSAL rather than inventing anything.
   ───────────────────────────────────────────────────────────────────────── */
(function (window) {
  "use strict";

  var REFUSAL = "I can only answer questions about Himanshu's work and background. " +
    "Try asking about his projects, experience or skills.";

  /* Words that carry no topic: grammar, plus the meta-vocabulary people use to
     frame a question ("what projects has he built") which the intent layer has
     already consumed. Stripping them is what lets an empty remainder mean
     "just list them" and a non-empty remainder that matches nothing mean
     "not in the dossier". */
  var STOP = ("a about above actually after again against all also am an and any anything are aren area areas as at "
    + "be because been before being below best between both build building built but by "
    + "can cannot could couldn currently day days did didn do does doesn doing done don down during "
    + "each ever few field fields first for from further general had hadn has hasn have haven having he her here hers herself "
    + "him himself himanshu his how i if in into is isn it its itself jha just kind know knows "
    + "kumar last late lately latest later like list made main mainly make many me more most mostly much must my myself "
    + "new newest next no nor not notable now nowadays of off old on once one only or other ought our ours out over own "
    + "page particular please post posts project projects really recent recently right same shipped should show side site skill skills so some something sort specific stuff "
    + "stack such tech technologies tell than that the their theirs them themselves then there thing things "
    + "these they this those three through time to today too two type under until up us use used uses using very "
    + "was wasn we were weren what when where which while who whom why will with won work "
    /* "write" belongs here with its inflections: it frames the question ("how
       do I write…", "write me a poem") and prefix-matches "writes" in ordinary
       prose, which turned unrelated requests into note answers. */
    + "working works would write writer writes writing written wrote year years you your yours yourself").split(" ");

  var STOPSET = {};
  STOP.forEach(function (w) { STOPSET[w] = true; });

  /* Query-side expansions: a visitor's shorthand widened to the words the
     dossier actually uses. */
  var EXPANSIONS = [
    /* Deliberately no "detection" here — it also names non-vision work on this
       page (compaction-pass, automobile failure) and drags them into every CV
       answer. */
    [/\bcv\b|\bcomputer vision\b|\bvision\b/, ["computer vision", "opencv", "yolo", "pose", "video", "surveillance"]],
    [/\bml\b|\bmachine learning\b|\bai\b|\bmodel/, ["machine learning", "model", "inference", "triton", "onnx", "learning"]],
    [/\bdb\b|\bdatabase/, ["postgresql", "mongodb", "mysql", "sql", "supabase"]],
    [/\bdevops\b|\binfra/, ["docker", "aws", "gcp", "ci/cd", "kubernetes", "compose", "cloud"]],
    [/\bbackend\b|\bapi\b|\bserver/, ["fastapi", "node.js", "express", "rest", "backend", "microservices"]],
    [/\bfrontend\b|\bweb\b|\bui\b/, ["react", "next.js", "web", "responsive"]],
    [/\bcloud\b/, ["aws", "gcp", "s3", "lambda", "ecs", "serverless"]],
    [/\bgeo|\bmap|\bgps\b|\bspatial/, ["geospatial", "gps", "turf.js", "geopandas", "shapely"]],
    [/\bpaper|\bresearch|\bpublicat/, ["publication", "springer", "icdam", "formerpose"]]
  ];

  /* Intent scoring — the highest total wins; ties fall to declaration order.
     Patterns anchor on a leading \b and then match as prefixes, so plurals and
     inflections ("projects", "written", "publications") hit the same rule. */
  var INTENTS = [
    {
      name: "contact",
      rules: [
        [/\b(hire|hiring|recruit|availab|freelanc|opportunit|vacanc|open to|looking for a job|full[- ]?time|contact|reach out|reach him|get in touch|e?mail|phone|collaborat)/, 2],
        [/\b(resum|cv\b|cover letter|apply|offer)/, 2]
      ]
    },
    {
      name: "publication",
      rules: [[/\b(publication|publish(ed)? paper|springer|icdam|journal|lnns|conference)/, 2], [/\b(paper|research)/, 1]]
    },
    {
      name: "education",
      rules: [
        [/\b(educat|degree|college|universit|dtu|delhi technological|cgpa|gpa|graduat|b\.?tech|school|certificat|nptel|coursework)/, 2],
        [/\b(stud(y|ie|ied)|academic|marks|grades)/, 1]
      ]
    },
    {
      name: "writing",
      rules: [[/\b(writ|wrote|blog|article|essay|note[s]?\b|learning log|thought|opinion|think about|believe)/, 2], [/\b(read|published)/, 1]]
    },
    {
      name: "experience",
      rules: [
        [/\b(cognecto|accenture|intern|experience|career|employ|previous|past role|worked at|works at|working at|currently)/, 2],
        [/\b(role|job|compan|team|position|responsib)/, 1]
      ]
    },
    {
      name: "skills",
      rules: [[/\b(skill|stack|technolog|language|tool|framework|proficien|expert|familiar|comfortable)/, 2], [/\b(know|use[sd]?\b|good at)/, 1]]
    },
    {
      name: "projects",
      /* No "pipeline" here: it names things he built *and* things he wrote
         about, so routing on it sends note questions to the project shelf. */
      rules: [[/\b(project|portfolio|case stud|demo|repo)/, 2], [/\b(built|build|made|shipped|created|app\b|platform|system|code|github)/, 1]]
    },
    {
      name: "profile",
      rules: [[/\b(who is|about (him|himanshu)|introduce|background|summary|bio|based in|located|location|live[s]?\b|city|country)/, 2]]
    },
    {
      name: "github",
      rules: [[/\b(github|open[- ]source|repositor)/, 2]]
    }
  ];

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9+#./]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function tokenize(text) {
    /* Below three characters nothing is distinctive enough to retrieve on, and
       the short shorthands that do matter ("cv", "ml", "db") come in through
       EXPANSIONS, which reads the raw question. */
    return normalize(text).split(" ").filter(function (t) {
      return t.length > 2 && !STOPSET[t];
    });
  }

  function unique(list) {
    var seen = {};
    return list.filter(function (v) {
      if (seen[v]) return false;
      seen[v] = true;
      return true;
    });
  }

  /* Sentence split that survives the dossier's numbers: a period between two
     digits is a decimal ("R² 0.81", "0.0667 m"), not a full stop. No
     lookbehind — Safari carried it late and this has to run everywhere. */
  function sentences(text) {
    var s = String(text || "");
    var out = [];
    var start = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c !== "." && c !== "!" && c !== "?") continue;
      var prev = s.charAt(i - 1);
      var next = s.charAt(i + 1);
      var after = s.charAt(i + 2);
      if (c === "." && /\d/.test(prev) && /\d/.test(next)) continue;
      if (!next || (/\s/.test(next) && (!after || /[A-Z"'(“]/.test(after)))) {
        out.push(s.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
    if (start < s.length) out.push(s.slice(start).trim());
    return out.filter(Boolean);
  }

  function firstSentence(text) {
    return sentences(text)[0] || String(text || "");
  }

  /* "a, b and c" */
  function join(items) {
    if (items.length <= 1) return items[0] || "";
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  /* ── the index ──────────────────────────────────────────────────────────
     One record per thing on the page. `terms` is everything the record can be
     found by; `title` matches count triple. */
  function buildIndex(data) {
    var profile = data.profile || {};
    var records = { experience: [], projects: [], notes: [], skills: [] };

    (data.experience || []).forEach(function (job, i) {
      records.experience.push({
        title: job.org + " " + job.role,
        terms: [job.org, job.role, job.period, job.place, (job.bullets || []).join(" "), (job.tags || []).join(" ")].join(" "),
        order: i,
        item: job
      });
    });

    (data.heroProjects || []).forEach(function (p, i) {
      /* Case-study prose is indexed but never quoted back wholesale — it widens
         what a question can match without changing what an answer looks like. */
      var study = p.caseStudy || {};
      var studyText = [study.summary, study.role].concat(
        (study.sections || []).map(function (s) {
          return [s.label, (s.paras || []).join(" "), (s.bullets || []).join(" ")].join(" ");
        })
      ).join(" ");

      records.projects.push({
        title: p.title,
        terms: [p.title, p.kicker, (p.paras || []).join(" "), (p.tags || []).join(" "),
          (p.metrics || []).map(function (m) { return m.value + " " + m.label; }).join(" "),
          p.note, studyText].join(" "),
        order: i,
        featured: true,
        item: {
          title: p.title,
          stack: (p.tags || []).join(" · "),
          detail: (p.paras || [])[0] || "",
          metric: (p.metrics || []).map(function (m) { return m.value + " " + m.label; }).join(", "),
          link: p.linkHref || "",
          note: p.note || "",
          /* Present only when there's a page to send someone to. */
          caseStudyUrl: (p.slug && p.caseStudy) ? "case.html?p=" + p.slug : ""
        }
      });
    });

    (data.projects || []).forEach(function (p, i) {
      records.projects.push({
        title: p.title,
        terms: [p.title, p.stack, p.detail, p.metric].join(" "),
        order: 100 + i,
        item: {
          title: p.title, stack: p.stack, detail: p.detail,
          metric: p.metric, link: p.link, note: ""
        }
      });
    });

    (data.notes || []).forEach(function (n, i) {
      records.notes.push({
        title: n.title,
        terms: [n.title, n.summary, (n.tags || []).join(" "), (n.body || []).join(" ")].join(" "),
        order: i,
        index: i,
        item: n
      });
    });

    (data.specs || []).forEach(function (s, i) {
      records.skills.push({
        title: s.label,
        terms: s.label + " " + s.value,
        order: i,
        item: s
      });
    });

    Object.keys(records).forEach(function (key) {
      records[key].forEach(function (r) {
        /* Leading space so a search for " token" only ever matches at a word
           start. Without it "pose" matches "exposes" and every case study
           quietly becomes a computer-vision project. */
        r.titleNorm = " " + normalize(r.title);
        r.termsNorm = " " + normalize(r.terms);
      });
    });

    return { profile: profile, data: data, records: records };
  }

  function expand(tokens, raw) {
    var out = tokens.slice();
    EXPANSIONS.forEach(function (pair) {
      if (pair[0].test(raw)) out = out.concat(pair[1].map(normalize));
    });
    return unique(out).filter(Boolean);
  }

  function rank(records, tokens) {
    return records.map(function (r) {
      var score = 0;
      tokens.forEach(function (t) {
        if (t.length < 3) return;
        /* Word-prefix matching finds "segments" from "segment" but never the
           middle of an unrelated word. The singular form is tried too, so a
           question about "thresholds" still reaches a note titled
           "threshold" — prefix matching only stretches one way on its own. */
        var forms = [t];
        if (t.length > 4 && t.charAt(t.length - 1) === "s") forms.push(t.slice(0, -1));

        for (var i = 0; i < forms.length; i++) {
          var f = forms[i];
          /* An exact word in the title outranks a prefix of a longer one, so
             "threshold" beats "learn"-inside-"Machine Learning Engineer". */
          if ((r.titleNorm + " ").indexOf(" " + f + " ") !== -1) { score += 4; return; }
          if (r.titleNorm.indexOf(" " + f) !== -1) { score += 3; return; }
          if (r.termsNorm.indexOf(" " + f) !== -1) { score += 1; return; }
        }
      });
      return { record: r, score: score };
    }).filter(function (hit) {
      return hit.score > 0;
    }).sort(function (a, b) {
      return b.score - a.score || a.record.order - b.record.order;
    });
  }

  function scoreIntents(raw) {
    var best = null;
    INTENTS.forEach(function (intent) {
      var score = 0;
      intent.rules.forEach(function (rule) {
        if (rule[0].test(raw)) score += rule[1];
      });
      if (score > 0 && (!best || score > best.score)) best = { name: intent.name, score: score };
    });
    return best;
  }

  /* ── answer composers ───────────────────────────────────────────────── */

  function describeProject(item) {
    var out = item.title + " — " + firstSentence(item.detail);
    if (item.metric) out += " Headline number: " + item.metric + ".";
    if (item.caseStudyUrl) out += " There's a full case study on this site under Selected work.";
    else if (item.note) out += " " + item.note + ".";
    else if (item.link) out += " It's linked from this page at " + item.link + ".";
    return out;
  }

  /* "which projects", "list", "examples" — the question asks to enumerate, so
     enumerate even when one entry dominates the ranking. */
  var WANTS_LIST = /\bprojects\b|\blist\b|\bexamples\b|\bwhich ones\b|\ball of\b/;

  function answerProjects(hits, raw) {
    if (!hits.length) return null;
    /* One project clearly out in front means the question was about that
       project — answer it, rather than reciting a list it happens to head.
       Guarded on a non-zero score: the generic "show me everything" path
       ranks every record at zero, and 0 >= 0 is not dominance. */
    var decisive = hits.length > 1
      && hits[0].score > 0
      && hits[0].score >= hits[1].score * 2
      && !WANTS_LIST.test(raw || "");
    if (hits.length === 1 || decisive) return describeProject(hits[0].record.item);
    var top = hits.slice(0, 4).map(function (h) {
      return h.record.item.title + " (" + h.record.item.stack + ")";
    });
    var lead = hits[0].record.item;
    return "From this page — " + join(top) + ". "
      + firstSentence(lead.detail)
      + (lead.metric ? " " + lead.title + " came in at " + lead.metric + "." : "");
  }

  function answerExperience(hits) {
    if (!hits.length) return null;
    var job = hits[0].record.item;
    var current = /present/i.test(job.period);
    var out = current
      ? "Himanshu is currently " + job.role + " at " + job.org + ", " + job.period + " (" + job.place + ")."
      : "At " + job.org + " he was " + job.role + ", " + job.period + " (" + job.place + ").";

    var bullets = job.bullets || [];
    if (bullets[0]) out += " " + bullets[0];
    if (bullets[1] && out.length < 420) out += " " + bullets[1];

    var others = unique(hits.slice(1).map(function (h) { return h.record.item.org; }))
      .filter(function (org) { return org !== job.org; });
    if (others.length) out += " He has also worked at " + join(others.slice(0, 2)) + ".";
    return out;
  }

  function answerNotes(hits) {
    if (!hits.length) return null;
    /* A clear winner means the question was about that note — same rule the
       project answers use, so "Gait-YOLO" gets the note rather than a list. */
    var decisive = hits.length > 1 && hits[0].score > 0 && hits[0].score >= hits[1].score * 2;
    if (hits.length === 1 || decisive || hits[0].score >= 3) {
      var n = hits[0].record.item;
      return "He has a note called \"" + n.title + "\" (" + (n.status || "Draft") + "). "
        + n.summary + " " + firstSentence((n.body || [])[0] || "");
    }
    var titles = hits.slice(0, 3).map(function (h) { return "\"" + h.record.item.title + "\""; });
    return "There " + (titles.length === 1 ? "is a note" : "are notes") + " on this page on "
      + join(titles) + ". " + hits[0].record.item.summary;
  }

  function answerSkills(hits) {
    if (!hits.length) return null;
    return "From the skills table on this page — " + hits.slice(0, 3).map(function (h) {
      return h.record.item.label + ": " + h.record.item.value;
    }).join(". ") + ".";
  }

  /* ── the assistant ──────────────────────────────────────────────────── */

  function create(data) {
    var ctx = buildIndex(data);
    var profile = ctx.profile;

    /* Search every pool and answer from whichever the best hit came from.
       `floor` is how strong that hit has to be: 1 when the question gave no
       intent to scope by, 3 (a title match) when it did and that scope came up
       empty — strong enough that an off-topic word can't drag an answer out. */
    function acrossEverything(tokens, raw, floor) {
      var all = ctx.records.projects
        .concat(ctx.records.experience, ctx.records.notes, ctx.records.skills);
      var best = rank(all, tokens);
      if (!best.length || best[0].score < floor) return null;

      var top = best[0].record;
      if (top.item.bullets) return answerExperience(rank(ctx.records.experience, tokens));
      if (top.item.body) return answerNotes(rank(ctx.records.notes, tokens));
      if (top.item.value) return answerSkills(rank(ctx.records.skills, tokens));
      return answerProjects(rank(ctx.records.projects, tokens), raw);
    }

    function answer(question) {
      var raw = normalize(question);
      if (!raw) return REFUSAL;

      var tokens = expand(tokenize(question), raw);
      var intent = scoreIntents(raw);
      var name = intent && intent.name;

      /* "paper"/"research" alone is as likely to mean the FormerPose note as
         the Springer publication — only the named-publication vocabulary goes
         straight to the publication answer. */
      if (name === "publication" && intent.score < 2) name = null;

      /* No framing at all ("FormerPose?", "Triton", "any AWS?") — search
         everything and answer from whichever pool the best hit came from. */
      if (!name) {
        /* A greeting, or a question framed entirely in words the dossier
           doesn't index — open with who he is rather than a refusal. */
        if (!tokens.length) {
          return profile.summary + " Ask about his projects, experience, skills or writing.";
        }
        return acrossEverything(tokens, raw, 1) || REFUSAL;
      }

      if (name === "contact") {
        return (ctx.data.contact || {}).body + " The best way to reach him is "
          + profile.email + (profile.phone ? ", or " + profile.phone : "")
          + ". His resume PDF is linked at the top-left of this page.";
      }

      if (name === "github") {
        return "His code is at " + profile.github + " (@" + profile.githubUser + "), and the contribution "
          + "graph is embedded further down this page. Public repositories include "
          + join((ctx.data.projects || []).filter(function (p) {
            return /github\.com/.test(p.link);
          }).slice(0, 3).map(function (p) { return p.title; })) + ".";
      }

      if (name === "publication") {
        var pub = ctx.data.publication || {};
        return "His publication is \"" + pub.title + "\" — " + pub.meta
          + ". It's the only publication listed on this page.";
      }

      if (name === "education") {
        var edu = (ctx.data.specs || []).filter(function (s) { return /education|certificat/i.test(s.label); });
        var qual = (ctx.data.titleBlocks || []).filter(function (b) { return /qualification/i.test(b.label); })[0];
        if (!edu.length && !qual) return REFUSAL;
        return (qual ? "He's studying " + qual.title + " — " + qual.meta + ". " : "")
          + edu.map(function (s) { return s.label + ": " + s.value + "."; }).join(" ");
      }

      if (name === "profile") {
        var kicker = profile.kicker || [];
        var where = kicker.length > 1
          ? " He's a " + kicker[0].toLowerCase() + " based in " + kicker.slice(1).join(", ") + "."
          : "";
        return profile.summary + where;
      }

      var pool = name === "experience" ? ctx.records.experience
        : name === "writing" ? ctx.records.notes
          : name === "skills" ? ctx.records.skills
            : ctx.records.projects;

      var hits = rank(pool, tokens);

      /* Nothing distinctive left in the question — it was a plain "show me
         your X", so show the whole X. */
      if (!hits.length && !tokens.length) {
        hits = pool.map(function (r, i) { return { record: r, score: 0 }; });
      }
      /* The intent pointed at the wrong shelf — "why two pipelines?" reads as
         a project question but is answered by a note. Widen the search, but
         only accept a title-strength match so this can't become a back door
         for off-topic questions. */
      if (!hits.length) return acrossEverything(tokens, raw, 3) || REFUSAL;

      var text = name === "experience" ? answerExperience(hits)
        : name === "writing" ? answerNotes(hits)
          : name === "skills" ? answerSkills(hits)
            : answerProjects(hits, raw);

      return text || REFUSAL;
    }

    return { answer: answer, REFUSAL: REFUSAL };
  }

  window.PortfolioAsk = { create: create, REFUSAL: REFUSAL };
})(window);
