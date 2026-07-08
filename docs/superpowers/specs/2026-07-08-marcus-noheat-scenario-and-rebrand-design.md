# Marcus Webb "No Heat" Scenario + Netic Rebrand — Design Spec

## Purpose

1. Add a new scenario grounded in Netic's real home-services job-triage data model (researched from the `roadrunner` repo's Paschal HVAC tenant), and make it the app's default active scenario.
2. Rebrand the app chrome from "TriageOS 3.1" to "NeticOS 3.1".

This is a content + branding addendum to the already-implemented multi-scenario Next.js system described in `docs/superpowers/specs/2026-07-08-triageos-nextjs-address-validation-design.md`. It changes no engine code (`lib/scenarios.ts` parsing/registry logic, `lib/grading.ts`, address validation, fireworks) — only scenario data, the default-scenario order, and branding strings.

## Non-goals

- No changes to the `FieldType` schema, grading logic, or address-validation flow.
- The existing "Priya Shah — VPN Outage" scenario is kept, not removed — it becomes the second entry in the scenario switcher.
- No new field types (e.g. a dedicated "phone" type) — phone number is a plain `Text` field graded the same way as name/address.
- No changes to `docs/superpowers/**` history (prior specs/plans) or `.superpowers/sdd/**` scratch artifacts — those are historical records, not live branding surface.

## Scenario content: "Marcus Webb — No Heat"

Researched against `roadrunner`'s real triage model: HVAC job identification there is **System Type × Service-vs-Maintenance intent** (e.g. `store_job_type_id`, `job_type_screening_prompt`, the FURN/BOIL/HP/AC system-type list in `triage_prompt.py`), not a flat "job type" list. "Priority" was considered and rejected — it's a static per-job-type backend attribute (`job_type_priority` table) automatically derived once job type is known in production, not something an agent independently extracts from the customer, so it wouldn't test anything real in the booth game.

**Company framing:** fictional HVAC company "Hearthstone Home Comfort" (no direct Netic branding inside the roleplay — Netic branding lives in the app chrome instead, per the rebrand below).

**Fields** (5, same shape/count as the original scenario):

| Field | Key | Type | Correct answer |
|---|---|---|---|
| Full Name | `requesterName` | Text | tokens: `["marcus", "webb"]`, display "Marcus Webb" |
| Phone Number | `phoneNumber` | Text | tokens: `["555", "0138"]`, display "(415) 555-0138" |
| Service Address | `officeAddress` (key kept as-is — hardcoded in `components/TicketForm.tsx:7` as the field the live Google Address Validation call keys off of) | Text | tokens: `["2 jackson", "san francisco", "94111"]`, display "2 Jackson Street, San Francisco, CA 94111" |
| System Type | `systemType` | Dropdown | options: Furnace, **Boiler**, Heat Pump, Air Conditioner, Mini-Split AC, Geothermal, Water Heater, Thermostat — correct: "Boiler" |
| Job Type | `issueCategory` | Dropdown | options: No Cool, **No Heat**, Boiler Service, Estimate / Replacement, Duct Cleaning, Thermostat Install — correct: "No Heat" |

Grading/threshold is unchanged generic logic (`components/StaffReveal.tsx:30`, `score / fields.length >= 0.8`) — 5 fields means the same 4/5 approve bar as the original scenario.

**Staff roleplay briefing:** Marcus Webb, home alone at 2 Jackson Street, San Francisco, CA 94111 (Jackson Square, near the Embarcadero — a real, locally-recognizable address for a booth at a SF-area tech fair). His boiler stopped producing heat overnight — no warm radiators anywhere, no hot water either. He reset it and checked the pilot light himself, no luck. It's a damp, foggy 48°F outside and the house feels freezing without any heat (SF's mild climate doesn't get pipe-freezing cold, so the urgency comes from the house being genuinely cold and no heat source at all, not a freeze-damage risk). It's never given him trouble before — it just died last night (this is the "No Heat" repair signal, as opposed to routine "Boiler Service" maintenance on a working system — the intended trap, since "Boiler Service" sounds right for a boiler problem but is actually the wrong job-type bucket). If asked about cooling/AC, it's the dead of winter — not the issue ("No Cool" is a plain seasonal decoy). Phone (415) 555-0138 and the full address (city/state/zip) are given only if the visitor asks for them.

**Address grading:** the correct-answer tokens require city and zip in addition to the street (`["2 jackson", "san francisco", "94111"]`) — a visitor who only catches "2 Jackson Street" without asking for city/state/zip is graded wrong on that field. The street token is the compound `"2 jackson"` rather than a bare `"2"` — a single digit is too weak a substring match (it would trivially match unrelated numbers); anchoring it to `"2 jackson"` requires the number and street name together, while still tolerating minor punctuation/spacing differences.

## Default scenario

`lib/scenarios.ts`'s `RAW_SCENARIOS` array order determines the default: `app/page.tsx:15` initializes `activeScenarioId` from `SCENARIOS[0].id`. Changing the order to `[marcusNoHeatRaw, priyaVpnRaw]` makes Marcus the default on first load (and after `localStorage` is cleared), while Priya's VPN scenario remains available and switchable.

## Rebrand: TriageOS → NeticOS

Live, user-facing/source strings only (not historical docs):

- `app/layout.tsx:5` — page `<title>` metadata: `"TriageOS 3.1"` → `"NeticOS 3.1"`
- `app/page.tsx:65` — titlebar text: `"TriageOS 3.1 — Staff Review"` / `"TriageOS 3.1 — New Ticket"` → `"NeticOS 3.1 — ..."`
- `app/page.tsx:10` — `SCENARIO_STORAGE_KEY = "triageos.scenarioId"` → `"neticos.scenarioId"` (internal-only key; renaming it means any already-set preference on a real booth laptop silently resets to the default once — harmless before the event, and consistent with making Marcus the new default anyway)
- `README.md:1` — heading `# TriageOS` → `# NeticOS`, plus a one-line mention of the new default scenario and the "Adding a new scenario" section's example filename
- `package.json:2` — `"name": "triageos"` → `"name": "neticos"` (cosmetic, not user-visible, but keeps the repo internally consistent)

No changes to visual chrome/CSS, no changes to `docs/superpowers/**` history.

## Testing

Manual, in-browser (per project decision to drop automated tests — see `.superpowers/sdd/task-6-report.md`):

- App loads with Marcus's scenario active by default (System Type / Job Type dropdowns show the HVAC option lists; title bar reads "NeticOS 3.1 — New Ticket").
- Scenario switcher still lists both scenarios; switching to "Priya Shah — VPN Outage" and back works and resets to the entry screen each time.
- Submitting Marcus's scenario with all-correct answers → staff reveal (`Alt+Shift+R`) shows 5/5 and APPROVE; entering "Boiler Service" for Job Type (the trap) drops the score and is marked wrong, still shows the correct answer "No Heat".
- Address validation still fires on the `officeAddress` field for Marcus's scenario (real address passes, garbage address blocked) — confirms the validation hook works keyed by field `key`, not by scenario.
- `npm run build` succeeds.
