# TriageOS Next.js Migration + Address Validation + Multi-Scenario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate TriageOS from a single offline `index.html` to a Next.js app with a backend that validates the Office Address against Google's Address Validation API, plays a dense pixel-fireworks animation on successful submission, and supports multiple JSON-defined scenarios switchable at runtime via a staff dropdown.

**Architecture:** Next.js App Router + TypeScript, one client component (`app/page.tsx`) driving the existing three-screen state machine, one API route (`app/api/validate-address/route.ts`) proxying Google's Address Validation API server-side, scenario content authored as JSON files under `scenarios/` and loaded through a typed registry in `lib/scenarios.ts`.

**Tech Stack:** Next.js (App Router, TypeScript), React, Vitest + React Testing Library for tests, no CSS framework (hand-written Win 3.1 chrome CSS), deployed to Vercel.

## Global Constraints

- No visitor-facing correctness feedback — grading/score stays staff-only, revealed via the existing `Alt+Shift+R` hotkey (per `index.html:336` in the current app — keep this exact hotkey, not `Ctrl+Shift+R`).
- `GOOGLE_MAPS_API_KEY` must never be exposed to the client (no `NEXT_PUBLIC_` prefix), must live only in `.env.local` (gitignored) and Vercel env vars.
- Address validation failures (network error, timeout, bad/missing key, malformed response) must **fail open** — submission proceeds, a warning is logged server-side.
- Empty/whitespace address is blocked client-side without any network call.
- Invalid address shows a generic message ("Input not valid — please check and try again") and a red outline on the Office Address field only — never field-specific detail.
- Scenario field types are limited to `FieldType.Text` and `FieldType.Dropdown` for now, defined as a TypeScript enum, with renderer/grader switching exhaustively over it.
- If the scenario registry ends up empty (all JSON files fail validation), fall back to a hardcoded default scenario so the app never renders blank.
- Fireworks are pure CSS/SVG-driven divs (no canvas/animation library), dense (multiple simultaneous burst points, ~10+ sparks per burst), and play only after a successful (valid-address) submission — never tied to scenario correctness.

---

## File Structure

```
package.json, tsconfig.json, next.config.mjs, vitest.config.ts, vitest.setup.ts, .gitignore
app/
  layout.tsx                    — root layout, sets <title>
  globals.css                   — Win 3.1 chrome + error outline + fireworks + scenario switcher styles
  page.tsx                      — top-level client component: screen state machine, active scenario, hotkey
  api/validate-address/route.ts — thin POST handler wrapping lib/address-validation.ts
lib/
  scenarios.ts                  — FieldType enum, ScenarioData types, parseScenario, buildScenarioRegistry, DEFAULT_SCENARIO
  grading.ts                    — normalize, gradeField, gradeSubmission
  address-validation.ts         — checkAddressValid(address, apiKey, fetchImpl?)
components/
  TicketForm.tsx                — entry screen: renders fields from active scenario, handles submit + validation
  ProcessingScreen.tsx          — "submitted" screen: progress bar animation, ticket text, Fireworks overlay
  StaffReveal.tsx                — staff-only graded table, score, recommendation banner, New Ticket button
  ScenarioSwitcher.tsx          — top-right scenario dropdown, persists to localStorage
  Fireworks.tsx                 — dense pixel-burst animation component
scenarios/
  priya-vpn.json                — default scenario, ported from current hardcoded SCENARIO
```

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx` (placeholder)
- Create: `app/globals.css` (placeholder)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Test: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, and `npm test` for all later tasks to build on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "triageos",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/react-dom @types/node \
  vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```
Expected: `node_modules/` created, `package.json` now has `dependencies`/`devDependencies` populated with resolved versions.

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.next/
.env*.local
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 6: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriageOS 3.1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder `app/page.tsx` and `app/globals.css`**

`app/page.tsx`:
```tsx
export default function Page() {
  return <div>TriageOS loading...</div>;
}
```

`app/globals.css`:
```css
* { box-sizing: border-box; }
body { margin: 0; }
```

- [ ] **Step 8: Create `vitest.config.ts` and `vitest.setup.ts`**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 9: Write a smoke test**

`lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("project scaffold", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 10: Run the smoke test**

Run: `npm test`
Expected: `1 passed`

- [ ] **Step 11: Verify the dev server boots**

Run: `npm run dev` (then Ctrl+C after confirming), or `npm run build`
Expected: `npm run build` completes with no errors, producing a `.next/` directory.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs .gitignore \
  app/layout.tsx app/page.tsx app/globals.css vitest.config.ts vitest.setup.ts \
  lib/__tests__/smoke.test.ts
git commit -m "Scaffold Next.js + Vitest project"
```

---

### Task 2: Grading logic (`lib/grading.ts`)

**Files:**
- Create: `lib/grading.ts`
- Test: `lib/__tests__/grading.test.ts`

**Interfaces:**
- Produces: `FieldType` enum (`Text`, `Dropdown`), `FieldDef` union type (`TextFieldDef | DropdownFieldDef`), `normalize(str: string): string`, `gradeField(value: string, field: FieldDef): boolean`, `gradeSubmission(fields: FieldDef[], submission: Record<string, string>): { results: Record<string, boolean>; score: number }`. Task 3 (`lib/scenarios.ts`) imports `FieldType` and `FieldDef` from this module rather than redefining them.

- [ ] **Step 1: Write the failing test**

