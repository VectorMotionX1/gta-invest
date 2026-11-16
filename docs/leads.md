# docs/leads.md — unified lead capture contract (gta-invest + property-playbooks)

Read this before touching anything related to subscribe, email, Supabase, or
MailerLite. This file is the contract between the two repos. A cold agent
must be able to implement, verify, or extend the subscribe flow from this
file plus the two repos, with no chat history and no private memory.

Status as of 2026-11-15 (evening, America/Toronto): the gta-invest form
rewrite is committed locally (see HANDOFF.md). The property-playbooks CORS
change is committed locally in that repo. Neither has been pushed yet, so
the LIVE site still uses the old Buttondown form until both deploys land.
Do not claim the new flow is live until §9 is verified end to end.

## 1. Overview

All lead capture for the 北美雄吉 funnel goes to ONE place:

```
gta-invest form (GitHub Pages, this repo)
  --POST JSON--> property-playbooks /api/signup (Vercel, other repo)
  --insert--> Supabase `leads` table (dedicated property-playbooks project)
  --sync--> MailerLite groups (sender only)
```

- Supabase `leads` is the source of truth. MailerLite only sends mail.
- The gta-invest site is pure static and holds NO credentials. The signup
  API holds the Supabase credentials server-side (Vercel env vars).
- Buttondown (username xiong) is RETIRED as of 2026-11-15. The form no
  longer posts there. Whether its list held subscribers is UNVERIFIED —
  see §7 before closing the account.

## 2. Locked contract (do not change without a decision in BOTH repos)

| Item | Value |
|---|---|
| Signup API | `https://property-playbooks.vercel.app/api/signup` |
| Allowed CORS origin | `https://vectormotionx1.github.io` (exact, no other origin, never `*`) |
| gta-invest product | `gta-invest` |
| gta-invest source | `gta-invest-subscribe` |
| Buyer toolkit product (other repo) | `buyer-toolkit` |
| Buyer toolkit source (other repo) | `landing` |
| Supabase table | `public.leads` in the dedicated property-playbooks project |
| MailerLite group, buyer waitlist | `buyer-toolkit-waitlist` (locked 2026-10-28) |
| MailerLite group, gta-invest | PROPOSED name `gta-invest-subscribers` — locks only when Andy creates it |

Segmentation rule: every row is routed by its `product` value. gta-invest
rows must NEVER be imported or synced into `buyer-toolkit-waitlist`, whose
5-email sales sequence (price + checkout in email 5) must not go to
case-update subscribers. The two audiences stay in separate groups even
though they share one table and one MailerLite account.

## 3. Supabase `leads` table

Schema (canonical SQL: property-playbooks `docs/supabase-leads.sql` — run
once in the dedicated project; do not copy an old version):

- `id` bigint identity primary key
- `email` text, not null
- `name` text, nullable (gta-invest always sends null — the form has no name field)
- `product` text, not null, default `'buyer-toolkit'`
- `source` text, nullable
- `created_at` timestamptz, default now()

Rules that matter for this repo:

- Row Level Security is ON with an insert-only policy for `anon`. There is
  NO read policy for anonymous callers. Never add one, and never use the
  `service_role` key anywhere in this flow — Vercel must hold only the
  anon key.
- Post-2026-10-30 Supabase rule: new tables get NO Data API access until
  explicitly granted. The canonical SQL already includes the GRANTs
  (schema usage + table insert + sequence usage/select). If inserts start
  failing with permission denied, check the GRANTs before anything else.
- No table change was needed to add gta-invest: `product` is free text
  with no check constraint, so new product values just work. Do not add a
  constraint without a decision in both repos.
- Pause risk (seen before): the dedicated project auto-pauses after 7
  days without activity (it paused 2026-11-09 and was restored by Andy
  2026-11-10). While paused, the website still opens but ALL signups
  fail. Only Andy can restore it from the Supabase dashboard (one click,
  restorable within 90 days). A dashboard visit counts as activity.
