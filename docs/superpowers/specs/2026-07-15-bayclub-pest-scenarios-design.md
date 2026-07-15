# BC (Bay Club freeze) + PC (carpenter ants) scenarios; Priya IT purge

Two new cases for the Greylock fair, grounded in real Netic triage logic researched from blackbird, roadrunner, and condor. The switcher now shows **NH / NC / BC / PC**.

## Uniform identity across all scenarios

Per direction, every scenario shares the same identity setup as NH/NC — there is no scenario-specific "target name" or address:

- **Customer**: always one of the five interchangeable team members (`dat-tran`, `sameer-das`, `davin-jeong`, `cassie-wu`, `jessica-zhu`).
- **Full Name**: `deriveFromCustomer: "name"` — grades against whichever of the five is selected; no per-scenario name baked in.
- **Service Address**: always **2 Jackson Street, San Francisco, CA 94111**, with the same stale-directory-prefill trap (only Dat Tran's record is current; the other four prefill a stale address that must be corrected).

So BC and PC differ from NH/NC only in their **story** and their **classification dropdowns**. This keeps the puzzle focused on classification and keeps the identity mechanics consistent for repeat visitors.

## Research grounding

- **Bay Club is a real Netic tenant** (`roadrunner/tenants/the_bay_club/`, `blackbird/docs/tenants/the-bay-club.md`). Its production agent does NOT self-serve freezes/holds — they escalate to the Membership team — while cancellations route to retention and invoice/card requests go to the self-service portal (`condor/config/shared/components/account/base.ts`).
- **Lookout Pest's ISP/OSP/Premium taxonomy** (`roadrunner/tenants/lookout_pest/v1/prompts/base.py`): regular ants = standard quarterly plan; carpenter ants = On-Site Specialist (wood-destroying, inspection first); the real disambiguation question is "carpenter ants or regular ants?". Wildlife (raccoons, snakes, deer) is verbatim on the not-covered list.

## BC — `scenarios/bayclub.json` (id `bayclub`)

One of the five is a Bay Club member who wants to stop paying for the summer without losing their grandfathered rate. They keep saying "cancel" while meaning freeze — the "Dale" bit in the staff briefing carries the comedy.

- Classification: **Request Type: Freeze / Hold Membership** (bait: Cancel Membership); **Route To: Membership Team — Escalate** (baits: Retention Offers — internally consistent with the Cancel misread — and Self-Service Portal). The double trap mirrors production: classify as Cancel and Retention "correctly" follows, so a visitor who takes the first bait takes the second too.

## PC — `scenarios/pest.json` (id `pest`)

One of the five has big black ants and returning sawdust piles at the deck posts (WD-40 countermeasures notwithstanding).

- Classification: **Pest Type: Carpenter Ants** (bait: Ants); **Service Program: On-Site Specialist Inspection (OSP)** (bait: Standard Quarterly Plan (ISP), consistent with the Ants misread).
- The clue ladder (big / black / sawdust / wings) is released only when asked — rewarding the disambiguating questions a real CSR asks.

## Priya Shah IT case purged

- `DEFAULT_SCENARIO` (the Priya VPN fallback in `lib/scenarios.ts`) removed; `buildScenarioRegistry` now **throws** when no scenario parses. Scenario JSONs are statically imported and parsed at build time, so this fails the build loudly rather than silently serving a fallback at the booth.
- Priya's directory record removed. The Dan Tran / Dat Tran near-miss remains the directory's identity decoy.

## Testing

No unit tests (per direction). Verification is done by driving the running app in a real browser: switcher renders NH/NC/BC/PC; for BC, selecting a non-Dat customer prefills a stale address and the Cancel+Retention misread is blocked, while Freeze+Membership Team with the corrected 2 Jackson address submits; for PC, the regular-Ants+ISP combo is blocked while Carpenter Ants+OSP submits; NH and NC still load. Production build clean.
