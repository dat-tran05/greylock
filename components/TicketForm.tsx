"use client";

import { useState, FormEvent } from "react";
import { FieldType, NEW_CUSTOMER_VALUE, ADDRESS_FIELD_KEY } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";
import { findCustomer } from "../lib/customers";

const INVALID_ADDRESS_ERROR = "Input not valid — please check and try again";
const MISSING_FIELDS_ERROR = "Please fill in every field before submitting";

export function TicketForm({
  scenario,
  values,
  onValueChange,
  onSubmit,
  onRequestDirectory,
}: {
  scenario: ScenarioData;
  values: Record<string, string>;
  onValueChange: (key: string, value: string) => void;
  onSubmit: (submission: Record<string, string>) => void;
  onRequestDirectory: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const customerField = scenario.fields.find((f) => f.type === FieldType.CustomerLookup);
  const customerResolved = !customerField || !!values[customerField.key];

  function setValue(key: string, value: string) {
    onValueChange(key, value);
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

  if (customerField && !customerResolved) {
    return (
      <div className="screen">
        <p>Is this regarding an existing customer?</p>
        <div className="button-row">
          <button type="button" onClick={onRequestDirectory}>
            Search Directory
          </button>
          <button type="button" onClick={() => setValue(customerField.key, NEW_CUSTOMER_VALUE)}>
            No — New Customer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`screen${errorMessage ? " form-error" : ""}`}>
      {customerField && (
        <p className="customer-indicator">
          Customer:{" "}
          {values[customerField.key] === NEW_CUSTOMER_VALUE
            ? "New"
            : (findCustomer(values[customerField.key])?.name ?? "Unknown")}
          {" — "}
          <button type="button" className="link-button" onClick={() => setValue(customerField.key, "")}>
            change
          </button>
        </p>
      )}
      {scenario.fields
        .filter((field) => field.type !== FieldType.CustomerLookup)
        .map((field) => (
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
