/* ─────────────────────────────────────────────────────────────────────────
   THE ASSISTANT SWITCH.

   Empty string  → the assistant answers offline, in the browser, from
                   portfolio-data.js. No backend, no API key, no cost.
                   This is the shipped default.

   A URL         → the page POSTs {"q": "<question>"} to that endpoint and
                   expects {"ok": true, "text": "<answer>"} back. Anything
                   else — an error, a timeout, a rate limit, a CORS failure —
                   silently falls back to the offline engine, so the section
                   never breaks.

   The contract is provider-agnostic: Claude, OpenAI, or a model you host
   yourself. See worker/README.md for a reference implementation and the
   turn-it-on checklist.
   ───────────────────────────────────────────────────────────────────────── */
window.ASK_ENDPOINT = "";
