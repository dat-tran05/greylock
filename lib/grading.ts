export enum FieldType {
  Text = "text",
  Dropdown = "dropdown",
  CustomerLookup = "customer-lookup",
}

export const NEW_CUSTOMER_VALUE = "NEW";

// Conventional field keys used across scenarios for the customer's name and
// service address — relied on by the live address-validation hook and by
// directory-selection prefill, both of which need to target these fields
// regardless of which scenario is active.
export const NAME_FIELD_KEY = "requesterName";
export const ADDRESS_FIELD_KEY = "officeAddress";

export interface TextFieldDef {
  key: string;
  label: string;
  type: FieldType.Text;
  correctTokens: string[];
  correctDisplay: string;
  placeholder?: string;
}

export interface DropdownFieldDef {
  key: string;
  label: string;
  type: FieldType.Dropdown;
  options: string[];
  correct: string;
}

export interface CustomerLookupFieldDef {
  key: string;
  label: string;
  type: FieldType.CustomerLookup;
  correctCustomerId: string | null;
}

export type FieldDef = TextFieldDef | DropdownFieldDef | CustomerLookupFieldDef;

export function normalize(str: string): string {
  return (str || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

export function gradeField(value: string, field: FieldDef): boolean {
  switch (field.type) {
    case FieldType.Text: {
      const normalized = normalize(value);
      return field.correctTokens.every((token) => normalized.includes(token));
    }
    case FieldType.Dropdown:
      return value === field.correct;
    case FieldType.CustomerLookup:
      return value === (field.correctCustomerId ?? NEW_CUSTOMER_VALUE);
  }
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
