# AGENTS.md — canonical instructions for every agent working in this repo

This file is the single source of truth for how to work here. It applies equally to
Muse, Codex, Claude, and any future agent. If another file disagrees with this one,
this file wins, unless DECISIONS.md records a newer locked decision.

## 0. Start here, every session, no exceptions
1. `git pull` (or `git fetch` + check status) — never start coding on a stale tree.
2. Read, in order: `AGENTS.md`, `TASKS.md`, `HANDOFF.md`, `DECISIONS.md`.
3. Read `git log --oneline -10` and `git status --short`.
4. Only then claim a task. Do not redo a DONE task, do not re-ask a decision
   already recorded in DECISIONS.md, and do not rely on chat history, a previous
   agent's memory, or any tool that is not in this repo. The repo must be enough
   for a cold agent to continue.

This is how token exhaustion is handled: when one agent runs out, the next agent
(Codex, Claude, Muse, in any order) starts cold from this repo and continues.
No agent is special. No step lives only in one agent's head.

## 1. What this repo is
A free Chinese-language GTA real-estate tools site for the 北美雄吉 channel
(see README.md): loss-deals table, split-rental and flip calculators, CDR
converter, printable checklists, email subscribe. It is the free top of the
funnel; the paid buyer toolkit lives in a separate repo and site
(property-playbooks). This repo sells nothing directly and must never claim
checkout is live.

- Stack: pure static site, no build step, no dependencies. `index.html` +
  `styles.css` + `app.js` + `data.json`, deployed to GitHub Pages.
- Email: unified leads via the property-playbooks signup API — the form in
  index.html POSTs JSON to https://property-playbooks.vercel.app/api/signup
  (fetch in app.js), which writes the shared Supabase `leads` table;
  MailerLite is the sender only. The full contract lives in docs/leads.md:
  locked product/source values, the CORS origin, group names, and the sync
  spec. Buttondown is retired (2026-11-15); never reintroduce it. Never put
  a Supabase URL/key or a MailerLite API key in this repo or in browser
  code, never call the MailerLite API from the browser, and never mix
  gta-invest subscribers into the buyer-toolkit-waitlist group.

## 2. Task board is TASKS.md, not chat
- TASKS.md is the only task board. Statuses: TODO / IN_PROGRESS / DONE / BLOCKED.
- Claim a task before coding it: commit a TASKS.md change marking it
  IN_PROGRESS with your agent name, date, and branch. One task, one agent, one branch.
- Branch naming: `<agent>/<task-slug>`, e.g. `muse/canadian-compounding`.
  Main is always deployable. Single-agent urgent fixes may commit directly to
  main only when Andy explicitly asks for speed and the change is verified;
  record that in the commit message.
- Finish a task only when it is verified (section 5). Then mark it DONE in
  TASKS.md with the commit hash and the verification output.
- If you cannot finish, do not leave it silently half-done. Commit your work
  with a `[WIP]` prefix, mark the task IN_PROGRESS or BLOCKED in TASKS.md,
  and write the next step in HANDOFF.md (section 6).

## 3. File ownership (avoid merge conflicts)
- `index.html` / `styles.css` — page structure, copy, styling. One agent at a time.
- `app.js` / `test-calc.js` / `validate-data.js` — calculators and checks.
- `data.json` — structured case data. The single source of truth for numbers.
- `pack/` / `privacy.html` — checklists and privacy page.
- `.github/workflows/` — CI + Pages deploy. Changes here need a test push check.
- `AGENTS.md` / `TASKS.md` / `HANDOFF.md` / `DECISIONS.md` — collaboration docs.
If you must touch a file owned by an in-progress task, pull first and rebase,
do not overwrite the other agent's uncommitted work — there should be none,
because all work is committed (section 6).

## 4. Commit rules
- Before your first commit in a session, set:
  ```
  git config user.name "VectorMotionX1"
  git config user.email "VectorMotionX1@users.noreply.github.com"
  ```
  Every commit in this repo must use that author, whatever tool you are.
- Small commits, one logical change each. Commit message: what changed + why,
  in the language of the change (Chinese for product copy, English is fine for code).
- Never commit: API keys, passwords, tokens, customer emails, or any private
  user data. There is no `.env` in this repo; do not introduce one with secrets.
- Push method is Andy's choice per session (deploy key or transient token).
  Never write a token into a file, a URL, a commit message, or chat history
  beyond what Andy himself pasted. Never store a token for later sessions.

## 5. Verification before DONE
- `npm test` must pass: syntax check + `test-calc.js` + `validate-data.js`.
  The Pages workflow runs the same command and stops the deploy on failure.
- Mortgage math: Canadian semi-annual compounding only. See `monthlyPayment`
  in app.js. If you change the formula, update test expectations, the preset
  copy in index.html, and DECISIONS.md together.
- No invented content: no fake deals, prices, rents, CDR factors, sales
  numbers, testimonials, or launch dates. Every case number must trace to
  data.json with a verifiable source. If a number cannot be verified, do not
  publish it; record it as BLOCKED in TASKS.md instead.
- Data rule: data.json, app.js presets/factors, and index.html copy must agree.
  validate-data.js enforces this. Do not weaken a check to make a bad change pass.
- Subscribe contract: `npm test` checks the /api/signup endpoint and the
  locked product/source values. If the endpoint or values change, update
  app.js, test-calc.js, validate-data.js, docs/leads.md, and the
  property-playbooks docs together — the contract spans both repos.
- Product content: generic educational info only. No personalised mortgage or
  investment advice. Every page must carry the disclaimer.
- Never publish, email a full list, change a price, or claim checkout is live
  without Andy's explicit approval. Drafts are fine; sending is not.
- Never scrape listings or contact sellers/hosts for marketing.

## 6. Handoff protocol (the token-exhaustion rule)
At the end of every session, even an interrupted one, you must leave the repo
in a resumable state:
1. Commit everything. No uncommitted work, no untracked files that matter.
2. Update TASKS.md statuses with commit hashes and verification output.
3. Update HANDOFF.md: what is done, what is next (single next step), what is
   blocked and on whom, and what NOT to do.
4. If a decision was made, record it in DECISIONS.md with date + reason.
