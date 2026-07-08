# NeticOS

Retro Windows 3.1-styled booth game for the Greylock tech fair, built with Next.js.
Default scenario is "Marcus Webb — No Heat", an HVAC job-triage puzzle grounded in
Netic's real home-services data model; "Priya Shah — VPN Outage" is kept as a second,
switchable scenario.

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in GOOGLE_MAPS_API_KEY in .env.local — see note below
npm run dev
```

## Google Maps API key

> **Note:** an earlier key was pasted into a chat session during design and must be
> treated as compromised. Rotate it in Google Cloud Console, restrict the new key
> (HTTP referrer or IP) to the Address Validation API only, and put it in
> `.env.local` — never commit it.

## Staff runbook

- `Cmd+Shift+G` reveals the graded answer key (staff-only) after a submission.
- The scenario dropdown (top-right) switches the active scenario; selection persists
  per booth laptop via `localStorage`.
- Click "New Ticket" before the next visitor approaches to reset the form and hide
  the answer key.

## Adding a new scenario

Add a new JSON file under `scenarios/`, matching the shape of `scenarios/marcus-noheat.json`,
then add it to the `RAW_SCENARIOS` array in `lib/scenarios.ts`. It will appear in the
scenario switcher automatically. The first entry in `RAW_SCENARIOS` is the default active
scenario on load.