- Test rows: the table has held test rows (2026-10-28, 2026-11-10). Any
  test address used for verification MUST be deleted in Table Editor by
  Andy afterwards, and must never be imported into MailerLite.

## 4. API contract (`POST /api/signup`)

Implementation: property-playbooks `web/app/api/signup/route.ts`.
The API does NOT validate `product`/`source` values — callers must send
the locked values from §2. Do not "fix" that without a decision in both
repos; the buyer form relies on the same endpoint.

Request (JSON):

```json
{ "email": "reader@example.com", "name": null, "product": "gta-invest", "source": "gta-invest-subscribe" }
```

Responses (all carry the CORS headers from §4.1):

| Status | Body | Meaning | Page message |
|---|---|---|---|
| 200 | `{"ok": true}` | Row inserted | 订阅成功，新案例核实后会发邮件通知你。 |
| 400 | `{"error": "invalid_email"}` | Missing/malformed email | 邮箱格式不对，请检查后重试。 |
| 502 | `{"error": "signup_failed"}` | Supabase insert failed | 订阅失败，请稍后再试。 |
| 503 | `{"error": "signup_not_configured"}` | `SUPABASE_URL`/`SUPABASE_ANON_KEY` missing in Vercel | 订阅尚未接通数据库，正在准备中，请稍后再试。 |
| Network/CORS failure | (no readable response) | Unreachable, or CORS not deployed | 网络错误，请检查网络后重试。 |

The page must NEVER show success unless the API returned 200. This is the
same honest-failure rule the buyer form follows.

### 4.1 CORS

- `OPTIONS` on `/api/signup` returns 204 with:
  `Access-Control-Allow-Origin: https://vectormotionx1.github.io`,
  `Access-Control-Allow-Methods: POST, OPTIONS`,
  `Access-Control-Allow-Headers: Content-Type`,
  `Access-Control-Max-Age: 86400`.
- Every `POST` response (success AND error) carries the same
  `Access-Control-Allow-Origin` header, so the browser can read error
  bodies too.
- The buyer form calls the API same-origin and needs no CORS; adding
  these headers must not change its behavior. Verify that after deploy
  (§9 step 6).
- Until the CORS change deploys, the gta-invest form will fail in the
  browser with a CORS error even though the API itself works. That is
  expected during the transition — deploy CORS FIRST, then the form.

## 5. Browser form (this repo)

Files: `index.html` (`#subscribe-form`, `#sub-email`, `#sub-msg`),
`app.js` (`SUBSCRIBE_ENDPOINT`, `SUBSCRIBE_PRODUCT`, `SUBSCRIBE_SOURCE`,
`subscribePayload()`, `initSubscribe()`).

Behavior:

- Submit is intercepted with `fetch` + `preventDefault`. A plain form
  POST cannot work: the API expects JSON.
- The payload builder trims whitespace but does NOT lowercase the email,
  matching the API's existing behavior. Lower-casing for dedupe happens
  at sync time (§6), not at capture time.
- The submit button disables while the request is in flight and
  re-enables on every outcome. The status line (`#sub-msg`, aria-live)
  shows exactly one of the messages in §4.
- JavaScript is required. A `<noscript>` note tells readers to email
  xiongjibro@gmail.com instead. If `app.js` fails to load, the form
  submits nowhere (no `action` attribute) — no data is sent anywhere.
- Consent: submitting the form IS the consent to receive case-update
  emails. There is NO double-opt-in confirmation email in this flow
  today. Do not write copy claiming one exists. Whether MailerLite
  double opt-in gets enabled for the gta-invest group is decided when
  Andy creates the group; record the actual setting here when known.
  Until MailerLite sending exists, new subscribers are stored only and
  receive nothing — the page copy promises future updates, not an
  immediate email, and that wording must stay honest.

## 6. MailerLite: groups and sync

