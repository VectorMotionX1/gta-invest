# DECISIONS.md — locked decisions

Record a decision here when Andy makes it, with date + reason. A new agent
must follow these, not re-litigate them, unless Andy overturns them in a
new entry below.

- 2026-11-15 — Repo purpose: use VectorMotionX1/gta-invest to develop
  money-making tools related to the 北美雄吉 (xiongjibro) channel. This repo
  is the free tools site; paid toolkits live in property-playbooks.
- 2026-11-15 — Stack: pure static site, no build step, no dependencies,
  deployed to GitHub Pages via Actions. Keep it that way unless Andy
  approves a framework migration.
- 2026-11-15 — Commit author: every commit must be
  `VectorMotionX1 <VectorMotionX1@users.noreply.github.com>`.
- 2026-11-15 — Mortgage math: Canadian semi-annual compounding for all
  monthly-payment calculations. The original US-style annual/12 formula
  overstated payments by about $17–$31/month on the three presets and was
  replaced on 2026-11-15. Do not revert without recording a new decision.
- 2026-11-15 — No invented content: no fake deals, prices, rents, CDR
  factors, sales numbers, testimonials, or launch dates. Data cutoff stays
  2026-10 until verifiable November data arrives. The weekly-update promise
  was removed the same day because there is no update pipeline behind it.
- 2026-11-15 — CDR: only tickers with a real CDR appear in the selector
  (GOOG, NVDA, ISRG). SPCX has no CDR and stays only as a reference row in
  data.json. Factors are October 2026 approximations; CIBC is the authority.
- 2026-11-15 — Subscribe is live via Buttondown (username xiong), plain HTML
  POST, double opt-in. Whether to unify with the property-playbooks
  MailerLite + Supabase plan is UNDECIDED and needs Andy's decision. Do not
  migrate lists without explicit approval. (SUPERSEDED the same evening —
  see the unification entries at the end of this file.)
- 2026-11-15 — No checkout on this site. The $39 buyer toolkit (CAD 39 launch,
  CAD 49 after 20 sales, Gumroad v1) lives on property-playbooks and its
  Gumroad product does not exist yet. This site links to the waitlist only.
- 2026-11-15 — No analytics tracker until Andy supplies an ID. No YouTube
  channel hyperlink until Andy supplies the exact URL. Do not guess either.
- 2026-11-15 — Multi-agent rule: repo is source of truth. Muse, Codex, and
  Claude rotate by reading AGENTS.md + TASKS.md + HANDOFF.md and committing +
  updating handoff at session end. No agent-specific instructions override
  AGENTS.md.
- 2026-11-15 — Human gates: no email to a full list, no price change, no
  checkout claim, and no list migration without Andy's explicit approval.
- 2026-11-15 (evening) — Leads unified: all lead capture goes to
  MailerLite + Supabase, one shared Supabase `leads` table as the source
  of truth (Andy decision). Buttondown (xiong) is retired; the form no
  longer posts there. This supersedes the Buttondown entry above. Whether
  the Buttondown list held any subscribers is UNVERIFIED — check the
  Buttondown dashboard before closing the account; see docs/leads.md for
  the migration procedure. Do not assume the list was empty.
- 2026-11-15 (evening) — Subscribe architecture: this static site POSTs
  JSON to the property-playbooks signup API
  (https://property-playbooks.vercel.app/api/signup), which holds the
  Supabase credentials server-side (Andy confirmed this architecture the
  same night). Direct browser-to-Supabase was considered and rejected: it
  would put Supabase URL/key handling into a public static repo. The API
  must allow CORS from https://vectormotionx1.github.io and no other
  origin for this purpose. Locked values: product=gta-invest,
  source=gta-invest-subscribe. Changing them requires a new decision
  recorded in BOTH repos.
- 2026-11-15 (evening) — MailerLite segmentation (PROPOSED, not locked): a
  separate group for gta-invest subscribers (proposed name
  gta-invest-subscribers), never mixed into buyer-toolkit-waitlist, whose
  5-email sales sequence must not go to case-update subscribers. The group
  name locks only when Andy creates the group; record the exact name in
  docs/leads.md then. MailerLite account, group, and automation are still
  BLOCKED on Andy (see TASKS.md).
