# TriageOS: Next.js Migration + Address Validation + Multi-Scenario — Design Spec

## Purpose

Evolve TriageOS from a single offline `index.html` booth game into a Next.js app with a live backend that:

1. Validates the visitor-entered Office Address against Google's Address Validation API, blocking submission on invalid input.
2. Plays a retro pixel-fireworks celebration on successful submission.
3. Supports multiple interchangeable scenarios, defined as JSON, switchable at runtime by staff via an on-screen dropdown — so future scenario changes don't require code changes or redeploys.

This supersedes the offline-only constraint from the original spec (`docs/superpowers/specs/2026-07-01-triageos-booth-game-design.md`): the booth now requires internet connectivity, in exchange for live address validation and easier scenario management.

## Non-goals

- No chatbot / LLM integration — the conversation still happens face-to-face between staff and visitor.
- No visitor-facing correctness feedback — grading and scoring remain staff-only, revealed via hotkey, unchanged from the original design.
- No full CMS/admin UI for editing scenarios — scenarios are authored as JSON files in the repo, not edited live through a UI.
- No real-time (as-you-type) address validation — validation happens once, on submit.

## Architecture

- **Framework:** Next.js (App Router), TypeScript, deployed on Vercel.
- **Frontend:** One client component (`app/page.tsx`) implements the existing three-screen state machine (`entry` → `submitted` → `staffReveal`), ported from the current `index.html` with the same Win 3.1 visual chrome (moved into `app/globals.css`).
- **Backend:** One API route, `app/api/validate-address/route.ts`. Accepts `{ address: string }`, calls Google's **Address Validation API** server-side using `GOOGLE_MAPS_API_KEY` (never exposed to the client), returns `{ valid: boolean }`.
- **Secrets:** `GOOGLE_MAPS_API_KEY` lives in `.env.local` (gitignored) locally and as an encrypted Vercel environment variable in production. Never committed, never sent to the browser (no `NEXT_PUBLIC_` prefix). The key pasted into chat during design discussion must be rotated and restricted (HTTP referrer + API restriction to Address Validation API only) before use.

## Scenario system

- `scenarios/*.json` — one file per scenario, each containing: staff briefing text, field definitions, and correct-display strings. Same shape as the current inline `SCENARIO` object in `index.html`.
- **Field types:** each field declares a `type`, drawn from a `FieldType` enum in `lib/scenarios.ts`:
  ```ts
  enum FieldType {
    Text = "text",
    Dropdown = "dropdown",
  }
  ```
  - `Text` — free-text input, graded by required substring tokens (e.g. Requester Name, Office Address today).
  - `Dropdown` — `<select>` with an `options` list, graded by exact match (e.g. Department, Issue Category, Priority today).
  - Scenario JSON stores the field's string value (`"text"` / `"dropdown"`); it's parsed against the `FieldType` enum on load, so an unrecognized value fails loudly (falls back to the default scenario per the error-handling section) instead of silently rendering nothing. The renderer and grader both switch exhaustively over `FieldType`, so adding a new case later (e.g. a number or date field) means extending the enum plus one switch arm in each, not restructuring the schema. No other types are built now — just these two.
- `lib/scenarios.ts` — loads all JSON files from `scenarios/` at build time and exports a registry: `{ id, name, data }[]`.
- **Scenario switcher UI:** a small `<select>` pinned to the top-right of the page, outside the retro window chrome (reads as a booth "control panel," not part of the in-universe ticket UI). Lists scenario names only — never correct answers. Selecting a scenario:
  - Sets it as active.
  - Persists the choice to `localStorage` (survives refresh on the booth laptop).
  - Resets the form back to the entry screen.
- Grading, address-validation-triggered fireworks, and staff reveal all read from whichever scenario is currently active. Adding a new scenario later requires only adding a new JSON file — no code changes.

## Data flow (submit path)

1. Visitor clicks **Submit Ticket**; form values are read, including `officeAddress`.
2. Client-side: if `officeAddress` is empty/whitespace, treat as invalid immediately (no network call).
3. Otherwise, client calls `POST /api/validate-address` with the raw address string.
4. The route handler calls Google's Address Validation API server-side with the key, inspects the verdict, and returns `{ valid: boolean }`.
   - On any error from Google (timeout, 5xx, malformed response) or a missing/misconfigured API key: **fail open** — return `{ valid: true }` and log a server-side warning. The booth flow must never stall because of an external API or config issue.
5. **If `valid: false`:** the Office Address input gets a red outline (`.error-outline`), a generic message appears ("Input not valid — please check and try again"), submission is blocked. No other field is touched, and the message never names which field or why.
6. **If `valid: true`:** proceeds as today — "Processing request..." progress bar animation, then the ticket settles on "Ticket #XXXX submitted. Please see support staff." A **pixel fireworks** animation (dense: multiple simultaneous burst points, many sparks per burst) plays over this screen to celebrate a successful submission. This celebrates that the ticket went through — it is not tied to scenario correctness, which visitors never see.
7. Existing grading (`gradeSubmission`, from the active scenario) runs and is stored for the staff-only reveal exactly as before, unaffected by address validation.

## Error handling

- Google API errors/timeouts/misconfiguration → fail open, ticket proceeds unflagged, server logs a warning.
- Empty/whitespace address → blocked client-side before any network call, same generic red-outline treatment.
- Scenario JSON fails to load or registry is empty → fall back to a single built-in default scenario (ported from the current hardcoded one) so the app never renders a broken/empty form.

## Visual style

Unchanged from the original spec (Win 3.1 chrome: `#c0c0c0` window, navy titlebar, beveled borders, `MS Sans Serif`/Tahoma stack, teal desktop backdrop), plus:

- `.error-outline`: red (`#aa0000`) border on the Office Address input plus a small red text message beneath it, cleared on next edit or successful resubmit.
- Pixel fireworks: small square (not smooth/rounded) particles in bright flat colors, bursting outward from multiple points and fading — rendered as absolutely-positioned divs animated via CSS keyframes (no canvas/animation library), self-cleaning via timeouts. Density: several simultaneous burst points, ~10+ sparks per burst.
- Scenario switcher `<select>`: plain, minimal styling, positioned top-right, visually distinct from the retro window (it's a booth control, not part of the simulated OS).

## Testing

Manual, in-browser (extends the original spec's checklist):

- All fields render with correct control types and dropdown options for the active scenario.
- Real, valid address → validation passes, fireworks play (dense burst), ticket submits, ticket text shown.
- Garbage/unreal address → red outline + generic error, submission blocked, no other fields affected.
- Empty address → same red-outline/blocked behavior, no network call made.
- Simulated Google API failure (bad/missing key, forced timeout) → submission still succeeds (fail-open), warning logged server-side.
- Submit with correct scenario answers → staff reveal (existing hotkey) shows 5/5 and APPROVE; wrong answers show correct score and DENY at ≤3, unchanged from original.
- Scenario switcher: selecting a different scenario updates the form's dropdown options and staff-reveal answer key accordingly, resets to the entry screen, and persists across a page refresh.
- If `scenarios/` fails to load or is empty, the app falls back to the default scenario instead of rendering broken/blank.