Status: NOT SET UP YET (as of 2026-11-15). No MailerLite account, group,
automation, API key, or group ID has been verified by any agent. The
canonical setup guide is property-playbooks `docs/email-tool.md` (manual
setup + CSV import + Mac mini sync spec for the buyer group). This
section extends it for gta-invest; it does not replace it.

Groups:

- `buyer-toolkit-waitlist` — buyer toolkit 5-email sequence. Locked.
- `gta-invest-subscribers` — PROPOSED name for case-update subscribers.
  Separate automation (case updates only, no price/checkout copy) to be
  written and approved by Andy. Nothing may be sent to this group until
  Andy approves the sending setup.

Sync (either path; the worker is the goal, CSV is the interim):

1. Filter by `product`. gta-invest rows (`product = 'gta-invest'`) go
   ONLY to the gta-invest group. Buyer rows go ONLY to the waitlist.
2. Dedupe by lower-cased email. Never sync the same row twice into an
   automation that restarts on re-join; import/sync only rows created
   since the last sync (filter by `created_at`).
3. Skip test addresses (any `test-signup-*@example.com` row and any
   obviously fake address) and log the skip. Delete test rows from
   Supabase rather than syncing them.
4. Worker behavior (extends `docs/email-tool.md` Part C): same polling,
   state file, logging, and 429/5xx backoff rules, with one additional
   product→group mapping. The worker only ADDS subscribers; it never
   enables/disables automations, edits copy, or sends campaigns.
5. Human gate: no email to any group, no automation change, and no bulk
   import without Andy's explicit approval. Drafts are fine; sending
   is not.

When the group is created, record here: exact group name, group ID
retrieval method (`GET /api/groups`), double-opt-in setting, and the
date sending first went live. Never record the API key anywhere.

## 7. Buttondown retirement and list migration

What happened: the site subscribed via Buttondown (`embed-subscribe/xiong`,
double opt-in) from launch (2026-11-15) until this unification. The form
no longer posts there. The Buttondown ACCOUNT has not been closed by any
agent and must not be closed until the check below is done.

Migration procedure (Andy-only steps marked; agents never move real
subscriber emails without Andy confirming counts):

1. Andy opens the Buttondown dashboard and reports the subscriber count
   for `xiong` (confirmed + unconfirmed separately, if shown).
2. If ZERO subscribers: record "Buttondown list was empty on <date>" in
   DECISIONS.md / this file, then Andy may close or leave the account.
   No migration needed.
3. If NONZERO: Andy exports the list (CSV). Before any import:
   - Dedupe against Supabase `leads` by lower-cased email (same address
     in both places is imported once, keeping the Supabase row).
   - Keep only addresses that completed Buttondown double opt-in, unless
     Andy explicitly decides otherwise; record the decision.
   - Import into Supabase with `product = 'gta-invest'`,
     `source = 'buttondown-migration'`, preserving the original signup
     date if the export carries one. Then sync to the MailerLite
     gta-invest group via §6 (once the group exists).
   - Verify counts at each step (exported = imported + skipped, with a
     reason for every skip). Never import the same export twice.
4. Only after step 2 or 3 is verified may the Buttondown account be
   closed. Record the outcome here.

## 8. Secrets inventory (where each secret lives — and where it must not)

| Secret | Lives in | Must NEVER appear in |
|---|---|---|
| `SUPABASE_URL` | Vercel env vars (property-playbooks) | Any repo, chat, browser code |
| `SUPABASE_ANON_KEY` | Vercel env vars only (anon/public key) | Any repo, chat, browser code |
| `SUPABASE_SERVICE_ROLE_KEY` | Nowhere in this flow — do not create/use it | Anywhere (if one exists, it stays in Supabase dashboard only) |
| `MAILERLITE_API_KEY` | Mac mini env only (when the worker exists) | Any repo, chat, Vercel, browser code |
| MailerLite group IDs | Mac mini env + MailerLite dashboard | Hard-coded group IDs are allowed ONLY in the worker's env, never in git |
| GitHub push credentials | Andy's choice per session (deploy key or transient token) | Files, URLs, commit messages, stored memory |

