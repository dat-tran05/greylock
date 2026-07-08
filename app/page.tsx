"use client";

import { useEffect, useState } from "react";
import { SCENARIOS } from "../lib/scenarios";
import { TicketForm } from "../components/TicketForm";
import { ProcessingScreen } from "../components/ProcessingScreen";
import { StaffReveal } from "../components/StaffReveal";
import { ScenarioSwitcher } from "../components/ScenarioSwitcher";

const SCENARIO_STORAGE_KEY = "neticos.scenarioId";

type Screen = "entry" | "submitted" | "staff";

export default function Page() {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [screen, setScreen] = useState<Screen>("entry");
  const [lastSubmission, setLastSubmission] = useState<Record<string, string> | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (stored && SCENARIOS.some((s) => s.id === stored)) {
      setActiveScenarioId(stored);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.key.toUpperCase() === "R") {
        event.preventDefault();
        setScreen("staff");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId)!.data;

  function handleScenarioChange(id: string) {
    setActiveScenarioId(id);
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, id);
    setLastSubmission(null);
    setTicketNumber(null);
    setScreen("entry");
  }

  function handleSubmit(submission: Record<string, string>) {
    setLastSubmission(submission);
    setTicketNumber(String(Math.floor(1000 + Math.random() * 9000)));
    setScreen("submitted");
  }

  function handleNewTicket() {
    setLastSubmission(null);
    setTicketNumber(null);
    setScreen("entry");
  }

  return (
    <div id="desktop">
      <ScenarioSwitcher entries={SCENARIOS} activeId={activeScenarioId} onChange={handleScenarioChange} />
      <div id="window">
        <div id="titlebar">
          <span>{screen === "staff" ? "NeticOS 3.1 — Staff Review" : "NeticOS 3.1 — New Ticket"}</span>
        </div>
        <div id="menubar"><span>File</span><span>Edit</span><span>Help</span></div>

        {screen === "entry" && <TicketForm scenario={activeScenario} onSubmit={handleSubmit} />}
        {screen === "submitted" && ticketNumber && <ProcessingScreen ticketNumber={ticketNumber} />}
        {screen === "staff" && (
          <StaffReveal
            scenario={activeScenario}
            submission={lastSubmission}
            ticketNumber={ticketNumber}
            onNewTicket={handleNewTicket}
          />
        )}
      </div>
    </div>
  );
}
