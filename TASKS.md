# TASKS.md — the only task board

Statuses: TODO / IN_PROGRESS / DONE / BLOCKED.
Claim rule (AGENTS.md §2): commit a TASKS.md change marking IN_PROGRESS
(agent + date + branch) before coding. One task, one agent, one branch.

## v1 — site launch (2026-11-15)
- [x] DONE — Static site: loss table, split + flip calculators, CDR converter, Buttondown subscribe, GitHub Pages workflow — commits 331ee31..04cd748 — verification: site loads at https://vectormotionx1.github.io/gta-invest/, `node test-calc.js` passed at the time

## Accuracy + config + funnel fixes (2026-11-15, Andy: fix all three batches)
- [x] DONE — Canadian semi-annual compounding for monthlyPayment; holding extras (condo fee, vacancy, maintenance) + net cashflow rows; CMHC warning under 20% down; flip commission + holding months + annualised return; CDR cleanup (SPCX removed from selector, as-of + CIBC link); preset notes (Burlington no-split, Markham asking price) — verification: `npm test` passed (see HANDOFF.md for commit hashes)
- [x] DONE — Tests + validation: test-calc.js expectations recomputed for the Canadian formula, new coverage for condo/net/flip/CDR; validate-data.js cross-checks data.json vs app.js vs index.html vs README — verification: `npm test` passed
- [x] DONE — README + config: README rewritten for the live setup (stale push block removed); package.json + .gitignore; CI workflow; Pages workflow runs tests before deploy; favicon, robots.txt, sitemap.xml, privacy.html, SEO meta (canonical, Open Graph) — verification: `npm test` passed, validate-data.js README guards passed
- [x] DONE — Multi-agent docs: AGENTS.md, TASKS.md, HANDOFF.md, DECISIONS.md, CLAUDE.md (repo-as-source-of-truth, same pattern as property-playbooks) — verification: docs committed, no code change
- [x] DONE — Lead magnet + funnel links: 3 printable checklists in pack/ (buying, split-rental legality, flip), print stylesheet, links to property-playbooks free checklist + toolkit waitlist, email + privacy links, no invented checkout link — verification: `npm test` passed, links are to verified URLs only
- [x] DONE — Data-honesty copy: weekly-update promise removed, November-data honesty note added (no invented cases), data_as_of stays 2026-10, CDR as-of + CIBC link — verification: validate-data.js honesty guards passed

## TODO — blocked on Andy or on real data (do not invent)
- [ ] TODO — November 2026 loss / rental cases (BLOCKED on real data: needs a verifiable HouseSigma/PROPTX source Andy supplies or approves; do NOT invent cases, prices, or dates. When data arrives: update data.json, index.html table + cards, app.js presets, test expectations, data_as_of, sitemap lastmod, then `npm test`.)
- [ ] TODO — YouTube channel link (BLOCKED on Andy: no verified channel URL found in repo or search; page shows channel name + @xiongjibro as text only. When Andy supplies the exact URL: add it to header/footer/pack pages + README.)
- [ ] TODO — Analytics (BLOCKED on Andy: Plausible or GA ID needed. Add the snippet to index.html head only after Andy supplies the ID; update privacy.html at the same time. Do not invent an ID.)
- [ ] TODO — Email list decision: Buttondown (live, xiong) vs MailerLite + Supabase (property-playbooks plan) (BLOCKED on Andy decision. Do not migrate lists without explicit approval. See DECISIONS.md.)
- [ ] TODO — Gumroad checkout link for the $39 toolkit (BLOCKED on Andy: product does not exist yet in Gumroad. This site must keep linking to the property-playbooks waitlist only and must not claim checkout is live. See property-playbooks DECISIONS.md.)
- [ ] TODO — CDR factor refresh process (TODO: decide cadence + owner for checking CIBC factors; factors move daily and are currently October 2026 approximations. Do not auto-scrape CIBC without checking its terms.)
