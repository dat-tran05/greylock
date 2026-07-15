import { describe, expect, test } from "vitest";
import { buildScenarioRegistry } from "./scenarios";

const validRaw = {
  id: "test-case",
  name: "TC",
  staffBriefing: "Test briefing",
  fields: [
    { key: "requesterName", label: "Full Name", type: "text", correctTokens: ["a"], correctDisplay: "A" },
  ],
};

describe("buildScenarioRegistry", () => {
  test("parses valid scenarios in order", () => {
    const entries = buildScenarioRegistry([validRaw, { ...validRaw, id: "second", name: "S2" }]);
    expect(entries.map((e) => e.id)).toEqual(["test-case", "second"]);
    expect(entries[0].name).toBe("TC");
  });

  test("skips invalid scenarios but keeps valid ones", () => {
    const entries = buildScenarioRegistry([{ bogus: true }, validRaw]);
    expect(entries.map((e) => e.id)).toEqual(["test-case"]);
  });

  test("throws when no scenario parses (no silent Priya fallback)", () => {
    expect(() => buildScenarioRegistry([])).toThrow();
    expect(() => buildScenarioRegistry([{ bogus: true }])).toThrow();
  });
});
