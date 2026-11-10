# Clinic page brief (shared by every page builder)

Pulse is a frontend-only operations demo, re-skinned for **Deborah Gough, Aesthetics Clinic · Milltown** (sole trader, a nurse, Milltown Dublin near the Eurospar; rented room shared with a plastic surgeon; Deborah works alone; a prospective practitioner may join two days weekly). All data is FICTIONAL demo data. The demo should make Deborah think: "I can keep control of my clinic without doing every piece of admin myself."

## Read first (do NOT edit these shared files)
- `src/clinic/fixtures.ts`  typed fixture data with stable IDs (patients, slots, appointments, waitlist, conversations, posts, transactions, tasks, onboarding, agents, runs, documents, integrations, activity seed).
- `src/clinic/store.ts`     state + actions (`useClinic()`, `useUi()`, `go(page, tab, id)`, `openPatient(id)`, `takeFocus(page)`, `toast(msg)`, booking/reschedule/offer/draft/receipt/post/prep/task/onboarding/agent/settings actions, `reset()`), plus `fits(slot, serviceId)`, `isOpen(state, slotId)`, `slotsOn(date)`.
- `src/clinic/selectors.ts` every derived number (week/today capacity, open slots, prep rows, inbox counts, receipt queue, October finance, local share, funnel, onboarding, task rows, approvals, run approval, activity, briefing, follow-ups).
- `src/clinic/ui.tsx`       UI kit: Page, Grid, Panel, Stats/Stat, Badge, Btn, Table (pagination), Drawer, Tabs, Field, Search, Toggle, Empty, Note, Kv, BarList, Columns, Progress, Avatar, DemoTag. Classes in `src/styles/clinic.css` (`c-*`), e.g. `c-input`, `c-select`, `c-textarea`, `c-list`/`c-li`, `c-cal`/`c-cal-day`/`c-slot`, `c-post`/`c-post-thumb`.
- `src/clinic/format.ts`    Irish formatting: `SNAPSHOT` (Tue 10 Nov 2026 08:30 Europe/Dublin), `dayLabel`, `dayLong`, `dateShort` (dd/mm/yyyy), `relDay`, `eur`, `eur2`, `toMin`, `fromMin`, `plural`.
- `src/clinic/modules.ts`   tab ids per module.

If you need extra derived data, compute it inside your own page file from `useClinic()` state + fixtures. Do not edit shared files; if something is truly missing, say so in your final report.

## Component contract
Each page file default-exports `function X({ tab, v }: { tab: string; v: any })`. `tab` is the active top-bar tab id (from modules.ts). `v` is the Pulse render object (you rarely need it). The top-bar tabs are rendered by the shell; do NOT render your own module tab bar. Render one tab's content based on `tab`.

Navigation: `go("Inbox", "drafts", "CONV-01")` switches module/tab; the target page reads `takeFocus("Inbox")` once on mount (e.g. in `useState(() => takeFocus("Inbox"))`) to open that record. Patient record drawer: call `openPatient("PAT-118")` (a global drawer renders it).

## Hard rules
- Frontend only. No new dependencies. No fetch. React 18 + TypeScript (strict). Use only theme tokens (`var(--accent)`, `var(--ink)`, `var(--body)`, `var(--dim)`, `var(--faint)`, `var(--surface)`, `var(--surface-2)`, `var(--border)`, `var(--ok)`, `var(--warn)`, `var(--bad)`, `-soft` variants, `var(--accent-soft)`, `var(--accent-faint)`, `var(--track)`, `var(--neutral)`). No hex colours except post thumbnail tints already in fixtures.
- Every number comes from selectors/state. Never hard-code a total that should move when the user acts.
- Simulated things are never called "Live", "Connected", "Sent" or "Published". Use "Sent in demo", "Scheduled in demo", "Simulated", "Demo import", "Awaiting confirmation". Say clearly nothing left Pulse.
- No clinical advice, diagnoses, treatment recommendations, outcome claims or invented credentials. Deborah is a nurse, never "doctor"/"Dr". Preparation checks are administrative only.
- Mark fictional/illustrative things (prices, attributed funnel events, scenarios) with a short label (`DemoTag` or a note).
- Copy: plain, warm, direct, Irish English spelling (organise, colour, programme). No em dashes or en dashes anywhere in visible text (use commas, colons, full stops). No exclamation marks. No filler words like "seamless", "elevate", "unlock".
- Compact operational layouts: tables, lists, calendars, queues, drawers, small charts. No big decorative headers, no oversized KPI cards, no repeated identical KPI grids. Put useful information above the fold; fill width sensibly; no accidental empty columns.
- Mobile: layouts collapse (Grid already collapses <980px; use `c-hide-sm` for non-essential table columns). Booking, messages and today's work must be usable at 375px.
- Accessibility: real `<button>`s, labels on inputs, focus states come from clinic.css.
- Every primary button must do something (via store actions / navigation). Confirm destructive-looking demo actions inline only if needed; keep it light.

## Done means
`npx tsc -b` reports no errors in YOUR files (other files may be mid-edit by teammates; ignore errors outside your files). Do not start a dev server. Final report: files created, what each tab shows, any missing store/selector capability you worked around.
