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
  if (typeof raw?.key !== "string" || typeof raw?.label !== "string") {
    throw new Error(`Invalid field "${raw?.key}": missing/non-string key or label`);
  }
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
