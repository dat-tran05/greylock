import { SCENARIOS } from "../../lib/scenarios";
import { FieldType, type FieldDef } from "../../lib/grading";
import { findCustomer } from "../../lib/customers";

// Hidden staff cheat-sheet. Reachable only by typing /notes — not linked
// anywhere in the app. The answer key and briefings are pulled live from the
// scenario registry so they can never drift from what the form actually grades;
// only the coaching tips below are authored by hand.

export const metadata = {
  title: "Staff Notes — NeticOS",
  robots: { index: false, follow: false },
};

const UNIVERSAL_TRICKS: string[] = [
  "Make them ask. Never volunteer the name, address, or details up front — a good CSR pulls it out of you. Answer only what you're actually asked.",
  "The address is the #1 trip-up. Say it fast and only once: “2 Jackson Street, San Francisco, nine-four-one-one-one.” See if they ask you to slow down or repeat it back. Bonus: give just “2 Jackson” and stop — do they remember to ask for city/state/zip?",
  "Prefill trap. If they pick anyone other than Dat Tran from the directory, the address box auto-fills that person's OLD address. The correct answer is ALWAYS 2 Jackson Street — watch for them submitting the stale prefill without fixing it.",
  "Wrong customer. Search “tran” and both Dat Tran and Dan Tran show up. Any of the five approved people is fine, but Dan Tran is a decoy — not one of them.",
  "Interrupt. Cut in while they're typing, or trail off mid-sentence and change the subject. See if they keep control of the call.",
  "Speed & nerves. Ramble, go on tangents, be a little flustered. The skill is staying on task and getting the ticket right anyway.",
  "The form is strict. Every field must match exactly; submission is blocked until it's all correct, then a ticket number pops. A red box means something's wrong — but it never says which field.",
  "Staff reveal: on the ticket screen press Cmd+Shift+G to pull up the graded answer sheet after a submission.",
];

const COACHING: Record<string, { title: string; situation: string; tips: string[] }> = {
  "marcus-noheat": {
    title: "No Heat (boiler)",
    situation:
      "Their boiler died overnight — no heat, no hot water, freezing house. It's winter. They already reset it and checked the pilot light themselves, no luck.",
    tips: [
      "Lean on the word “boiler” — bait them toward a maintenance/tune-up mindset. System Type IS Boiler, but the Job Type is a repair (No Heat), not a service call on a working system.",
      "Mention that you already tried to fix it — makes it sound routine when it's actually a No Heat repair.",
      "If they ask about AC or cooling, it's the dead of winter — that's a decoy, not the issue.",
    ],
  },
  nocool: {
    title: "No Cool (AC)",
    situation:
      "Heat wave. The AC runs and air comes out of the vents, but it's warm. They already checked the thermostat (set to cool, fresh batteries) and the filter looks clean.",
    tips: [
      "Keep bringing up the thermostat — bait them toward System Type “Thermostat” or Job Type “Thermostat Install.” It's Air Conditioner + No Cool.",
      "If they ask about heating, it's a heat wave — not the issue.",
    ],
  },
  bayclub: {
    title: "Bay Club — membership freeze",
    situation:
      "A Bay Club member since 2016 on a grandfathered rate is away for the summer and wants to STOP PAYING for three months without losing that rate.",
    tips: [
      "Say “cancel” constantly — but what you actually want is a Freeze/Hold, not a cancellation. That's the whole trap.",
      "The double trap: if they classify it as “Cancel Membership,” then routing to “Retention Offers” feels correct — but freezes go to the Membership Team. Two wrong dropdowns in a row.",
      "“Self-Service Portal” looks efficient and modern — also wrong; a freeze needs a human on the Membership team.",
      "If they start processing a cancellation, panic: “You're not cancelling me right now, are you? DON'T Dale me.”",
    ],
  },
  pest: {
    title: "Pest control — carpenter ants",
    situation:
      "Big black ants pouring out of the deck posts with little piles of sawdust underneath. They tried WD-40 (it's a lubricant, not a pesticide). A raccoon makes a cameo.",
    tips: [
      "NEVER say “carpenter.” Only reveal the tells when asked: big, black, sawdust, and a couple had wings. That combo = Carpenter Ants (wood-destroying) → On-Site Specialist (OSP), not regular Ants on the Standard Quarterly plan.",
      "If they never ask what the ants look like, let them pick “Ants” + “Standard Quarterly” and fail — the reveal is the lesson.",
      "Drop the raccoon in mid-call (“can they do the raccoon too?”). Raccoons are wildlife — NOT covered. Bait them into “Add to Treatment Plan.”",
    ],
  },
};

