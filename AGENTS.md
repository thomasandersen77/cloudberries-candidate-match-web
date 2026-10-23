# AGENTS.md: Cloudberries Candidate Match, web

Repository facts for coding agents. Preferences about how Thomas Andersen works live in
`AI_CONTEXT.md` in the backend repository (`cloudberries-candidate-match`), and the architectural
invariants of the system live in that repository's `AGENTS.md`. This file only holds what is true
of the frontend.

## What this is

React 18, Vite, TypeScript, MUI. It talks to the backend's `/api` through the Vite dev proxy
(`.env.development`, `VITE_BACKEND_TARGET`, port 8081 locally). Routes are in
`src/routes/router.tsx`, which `src/main.tsx` passes to `RouterProvider`; a page with no route
there is dead code. `src/routes/__tests__/router.test.ts` checks that every module the dashboard
and the superuser page link to has a route.

## Commands

```bash
npm run dev          # Vite on 5174, strict port
npm test             # vitest, jsdom
npm run test:e2e     # Playwright, chromium, reuses a running dev server on 5174
npm run lint         # eslint; clean, and CI fails on any error
npm run gen:api      # openapi.yaml -> src/api/generated.ts
npx tsc -b           # the type check the build runs
```

## The contract

`openapi.yaml` here is a copy of the backend's root `openapi.yaml`, which is canonical. Sync with
`cp`, then `npm run gen:api`. Types come from `src/api/generated.ts`, re-exported by name in
`src/types/api.ts`. No handwritten API DTOs beside the generated ones: a handwritten copy is how a
field the server never sent (`createdAt`) stayed in the code for months without a compile error.

## UI rules

- **Page help is visible on arrival.** `PageIntro` under every page title: one sentence, and the
  how-to open. One switch turns it off for the whole app; "Om denne siden" brings it back.
- **A module's explanation of itself may fold, and keeps its own state.** `HowTheAssistantAnswers`
  is folded on the front page and open on the assistant page. It does not read the page-help
  switch: turning the help off is a decision about the app, and the basis for trusting an answer
  does not go with it. The two are documented against each other in `PageIntro.tsx` and
  `HowTheAssistantAnswers.tsx`.
- **Costs and consequences sit next to the control**, never in help that can be switched off.
- **Phones are a requirement, not a breakpoint.** MUI's `sx` breakpoints are media queries jsdom
  does not evaluate, so vitest cannot see layout; `e2e/home.spec.ts` measures the front page at
  390×844. Touch targets on `xs` are 44 px; a small `Button` is about 30 and a small `IconButton`
  40, so give the ones a thumb needs a `minHeight`.
- Folded content uses `Collapse` with `unmountOnExit`, `aria-expanded` on the button and
  `aria-controls` pointing at the region's `id`. Focus stays on the button after opening.

The consultant and CV detail pages load one person through `GET /consultants/{userId}/with-cv`
(`getConsultantWithCv`), which also answers for somebody who has left; the lists do not, and
looking the id up in a list said «Konsulent ikke funnet» for a CV the backend has. The semantic
search table keeps the backend's order (by similarity) and shows similarity and CV quality as two
columns; sorting it by quality hid which signal put a row where it was.

## Theme files

`themeTokens.ts` holds the palettes, the touch constants and `createAppTheme`; `colorMode.ts` the
context and `useColorMode`; `theme.tsx` only `ColorModeProvider`. A module that exports a component
exports nothing else, or Fast Refresh reloads the whole page on every edit (eslint
react-refresh/only-export-components). CI runs lint, `npm test`, a check that `generated.ts` matches
`openapi.yaml`, and the build.

## Touch and phone

On a coarse pointer every control that acts is at least 44 px: the theme sets it for buttons,
icon buttons, clickable chips, toggles, checkboxes and inputs (`COARSE_POINTER`,
`TOUCH_TARGET_PX` in `themeTokens.ts`); a link that stands as an action on its own (a row's «Se
CV») sets it where it is used, since a link inside a sentence must not grow. Nothing changes
with a mouse. A page is checked at 390 px for sideways overflow and target size in Playwright
(`e2e/matches-phone.spec.ts`), not by screenshot; jsdom has neither layout nor pointer queries.

## Words

