import { FieldType, type FieldDef } from "./grading";
import marcusNoHeatRaw from "../scenarios/marcus-noheat.json";
import webbNoCoolRaw from "../scenarios/webb-nocool.json";

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
    if (raw.placeholder !== undefined && typeof raw.placeholder !== "string") {
      throw new Error(`Invalid text field "${raw.key}": placeholder must be a string`);
    }
    if (raw.deriveFromCustomer !== undefined && raw.deriveFromCustomer !== "name" && raw.deriveFromCustomer !== "address") {
      throw new Error(`Invalid text field "${raw.key}": deriveFromCustomer must be "name" or "address"`);
    }
    return {
      key: raw.key,
      label: raw.label,
      type: FieldType.Text,
      correctTokens: raw.correctTokens,
      correctDisplay: raw.correctDisplay,
      placeholder: raw.placeholder,
      deriveFromCustomer: raw.deriveFromCustomer,
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
  if (raw.type === FieldType.CustomerLookup) {
    const isValidCorrectCustomerId =
      raw.correctCustomerId === null ||
      typeof raw.correctCustomerId === "string" ||
      (Array.isArray(raw.correctCustomerId) && raw.correctCustomerId.every((id: unknown) => typeof id === "string"));
    if (!isValidCorrectCustomerId) {
      throw new Error(`Invalid customer-lookup field "${raw.key}": correctCustomerId must be a string, string[], or null`);
    }
    return {
      key: raw.key,
      label: raw.label,
      type: FieldType.CustomerLookup,
      correctCustomerId: raw.correctCustomerId,
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

// priya-vpn.json (the original IT-themed scenario) is retired from the live
// registry but kept on disk; re-import it here to bring it back.
const RAW_SCENARIOS: unknown[] = [marcusNoHeatRaw, webbNoCoolRaw];

export const SCENARIOS: ScenarioEntry[] = buildScenarioRegistry(RAW_SCENARIOS);
