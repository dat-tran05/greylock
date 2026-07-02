# TriageOS Booth Game — Design Spec

## Purpose

A retro Windows 3.1-styled single-page web app for the Greylock tech fair booth. A booth staffer roleplays an "employee" describing an IT problem to a visitor in conversation. The visitor then fills out a fake IT ticket form based on what they extracted from that conversation. Staff privately grade the submission and decide whether to hand over a prize ticket.

## Non-goals

- No chatbot / LLM integration — the conversation happens face-to-face between staff and visitor, not in-app.
- No backend, database, or network dependency — must run fully offline on a booth laptop.
- No scenario randomization — a single fixed scenario for the whole event.
- No build step or external dependencies.

## Architecture

Single self-contained `index.html` file: inline CSS, vanilla JS, no external assets, no CDN calls. Internally organized as:

- A `SCENARIO` config object (fields, dropdown options, answer key, grading rules) kept separate from rendering/event-handling code, so the scenario can be edited later without touching UI logic.
- A tiny state machine with three screens rendered into one retro "window" shell: `entry` → `submitted` → `staffReveal` (hidden).

Delivered as one file so it can be opened directly in a browser (double-click or `open index.html`) with zero setup — critical for reliability at a live event with unpredictable wifi.

## Scenario content

**Staff briefing (kept as a comment block in the source, not shown to visitors):**

> Priya Shah from Finance is working from a downtown branch office. Her laptop can't connect to the VPN, which is blocking her from submitting quarterly numbers before today's deadline. She's already restarted her laptop twice — no luck. Everyone else at her branch is fine; it's just her connection.

**Fields:**

| # | Field | Type | Control | Correct Answer | Distractors / Options |
|---|-------|------|---------|-----------------|------------------------|
| 1 | Requester Name | Text | text input | "Priya Shah" | — |
| 2 | Department | Dropdown | select | Finance | Accounting, Sales, Engineering, Marketing, HR, Facilities, IT |
| 3 | Issue Category | Dropdown | select | Network/VPN | Hardware, Software, Account Access, Email, Printing |
| 4 | Priority | Dropdown | select | High | Low, Medium, Critical |
| 5 | Office Address | Text | text input | "455 Market Street" | — |

**Grading rules:**

- Dropdown fields (Department, Issue Category, Priority): exact match required.
- Requester Name: case-insensitive; passes if the submitted value contains both "priya" and "shah" as separate tokens (order-independent).
- Office Address: case-insensitive, punctuation-normalized; passes if it contains the street number "455" and the word "market".
- Overall score = count of passing fields out of 5.
- Recommendation banner: score ≥ 4 → "APPROVE — hand over a ticket"; score ≤ 3 → "DENY — close but not quite". This is a suggestion only; staff make the final call.

## Screens & flow

1. **Ticket Entry (default/reset state)**
   Title bar: "TriageOS 3.1 — New Ticket". Decorative, non-functional menu bar (File / Edit / Help). The 5 fields as Win 3.1-style controls. "Submit Ticket" button.

2. **Processing → Submitted**
   On submit: brief animated "Processing request..." (fake progress bar, ~1-2s), then settles on "Ticket #[random 4-digit] submitted. Please see support staff." Visitor's flow ends here — no correctness is shown.

3. **Staff Reveal (hidden)**
   Triggered by `Ctrl+Shift+R` any time after a submission exists. Shows a graded table (Field | Submitted value | Correct value | ✓/✗), the score (e.g. "4/5"), the recommendation banner, and a "New Ticket" button that clears the form and returns to screen 1 for the next visitor. If triggered before any submission exists, shows a small "No submission yet" notice instead.

## Visual style

Windows 3.1 chrome, applied via plain CSS (no rounded corners, no drop shadows, no gradients beyond flat fills):

- Window chrome background: `#c0c0c0`.
- Title bar: solid blue (`#000080`) background, white bold text, System-font look.
- Borders: chunky 2-3px beveled outset/inset borders (light top/left, dark bottom/right for outset; reversed for inset/pressed and for text inputs).
- Font: `"MS Sans Serif", "Tahoma", "Arial", sans-serif` stack.
- Buttons: classic 3D push-buttons (outset bevel, inset on `:active`).
- Inputs/selects: sunken (inset bevel) fields.
- Page backdrop behind the window: solid muted teal, evoking the classic Windows 3.1 desktop.

## Testing

Manual only — this is a static, deterministic UI with no backend. Verify in-browser:
- All 5 fields render with correct control types and dropdown options.
- Submit with correct answers → reveal shows 5/5 and APPROVE.
- Submit with wrong answers → reveal shows correct score and DENY when ≤3.
- Name/address matching tolerates case differences and minor formatting (e.g. "priya shah", "PRIYA SHAH", "455 Market St").
- Ctrl+Shift+R before any submission shows the "no submission" notice; after submission shows the graded reveal.
- "New Ticket" fully resets the form and returns to screen 1.
