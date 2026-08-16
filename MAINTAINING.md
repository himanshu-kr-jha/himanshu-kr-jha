# Maintaining this portfolio

Almost everything you'll ever change lives in one file:
**`assets/portfolio-data.js`**. Edit it, commit, push. GitHub Pages does the
rest. There is no build step, no dependencies, and nothing to install.

```
index.html          the portfolio sheet
case.html           case studies      → case.html?p=<slug>
blog.html           writing           → blog.html?note=<n>
index-legacy.html   your previous dark-theme portfolio, kept for reference

assets/
  portfolio-data.js   ← ALL CONTENT LIVES HERE
  blueprint.css       the Industry design system + page styles
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
  stack: "Python · Postgres · Docker",
  detail: "One paragraph. What it does and why it was hard.",
  metric: "The number that matters",
  link: "https://github.com/…",
  linkLabel: "GitHub"
}
```

## Promote a project to Selected work

Move it into `heroProjects` and give it `kicker`, `paras` (an array of
paragraphs), `tags`, and `metrics`. Three is the right number of featured
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

The visual language came from the **Industry** design system in your Claude
Design project ("Portfolio creation project"). `assets/blueprint.css` carries
its tokens verbatim at the top — retune the `:root` block there to reskin the
whole site, and don't hard-code a colour or font that a token already covers.
