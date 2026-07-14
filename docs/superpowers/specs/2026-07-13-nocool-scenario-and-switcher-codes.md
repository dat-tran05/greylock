# No Cool scenario + short switcher codes

## Switcher codes

The top-right scenario switcher previously showed "Dat Tran — No Heat", which leaks both the customer name and the correct Job Type to anyone who glances at the corner of the screen. Scenario `name` is only rendered in `ScenarioSwitcher` (nowhere else in the UI), so the names themselves became staff-only codes: **NH** (No Heat) and **NC** (No Cool).

## Second case: Marcus Webb — No Cool (`scenarios/webb-nocool.json`)

Mirrors the No Heat scenario's structure (customer-lookup + name/address/system/job fields, same dropdown option lists) with the cooling-side answers: System Type **Air Conditioner**, Job Type **No Cool**.

- Customer: **Marcus Webb**, 233 Post Street, San Francisco, CA 94108 (Union Square — real address, verified live against the Address Validation API). Single accepted customer, unlike NH's five interchangeable ones.
- Deliberate contrast with NH: Webb's directory record is **current**, so the prefilled address is correct as-is. NH keeps the stale-directory trap; NC rewards the directory flow working normally. Staff briefing spells this out.
- Decoy: the briefing has Webb mentioning he checked his thermostat (set to cool, fresh batteries) — bait toward "Thermostat" / "Thermostat Install", both wrong. "No Heat" remains as the seasonal-opposite decoy.

## Priya VPN retired

`priya-vpn.json` (the original IT-themed scenario, pre-HVAC-rebrand) is removed from `RAW_SCENARIOS` so the switcher shows exactly NH and NC. The JSON stays on disk; re-importing it in `lib/scenarios.ts` brings it back. A `localStorage` value pointing at the retired id falls back to the default scenario (guarded by the existing `SCENARIOS.some(...)` check).

Verified end-to-end in the running app: switcher renders ["NH", "NC"]; NC flow (directory → select Webb → prefill correct → Air Conditioner + No Cool) submits a ticket; wrong Job Type (No Heat) on the NC case is blocked by grading; NH still loads after switching back.
