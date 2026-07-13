# Customer Directory + Existing/New Customer Flow — Design Spec

## Purpose

Add a searchable customer directory (grounded in the real `confirm_location`/`create_location` distinction from Netic's roadrunner triage flow) and a branching New Ticket flow: check whether the visitor's roleplay is about an existing customer (search directory, select, prefill Name/Address) or a new one (blank manual entry, as today). Correctly resolving this becomes a graded dimension of the puzzle, not just UI flavor.

## Non-goals

- No persistence — submitting a "new customer" ticket does not add them to the directory for future visitors. The directory is static seed data.
- No backend/API — the directory is a small in-browser array; search is client-side substring matching, no network call.
- No fuzzy/typo-tolerant search.
- Phone number is directory search/display metadata only — it is not reintroduced as a typed, graded ticket field (that was explicitly removed).

## Data model

`data/customers.json` — one shared, global directory (not per-scenario), loaded by `lib/customers.ts` mirroring `lib/scenarios.ts`'s parse-with-fallback pattern (malformed/missing data falls back to an empty list rather than crashing):

```ts
interface CustomerRecord { id: string; name: string; phone: string; address: string; }
```

Seeded with 12 records: Dat Tran (matching the "Dat Tran — No Heat" scenario's correct Name/Address answers), Priya Shah (ties the two existing scenarios into one shared world — pure flavor, no functional effect on her VPN scenario since it doesn't use this feature), plus SF-area decoys including one deliberately similar-sounding name ("Dan Tran") so search actually tests careful listening rather than "type the first three letters and grab the first result."

## Schema extension

New `FieldType.CustomerLookup = "customer-lookup"` added to the enum in `lib/grading.ts` (additive — the enum was explicitly designed for this: "extending the enum plus one switch arm in each, not restructuring the schema"):

```ts
interface CustomerLookupFieldDef {
  key: string;
  label: string;
  type: FieldType.CustomerLookup;
  correctCustomerId: string | string[] | null; // null = "new customer" is correct; string[] = any of these ids are equally correct
}
```

`FieldDef` union gains this variant. `gradeField` gains a matching switch arm: the submission value for this field is either a customer id (e.g. `"dat-tran"`) or the literal string `"NEW"`; correct iff it equals a single `correctCustomerId`, is included in a `correctCustomerId` array, or (when `null`) equals `"NEW"`. `lib/scenarios.ts`'s `parseField` gains matching validation (require `correctCustomerId` to be a string, an array of strings, or `null`).

This becomes a scenario's 5th graded field when present. Priya's scenario simply omits it — her flow, rendering, and grading are entirely unaffected. `scenarios/marcus-noheat.json` accepts any of 5 interchangeable customers (per follow-up direction — see "Interchangeable customers" below), as the first field:

```json
{ "key": "customerId", "label": "Customer", "type": "customer-lookup", "correctCustomerId": ["dat-tran", "sameer-das", "davin-jeong", "cassie-wu", "jessica-zhu"] }
```

### Interchangeable customers (follow-up)

Accepting multiple customer ids as correct raised a question: if a visitor selects, say, Jessica Zhu instead of Dat Tran, should Full Name/Service Address then grade against Jessica's own record, or stay fixed to Dat Tran's? Confirmed: whichever approved customer is selected becomes the reference for Name/Address too — all 5 are fully interchangeable, and correctly identifying any one of them as "the existing customer" is a full pass.

This required `TextFieldDef` to gain an optional `deriveFromCustomer?: "name" | "address"` flag. When set and a valid (non-`"NEW"`) customer is selected, that field's correctness compares the submitted value against `selectedCustomer.name`/`selectedCustomer.address` (via the same lenient `normalize(...).includes(...)` check) instead of the field's static `correctTokens`. It falls back to the static `correctTokens`/`correctDisplay` when no valid customer is selected (e.g. the "new customer" path) — which for this scenario is always the wrong path anyway, since all 5 accepted people are already in the directory.

This makes `gradeField`/`gradeSubmission` cross-field-aware for the first time: `gradeSubmission` resolves the submitted customer-lookup value once, looks up the matching `CustomerRecord`, and threads it into every subsequent `gradeField` call so `deriveFromCustomer` fields can reference it. `lib/grading.ts` now imports `lib/customers.ts` (no cycle — `customers.ts` has no dependency back on `grading.ts`).

`components/StaffReveal.tsx` updated to match: the Customer field's "correct" column lists all accepted names (e.g. "Dat Tran, Sameer Das, Davin Jeong, Cassie Wu, Jessica Zhu (existing)"), and a `deriveFromCustomer` text field's "correct" column shows the actually-selected customer's real name/address when one was chosen, falling back to the static `correctDisplay` otherwise.

Verified (via `gradeSubmission` directly): all 5 accepted customers submitted with their own real info each score 5/5; a directory customer *not* in the accepted list (Priya Shah) fails only the Customer field (4/5); selecting an accepted customer but typing a different accepted customer's name/address fails Name and Address independently (3/5); the "new customer" path fails the Customer field since all 5 approved people are already in the directory (4/5). Priya's own scenario (no customer-lookup field at all) regression-checked unaffected.

The approve threshold (`score === fields.length`, unchanged) now requires all 5 correct for this scenario, not 4.

## New Ticket flow

Ticket field values move from `TicketForm`'s internal state up to `app/page.tsx` (as `ticketValues`), since both the ticket form and the directory tab need to read/write the same in-progress submission and coordinate a tab switch.

If the active scenario has a `customer-lookup` field and it isn't resolved yet (`ticketValues[field.key]` unset), the New Ticket tab shows a branching prompt instead of the full field list: **"Is this regarding an existing customer?"** with **[Search Directory]** (switches `activeTab` to `"directory"`) and **[No — New Customer]** (sets the field to `"NEW"` directly, no tab switch, reveals the rest of the form for manual entry).

Once resolved (either way), the rest of the scenario's fields render normally below a small "Customer: Dat Tran (existing) — change" indicator (or "Customer: New — change"). "change" clears the field back to unresolved and re-shows the branching prompt; it does not clear the other already-filled fields. If resolved via directory pick, Name/Address are prefilled from the record but remain editable — grading always runs against the actual current value, prefilled or typed, so overtyping a prefilled value still grades normally.

The customer-lookup field itself is never rendered as a plain text/select input in the fields list — `TicketForm` skips it in the normal render loop and handles it via the branching prompt / indicator instead.

## Customer Directory tab

New `components/CustomerDirectory.tsx`: a search box filtering `CUSTOMERS` by case-insensitive substring match across name/phone/address, a results table (Name | Phone | Address | Select), and an always-visible "New Customer" button for the no-match case. Selecting a row calls `onSelectCustomer(record.id)`; "New Customer" calls `onSelectCustomer("NEW")`. Both set the scenario's customer-lookup field in `ticketValues` and switch `activeTab` back to `"ticket"` (select-and-jump).

## Tabs UI

Two flat rectangular tabs in a strip above the titlebar — "New Ticket" / "Customer Directory" — built from the same beveled Win-chrome vocabulary as the existing buttons (raised/bordered inactive tab, active tab flush against the window below it with no dividing border). This is the retro-native reading of "website tabs": immediately recognizable as tabs without importing a modern rounded/glossy style that would clash with the rest of the UI. The tab strip only renders while `screen === "entry"` (not during processing/staff-reveal) and only when the active scenario actually has a customer-lookup field — for a scenario without one (Priya's), there is nothing to browse to, so the tab strip doesn't appear and the New Ticket tab behaves exactly as it does today.

## Staff reveal

`components/StaffReveal.tsx` imports `CUSTOMERS` to resolve an id to a display name. For the customer-lookup field's row: submitted column shows the resolved name (or "New Customer" for `"NEW"`, or "(blank)" if unresolved); correct column shows the scenario's expected outcome ("Dat Tran (existing)" or "New Customer" for a `null` `correctCustomerId`).

## Testing

Manual, in-browser (extends the existing checklist):

- Dat Tran scenario: New Ticket tab opens with the branching prompt, not the full form.
- Search Directory → search "tran" → both Dat Tran and the decoy "Dan Tran" appear; search "jackson" → only Dat Tran (address match) appears.
- Selecting Dat Tran jumps back to New Ticket with Name/Address prefilled and editable; submitting with correct System Type + Job Type → staff reveal shows 5/5 and APPROVE.
- Selecting the decoy "Dan Tran" instead → Name/Address prefill to the decoy's (wrong) data; staff reveal shows Customer field and Name/Address all marked wrong.
- "No — New Customer" path → blank Name/Address, typed manually; even with correct info typed, the Customer field itself grades wrong (since Dat Tran actually exists in the directory) — demonstrates the "duplicate record" mistake.
- "change" link resets the branch choice without clearing other fields.
- Switching to Priya's VPN scenario: no tab strip appears, New Ticket form behaves exactly as before this feature.
- `npm run build` succeeds.
