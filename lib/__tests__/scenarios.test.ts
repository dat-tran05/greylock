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
