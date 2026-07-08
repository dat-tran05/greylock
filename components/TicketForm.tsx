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
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errorFields.has(key)) {
      setErrorFields((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setErrorMessage(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const emptyFields = scenario.fields
      .map((field) => field.key)
      .filter((key) => !(values[key] ?? "").trim());
    if (emptyFields.length > 0) {
      setErrorFields(new Set(emptyFields));
      setErrorMessage(MISSING_FIELDS_ERROR);
      return;
    }
    setErrorFields(new Set());

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
        setErrorFields(new Set([ADDRESS_FIELD_KEY]));
        setErrorMessage(INVALID_ADDRESS_ERROR);
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
              className={errorFields.has(field.key) ? "error-outline" : ""}
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
              className={errorFields.has(field.key) ? "error-outline" : ""}
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
