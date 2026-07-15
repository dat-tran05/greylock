# BC (Bay Club freeze) + PC (carpenter ants) scenarios; Priya IT purge

Two new cases for the Greylock fair, both grounded in real Netic triage logic researched from blackbird, roadrunner, and condor. The switcher now shows **NH / NC / BC / PC**. Design approved in-session before implementation.

## Research grounding

- **Bay Club is a real Netic tenant** (`roadrunner/tenants/the_bay_club/`, `blackbird/docs/tenants/the-bay-club.md`). Its production agent does NOT self-serve freezes/holds — they escalate to the Membership team — while cancellations route to retention and invoice/card requests go to the self-service portal (`condor/config/shared/components/account/base.ts` account_intent taxonomy).
- **Lookout Pest's ISP/OSP/Premium taxonomy** (`roadrunner/tenants/lookout_pest/v1/prompts/base.py`): regular ants = Immediate Service Pests (standard quarterly plan); carpenter ants = On-Site Specialist (wood-destroying, inspection first); the production agent's real disambiguation question is "carpenter ants or regular ants?". Wildlife (raccoons, snakes, deer) is verbatim on the not-covered list.

## BC — `scenarios/bayclub.json` (id `bayclub`)

Barry Kleinman (new directory record, `barry-kleinman`, home 2130 Fillmore Street) wants to stop paying for the summer without losing his grandfathered 2016 rate. He says "cancel" constantly while meaning freeze — the Dale bit in the staff briefing carries the comedy.

- Correct answers: Barry from the directory; **Request Type: Freeze / Hold Membership** (bait: Cancel Membership); **Route To: Membership Team — Escalate** (baits: Retention Offers — internally consistent with the Cancel misread — and Self-Service Portal).
- **Home Club Address** reuses the `officeAddress` key (required by the live Google validation hook): correct answer is the club, **150 Greenwich Street, San Francisco, CA 94111** (validated live against the API). Directory prefill inserts Barry's *home* address — a variant of the don't-trust-the-prefill trap where the label, not record staleness, makes the prefill wrong.

## PC — `scenarios/pest.json` (id `pest`)

Carol Pemberton, a first-time caller (neighbor Diane's yellowjacket referral), has big black ants and returning sawdust piles at her deck posts, WD-40 countermeasures notwithstanding. Mid-call raccoon stinger.

- **First scenario to use `correctCustomerId: null`** — the correct answer is the New Customer path; a directory search finds nothing. This deliberately breaks the "always pick someone from the directory" habit NH/NC/BC teach. Name and address are typed by hand (no prefill): Carol Pemberton, **1298 Haight Street, San Francisco, CA 94117** (validated live).
- Correct answers: **Pest Type: Carpenter Ants** (bait: Ants); **Service Program: On-Site Specialist Inspection (OSP)** (bait: Standard Quarterly Plan (ISP), consistent with the Ants misread); **Raccoon Request: Not Covered — Wildlife** (bait: Add to Treatment Plan, punishing maximal helpfulness).
- The clue ladder (big / black / sawdust / wings) is released by the staffer only when asked — rewarding the disambiguating questions a real CSR asks.

## Priya Shah IT case purged

- `DEFAULT_SCENARIO` (the Priya VPN fallback in `lib/scenarios.ts`) removed; `buildScenarioRegistry` now **throws** when no scenario parses. Scenario JSONs are statically imported and parsed at build time, so this fails the build loudly instead of silently serving a fallback at the booth. Covered by `lib/scenarios.test.ts` (TDD: watched the throw case fail against the old fallback first).
- Priya Shah's directory record removed from `data/customers.json` (replaced by Barry's). The Dan Tran / Dat Tran near-miss remains the directory's identity decoy.

## Verified

End-to-end in the running app: switcher renders NH/NC/BC/PC. BC: Barry's prefill shows his home address; the Dale mistake (Cancel + Retention + untouched prefill) is blocked; Freeze + Membership Team + club address submits. PC: "pemberton" search correctly finds nothing; New Customer path with "1298 Haight St" (abbreviation exercised the softened normalize), regular-Ants + ISP + raccoon-on-the-plan blocked; Carpenter Ants + OSP + Not Covered submits. All 21 unit tests pass; production build clean.
