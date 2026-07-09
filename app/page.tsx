"use client";

import { useEffect, useState } from "react";
import { SCENARIOS } from "../lib/scenarios";
import { FieldType, NEW_CUSTOMER_VALUE, NAME_FIELD_KEY, ADDRESS_FIELD_KEY } from "../lib/grading";
import { findCustomer } from "../lib/customers";
import { TicketForm } from "../components/TicketForm";
import { CustomerDirectory } from "../components/CustomerDirectory";
import { ProcessingScreen } from "../components/ProcessingScreen";
import { StaffReveal } from "../components/StaffReveal";
import { ScenarioSwitcher } from "../components/ScenarioSwitcher";

const SCENARIO_STORAGE_KEY = "neticos.scenarioId";

type Screen = "entry" | "submitted" | "staff";
type Tab = "ticket" | "directory";

export default function Page() {
  const [activeScenarioId, setActiveScenarioId] = useState(SCENARIOS[0].id);
  const [screen, setScreen] = useState<Screen>("entry");
  const [activeTab, setActiveTab] = useState<Tab>("ticket");
  const [ticketValues, setTicketValues] = useState<Record<string, string>>({});
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
      if (event.metaKey && event.shiftKey && event.key.toUpperCase() === "G") {
        event.preventDefault();
        setScreen("staff");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId)!.data;
  const customerField = activeScenario.fields.find((f) => f.type === FieldType.CustomerLookup);

  function handleScenarioChange(id: string) {
    setActiveScenarioId(id);
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, id);
    setTicketValues({});
    setActiveTab("ticket");
    setLastSubmission(null);
    setTicketNumber(null);
    setScreen("entry");
  }

  function handleValueChange(key: string, value: string) {
    setTicketValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectCustomer(customerId: string) {
    if (!customerField) return;
    setTicketValues((prev) => {
      const next = { ...prev, [customerField.key]: customerId };
      if (customerId !== NEW_CUSTOMER_VALUE) {
        const record = findCustomer(customerId);
        if (record) {
          next[NAME_FIELD_KEY] = record.name;
          next[ADDRESS_FIELD_KEY] = record.address;
        }
      }
      return next;
    });
    setActiveTab("ticket");
  }

  function handleSubmit(submission: Record<string, string>) {
    setLastSubmission(submission);
    setTicketNumber(String(Math.floor(1000 + Math.random() * 9000)));
    setScreen("submitted");
  }

  function handleNewTicket() {
    setTicketValues({});
    setActiveTab("ticket");
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

        {screen === "entry" && customerField && (
          <div className="tab-strip">
            <button
              type="button"
              className={activeTab === "ticket" ? "tab active" : "tab"}
              onClick={() => setActiveTab("ticket")}
            >
              New Ticket
            </button>
            <button
              type="button"
              className={activeTab === "directory" ? "tab active" : "tab"}
              onClick={() => setActiveTab("directory")}
            >
              Customer Directory
            </button>
          </div>
        )}

        {screen === "entry" && activeTab === "ticket" && (
          <TicketForm
            scenario={activeScenario}
            values={ticketValues}
            onValueChange={handleValueChange}
            onSubmit={handleSubmit}
            onRequestDirectory={() => setActiveTab("directory")}
          />
        )}
        {screen === "entry" && activeTab === "directory" && customerField && (
          <CustomerDirectory onSelect={handleSelectCustomer} />
        )}
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
