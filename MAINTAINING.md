# Maintaining this portfolio

Almost everything you'll ever change lives in one file:
**`assets/portfolio-data.js`**. Edit it, commit, push. GitHub Pages does the
rest. There is no build step, no dependencies, and nothing to install.

```
index.html          the portfolio page
case.html           case studies      → case.html?p=<slug>
blog.html           writing           → blog.html?note=<n>
index-legacy.html   your previous dark-theme portfolio, kept for reference

assets/
  portfolio-data.js   ← ALL CONTENT LIVES HERE
  site.css            the "Training Run" design: tokens, layout, phone + tablet
  fonts/              self-hosted IBM Plex Sans/Mono + Instrument Serif
  theme.js            light/dark toggle, remembered per visitor
  art.js              project drawings and project icons
  logos/              square company marks shown beside each post
  dom.js              tiny element builder shared by every page
  portfolio.js        draws index.html
  case.js             draws case.html
  blog.js             draws blog.html
  ask.js              the offline assistant
  ask-remote.js       optional bridge to a real LLM
  ask-config.js       the switch — empty means offline

worker/             optional LLM backend, inert until you deploy it
tools/              the dossier build step, only needed with the backend
```

## Add a project

Copy any block inside `projects` in `assets/portfolio-data.js` and change the
text. Numbering (`P-01`, `P-02`…) is automatic — don't hand-write it.

```js
{
  title: "Thing I built",
  icon: "cube",
  stack: "Python · Postgres · Docker",
  detail: "One paragraph. What it does and why it was hard.",
  metric: "The number that matters",
  link: "https://github.com/…",
  linkLabel: "GitHub"
}
```

`icon` is one of `excavator`, `clock`, `cube`, `moon`, `pin`, `sheet`, `car`.
Leave it out and the row simply has no icon. To add a new one, add a 24 × 24
line drawing to `ICONS` in `assets/art.js`.

## Promote a project to Selected work

Move it into `heroProjects` and give it `kicker`, `paras` (an array of
paragraphs), `tags`, and `metrics`. The first metric is set in the accent
colour.

`art` picks the drawing shown beside it and at the top of its case study:
`segments`, `passes` or `site`. A new project needs its own drawing in
`FIGURES` in `assets/art.js`; until then, leave `art` out and it shows its
numbers alone. Three is the right number of featured
projects; a fourth dilutes the other three.

## Add a case study

Give a `heroProjects` entry a `slug` and a `caseStudy` block. The "Read the
case study" button appears on its own, and the page is live at
`case.html?p=<slug>`. **A project without a `caseStudy` simply shows no
button** — you can add depth one project at a time.

```js
slug: "my-project",
caseStudy: {
  role: "What you personally did",
  summary: "One line, the tension the project resolved.",
  sections: [
    { label: "Context",     paras: ["…", "…"] },
    { label: "Constraints", bullets: ["…", "…"] },
    { label: "Approach",    paras: ["…"] },
    { label: "Outcome",     paras: ["…"] }
  ]
}
```

Sections render in the order you write them and are numbered automatically.
`paras` and `bullets` are both optional — use either or both.

Keep the shape **Context → Constraints → Approach → Outcome**. That structure
is doing real work: constraints are what make a decision look considered rather
than arbitrary, and it's the part most portfolios leave out.

## Add a writing note

Copy a block inside `notes`. `body` is an array of paragraphs — one string per
paragraph. The assistant reads `body`, so a note makes the assistant smarter
about how you think, not just what you built.

## Add a job — and a promotion

A job is a block in `experience`, newest first:

```js
{
  org: "Company",
  period: "2025.06 — 2025.07",
  place: "On-site · Bengaluru",
  role: "What you were called",
  bullets: ["…", "…"],
  tags: ["Python", "Docker"]
}
```

**Several posts at one company** — a promotion, or an internship you converted
from — go in a `roles` array on a single block rather than as two blocks. The
company is named once and the posts hang off a shared spine, so the section
reads as one continuous stint with a step in it. Put `bullets` and `tags` on
each post, and keep the posts newest first; the first one gets the accent
marker as the current post.

