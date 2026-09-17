# AGENTS.md: Cloudberries Candidate Match, web

Repository facts for coding agents. Preferences about how Thomas Andersen works live in
`AI_CONTEXT.md` in the backend repository (`cloudberries-candidate-match`), and the architectural
invariants of the system live in that repository's `AGENTS.md`. This file only holds what is true
of the frontend.

## What this is

React 18, Vite, TypeScript, MUI. It talks to the backend's `/api` through the Vite dev proxy
(`.env.development`, `VITE_BACKEND_TARGET`, port 8081 locally). Routes are in `src/App.tsx`; a page
with no route there is dead code, not a work in progress.

## Commands

```bash
npm run dev          # Vite on 5174, strict port
npm test             # vitest, jsdom
npm run test:e2e     # Playwright, chromium, reuses a running dev server on 5174
npm run lint         # eslint; five long-standing errors in theme.tsx and healthService.ts
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

## Verifying

Run `npx tsc -b`, `npm test` and `npm run test:e2e` after a change to a page, and say which ran.
Playwright needs the dev server; `reuseExistingServer` picks up one already on 5174.
