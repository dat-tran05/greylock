"use client";

import { useEffect, useState } from "react";
import { Fireworks } from "./Fireworks";

export function ProcessingScreen({ ticketNumber }: { ticketNumber: string }) {
  const [pct, setPct] = useState(0);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPct((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setSettled(true);
          return 100;
        }
        return next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  if (!settled) {
    return (
      <div className="screen">
        <p>Processing request...</p>
        <div id="progress-bar">
          <div id="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ position: "relative" }}>
      <p>{`Ticket #${ticketNumber} submitted. Please see support staff.`}</p>
      <Fireworks active={true} />
    </div>
  );
}
