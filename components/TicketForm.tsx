"use client";

import { useState, FormEvent } from "react";
import { FieldType } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";

const ADDRESS_FIELD_KEY = "officeAddress";
const INVALID_ADDRESS_ERROR = "Input not valid — please check and try again";
const MISSING_FIELDS_ERROR = "Please fill in every field before submitting";

export function TicketForm({
  scenario,
  onSubmit,
}: {
  scenario: ScenarioData;
  onSubmit: (submission: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const hasEmptyField = scenario.fields.some((field) => !(values[field.key] ?? "").trim());
    if (hasEmptyField) {
      setErrorMessage(MISSING_FIELDS_ERROR);
      return;
    }

    const address = values[ADDRESS_FIELD_KEY].trim();
    setSubmitting(true);
    try {
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const { valid } = await res.json();
      if (!valid) {
        setErrorMessage(INVALID_ADDRESS_ERROR);
        return;
      }
      onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={errorMessage ? "form-error" : ""}>
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
              value={values[field.key] ?? ""}
              onChange={(e) => setValue(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
      {errorMessage && <p className="field-error">{errorMessage}</p>}
      <div className="button-row">
        <button type="submit" disabled={submitting}>
          Submit Ticket
        </button>
      </div>
    </form>
  );
}
