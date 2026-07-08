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
