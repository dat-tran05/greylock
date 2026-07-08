"use client";

import type { ScenarioEntry } from "../lib/scenarios";

export function ScenarioSwitcher({
  entries,
  activeId,
  onChange,
}: {
  entries: ScenarioEntry[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      className="scenario-switcher"
      value={activeId}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Scenario"
    >
      {entries.map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entry.name}
        </option>
      ))}
    </select>
  );
}
