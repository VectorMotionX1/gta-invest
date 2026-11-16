# HANDOFF.md — latest state, updated at the end of every session

## Done (this session, 2026-11-15 evening, agent: Muse)
- Andy decided: unify all lead capture on MailerLite + Supabase (one
  shared `leads` table), Buttondown retired. Andy confirmed the
  architecture the same night: this static site reuses the
  property-playbooks `/api/signup` endpoint (no browser-to-Supabase).
- Commit `e956f35` (code): subscribe form now POSTs JSON to
  `https://property-playbooks.vercel.app/api/signup` via fetch in
  app.js (`subscribePayload`, locked `product=gta-invest`,
  `source=gta-invest-subscribe`), with honest per-error messages and
  no fake success; Buttondown form action removed; `<noscript>` note
  added; `test-calc.js` payload-contract tests added;
  `validate-data.js` guards rewritten (no Buttondown, endpoint +
  locked values + README MailerLite/Supabase checks); `privacy.html`
  rewritten for the unified list.
  Verification: `npm test` passed (all calculator checks + subscribe
  payload check + all data checks).
- Commit `e8d6dbb` (docs): new `docs/leads.md` — the full cross-repo
  contract (API, CORS, table, groups, sync, Buttondown migration,
  secrets, verification checklist, file map); AGENTS.md email section
  + subscribe-contract rule; DECISIONS.md unification + architecture +
  proposed-group entries (old UNDECIDED entry marked superseded);
  TASKS.md decision/rewrite DONE, CORS/E2E/MailerLite/Buttondown/sync
  TODOs; README funnel section rewritten.
  Verification: `npm test` passed (README guards included).
- Cross-repo, property-playbooks (local only, NOT pushed): commit
  `5b2b0b6` adds CORS to `/api/signup` (OPTIONS 204 + headers on every
  response, origin `https://vectormotionx1.github.io` only);
  commit `18e3c15` documents the decision + proposed group + sync
  extension there. Verification: `cd web && npm run build` passed.
- Nothing was pushed in either repo this session (see Blocked). The
  LIVE gta-invest site still shows the old Buttondown form until both
  deploys land. Do not claim the new flow is live.

## Next (single next step)
1. Push in order, verifying each deploy before the next: (a) retry
   `git fetch` in property-playbooks, push the CORS change, confirm
   the Vercel deployment is READY; (b) push gta-invest with the push
   method Andy supplies, confirm the Pages deploy passes; (c) run the
   end-to-end checklist in `docs/leads.md` §9 (live-page test row,
   Supabase confirmation, DELETE the test row, buyer-signup regression).

## Blocked (on Andy, not on an agent)
- Push method for gta-invest: no token is stored and no deploy key
  exists for this repo. Andy supplies a transient token per session or
  approves a fresh deploy-key setup. Never write a token into a file,
  URL, commit message, or stored memory.
- property-playbooks fetch: `git fetch origin` failed twice on
  2026-11-15 night (SSH via egress proxy: connection reset by
  198.19.0.1:3128). Do NOT push there until a fetch succeeds and the
  tree is confirmed current — local base 410ed3f may be stale.
- MailerLite setup: account + gta-invest group (proposed name
  gta-invest-subscribers, locks on creation) + case-update sending.
  Until then new subscribers are stored only, no emails sent. Do not
  import gta-invest rows into buyer-toolkit-waitlist.
- Buttondown list check: Andy to report whether the xiong list held
  any subscribers; migration procedure in docs/leads.md §7. Do not
  assume it was empty; do not close the account until checked.
- November 2026 cases: needs a verifiable HouseSigma/PROPTX source. Do
  not invent cases. See TASKS.md.
- YouTube channel URL: no verified URL found; page shows name + handle
  as text only. See TASKS.md.
- Analytics ID: Plausible or GA, Andy to supply. See TASKS.md.
- Gumroad checkout: product does not exist yet. This site links to the
  property-playbooks waitlist only. See DECISIONS.md.

## Decisions (also in DECISIONS.md)
- Leads unified on MailerLite + Supabase; Buttondown retired.
- Subscribe via shared /api/signup + CORS for the Pages origin only;
  locked product/source values; direct browser-to-Supabase rejected.
- MailerLite groups stay segmented (proposed gta-invest group, not
  locked); no sending without Andy's approval.
- Canadian compounding only; no invented numbers; no checkout claim;
  no analytics / YouTube link until Andy supplies the exact value.

## Do NOT do
- Do not invent November deals, rents, or CDR factors.
- Do not add a guessed YouTube URL, analytics ID, or checkout link.
- Do not weaken validate-data.js checks to make a bad change pass.
- Do not put a Supabase URL/key or MailerLite API key in this repo,
  in browser code, or in chat. Do not call the MailerLite API from
  the browser.
- Do not mix gta-invest subscribers into buyer-toolkit-waitlist.
- Do not commit tokens, passwords, or customer emails. Ever.
- Do not push either repo on a stale or unverified tree.