`lib/__tests__/grading.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { FieldType, normalize, gradeField, gradeSubmission, type FieldDef } from "../grading";

describe("normalize", () => {
  it("lowercases, strips punctuation, and trims", () => {
    expect(normalize("  Priya, SHAH!  ")).toBe("priya shah");
  });
  it("handles undefined/empty input", () => {
    expect(normalize("")).toBe("");
  });
});

describe("gradeField", () => {
  const textField: FieldDef = {
    key: "officeAddress",
    label: "Office Address",
    type: FieldType.Text,
    correctTokens: ["455", "market"],
    correctDisplay: "455 Market Street",
  };
  const dropdownField: FieldDef = {
    key: "department",
    label: "Department",
    type: FieldType.Dropdown,
    options: ["Finance", "IT"],
    correct: "Finance",
  };

  it("passes a text field when all tokens are present, case/punctuation-insensitive", () => {
    expect(gradeField("455 Market St.", textField)).toBe(true);
    expect(gradeField("market street 455", textField)).toBe(true);
  });
  it("fails a text field missing a token", () => {
    expect(gradeField("455 Mission Street", textField)).toBe(false);
  });
  it("passes a dropdown field on exact match", () => {
    expect(gradeField("Finance", dropdownField)).toBe(true);
  });
  it("fails a dropdown field on mismatch", () => {
    expect(gradeField("IT", dropdownField)).toBe(false);
  });
});

describe("gradeSubmission", () => {
  const fields: FieldDef[] = [
    { key: "requesterName", label: "Requester Name", type: FieldType.Text, correctTokens: ["priya", "shah"], correctDisplay: "Priya Shah" },
    { key: "department", label: "Department", type: FieldType.Dropdown, options: ["Finance", "IT"], correct: "Finance" },
  ];

  it("scores each field and totals correctly", () => {
    const { results, score } = gradeSubmission(fields, { requesterName: "Priya Shah", department: "IT" });
    expect(results).toEqual({ requesterName: true, department: false });
    expect(score).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- grading`
Expected: FAIL — `Cannot find module '../grading'`

- [ ] **Step 3: Write minimal implementation**

`lib/grading.ts`:
```ts
export enum FieldType {
  Text = "text",
  Dropdown = "dropdown",
}

export interface TextFieldDef {
  key: string;
  label: string;
  type: FieldType.Text;
  correctTokens: string[];
  correctDisplay: string;
}

export interface DropdownFieldDef {
  key: string;
  label: string;
  type: FieldType.Dropdown;
  options: string[];
  correct: string;
}

export type FieldDef = TextFieldDef | DropdownFieldDef;

export function normalize(str: string): string {
  return (str || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

export function gradeField(value: string, field: FieldDef): boolean {
  if (field.type === FieldType.Text) {
    const normalized = normalize(value);
    return field.correctTokens.every((token) => normalized.includes(token));
  }
  return value === field.correct;
}

export interface GradeResult {
  results: Record<string, boolean>;
  score: number;
}

export function gradeSubmission(fields: FieldDef[], submission: Record<string, string>): GradeResult {
  const results: Record<string, boolean> = {};
  for (const field of fields) {
    results[field.key] = gradeField(submission[field.key] ?? "", field);
  }
  const score = Object.values(results).filter(Boolean).length;
  return { results, score };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- grading`