function answerFor(field: FieldDef): string {
  switch (field.type) {
    case FieldType.CustomerLookup: {
      if (field.correctCustomerId === null) return "New Customer (not in the directory)";
      const ids = Array.isArray(field.correctCustomerId) ? field.correctCustomerId : [field.correctCustomerId];
      const names = ids.map((id) => findCustomer(id)?.name ?? id);
      return names.length > 1 ? `Any of: ${names.join(", ")}` : names[0];
    }
    case FieldType.Text:
      if (field.deriveFromCustomer === "name") return "The selected customer's name (must match who they picked)";
      if (field.deriveFromCustomer === "address") return `${field.correctDisplay} (or the selected customer's address)`;
      return field.correctDisplay;
    case FieldType.Dropdown:
      return field.correct;
  }
}

export default function NotesPage() {
  return (
    <div className="notes-root">
      <style>{`
        .notes-root {
          min-height: 100vh;
          background: #f4f4f2;
          color: #1a1a1a;
          font-family: -apple-system, "Segoe UI", Tahoma, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.5;
          padding: 32px 20px 64px;
        }
        .notes-wrap { max-width: 860px; margin: 0 auto; }
        .notes-title { font-size: 26px; margin: 0 0 4px; }
        .notes-warn {
          background: #ffe8e8; border: 1px solid #d99; color: #900;
          padding: 8px 12px; border-radius: 6px; font-weight: 600; margin: 12px 0 28px;
        }
        .notes-panel {
          background: #fff; border: 1px solid #ddd; border-radius: 8px;
          padding: 18px 22px; margin: 0 0 22px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .notes-panel h2 { margin: 0 0 4px; font-size: 20px; }
        .notes-code {
          display: inline-block; background: #000080; color: #fff;
          font-weight: 700; font-size: 13px; padding: 2px 8px; border-radius: 4px;
          margin-right: 8px; vertical-align: middle;
        }
        .notes-sub { color: #555; font-weight: 400; font-size: 16px; }
        .notes-h3 { text-transform: uppercase; letter-spacing: 0.04em; font-size: 12px;
          color: #777; margin: 18px 0 6px; }
        .notes-brief { white-space: pre-wrap; background: #fafafa; border-left: 3px solid #000080;
          padding: 10px 14px; border-radius: 0 4px 4px 0; color: #222; font-size: 14px; }
        table.notes-key { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.notes-key td { border: 1px solid #e2e2e2; padding: 6px 10px; vertical-align: top; }
        table.notes-key td.f { width: 34%; font-weight: 600; background: #f7f7f7; }
        table.notes-key td.a { color: #0a5c2b; font-weight: 600; }
        .notes-ul { margin: 4px 0 0; padding-left: 20px; }
        .notes-ul li { margin-bottom: 7px; }
        @media print {
          .notes-root { background: #fff; padding: 0; font-size: 12px; }
          .notes-panel { break-inside: avoid; box-shadow: none; page-break-inside: avoid; }
        }
      `}</style>
      <div className="notes-wrap">
        <h1 className="notes-title">Booth Staff Notes — NeticOS Triage</h1>
        <div className="notes-warn">STAFF ONLY — do not show this to visitors. (Hidden page: /notes)</div>

        <div className="notes-panel">
          <h2>How to trip them up — every case</h2>
          <ul className="notes-ul">
            {UNIVERSAL_TRICKS.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        {SCENARIOS.map((entry) => {
          const coach = COACHING[entry.id];
          return (
            <div className="notes-panel" key={entry.id}>
              <h2>
                <span className="notes-code">{entry.name}</span>
                <span className="notes-sub">{coach?.title ?? entry.data.name}</span>
              </h2>

              {coach && (
                <>
                  <div className="notes-h3">The situation</div>
                  <div>{coach.situation}</div>
                </>
              )}

              <div className="notes-h3">What to say / how to play it</div>
              <div className="notes-brief">{entry.data.staffBriefing}</div>

              <div className="notes-h3">Answer key</div>
              <table className="notes-key">
                <tbody>
                  {entry.data.fields.map((field) => (
                    <tr key={field.key}>
                      <td className="f">{field.label}</td>
                      <td className="a">{answerFor(field)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {coach && (
                <>
                  <div className="notes-h3">Tricks to trip them up</div>
                  <ul className="notes-ul">
                    {coach.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
