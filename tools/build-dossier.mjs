/* ─────────────────────────────────────────────────────────────────────────
   Generates worker/dossier.generated.js from assets/portfolio-data.js.

   Run:  node tools/build-dossier.mjs

   Why this exists: the assistant's knowledge and the page's content must be
   the same thing. Editing assets/portfolio-data.js and re-running this is the
   whole update path — there is no second place to remember.

   The output is plain prose in a fixed order, not JSON. Three reasons:
   the Worker does no formatting at request time, the exact system prompt is
   reviewable in a git diff, and byte-stability keeps prompt caching available
   if the dossier ever grows past a provider's minimum cacheable size.
   ───────────────────────────────────────────────────────────────────────── */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = resolve(ROOT, "assets/portfolio-data.js");
const ASK_FILE = resolve(ROOT, "assets/ask.js");
const OUT_FILE = resolve(ROOT, "worker/dossier.generated.js");

/* portfolio-data.js is browser JS that assigns to `window`. Give it a window. */
function loadData() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(DATA_FILE, "utf8"), sandbox, { filename: DATA_FILE });
  const data = sandbox.window.PORTFOLIO_DATA;
  if (!data || !data.profile) throw new Error("portfolio-data.js did not set window.PORTFOLIO_DATA");
  return data;
}

/* The refusal sentence has exactly one home: the REFUSAL constant in ask.js.
   Scraping it here is what stops the browser and the server from drifting. */
function loadRefusal() {
  const src = readFileSync(ASK_FILE, "utf8");
  const match = src.match(/var REFUSAL =\s*([\s\S]*?);\n/);
  if (!match) throw new Error("Could not find the REFUSAL constant in assets/ask.js");
  const value = vm.runInNewContext(match[1]);
  if (typeof value !== "string" || !value.trim()) throw new Error("REFUSAL did not evaluate to a string");
  return value;
}

function section(title, lines) {
  const body = lines.filter(Boolean);
  return body.length ? `## ${title}\n${body.join("\n")}` : "";
}

function buildDossier(data) {
  const p = data.profile || {};
  const out = [];

  out.push(section("Identity", [
    `Name: ${p.name}`,
    `Located: ${(p.kicker || []).join(" · ")}`,
    `Positioning: ${p.pitch || ""}`,
    `Summary: ${p.summary || ""}`,
    p.phone ? `Email: ${p.email} | Phone: ${p.phone}` : `Email: ${p.email}`,
    `LinkedIn: ${p.linkedin} | GitHub: ${p.github}`
  ]));

  out.push(section("At a glance", [
    ...(data.titleBlocks || []).map((b) => `${b.label}: ${b.title} (${b.meta})`),
    data.publication ? `Publication: ${data.publication.title} — ${data.publication.meta}` : ""
  ]));

  (data.heroProjects || []).forEach((h) => {
    const lines = [
      `Context: ${h.kicker}`,
      ...(h.paras || []),
      `Tech: ${(h.tags || []).join(", ")}`,
      ...(h.metrics || []).map((m) => `Metric: ${m.value} — ${m.label}`),
      h.note ? `Note: ${h.note}` : "",
      h.linkHref ? `Link: ${h.linkHref}` : ""
    ];
    const study = h.caseStudy;
    if (study) {
      lines.push(`Role: ${study.role || ""}`);
      lines.push(`In one line: ${study.summary || ""}`);
      (study.sections || []).forEach((s) => {
        lines.push(`${s.label}: ${[...(s.paras || []), ...(s.bullets || [])].join(" ")}`);
      });
      if (h.slug) lines.push(`Full case study on the site: case.html?p=${h.slug}`);
    }
    out.push(section(`Featured project — ${h.title}`, lines));
  });

  (data.projects || []).forEach((pr) => {
    out.push(section(`Project — ${pr.title}`, [
      `Stack: ${pr.stack}`, pr.detail, `Metric: ${pr.metric}`, `Link: ${pr.link}`
    ]));
  });

  /* An entry with `roles` is several posts at one company. Each post becomes
     its own section so the assistant can answer about one of them, and each
     carries the company span so it can also say they were held back to back. */
  (data.experience || []).forEach((e) => {
    const posts = (e.roles || []).length ? e.roles : [e];
    posts.forEach((post) => {
      const when = [post.period, post.duration, post.place || e.place].filter(Boolean).join(" · ");
      out.push(section(`Experience — ${post.role}${post.type ? `, ${post.type}` : ""} at ${e.org}`, [
        `When: ${when}`,
        (e.roles || []).length
          ? `Part of a continuous stint at ${e.org}: ${e.period}${e.duration ? ` · ${e.duration}` : ""} · ${e.place}`
          : "",
        ...(post.bullets || []).map((b) => `- ${b}`),
        (post.tags || []).length ? `Tech: ${post.tags.join(", ")}` : ""
      ]));
    });
  });

  out.push(section("Skills", (data.specs || []).map((s) => `${s.label}: ${s.value}`)));

  (data.notes || []).forEach((n) => {
    out.push(section(`Writing — ${n.title} (${n.status})`, [
      `Summary: ${n.summary}`,
      (n.tags || []).length ? `Topics: ${n.tags.join(", ")}` : "",
      ...(n.body || [])
    ]));
  });

  out.push(section("Availability and contact", [
    (data.contact || {}).availability || "",
    (data.contact || {}).body || "",
    `Reach him at ${p.email}.`
  ]));

  return out.filter(Boolean).join("\n\n");
}

const data = loadData();
const dossier = buildDossier(data);
const refusal = loadRefusal();
const hash = createHash("sha256").update(dossier).digest("hex").slice(0, 12);

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, `/* GENERATED by tools/build-dossier.mjs — do not edit.
   Regenerate after every change to assets/portfolio-data.js. */
export const DOSSIER = ${JSON.stringify(dossier)};
export const REFUSAL = ${JSON.stringify(refusal)};
export const HASH = ${JSON.stringify(hash)};
`);

const words = dossier.split(/\s+/).filter(Boolean).length;
console.log(`worker/dossier.generated.js written — ${words} words, ~${Math.round(words * 1.35)} tokens, hash ${hash}`);
