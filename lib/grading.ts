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