```js
{
  org: "Company",
  period: "2026.01 — present",   // the whole stint
  duration: "9 mos",             // optional
  place: "Bengaluru, India",
  roles: [
    {
      role: "AI Engineer", type: "Full-time",
      period: "2026.08 — present", duration: "2 mos", place: "On-site",
      bullets: ["…"], tags: ["FastAPI"]
    },
    {
      role: "AI Engineer", type: "Internship",
      period: "2026.01 — 2026.07", duration: "7 mos", place: "Remote",
      bullets: ["…"], tags: ["React Native"]
    }
  ]
}
```

Give each block a `logo` (a square PNG in `assets/logos/`, drawn for a white
background) and it appears beside every post at that company. `education`
takes one too.

Only group posts that were actually back to back. Two separate stints at the
same company, years apart, are two blocks — grouping them would claim a
continuity that didn't happen.

## The hero, the strip and the loss curve

- `profile.headlineAccent` is the closing words of the headline, set in
  italic accent. `contact.headingAccent` does the same for the contact
  heading. Both must match the end of their heading exactly, or are ignored.
- `stats` is the four-figure strip under the hero.
- The status pill above the headline shows whichever post has "present" in
  its period.
- `education` is checkpoint 00 in Experience and the first dot on the loss
  curve. Every other dot is a post from `experience`, placed by its start
  date — add a job and the curve gains a checkpoint on its own.

The page draws every post as its own checkpoint (`ckpt-04 · latest` down to
`ckpt-00 · init`), including posts grouped under one company's `roles`.

## Update the résumé

Replace `Himanshu-Kumar-Jha-Resume.pdf` at the repo root, keeping the filename.
Both buttons point at it via `profile.resumeUrl`.

## Turn on contact-form delivery

**Do this before you share the site.** With `contact.formKey` blank, the form
can only hand the message to the visitor's mail app — and for anyone who reads
mail in a browser tab with no mail app configured, that silently does nothing.
They see "opening your mail app", you never get the enquiry.

1. Go to [web3forms.com](https://web3forms.com), enter your email, and they
   send you an access key. Free, no account.
2. Paste it into `contact.formKey` in `assets/portfolio-data.js`.

That's it. The form then POSTs directly and mail lands in your inbox regardless
of the visitor's setup. If the service is ever down, the form says so and
offers the mail-app route as a fallback rather than losing what they wrote.

The key is not a secret — it only permits sending mail to *you*, and it has to
ship in the page to work.

## Keep availability current

`contact.availability` renders as the tag beside the contact heading. It is the
first thing someone deciding whether to write to you reads — a stale one costs
more than no tag at all.

## The assistant

It answers **offline, in the browser**, from `portfolio-data.js` alone. No key,
no backend, no cost, and it works on any static host. New content is indexed
automatically the moment you add it.

It refuses anything it can't answer from the page, with a fixed sentence, by
design. If it refuses something it should have answered, the usual cause is
vocabulary: the question used a word the data doesn't contain. Either add the
word to the relevant entry, or add a synonym to `EXPANSIONS` near the top of
`assets/ask.js`.

To swap in a real LLM later, see [`worker/README.md`](worker/README.md). One
config line switches it over, and the offline engine stays as the fallback.

## Analytics

Off by default. `index.html` has a commented-out Cloudflare Web Analytics tag
near the bottom — no cookies, no consent banner. Paste a token to switch it on,
or delete the block to be rid of it.

## Checking your work locally

Double-clicking `index.html` works — every page, including the `?p=` and
`?note=` ones, runs fine straight off the filesystem, because nothing here
fetches anything.

If you'd rather serve it the way GitHub Pages will:

```
python3 -m http.server 8777
```
Then open <http://localhost:8777/>.

## Design source

The visual language is the **Training Run** design ("Portfolio — Training
Run", desktop and mobile boards). `assets/site.css` carries its tokens at the
top — retune the `:root` block (and its dark twin) to reskin the whole site,
and don't hard-code a colour or font that a token already covers.

Light or dark follows the visitor's system until they press the toggle; the
choice is then remembered in their browser.
