# Turning the assistant on

Nothing in this directory is live. The site ships with the assistant answering
**offline in the browser** — no key, no backend, no cost. This is the path to
swap in a real LLM whenever you want one, and the path back if you change your
mind.

## The contract

The page POSTs `{"q": "the question"}` and expects `{"ok": true, "text": "the answer"}`.
Anything else — an error, a timeout, a rate limit, `{"ok": false}` — makes the
page fall back to the offline engine and relabel its caption. A visitor never
sees a broken section.

That contract is provider-agnostic. `worker/ask.js` uses the Claude API, but
only inside one function (`generate`). Everything else is transport, validation
and budget, none of which cares who generates the text.

## Checklist

1. **Set a spend limit first.** In the Anthropic Console, create a dedicated
   *workspace*, issue an API key scoped to it, and set a monthly spend limit
   (\$5–10 is plenty). This is the only ceiling that survives a bug in your own
   counters — do it before anything else.

2. **Build the dossier.**
   ```
   node tools/build-dossier.mjs
   ```
   Reads `assets/portfolio-data.js`, writes `worker/dossier.generated.js`.
   Re-run it after every content change — it is what keeps the assistant's
   knowledge and the page identical. Commit the generated file.

3. **Create the KV namespace** (daily counter + kill switch) and uncomment the
   `kv_namespaces` block in `wrangler.toml`:
   ```
   npx wrangler kv namespace create ASK_KV
   ```

4. **Set the secret and deploy:**
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler deploy
   ```

5. **Point the page at it.** Put the deployed URL in `assets/ask-config.js`:
   ```js
   window.ASK_ENDPOINT = "https://portfolio-ask.<your-subdomain>.workers.dev";
   ```
   Add your site's origin to `ALLOWED_ORIGINS` in `ask.js` if it isn't already.

To switch it off in seconds without a deploy, set the KV key
`ASSISTANT_ENABLED` to `false`. To switch it off permanently, blank
`ASK_ENDPOINT` — the page returns to offline answering exactly as it ships.

## What it costs

The dossier is currently ~3,600 tokens (case studies are the bulk of it), and
answers are capped at 300. On `claude-haiku-4-5` that's roughly **\$0.004 per
question** — about **\$2/month at 500 questions**, **\$20 at 5,000**.

Prompt caching isn't worth wiring up yet: Haiku's minimum cacheable prefix is
4,096 tokens and the dossier is just under it. The system prompt is built
byte-stable anyway, so caching stays available if the dossier grows past that.
Never pre-warm a cache on a site this quiet — the writes cost more than the
traffic.

## Why Cloudflare

It's the only mainstream option with a **built-in rate-limiting primitive**, it
has effectively no cold start (which matters on a widget someone is waiting on),
and it lets the site stay on GitHub Pages. The cost of that last point is that
the call is cross-origin, which is why `ask.js` handles preflight against an
exact-origin allowlist.

Vercel or Netlify Functions work fine too if you'd rather move the whole site —
you'd write your own rate limiting, and the endpoint becomes same-origin
`/api/ask` with no CORS.

## Honest limits

- Per-IP rate limiting is bypassable and the Cloudflare binding is per-colo and
  best-effort. **The daily cap and the provider-side spend limit are the only
  real ceilings.** Don't let the rate limiter give you false confidence.
- The injection regex is a token-saver, not a security boundary. The structural
  defence is that the dossier lives in the system prompt and visitor text never
  does.
- `DAILY_CALL_CAP` is 300, which is ~\$36/month of Haiku at worst. Set your
  provider spend limit *below* that so the un-bypassable control trips first.