Expected: all `grading.test.ts` tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/grading.ts lib/__tests__/grading.test.ts
git commit -m "Add scenario-agnostic grading logic with FieldType enum"
```

---

### Task 3: Scenario types, JSON schema, and registry (`lib/scenarios.ts`)

**Files:**
- Create: `scenarios/priya-vpn.json`
- Create: `lib/scenarios.ts`
- Test: `lib/__tests__/scenarios.test.ts`

**Interfaces:**
- Consumes: `FieldType`, `FieldDef` from `lib/grading.ts` (Task 2).
- Produces: `ScenarioData { id, name, staffBriefing, fields: FieldDef[] }`, `ScenarioEntry { id, name, data: ScenarioData }`, `parseScenario(raw: unknown): ScenarioData`, `buildScenarioRegistry(rawList: unknown[]): ScenarioEntry[]`, `DEFAULT_SCENARIO: ScenarioData`, `SCENARIOS: ScenarioEntry[]` (the live registry built from `scenarios/*.json`).

- [ ] **Step 1: Create the default scenario JSON**

`scenarios/priya-vpn.json`:
```json
{
  "id": "priya-vpn",
  "name": "Priya Shah — VPN Outage",
  "staffBriefing": "Priya Shah from Finance is working from a downtown branch office. Her laptop can't connect to the VPN, which is blocking her from submitting quarterly numbers before today's deadline. She's already restarted her laptop twice — no luck. Everyone else at her branch is fine; it's just her connection.",
  "fields": [
    { "key": "requesterName", "label": "Requester Name", "type": "text", "correctTokens": ["priya", "shah"], "correctDisplay": "Priya Shah" },
    { "key": "department", "label": "Department", "type": "dropdown", "options": ["Finance", "Accounting", "Sales", "Engineering", "Marketing", "HR", "Facilities", "IT"], "correct": "Finance" },
    { "key": "issueCategory", "label": "Issue Category", "type": "dropdown", "options": ["Network/VPN", "Hardware", "Software", "Account Access", "Email", "Printing"], "correct": "Network/VPN" },
    { "key": "priority", "label": "Priority", "type": "dropdown", "options": ["Low", "Medium", "High", "Critical"], "correct": "High" },
    { "key": "officeAddress", "label": "Office Address", "type": "text", "correctTokens": ["455", "market"], "correctDisplay": "455 Market Street" }
  ]
}
```

- [ ] **Step 2: Write the failing test**

`lib/__tests__/scenarios.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { FieldType } from "../grading";
import { parseScenario, buildScenarioRegistry, DEFAULT_SCENARIO } from "../scenarios";
import priyaVpnRaw from "../../scenarios/priya-vpn.json";

describe("parseScenario", () => {
  it("parses a valid scenario", () => {
    const data = parseScenario(priyaVpnRaw);
    expect(data.id).toBe("priya-vpn");
    expect(data.fields).toHaveLength(5);
    expect(data.fields[0].type).toBe(FieldType.Text);
    expect(data.fields[1].type).toBe(FieldType.Dropdown);
  });

  it("throws on an unrecognized field type", () => {
    const bad = { ...priyaVpnRaw, fields: [{ key: "x", label: "X", type: "number" }] };
    expect(() => parseScenario(bad)).toThrow();
  });

  it("throws on a text field missing correctTokens", () => {
    const bad = { ...priyaVpnRaw, fields: [{ key: "x", label: "X", type: "text", correctDisplay: "X" }] };
    expect(() => parseScenario(bad)).toThrow();
  });

  it("throws on a dropdown field missing options", () => {
    const bad = { ...priyaVpnRaw, fields: [{ key: "x", label: "X", type: "dropdown", correct: "A" }] };
    expect(() => parseScenario(bad)).toThrow();
  });
});

describe("buildScenarioRegistry", () => {
  it("includes valid scenarios and skips invalid ones", () => {
    const bad = { id: "bad", name: "Bad", staffBriefing: "x", fields: [{ key: "x", label: "X", type: "nope" }] };
    const entries = buildScenarioRegistry([priyaVpnRaw, bad]);
    expect(entries.map((e) => e.id)).toEqual(["priya-vpn"]);
  });

  it("falls back to DEFAULT_SCENARIO when every raw scenario is invalid", () => {
    const bad = { id: "bad", name: "Bad", staffBriefing: "x", fields: [{ key: "x", label: "X", type: "nope" }] };
    const entries = buildScenarioRegistry([bad]);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(DEFAULT_SCENARIO.id);
  });

  it("falls back to DEFAULT_SCENARIO when the raw list is empty", () => {
    const entries = buildScenarioRegistry([]);
    expect(entries[0].data).toEqual(DEFAULT_SCENARIO);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- scenarios`
Expected: FAIL — `Cannot find module '../scenarios'`

- [ ] **Step 4: Write minimal implementation**

`lib/scenarios.ts`:
```ts
import { FieldType, type FieldDef } from "./grading";
import priyaVpnRaw from "../scenarios/priya-vpn.json";

export interface ScenarioData {
  id: string;
  name: string;
  staffBriefing: string;
  fields: FieldDef[];
}

export interface ScenarioEntry {
  id: string;
  name: string;
  data: ScenarioData;
}

function parseField(raw: any): FieldDef {
  if (raw.type === FieldType.Text) {
    if (!Array.isArray(raw.correctTokens) || typeof raw.correctDisplay !== "string") {
      throw new Error(`Invalid text field "${raw.key}": missing correctTokens/correctDisplay`);
    }
    return {
      key: raw.key,
      label: raw.label,
      type: FieldType.Text,
      correctTokens: raw.correctTokens,
      correctDisplay: raw.correctDisplay,
    };
  }
  if (raw.type === FieldType.Dropdown) {
    if (!Array.isArray(raw.options) || typeof raw.correct !== "string") {
      throw new Error(`Invalid dropdown field "${raw.key}": missing options/correct`);
    }
    return {
      key: raw.key,
      label: raw.label,
      type: FieldType.Dropdown,
      options: raw.options,
      correct: raw.correct,
    };
  }
  throw new Error(`Unknown field type "${raw.type}" for field "${raw.key}"`);
}

export function parseScenario(raw: any): ScenarioData {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.staffBriefing !== "string" ||
    !Array.isArray(raw.fields)
  ) {
    throw new Error("Invalid scenario shape");
  }
  return {
    id: raw.id,
    name: raw.name,
    staffBriefing: raw.staffBriefing,
    fields: raw.fields.map(parseField),
  };
}

export const DEFAULT_SCENARIO: ScenarioData = {
  id: "default-fallback",
  name: "Default (Fallback)",
  staffBriefing:
    "Priya Shah from Finance is working from a downtown branch office. Her laptop can't connect to the VPN, which is blocking her from submitting quarterly numbers before today's deadline.",
  fields: [
    { key: "requesterName", label: "Requester Name", type: FieldType.Text, correctTokens: ["priya", "shah"], correctDisplay: "Priya Shah" },
    { key: "department", label: "Department", type: FieldType.Dropdown, options: ["Finance", "IT"], correct: "Finance" },
    { key: "issueCategory", label: "Issue Category", type: FieldType.Dropdown, options: ["Network/VPN", "Hardware"], correct: "Network/VPN" },
    { key: "priority", label: "Priority", type: FieldType.Dropdown, options: ["Low", "High"], correct: "High" },
    { key: "officeAddress", label: "Office Address", type: FieldType.Text, correctTokens: ["455", "market"], correctDisplay: "455 Market Street" },
  ],
};

export function buildScenarioRegistry(rawList: unknown[]): ScenarioEntry[] {
  const entries: ScenarioEntry[] = [];
  for (const raw of rawList) {
    try {
      const data = parseScenario(raw);
      entries.push({ id: data.id, name: data.name, data });
    } catch (err) {
      console.warn("Skipping invalid scenario:", err);
    }
  }
  if (entries.length === 0) {
    entries.push({ id: DEFAULT_SCENARIO.id, name: DEFAULT_SCENARIO.name, data: DEFAULT_SCENARIO });
  }
  return entries;
}

const RAW_SCENARIOS: unknown[] = [priyaVpnRaw];

export const SCENARIOS: ScenarioEntry[] = buildScenarioRegistry(RAW_SCENARIOS);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- scenarios`
Expected: all `scenarios.test.ts` tests PASS

- [ ] **Step 6: Commit**

```bash
git add scenarios/priya-vpn.json lib/scenarios.ts lib/__tests__/scenarios.test.ts
git commit -m "Add JSON scenario schema, parser, and registry with default fallback"
```

---

### Task 4: Address validation logic (`lib/address-validation.ts`)

**Files:**
- Create: `lib/address-validation.ts`
- Test: `lib/__tests__/address-validation.test.ts`

**Interfaces:**
- Produces: `checkAddressValid(address: string, apiKey: string | undefined, fetchImpl?: typeof fetch): Promise<boolean>`

- [ ] **Step 1: Write the failing test**

`lib/__tests__/address-validation.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { checkAddressValid } from "../address-validation";

function mockFetch(response: { ok: boolean; status?: number; json?: () => Promise<any> }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: response.json ?? (async () => ({})),
  }) as unknown as typeof fetch;
}

describe("checkAddressValid", () => {
  it("returns false for an empty/whitespace address without calling fetch", async () => {
    const fetchImpl = vi.fn();
    const valid = await checkAddressValid("   ", "key", fetchImpl as unknown as typeof fetch);
    expect(valid).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails open when the API key is missing", async () => {
    const fetchImpl = vi.fn();
    const valid = await checkAddressValid("455 Market Street", undefined, fetchImpl as unknown as typeof fetch);
    expect(valid).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns true when Google confirms the address", async () => {
    const fetchImpl = mockFetch({
      ok: true,
      json: async () => ({ result: { verdict: { addressComplete: true } } }),
    });
    const valid = await checkAddressValid("455 Market Street", "key", fetchImpl);
    expect(valid).toBe(true);
  });

  it("returns false when Google marks the address incomplete", async () => {
    const fetchImpl = mockFetch({
      ok: true,
      json: async () => ({ result: { verdict: { addressComplete: false, validationGranularity: "OTHER" } } }),
    });
    const valid = await checkAddressValid("asdkfj", "key", fetchImpl);
    expect(valid).toBe(false);
  });

  it("fails open on a non-OK HTTP response", async () => {
    const fetchImpl = mockFetch({ ok: false, status: 500 });
    const valid = await checkAddressValid("455 Market Street", "key", fetchImpl);
    expect(valid).toBe(true);
  });

  it("fails open when fetch throws (network error/timeout)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;
    const valid = await checkAddressValid("455 Market Street", "key", fetchImpl);
    expect(valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- address-validation`
Expected: FAIL — `Cannot find module '../address-validation'`

- [ ] **Step 3: Write minimal implementation**

`lib/address-validation.ts`:
```ts
export async function checkAddressValid(
  address: string,
  apiKey: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  const trimmed = address.trim();
  if (!trimmed) {
    return false;
  }
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY is missing; failing open on address validation");
    return true;
  }

  try {
    const res = await fetchImpl(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: { addressLines: [trimmed] } }),
      }
    );

    if (!res.ok) {
      console.warn(`Address Validation API returned HTTP ${res.status}; failing open`);
      return true;
    }

    const data = await res.json();
    const verdict = data?.result?.verdict;
    if (!verdict) {
      console.warn("Address Validation API returned an unexpected shape; failing open");
      return true;
    }

    if (verdict.addressComplete === true) return true;
    if (verdict.validationGranularity === "PREMISE" || verdict.validationGranularity === "SUB_PREMISE") return true;
    return false;
  } catch (err) {
    console.warn("Address Validation API call failed; failing open", err);
    return true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- address-validation`
Expected: all `address-validation.test.ts` tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/address-validation.ts lib/__tests__/address-validation.test.ts
git commit -m "Add fail-open Google Address Validation API client"
```

---

### Task 5: API route (`app/api/validate-address/route.ts`)

**Files:**
- Create: `app/api/validate-address/route.ts`
- Test: `app/api/validate-address/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `checkAddressValid` from `lib/address-validation.ts` (Task 4).
- Produces: `POST /api/validate-address` accepting `{ address: string }`, responding `{ valid: boolean }`.

- [ ] **Step 1: Write the failing test**

`app/api/validate-address/__tests__/route.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import * as addressValidation from "../../../../lib/address-validation";

describe("POST /api/validate-address", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns { valid: true } when checkAddressValid resolves true", async () => {
    vi.spyOn(addressValidation, "checkAddressValid").mockResolvedValue(true);
    const request = new Request("http://localhost/api/validate-address", {
      method: "POST",
      body: JSON.stringify({ address: "455 Market Street" }),
    });
    const response = await POST(request as any);
    const body = await response.json();
    expect(body).toEqual({ valid: true });
  });

  it("returns { valid: false } when checkAddressValid resolves false", async () => {
    vi.spyOn(addressValidation, "checkAddressValid").mockResolvedValue(false);
    const request = new Request("http://localhost/api/validate-address", {
      method: "POST",
      body: JSON.stringify({ address: "asdkfj" }),
    });
    const response = await POST(request as any);
    const body = await response.json();
    expect(body).toEqual({ valid: false });
  });

  it("treats a missing/malformed body as an empty address", async () => {
    const spy = vi.spyOn(addressValidation, "checkAddressValid").mockResolvedValue(false);
    const request = new Request("http://localhost/api/validate-address", {
      method: "POST",
      body: "not json",
    });
    await POST(request as any);
    expect(spy).toHaveBeenCalledWith("", expect.anything());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- route.test`
Expected: FAIL — `Cannot find module '../route'`

- [ ] **Step 3: Write minimal implementation**

`app/api/validate-address/route.ts`:
```ts
import { NextResponse } from "next/server";
import { checkAddressValid } from "@/lib/address-validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? body.address : "";
  const valid = await checkAddressValid(address, process.env.GOOGLE_MAPS_API_KEY);
  return NextResponse.json({ valid });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- route.test`
Expected: all route tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/validate-address/route.ts app/api/validate-address/__tests__/route.test.ts
git commit -m "Add /api/validate-address route"
```

---

### Task 6: Fireworks animation component

**Files:**
- Create: `components/Fireworks.tsx`
- Modify: `app/globals.css` (append fireworks styles)
- Test: `components/__tests__/Fireworks.test.tsx`

**Interfaces:**
- Produces: `<Fireworks active: boolean />` — a React component that, when `active` becomes `true`, renders a dense burst of pixel sparks over its container and self-clears after the animation completes; renders nothing when `active` is `false`.

- [ ] **Step 1: Write the failing test**

`components/__tests__/Fireworks.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Fireworks } from "../Fireworks";

describe("Fireworks", () => {
  it("renders no sparks when inactive", () => {
    const { container } = render(<Fireworks active={false} />);
    expect(container.querySelectorAll(".spark").length).toBe(0);
  });

  it("renders a dense burst (at least 40 sparks across multiple burst points) when active", () => {
    const { container } = render(<Fireworks active={true} />);
    expect(container.querySelectorAll(".spark").length).toBeGreaterThanOrEqual(40);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Fireworks`
Expected: FAIL — `Cannot find module '../Fireworks'`

- [ ] **Step 3: Write minimal implementation**

`components/Fireworks.tsx`:
```tsx
"use client";

import { useMemo } from "react";

const SPARK_COLORS = ["#ff0000", "#ffff00", "#00ffff", "#ff00ff", "#00ff00"];
const BURST_POINTS = [
  { x: 20, y: 20 },
  { x: 80, y: 15 },
  { x: 50, y: 35 },
  { x: 15, y: 60 },
  { x: 85, y: 55 },
];
const SPARKS_PER_BURST = 10;

interface Spark {
  id: string;
  left: string;
  top: string;
  color: string;
  dx: number;
  dy: number;
  delay: number;
}

function buildSparks(): Spark[] {
  const sparks: Spark[] = [];
  BURST_POINTS.forEach((point, burstIndex) => {
    for (let i = 0; i < SPARKS_PER_BURST; i++) {
      const angle = (Math.PI * 2 * i) / SPARKS_PER_BURST;
      const dist = 30 + Math.random() * 25;
      sparks.push({
        id: `${burstIndex}-${i}`,
        left: `${point.x}%`,
        top: `${point.y}%`,
        color: SPARK_COLORS[(burstIndex + i) % SPARK_COLORS.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: burstIndex * 0.15,
      });
    }
  });
  return sparks;
}

export function Fireworks({ active }: { active: boolean }) {
  const sparks = useMemo(() => (active ? buildSparks() : []), [active]);

  if (!active) return null;

  return (
    <div className="fireworks-overlay">
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="spark"
          style={{
            left: spark.left,
            top: spark.top,
            background: spark.color,
            animationDelay: `${spark.delay}s`,
            ["--dx" as any]: `${spark.dx}px`,
            ["--dy" as any]: `${spark.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- Fireworks`
Expected: all `Fireworks.test.tsx` tests PASS

- [ ] **Step 5: Append fireworks CSS**

Append to `app/globals.css`:
```css
.fireworks-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.spark {
  position: absolute;
  width: 6px;
  height: 6px;
  animation: spark-burst 1.1s ease-out forwards;
}
@keyframes spark-burst {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; }
}
```

- [ ] **Step 6: Commit**

```bash
git add components/Fireworks.tsx components/__tests__/Fireworks.test.tsx app/globals.css
git commit -m "Add dense pixel-fireworks animation component"
```

---

### Task 7: TicketForm component (entry screen + validation)

**Files:**
- Create: `components/TicketForm.tsx`
- Modify: `app/globals.css` (append form + error-outline styles)
- Test: `components/__tests__/TicketForm.test.tsx`

**Interfaces:**
- Consumes: `ScenarioData`, `FieldType` from `lib/scenarios.ts` / `lib/grading.ts` (Tasks 2–3).
- Produces: `<TicketForm scenario: ScenarioData onSubmit: (submission: Record<string, string>) => void />`. Internally: on submit, blocks on empty address client-side; otherwise POSTs to `/api/validate-address`; on `{ valid: false }` sets a red outline + generic error and does not call `onSubmit`; on `{ valid: true }` calls `onSubmit` with all field values keyed by `field.key`.

- [ ] **Step 1: Write the failing test**

`components/__tests__/TicketForm.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TicketForm } from "../TicketForm";
import { FieldType } from "../../lib/grading";
import type { ScenarioData } from "../../lib/scenarios";

const scenario: ScenarioData = {
  id: "test",
  name: "Test Scenario",
  staffBriefing: "briefing",
  fields: [
    { key: "requesterName", label: "Requester Name", type: FieldType.Text, correctTokens: ["a"], correctDisplay: "A" },
    { key: "department", label: "Department", type: FieldType.Dropdown, options: ["Finance", "IT"], correct: "Finance" },
    { key: "officeAddress", label: "Office Address", type: FieldType.Text, correctTokens: ["455"], correctDisplay: "455 Market Street" },
  ],
};

describe("TicketForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a text input for text fields and a select for dropdown fields", () => {
    render(<TicketForm scenario={scenario} onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Requester Name:")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText("Department:")).toBeInstanceOf(HTMLSelectElement);
  });

  it("blocks submission and shows a generic error without calling the API when address is blank", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    const onSubmit = vi.fn();
    render(<TicketForm scenario={scenario} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("Submit Ticket"));
    await waitFor(() => expect(screen.getByText(/Input not valid/i)).toBeInTheDocument());
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submission and shows a generic error when the API reports the address invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ valid: false }),
    } as Response);
    const onSubmit = vi.fn();
    render(<TicketForm scenario={scenario} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Office Address:"), { target: { value: "asdkfj" } });
    fireEvent.click(screen.getByText("Submit Ticket"));
    await waitFor(() => expect(screen.getByText(/Input not valid/i)).toBeInTheDocument());
    expect(screen.getByLabelText("Office Address:").className).toContain("error-outline");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with field values when the API reports the address valid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      json: async () => ({ valid: true }),
    } as Response);
    const onSubmit = vi.fn();
    render(<TicketForm scenario={scenario} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Requester Name:"), { target: { value: "A Person" } });
    fireEvent.change(screen.getByLabelText("Office Address:"), { target: { value: "455 Market Street" } });
    fireEvent.click(screen.getByText("Submit Ticket"));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ requesterName: "A Person", officeAddress: "455 Market Street" })
      )
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TicketForm`
Expected: FAIL — `Cannot find module '../TicketForm'`

- [ ] **Step 3: Write minimal implementation**

`components/TicketForm.tsx`:
```tsx
"use client";

import { useState, FormEvent } from "react";
import { FieldType } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";

const ADDRESS_FIELD_KEY = "officeAddress";
const GENERIC_ERROR = "Input not valid — please check and try again";

export function TicketForm({
  scenario,
  onSubmit,
}: {
  scenario: ScenarioData;
  onSubmit: (submission: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [addressError, setAddressError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAddressError(false);

    const address = (values[ADDRESS_FIELD_KEY] ?? "").trim();
    if (!address) {
      setAddressError(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const { valid } = await res.json();
      if (!valid) {
        setAddressError(true);
        return;
      }
      onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {scenario.fields.map((field) => (
        <div className="field-row" key={field.key}>
          <label htmlFor={field.key}>{field.label}:</label>
          {field.type === FieldType.Dropdown ? (
            <select
              id={field.key}
              value={values[field.key] ?? ""}
              onChange={(e) => setValue(field.key, e.target.value)}
            >
              <option value="">-- select --</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={field.key}
              type="text"
              className={field.key === ADDRESS_FIELD_KEY && addressError ? "error-outline" : ""}
              value={values[field.key] ?? ""}
              onChange={(e) => setValue(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
      {addressError && <p className="field-error">{GENERIC_ERROR}</p>}
      <div className="button-row">
        <button type="submit" disabled={submitting}>
          Submit Ticket
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TicketForm`
Expected: all `TicketForm.test.tsx` tests PASS

- [ ] **Step 5: Append form + error styles**

Append to `app/globals.css`:
```css
.field-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.field-row label { width: 140px; }
input[type=text], select {
  flex: 1;
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  padding: 2px 4px;
  background: #fff;
  font-family: inherit;
  font-size: inherit;
}
input.error-outline { border-color: #aa0000; outline: 2px solid #aa0000; }
.field-error { color: #aa0000; font-size: 12px; margin: 4px 0 0; }
button {
  background: #c0c0c0;
  border: 2px solid;
  border-color: #fff #808080 #808080 #fff;
  padding: 4px 14px;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}
button:active { border-color: #808080 #fff #fff #808080; }
.button-row { text-align: right; }
```

- [ ] **Step 6: Commit**

```bash
git add components/TicketForm.tsx components/__tests__/TicketForm.test.tsx app/globals.css
git commit -m "Add TicketForm with client-side + API address validation"
```

---

### Task 8: ProcessingScreen component (submitted screen + fireworks)

**Files:**
- Create: `components/ProcessingScreen.tsx`
- Modify: `app/globals.css` (append progress bar styles)
- Test: `components/__tests__/ProcessingScreen.test.tsx`

**Interfaces:**
- Consumes: `Fireworks` from `components/Fireworks.tsx` (Task 6).
- Produces: `<ProcessingScreen ticketNumber: string onSettled?: () => void />`. Animates a progress bar to 100% (~1.2s), then shows "Ticket #{ticketNumber} submitted. Please see support staff." with `<Fireworks active={true} />` rendered alongside.

- [ ] **Step 1: Write the failing test**

`components/__tests__/ProcessingScreen.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ProcessingScreen } from "../ProcessingScreen";

describe("ProcessingScreen", () => {
  it("shows the processing state first, then settles on the submitted message with fireworks", async () => {
    render(<ProcessingScreen ticketNumber="4821" />);
    expect(screen.getByText("Processing request...")).toBeInTheDocument();

    await waitFor(
      () => expect(screen.getByText("Ticket #4821 submitted. Please see support staff.")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.queryByText("Processing request...")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".spark").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProcessingScreen`
Expected: FAIL — `Cannot find module '../ProcessingScreen'`

- [ ] **Step 3: Write minimal implementation**

`components/ProcessingScreen.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Fireworks } from "./Fireworks";

export function ProcessingScreen({ ticketNumber }: { ticketNumber: string }) {
  const [pct, setPct] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPct((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setSettled(true);
          return 100;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  if (!settled) {
    return (
      <div className="screen">
        <p>Processing request...</p>
        <div id="progress-bar">
          <div id="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <p>{`Ticket #${ticketNumber} submitted. Please see support staff.`}</p>
      <Fireworks active={true} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ProcessingScreen`
Expected: all `ProcessingScreen.test.tsx` tests PASS

- [ ] **Step 5: Append progress bar styles**

Append to `app/globals.css`:
```css
.screen { padding: 12px; position: relative; }
#progress-bar {
  border: 2px solid;
  border-color: #808080 #fff #fff #808080;
  height: 18px;
  margin: 10px 0;
  background: #fff;
}
#progress-fill { height: 100%; background: #000080; }
```

- [ ] **Step 6: Commit**

```bash
git add components/ProcessingScreen.tsx components/__tests__/ProcessingScreen.test.tsx app/globals.css
git commit -m "Add ProcessingScreen with progress bar and fireworks on settle"
```

---

### Task 9: StaffReveal component

**Files:**
- Create: `components/StaffReveal.tsx`
- Modify: `app/globals.css` (append table/banner styles)
- Test: `components/__tests__/StaffReveal.test.tsx`

**Interfaces:**
- Consumes: `ScenarioData`, `FieldDef` from `lib/scenarios.ts`; `gradeSubmission`, `GradeResult` from `lib/grading.ts`.
- Produces: `<StaffReveal scenario: ScenarioData submission: Record<string,string> | null ticketNumber: string | null onNewTicket: () => void />`. Shows "No submission yet." when `submission` is `null`; otherwise a graded table (Field | Submitted | Correct | ✓/✗), the score, and an APPROVE (score ≥ 4) or DENY (score ≤ 3) banner — note: banner thresholds are out of the scenario's total field count, not hardcoded to 5, so `>= 4` only applies to a 5-field scenario; generalize as `score / fields.length >= 0.8`.

- [ ] **Step 1: Write the failing test**

`components/__tests__/StaffReveal.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffReveal } from "../StaffReveal";
import { FieldType } from "../../lib/grading";
import type { ScenarioData } from "../../lib/scenarios";

const scenario: ScenarioData = {
  id: "test",
  name: "Test",
  staffBriefing: "briefing",
  fields: [
    { key: "requesterName", label: "Requester Name", type: FieldType.Text, correctTokens: ["priya"], correctDisplay: "Priya Shah" },
    { key: "department", label: "Department", type: FieldType.Dropdown, options: ["Finance", "IT"], correct: "Finance" },
  ],
};

describe("StaffReveal", () => {
  it("shows a no-submission notice when submission is null", () => {
    render(<StaffReveal scenario={scenario} submission={null} ticketNumber={null} onNewTicket={vi.fn()} />);
    expect(screen.getByText("No submission yet.")).toBeInTheDocument();
  });

  it("shows a graded table, score, and APPROVE banner for a high score", () => {
    render(
      <StaffReveal
        scenario={scenario}
        submission={{ requesterName: "Priya Shah", department: "Finance" }}
        ticketNumber="4821"
        onNewTicket={vi.fn()}
      />
    );
    expect(screen.getByText("Ticket #4821 — Score: 2/2")).toBeInTheDocument();
    expect(screen.getByText("APPROVE — hand over a ticket")).toBeInTheDocument();
  });

  it("shows a DENY banner for a low score", () => {
    render(
      <StaffReveal
        scenario={scenario}
        submission={{ requesterName: "Wrong", department: "IT" }}
        ticketNumber="4821"
        onNewTicket={vi.fn()}
      />
    );
    expect(screen.getByText("DENY — close but not quite")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- StaffReveal`
Expected: FAIL — `Cannot find module '../StaffReveal'`

- [ ] **Step 3: Write minimal implementation**

`components/StaffReveal.tsx`:
```tsx
"use client";

import { FieldType } from "../lib/grading";
import { gradeSubmission } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";

export function StaffReveal({
  scenario,
  submission,
  ticketNumber,
  onNewTicket,
}: {
  scenario: ScenarioData;
  submission: Record<string, string> | null;
  ticketNumber: string | null;
  onNewTicket: () => void;
}) {
  if (!submission) {
    return (
      <div className="screen">
        <p>No submission yet.</p>
        <div className="button-row">
          <button type="button" onClick={onNewTicket}>New Ticket</button>
        </div>
      </div>
    );
  }

  const { results, score } = gradeSubmission(scenario.fields, submission);
  const approve = score / scenario.fields.length >= 0.8;

  return (
    <div className="screen">
      <p>{`Ticket #${ticketNumber} — Score: ${score}/${scenario.fields.length}`}</p>
      <table>
        <thead>
          <tr><th>Field</th><th>Submitted</th><th>Correct</th><th></th></tr>
        </thead>
        <tbody>
          {scenario.fields.map((field) => {
            const correctDisplay = field.type === FieldType.Text ? field.correctDisplay : field.correct;
            const submittedValue = submission[field.key]?.trim() ? submission[field.key] : "(blank)";
            return (
              <tr key={field.key}>
                <td>{field.label}</td>
                <td>{submittedValue}</td>
                <td>{correctDisplay}</td>
                <td>{results[field.key] ? "✓" : "✗"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={`banner ${approve ? "approve" : "deny"}`}>
        {approve ? "APPROVE — hand over a ticket" : "DENY — close but not quite"}
      </div>
      <div className="button-row">
        <button type="button" onClick={onNewTicket}>New Ticket</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- StaffReveal`
Expected: all `StaffReveal.test.tsx` tests PASS

- [ ] **Step 5: Append table/banner styles**

Append to `app/globals.css`:
```css
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
table th, table td { border: 1px solid #808080; padding: 3px 6px; text-align: left; font-size: 12px; }
.banner { padding: 8px; font-weight: bold; text-align: center; margin-top: 10px; }
.banner.approve { background: #00aa00; color: #fff; }
.banner.deny { background: #aa0000; color: #fff; }
```

- [ ] **Step 6: Commit**

```bash
git add components/StaffReveal.tsx components/__tests__/StaffReveal.test.tsx app/globals.css
git commit -m "Add StaffReveal graded table and recommendation banner"
```

---

### Task 10: ScenarioSwitcher component

**Files:**
- Create: `components/ScenarioSwitcher.tsx`
- Modify: `app/globals.css` (append switcher positioning styles)
- Test: `components/__tests__/ScenarioSwitcher.test.tsx`

**Interfaces:**
- Consumes: `ScenarioEntry[]` from `lib/scenarios.ts`.
- Produces: `<ScenarioSwitcher entries: ScenarioEntry[] activeId: string onChange: (id: string) => void />`. Renders a `<select>` of scenario names only; calling `onChange` is the caller's responsibility for persisting to `localStorage` and resetting the form (handled in Task 11 by the parent).

- [ ] **Step 1: Write the failing test**

`components/__tests__/ScenarioSwitcher.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScenarioSwitcher } from "../ScenarioSwitcher";

const entries = [
  { id: "priya-vpn", name: "Priya Shah — VPN Outage", data: {} as any },
  { id: "second", name: "Second Scenario", data: {} as any },
];

describe("ScenarioSwitcher", () => {
  it("renders every scenario name as an option", () => {
    render(<ScenarioSwitcher entries={entries} activeId="priya-vpn" onChange={vi.fn()} />);
    expect(screen.getByText("Priya Shah — VPN Outage")).toBeInTheDocument();
    expect(screen.getByText("Second Scenario")).toBeInTheDocument();
  });

  it("calls onChange with the selected scenario id", () => {
    const onChange = vi.fn();
    render(<ScenarioSwitcher entries={entries} activeId="priya-vpn" onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "second" } });
    expect(onChange).toHaveBeenCalledWith("second");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ScenarioSwitcher`
Expected: FAIL — `Cannot find module '../ScenarioSwitcher'`

- [ ] **Step 3: Write minimal implementation**

`components/ScenarioSwitcher.tsx`:
```tsx
"use client";

import type { ScenarioEntry } from "../lib/scenarios";

export function ScenarioSwitcher({
  entries,
  activeId,
  onChange,
}: {
  entries: ScenarioEntry[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      className="scenario-switcher"
      value={activeId}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Scenario"
    >
      {entries.map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entry.name}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ScenarioSwitcher`
Expected: all `ScenarioSwitcher.test.tsx` tests PASS

- [ ] **Step 5: Append switcher styles**

Append to `app/globals.css`:
```css
.scenario-switcher {
  position: fixed;
  top: 10px;
  right: 10px;
  font-size: 11px;
  padding: 1px 2px;
  z-index: 10;
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ScenarioSwitcher.tsx components/__tests__/ScenarioSwitcher.test.tsx app/globals.css
git commit -m "Add staff-only scenario switcher dropdown"
```

---

### Task 11: Wire everything together in `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css` (append window chrome + desktop styles, ported from original `index.html`)
- Test: `app/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `SCENARIOS` from `lib/scenarios.ts`; `TicketForm`, `ProcessingScreen`, `StaffReveal`, `ScenarioSwitcher` (Tasks 7–10).
- Produces: the full three-screen app (`entry` → `submitted` → `staff`), `Alt+Shift+R` hotkey to reveal staff screen, "New Ticket" resets to `entry` and clears the last submission, scenario selection persists to `localStorage` key `triageos.scenarioId` and resets the form to `entry` on change.

- [ ] **Step 1: Write the failing test**

`app/__tests__/page.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Page from "../page";

describe("Page", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows 'No submission yet.' on Alt+Shift+R before any submission", () => {
    render(<Page />);
    fireEvent.keyDown(document, { key: "R", altKey: true, shiftKey: true });
    expect(screen.getByText("No submission yet.")).toBeInTheDocument();
  });

  it("submits a valid ticket, then reveals it via Alt+Shift+R, then resets via New Ticket", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({ json: async () => ({ valid: true }) } as Response);
    render(<Page />);

    fireEvent.change(screen.getByLabelText("Requester Name:"), { target: { value: "Priya Shah" } });
    fireEvent.change(screen.getByLabelText("Office Address:"), { target: { value: "455 Market Street" } });
    fireEvent.click(screen.getByText("Submit Ticket"));

    await waitFor(() => expect(screen.getByText(/submitted\. Please see support staff\./)).toBeInTheDocument(), {
      timeout: 3000,
    });

    fireEvent.keyDown(document, { key: "R", altKey: true, shiftKey: true });
    expect(screen.getByText(/Score:/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("New Ticket"));
    expect(screen.getByText("Submit Ticket")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/__tests__/page`
Expected: FAIL (page still renders the Task 1 placeholder `<div>TriageOS loading...</div>`)

- [ ] **Step 3: Write minimal implementation**

`app/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { SCENARIOS } from "../lib/scenarios";
import { TicketForm } from "../components/TicketForm";
import { ProcessingScreen } from "../components/ProcessingScreen";
import { StaffReveal } from "../components/StaffReveal";
import { ScenarioSwitcher } from "../components/ScenarioSwitcher";

const SCENARIO_STORAGE_KEY = "triageos.scenarioId";

type Screen = "entry" | "submitted" | "staff";

export default function Page() {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [screen, setScreen] = useState<Screen>("entry");
  const [lastSubmission, setLastSubmission] = useState<Record<string, string> | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (stored && SCENARIOS.some((s) => s.id === stored)) {
      setActiveScenarioId(stored);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.key.toUpperCase() === "R") {
        event.preventDefault();
        setScreen("staff");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId)!.data;

  function handleScenarioChange(id: string) {
    setActiveScenarioId(id);
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, id);
    setLastSubmission(null);
    setTicketNumber(null);
    setScreen("entry");
  }

  function handleSubmit(submission: Record<string, string>) {
    setLastSubmission(submission);
    setTicketNumber(String(Math.floor(1000 + Math.random() * 9000)));
    setScreen("submitted");
  }

  function handleNewTicket() {
    setLastSubmission(null);
    setTicketNumber(null);
    setScreen("entry");
  }

  return (
    <div id="desktop">
      <ScenarioSwitcher entries={SCENARIOS} activeId={activeScenarioId} onChange={handleScenarioChange} />
      <div id="window">
        <div id="titlebar">
          <span>{screen === "staff" ? "TriageOS 3.1 — Staff Review" : "TriageOS 3.1 — New Ticket"}</span>
        </div>
        <div id="menubar"><span>File</span><span>Edit</span><span>Help</span></div>

        {screen === "entry" && <TicketForm scenario={activeScenario} onSubmit={handleSubmit} />}
        {screen === "submitted" && ticketNumber && <ProcessingScreen ticketNumber={ticketNumber} />}
        {screen === "staff" && (
          <StaffReveal
            scenario={activeScenario}
            submission={lastSubmission}
            ticketNumber={ticketNumber}
            onNewTicket={handleNewTicket}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/__tests__/page`
Expected: all `page.test.tsx` tests PASS

- [ ] **Step 5: Append window chrome + desktop styles**

Append to `app/globals.css`:
```css
body {
  margin: 0;
  height: 100vh;
  background: #008080;
  font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
  font-size: 13px;
}
#desktop { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
#window {
  width: 440px;
  background: #c0c0c0;
  border: 2px solid #dfdfdf;
  box-shadow:
    inset -1px -1px 0 #000,
    inset 1px 1px 0 #fff,
    inset -2px -2px 0 #808080,
    inset 2px 2px 0 #dfdfdf;
  padding: 2px;
}
#titlebar { background: #000080; color: #fff; font-weight: bold; padding: 3px 6px; }
#menubar { background: #c0c0c0; border-bottom: 1px solid #808080; padding: 2px 6px; display: flex; gap: 12px; }
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests across every file PASS

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/__tests__/page.test.tsx app/globals.css
git commit -m "Wire TriageOS screens, scenario switching, and hotkey together in app/page.tsx"
```

---

### Task 12: Environment setup, key rotation note, and legacy file removal

**Files:**
- Create: `.env.local.example`
- Modify: `README.md` (create if it doesn't exist)
- Delete: `index.html`

**Interfaces:** None (config/docs/cleanup only).

- [ ] **Step 1: Create `.env.local.example`**

```
# Copy to .env.local and fill in a real key. Never commit .env.local.
# The key must be restricted (HTTP referrer or IP) and scoped to the
# Address Validation API only, in Google Cloud Console.
GOOGLE_MAPS_API_KEY=
```

- [ ] **Step 2: Create/update `README.md`**

```markdown
# TriageOS

Retro Windows 3.1-styled booth game for the Greylock tech fair, built with Next.js.

## Setup

\`\`\`bash
npm install
cp .env.local.example .env.local
# fill in GOOGLE_MAPS_API_KEY in .env.local — see note below
npm run dev
\`\`\`

## Google Maps API key

> **Note:** an earlier key was pasted into a chat session during design and must be
> treated as compromised. Rotate it in Google Cloud Console, restrict the new key
> (HTTP referrer or IP) to the Address Validation API only, and put it in
> `.env.local` — never commit it.

## Staff runbook

- `Alt+Shift+R` reveals the graded answer key (staff-only) after a submission.
- The scenario dropdown (top-right) switches the active scenario; selection persists
  per booth laptop via `localStorage`.
- Click "New Ticket" before the next visitor approaches to reset the form and hide
  the answer key.

## Adding a new scenario

Add a new JSON file under `scenarios/`, matching the shape of `scenarios/priya-vpn.json`,
then add it to the `RAW_SCENARIOS` array in `lib/scenarios.ts`. It will appear in the
scenario switcher automatically.
```

- [ ] **Step 3: Remove the legacy static file**

```bash
git rm index.html
```

- [ ] **Step 4: Verify the app still builds and passes tests**

Run: `npm run build && npm test`
Expected: build succeeds, all tests PASS

- [ ] **Step 5: Commit**

```bash
git add .env.local.example README.md
git commit -m "Add env setup docs, staff runbook, and remove legacy static index.html"
```

---

## Manual Verification (post-implementation, in-browser)

Once all tasks are complete, manually verify (per the design spec's Testing section) with `npm run dev`:

- All fields render with correct control types and dropdown options for the active scenario.
- Real, valid address → validation passes, dense fireworks play, ticket submits.
- Garbage/unreal address → red outline + generic error, submission blocked.
- Empty address → same red-outline/blocked behavior, no network call (check browser devtools Network tab).
- Temporarily unset `GOOGLE_MAPS_API_KEY` → submission still succeeds (fail-open), warning appears in the server console.
- Correct scenario answers → staff reveal (`Alt+Shift+R`) shows full score and APPROVE; wrong answers show DENY.
- Scenario switcher: selecting a different scenario updates the form and staff-reveal answer key, resets to entry, and persists across a page refresh.