There is no `.env` file in this repo. Do not introduce one. The anon key
is "publishable" in Supabase's model, but this architecture deliberately
keeps even it server-side; do not weaken that by wiring the browser
directly to Supabase without a new decision in both repos.

## 9. Verification checklist (in order — do not skip steps)

Local (before any push):

1. `npm test` passes in gta-invest (syntax + calculator + subscribe
   payload + validate-data guards).
2. `cd web && npm run build` passes in property-playbooks.
3. `git diff` in both repos contains no secret-looking strings, no real
   emails, and no Buttondown form action.

Deploy order (CORS first — the form cannot work before it):

4. Push property-playbooks (after a successful `git fetch` + status
   check; the pre-push hook must pass). Confirm the Vercel deployment
   is READY on the new commit.
5. Push gta-invest (push method is Andy's per-session choice; no token
   is stored). Confirm the GitHub Pages deploy passes (tests run in
   the workflow) and the live page shows the new form (no Buttondown
   action in page source).

End to end (needs Andy for the Supabase check + cleanup):

6. From the LIVE gta-invest page (not localhost — CORS origin must be
   the real Pages origin), submit a clearly-marked test address, e.g.
   `test-gta-signup-20261115@example.com`. The page must show the
   success message.
7. Andy confirms the row in Supabase Table Editor: correct email,
   `product = 'gta-invest'`, `source = 'gta-invest-subscribe'`.
8. Andy DELETES the test row in Table Editor. Record the deletion here
   or in HANDOFF.md; never leave test rows for a later import to pick up.
9. Regression: submit the property-playbooks signup form once with a
   test address and confirm it still succeeds (same API, same-origin).
   Delete that test row too.
10. If any step fails, stop, record the exact error + step in
    HANDOFF.md, and do not claim the flow is live. Common causes are
    in §10.

## 10. Failure modes

- Browser console shows a CORS error on POST/OPTIONS: the CORS change
  has not deployed (or deployed to a preview URL, not production).
  Check the Vercel production deployment commit first.
- Page shows "订阅尚未接通数据库": Vercel env vars are missing (or a
  redeploy after setting them never happened). Andy-only fix in the
  Vercel dashboard.
- Page shows "订阅失败" on every submit: Supabase insert failing —
  check project paused (§3), GRANTs (§3), or table/column drift.
- Form does nothing on submit: `app.js` failed to load (check the
  Pages deploy + browser console). The form has no fallback POST by
  design (§5).
- Buyer signup breaks after the CORS change: the change is additive
  headers only; check the build + diff before assuming CORS is the
  cause, and roll back the property-playbooks deploy from Vercel if
  needed (Andy-only).

## 11. Cross-repo file map (change together)

gta-invest (this repo):

- `index.html` — form markup + subscribe copy
- `app.js` — endpoint, payload, fetch handler
- `test-calc.js` — payload contract tests
- `validate-data.js` — endpoint/value/copy guards
- `privacy.html` — subscriber privacy wording
- `docs/leads.md` — this contract
- `AGENTS.md` / `DECISIONS.md` / `TASKS.md` / `HANDOFF.md` / `README.md`

property-playbooks (other repo):

- `web/app/api/signup/route.ts` — API + CORS (single write path)
- `web/app/SignupForm.tsx` — buyer form (same API, same-origin)
- `docs/supabase-leads.sql` — table + RLS + GRANTs (canonical)
- `docs/email-tool.md` — MailerLite setup + sync spec (buyer + gta-invest)
- `AGENTS.md` / `DECISIONS.md` / `TASKS.md` / `HANDOFF.md`

## 12. Change log

- 2026-11-15 — Unification decided (Andy): MailerLite + Supabase, one
  shared `leads` table; Buttondown retired. Architecture confirmed the
  same night: reuse `/api/signup` with CORS for the Pages origin.
  Form rewrite + this contract committed locally; pushes + E2E
  verification pending (see HANDOFF.md).
