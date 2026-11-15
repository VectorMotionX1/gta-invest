# HANDOFF.md — latest state, updated at the end of every session

## Done (this session, 2026-11-15, agent: Muse)
- Reviewed the live static site (7 commits on main, Pages live) against
  Andy's direction to develop xiongjibro money-making tools in this repo.
  Found three batches of fixes; Andy approved fixing all of them.
- Commit `d97deb7` (code): Canadian semi-annual compounding in
  `monthlyPayment`; holding extras (condo fee, vacancy, maintenance) with
  net cashflow rows; CMHC warning under 20% down; flip commission +
  holding months + annualised return; CDR cleanup (SPCX out of the
  selector); preset notes; `test-calc.js` expectations recomputed;
  `validate-data.js` added; `data.json` meta updated (compounding,
  last_reviewed, no-invented-data note); `package.json` added.
  Verification: `npm test` passed.
- Commit `069e596` (site/docs/config): `index.html` copy + new calculator
  inputs/outputs + funnel links + SEO meta; print stylesheet; README
  rewritten for the live setup; CI workflow + Pages test gate; favicon,
  robots.txt, sitemap.xml, privacy.html; 3 printable checklists in `pack/`;
  AGENTS.md, TASKS.md, DECISIONS.md, CLAUDE.md.
  Verification: `npm test` passed; ID/link/secret-string checks passed.
- This handoff file, committed separately after the two content commits
  above so their hashes are exact (see `git log --oneline -3`).

## Next (single next step)
1. Push to main and confirm the Pages deploy passes (tests run inside the
   Pages workflow). Then open the live site and spot-check: Scarborough
   preset shows payment $4,015 / holding $4,464, flip preset shows net
   $187,700 at 5% commission, CDR selector has 3 tickers, pack links open.

## Blocked (on Andy, not on an agent)
- November 2026 cases: needs a verifiable HouseSigma/PROPTX source. Do not
  invent cases. See TASKS.md.
- YouTube channel URL: no verified URL found; page shows name + handle as
  text only. See TASKS.md.
- Analytics ID: Plausible or GA, Andy to supply. See TASKS.md.
- Email list decision: Buttondown (live) vs MailerLite + Supabase. See
  DECISIONS.md. Do not migrate lists without approval.
- Gumroad checkout: product does not exist yet. This site links to the
  property-playbooks waitlist only. See DECISIONS.md.

## Decisions (also in DECISIONS.md)
- Canadian compounding only; no invented numbers; no checkout claim;
  no analytics / YouTube link until Andy supplies the exact value.

## Do NOT do
- Do not invent November deals, rents, or CDR factors.
- Do not add a guessed YouTube URL, analytics ID, or checkout link.
- Do not weaken validate-data.js checks to make a bad change pass.
- Do not commit tokens, passwords, or customer emails. Ever.
