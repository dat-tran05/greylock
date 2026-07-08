"use client";

import { useState, FormEvent } from "react";
import { FieldType } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";

const ADDRESS_FIELD_KEY = "officeAddress";
const GENERIC_ERROR = "Input not valid — please check and try again";

export function TicketForm({
  scenario,
  onSubmit,
}: {
  scenario: ScenarioData;
  onSubmit: (submission: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [addressError, setAddressError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === ADDRESS_FIELD_KEY) {
      setAddressError(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAddressError(false);

    const address = (values[ADDRESS_FIELD_KEY] ?? "").trim();
    if (!address) {
      setAddressError(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/validate-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const { valid } = await res.json();
      if (!valid) {
        setAddressError(true);
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
              className={field.key === ADDRESS_FIELD_KEY && addressError ? "error-outline" : ""}
              value={values[field.key] ?? ""}
              onChange={(e) => setValue(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
      {addressError && <p className="field-error">{GENERIC_ERROR}</p>}
      <div className="button-row">
        <button type="submit" disabled={submitting}>
          Submit Ticket
        </button>
      </div>
    </form>
  );
}
