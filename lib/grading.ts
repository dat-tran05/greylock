import { findCustomer, type CustomerRecord } from "./customers";

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
  // When set, correctness is derived from whichever customer record was
  // selected via the customer-lookup field (name/address must match that
  // customer's own data) instead of the static correctTokens/correctDisplay
  // above. Falls back to correctTokens/correctDisplay when no valid existing
  // customer is selected (e.g. the "new customer" path).
  deriveFromCustomer?: "name" | "address";
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
  // A single accepted customer id, a list of equally-acceptable ids, or null
  // (meaning the correct answer is "new customer, not in the directory").
  correctCustomerId: string | string[] | null;
}

export type FieldDef = TextFieldDef | DropdownFieldDef | CustomerLookupFieldDef;

// Canonical spellings for words players plausibly abbreviate or expand when
// typing an address. Both the typed value and the expected answer are mapped,
// so customer records may store either form ("Street" or "St", "CA" or
// "California"). Whole-word matches only — "st" as a street suffix, not "st"
// inside another word.
const WORD_ALIASES: Record<string, string> = {
  st: "street",
  ave: "avenue",
  av: "avenue",
  blvd: "boulevard",
  rd: "road",
  dr: "drive",
  ln: "lane",
  ct: "court",
  pl: "place",
  hwy: "highway",
  pkwy: "parkway",
  sq: "square",
  ter: "terrace",
  cir: "circle",
  california: "ca",
};

export function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => WORD_ALIASES[word] ?? word)
    .join(" ");
}

function gradeTextField(value: string, field: TextFieldDef, customer: CustomerRecord | undefined): boolean {
  // The form validates service addresses asynchronously with Google Maps before
  // accepting a submission. The synchronous scenario grader only needs to
  // ensure an address was supplied; matching a scenario/customer address here
  // would incorrectly reject other real, Google-validated addresses.
  if (field.key === ADDRESS_FIELD_KEY) {
    return value.trim().length > 0;
  }
  if (field.deriveFromCustomer && customer) {
    const expected = field.deriveFromCustomer === "name" ? customer.name : customer.address;
    return normalize(value).includes(normalize(expected));
  }
  const normalized = normalize(value);
  return field.correctTokens.every((token) => normalized.includes(normalize(token)));
}

export function gradeField(value: string, field: FieldDef, customer?: CustomerRecord): boolean {
  switch (field.type) {
    case FieldType.Text:
      return gradeTextField(value, field, customer);
    case FieldType.Dropdown:
      return value === field.correct;
    case FieldType.CustomerLookup: {
      const accepted = field.correctCustomerId;
      if (accepted === null) return value === NEW_CUSTOMER_VALUE;
      if (Array.isArray(accepted)) return accepted.includes(value);
      return value === accepted;
    }
  }
}

export interface GradeResult {
  results: Record<string, boolean>;
  score: number;
}

export function gradeSubmission(fields: FieldDef[], submission: Record<string, string>): GradeResult {
  const customerField = fields.find((f): f is CustomerLookupFieldDef => f.type === FieldType.CustomerLookup);
  const submittedCustomerId = customerField ? submission[customerField.key] : undefined;
  const customer =
    submittedCustomerId && submittedCustomerId !== NEW_CUSTOMER_VALUE ? findCustomer(submittedCustomerId) : undefined;

  const results: Record<string, boolean> = {};
  for (const field of fields) {
    results[field.key] = gradeField(submission[field.key] ?? "", field, customer);
  }
  const score = Object.values(results).filter(Boolean).length;
  return { results, score };
}
