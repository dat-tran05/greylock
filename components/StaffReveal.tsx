"use client";

import { ADDRESS_FIELD_KEY, FieldType, NEW_CUSTOMER_VALUE } from "../lib/grading";
import { gradeSubmission } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";
import { findCustomer } from "../lib/customers";

function customerDisplayName(customerId: string | null | undefined): string {
  if (!customerId) return "(blank)";
  if (customerId === NEW_CUSTOMER_VALUE) return "New Customer";
  return findCustomer(customerId)?.name ?? `Unknown (${customerId})`;
}

function acceptedCustomersDisplay(correctCustomerId: string | string[] | null): string {
  if (correctCustomerId === null) return "New Customer";
  const ids = Array.isArray(correctCustomerId) ? correctCustomerId : [correctCustomerId];
  return `${ids.map((id) => customerDisplayName(id)).join(", ")} (existing)`;
}

export function StaffReveal({
  scenario,
  submission,
  ticketNumber,
  onNewTicket,
}: {
  scenario: ScenarioData;
  submission: Record<string, string> | null;
  ticketNumber: string | null;
  onNewTicket: () => void;
}) {
  if (!submission) {
    return (
      <div className="screen">
        <p>No submission yet.</p>
        <div className="button-row">
          <button type="button" onClick={onNewTicket}>New Ticket</button>
        </div>
      </div>
    );
  }

  const { results, score } = gradeSubmission(scenario.fields, submission);
  const approve = score === scenario.fields.length;

  const customerField = scenario.fields.find((f) => f.type === FieldType.CustomerLookup);
  const submittedCustomerId = customerField ? submission[customerField.key] : undefined;
  const selectedCustomer =
    submittedCustomerId && submittedCustomerId !== NEW_CUSTOMER_VALUE ? findCustomer(submittedCustomerId) : undefined;

  return (
    <div className="screen">
      <p>{`Ticket #${ticketNumber} — Score: ${score}/${scenario.fields.length}`}</p>
      <table>
        <thead>
          <tr><th>Field</th><th>Submitted</th><th>Correct</th><th></th></tr>
        </thead>
        <tbody>
          {scenario.fields.map((field) => {
            let correctDisplay: string;
            let submittedValue: string;
            if (field.type === FieldType.Text) {
              correctDisplay =
                field.key === ADDRESS_FIELD_KEY
                  ? "Any valid address (Google Maps verified)"
                  : field.deriveFromCustomer && selectedCustomer
                  ? selectedCustomer[field.deriveFromCustomer]
                  : field.correctDisplay;
              submittedValue = submission[field.key]?.trim() ? submission[field.key] : "(blank)";
            } else if (field.type === FieldType.Dropdown) {
              correctDisplay = field.correct;
              submittedValue = submission[field.key]?.trim() ? submission[field.key] : "(blank)";
            } else {
              correctDisplay = acceptedCustomersDisplay(field.correctCustomerId);
              submittedValue = customerDisplayName(submission[field.key]);
            }
            return (
              <tr key={field.key}>
                <td>{field.label}</td>
                <td>{submittedValue}</td>
                <td>{correctDisplay}</td>
                <td>{results[field.key] ? "✓" : "✗"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={`banner ${approve ? "approve" : "deny"}`}>
        {approve ? "APPROVE — hand over a ticket" : "DENY — close but not quite"}
      </div>
      <div className="button-row">
        <button type="button" onClick={onNewTicket}>New Ticket</button>
      </div>
    </div>
  );
}