One word per thing, everywhere in the UI, in tests and in `aria-label`s: **avrop** (not
kundeforespørsel, forespørsel, prosjektforespørsel; «kundeforespørsel» appears once, as the
explanation on the upload page), **CV-score** (never CV-Score, CV score, CV-kvalitet or
kvalitet), **kravmatch** (the model's score per requirement), **presentert skår** (the match
weighed with CV-score). Every `aria-label` is Norwegian; the document is `lang="nb"`; dates use
`nb-NO`. A wording that drifts is fixed in one pass, not page by page.

## Matching pages

`/matches` is an overview: one card per request, which opens `/matches/{id}`, the request's one
page (plan C1, decided 2026-10-23). `/project-requests/{id}` redirects there; the upload page
(`/project-requests/upload`) stays and links each request to it. The page is `RequestMatchPanel`
in `layout="page"`, laid out from `requestPageState.ts` (pure, tested per state):

- The top (`RequestHeader`): customer, role, deadline, the one action scoped to the state with what
  it costs under it, and three `StatusFrame`s (components/feedback): requirements, coverage,
  assessment. «Lukk avropet» asks first; it cannot be undone yet.
- The states: NEW (nothing assessed: «Dokument og krav» and «Kandidater» first, «Vurder N
  valgte»), RUNNING («Avbryt vurderingen», progress polled every 3 s, the previous result kept,
  the choice locked), PARTIAL (the result first, «Vurder de N som feilet», «Uten skår» with each
  reason), OUTDATED (requirements or a CV changed: «Endret siden vurderingen» first, «Vurder N på
  nytt mot dagens krav», no retry), ASSESSED (the result first), BLOCKED (analysis failed or no
  consultant requirements: no action, and the reason). Nobody ticked disables the action; it is
  never read as «choose for me».
- The four parts («Dokument og krav», «Kandidater», «Vurdering», «Forslag») come in the state's
  order, linked from a part navigation; the requirements and the choice fold once there is an
  answer. «Slik fungerer matchingen» is open the first time a browser shows it, folded after.

An AI row opens on the score per requirement, must-haves first. The old `?requestId=` link
redirects to the page.

A list card carries two framed statuses of one size at its right: the coverage in the status
colour the server chose, and the AI status, green with count and date when the model has been
run, orange «Ikke AI-vurdert» when not. Every other card is tinted.

The card layout of the panel (tests, no route) keeps its status chip; the page's frames and the card's chip both come from `GET …/matches/status`, which reports
the run itself: `RUNNING` with «7 av 20 ferdige», `PARTIAL` («Delvis fullført», warning colour)
with «17 av 20 vurdert, 3 feilet», `COMPLETED`, `FAILED`, `CANCELLED`. A `409` on «Kjør
AI-matching» means a run is already going for the request; the message names it. «Vurder de N som
feilet» (`POST …/matches/retry-failed`) shows when the run is PARTIAL or FAILED and its
requirements are unchanged; it re-opens the same run. When the requirements have changed since the
run (`requirementsChanged` on the status) a warning says so and no retry is offered. A row whose CV
has changed since the run carries «CV endret etter vurderingen» (`cvChanged`).

The list is ordered and filtered by the server: a select for the order (`date`, `ai`, `coverage`,
each both ways) and chips for the filters (`assessed`, one of two or none; `coverage`, the lights
added up). Any change starts again from the first page; the count under the select says how many
are left. The order, the filters, the page and the page size live in the
URL (`?sort=&assessed=&coverage=&page=&size=`, defaults left out, unknown values ignored),
written with `replace`; opening a card passes the list's query as navigation state, and the
request page's «Tilbake til matcher» goes back to it.

## Verifying

Run `npx tsc -b`, `npm test` and `npm run test:e2e` after a change to a page, and say which ran.
Playwright needs the dev server; `reuseExistingServer` picks up one already on 5174.

## CV-score basis and rule versions

`/cv-score-grunnlag` is linked from Superbruker. It reads the two `/admin/cv-score/.../basis`
endpoints and never starts scoring. Details and errors belong to the selected candidate id;
late requests must not overwrite the current selection. Historical counts stay visible beside
current counts when the CV, counting rules or counting date differs. `rulesStatus` comes from the
backend (CURRENT, EQUIVALENT, OUTDATED, UNKNOWN) and is separate from CV freshness (`stale`).
The browser must not derive rule compatibility from prompt version strings. API types are generated.

The CV-score basis opens in a table row directly below the selected consultant on every screen
size. The name button toggles it and exposes `aria-expanded`/`aria-controls`. Sorting is local:
score descending by default, newest review for ties; Score/Date headers toggle direction. Missing
or invalid dates stay last. Sorting must preserve the open consultant and start no new API call.
