"use client";

import { FieldType } from "../lib/grading";
import { gradeSubmission } from "../lib/grading";
import type { ScenarioData } from "../lib/scenarios";

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

  return (
    <div className="screen">
      <p>{`Ticket #${ticketNumber} — Score: ${score}/${scenario.fields.length}`}</p>
      <table>
        <thead>
          <tr><th>Field</th><th>Submitted</th><th>Correct</th><th></th></tr>
        </thead>
        <tbody>
          {scenario.fields.map((field) => {
            const correctDisplay = field.type === FieldType.Text ? field.correctDisplay : field.correct;
            const submittedValue = submission[field.key]?.trim() ? submission[field.key] : "(blank)";
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
