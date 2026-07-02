# TriageOS Booth Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single self-contained retro Windows 3.1-styled HTML page implementing the "TriageOS" booth mini-game described in `docs/superpowers/specs/2026-07-01-triageos-booth-game-design.md`.

**Architecture:** One `index.html` file with inline `<style>` and `<script>`, no external dependencies, no build step. A `SCENARIO` config object holds the answer key; pure grading functions (`normalize`, `gradeTextField`, `gradeDropdownField`, `gradeSubmission`) are independent of the DOM and console-testable; a small `showScreen()` state machine swaps three screens (`entry`, `submitted`, `staff`) inside one window shell.

**Tech Stack:** Plain HTML5, CSS3, vanilla JavaScript (ES2017+). No frameworks, no package.json, no build tools.

## Global Constraints

- Single file: `index.html`, fully self-contained (inline CSS/JS), no external assets or CDN calls.
- No backend, no network calls, must work fully offline via `file://` or a trivial static server.
- No scenario randomization — the fixed Priya Shah / VPN scenario from the spec.
- Testing is manual-only per the spec, except the pure grading functions, which are verified via exact browser-console calls (documented per-task below).
- Visual style: Windows 3.1 chrome — flat colors, chunky beveled borders, no rounded corners, no shadows/gradients beyond flat fills, `"MS Sans Serif", Tahoma, Arial, sans-serif` font stack, `#c0c0c0` chrome, `#000080` title bar.

---

### Task 1: HTML shell, Win 3.1 CSS chrome, static entry screen

**Files:**
- Create: `index.html`

**Interfaces:**
- Produces: DOM elements with ids `desktop`, `window`, `titlebar`, `titlebar-text`, `menubar`, `screen-entry`, `ticket-form`, `requesterName`, `department`, `issueCategory`, `priority`, `officeAddress`, `submit-btn`. Later tasks attach behavior to these.

- [ ] **Step 1: Create `index.html` with full chrome, CSS, and the entry screen markup**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TriageOS 3.1</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    height: 100vh;
    background: #008080;
    font-family: "MS Sans Serif", Tahoma, Arial, sans-serif;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #window {
    width: 440px;
    background: #c0c0c0;
    border: 2px solid #dfdfdf;
    box-shadow:
      inset -1px -1px 0 #000,
      inset 1px 1px 0 #fff,
      inset -2px -2px 0 #808080,
      inset 2px 2px 0 #dfdfdf;
    padding: 2px;
  }
  #titlebar {
    background: #000080;
    color: #fff;
    font-weight: bold;
    padding: 3px 6px;
  }
  #menubar {
    background: #c0c0c0;
    border-bottom: 1px solid #808080;
    padding: 2px 6px;
    display: flex;
    gap: 12px;
  }
  .screen { padding: 12px; }
  .field-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .field-row label { width: 140px; }
  input[type=text], select {
    flex: 1;
    border: 2px solid;
    border-color: #808080 #fff #fff #808080;
    padding: 2px 4px;
    background: #fff;
    font-family: inherit;
    font-size: inherit;
  }
  button {
    background: #c0c0c0;
    border: 2px solid;
    border-color: #fff #808080 #808080 #fff;
    padding: 4px 14px;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
  }
  button:active {
    border-color: #808080 #fff #fff #808080;
  }
  .button-row { text-align: right; }
  #progress-bar {
    border: 2px solid;
    border-color: #808080 #fff #fff #808080;
    height: 18px;
    margin: 10px 0;
    background: #fff;
  }
  #progress-fill {
    height: 100%;
    background: #000080;
    width: 0%;
  }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  table th, table td { border: 1px solid #808080; padding: 3px 6px; text-align: left; font-size: 12px; }
  .banner { padding: 8px; font-weight: bold; text-align: center; margin-top: 10px; }
  .banner.approve { background: #00aa00; color: #fff; }
  .banner.deny { background: #aa0000; color: #fff; }
</style>
</head>
<body>
  <div id="desktop">
    <div id="window">
      <div id="titlebar"><span id="titlebar-text">TriageOS 3.1 — New Ticket</span></div>
      <div id="menubar"><span>File</span><span>Edit</span><span>Help</span></div>

      <div id="screen-entry" class="screen">
        <form id="ticket-form">
          <div class="field-row">
            <label for="requesterName">Requester Name:</label>
            <input type="text" id="requesterName" name="requesterName">
          </div>
          <div class="field-row">
            <label for="department">Department:</label>
            <select id="department" name="department"></select>
          </div>
          <div class="field-row">
            <label for="issueCategory">Issue Category:</label>
            <select id="issueCategory" name="issueCategory"></select>
          </div>
          <div class="field-row">
            <label for="priority">Priority:</label>
            <select id="priority" name="priority"></select>
          </div>
          <div class="field-row">
            <label for="officeAddress">Office Address:</label>
            <input type="text" id="officeAddress" name="officeAddress">
          </div>
          <div class="button-row">
            <button type="submit" id="submit-btn">Submit Ticket</button>
          </div>
        </form>
      </div>

      <div id="screen-submitted" class="screen" hidden>
        <p id="processing-text">Processing request...</p>
        <div id="progress-bar"><div id="progress-fill"></div></div>
        <p id="submitted-text" hidden></p>
      </div>

      <div id="screen-staff" class="screen" hidden>
        <div id="staff-content"></div>
        <div class="button-row">
          <button type="button" id="new-ticket-btn">New Ticket</button>
        </div>
      </div>
    </div>
  </div>
<script>
</script>
</body>
</html>
```

- [ ] **Step 2: Manually verify in browser**

Run: `open index.html` (macOS) or double-click the file.

Expected: A small gray Win-3.1-style window on a teal background, title bar "TriageOS 3.1 — New Ticket", a decorative File/Edit/Help menu bar, and 5 visible fields (Requester Name text box, Department/Issue Category/Priority empty dropdowns, Office Address text box) with a "Submit Ticket" button. Dropdowns are empty (populated in Task 3) — that's expected at this stage.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add TriageOS window chrome and static entry screen"
```

---

### Task 2: Scenario config and pure grading functions

**Files:**
- Modify: `index.html` (inside the empty `<script>` tag added in Task 1)

**Interfaces:**
- Consumes: nothing (pure, DOM-independent).
- Produces: `SCENARIO` object, `normalize(str) -> string`, `gradeTextField(value, requiredTokens) -> boolean`, `gradeDropdownField(value, correct) -> boolean`, `gradeSubmission(submission) -> {results: object, score: number}`, `FIELD_LABELS` array of `{key, label}`, `CORRECT_DISPLAY` object mapping text-field keys to their display-friendly correct answer. Later tasks call `gradeSubmission` and read `SCENARIO.fields.<key>.options`.

- [ ] **Step 1: Add scenario config and grading functions inside the `<script>` tag**

```javascript
// Staff briefing (not shown to visitors): Priya Shah from Finance is working
// from a downtown branch office. Her laptop can't connect to the VPN, which
// is blocking her from submitting quarterly numbers before today's deadline.
// She's already restarted her laptop twice — no luck. Everyone else at her
// branch is fine; it's just her connection.

const SCENARIO = {
  fields: {
    requesterName: { correct: ["priya", "shah"] },
    department: {
      correct: "Finance",
      options: ["Finance", "Accounting", "Sales", "Engineering", "Marketing", "HR", "Facilities", "IT"]
    },
    issueCategory: {
      correct: "Network/VPN",
      options: ["Network/VPN", "Hardware", "Software", "Account Access", "Email", "Printing"]
    },
    priority: {
      correct: "High",
      options: ["Low", "Medium", "High", "Critical"]
    },
    officeAddress: { correct: ["455", "market"] }
  }
};

const FIELD_LABELS = [
  { key: "requesterName", label: "Requester Name" },
  { key: "department", label: "Department" },
  { key: "issueCategory", label: "Issue Category" },
  { key: "priority", label: "Priority" },
  { key: "officeAddress", label: "Office Address" }
];

const CORRECT_DISPLAY = {
  requesterName: "Priya Shah",
  officeAddress: "455 Market Street"
};

function normalize(str) {
  return (str || "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function gradeTextField(value, requiredTokens) {
  const normalized = normalize(value);
  return requiredTokens.every(token => normalized.includes(token));
}

function gradeDropdownField(value, correct) {
  return value === correct;
}

function gradeSubmission(submission) {
  const results = {
    requesterName: gradeTextField(submission.requesterName, SCENARIO.fields.requesterName.correct),
    department: gradeDropdownField(submission.department, SCENARIO.fields.department.correct),
    issueCategory: gradeDropdownField(submission.issueCategory, SCENARIO.fields.issueCategory.correct),
    priority: gradeDropdownField(submission.priority, SCENARIO.fields.priority.correct),
    officeAddress: gradeTextField(submission.officeAddress, SCENARIO.fields.officeAddress.correct)
  };
  const score = Object.values(results).filter(Boolean).length;
  return { results, score };
}
```

- [ ] **Step 2: Manually verify grading logic via browser console**

Run: `open index.html`, open DevTools console, paste and run:

```javascript
gradeSubmission({requesterName:"Priya Shah", department:"Finance", issueCategory:"Network/VPN", priority:"High", officeAddress:"455 Market Street"})
```

Expected: `{results: {requesterName: true, department: true, issueCategory: true, priority: true, officeAddress: true}, score: 5}`

Then run:

```javascript
gradeSubmission({requesterName:"priya SHAH", department:"Accounting", issueCategory:"Network/VPN", priority:"Critical", officeAddress:"455 market st"})
```

Expected: `{results: {requesterName: true, department: false, issueCategory: true, priority: false, officeAddress: true}, score: 3}`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add TriageOS scenario config and grading functions"
```

---

### Task 3: Dropdown population and submit flow (entry → processing → submitted)

**Files:**
- Modify: `index.html` (append to `<script>` tag after Task 2's code)

**Interfaces:**
- Consumes: `SCENARIO.fields.<key>.options` and `gradeSubmission` from Task 2; DOM ids from Task 1.
- Produces: `showScreen(name)` where `name` is `"entry"` \| `"submitted"` \| `"staff"`; a module-level `lastSubmission` variable holding `{submission, graded, ticketNumber}` or `null`. Task 4 reads `lastSubmission` and calls `showScreen("staff")`. Task 5 sets `lastSubmission = null` and calls `showScreen("entry")`.

- [ ] **Step 1: Add screen-switching, dropdown population, and submit handling**

```javascript
let lastSubmission = null;

function showScreen(name) {
  document.getElementById("screen-entry").hidden = name !== "entry";
  document.getElementById("screen-submitted").hidden = name !== "submitted";
  document.getElementById("screen-staff").hidden = name !== "staff";
  document.getElementById("titlebar-text").textContent =
    name === "staff" ? "TriageOS 3.1 — Staff Review" : "TriageOS 3.1 — New Ticket";
}

function populateDropdown(selectEl, options) {
  selectEl.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "-- select --";
  selectEl.appendChild(blank);
  options.forEach(opt => {
    const optionEl = document.createElement("option");
    optionEl.value = opt;
    optionEl.textContent = opt;
    selectEl.appendChild(optionEl);
  });
}

function animateProgress(onComplete) {
  const fill = document.getElementById("progress-fill");
  let pct = 0;
  const interval = setInterval(() => {
    pct += 10;
    fill.style.width = pct + "%";
    if (pct >= 100) {
      clearInterval(interval);
      onComplete();
    }
  }, 120);
}

function handleSubmit(event) {
  event.preventDefault();
  const submission = {
    requesterName: document.getElementById("requesterName").value,
    department: document.getElementById("department").value,
    issueCategory: document.getElementById("issueCategory").value,
    priority: document.getElementById("priority").value,
    officeAddress: document.getElementById("officeAddress").value
  };
  const graded = gradeSubmission(submission);
  const ticketNumber = String(Math.floor(1000 + Math.random() * 9000));
  lastSubmission = { submission, graded, ticketNumber };

  document.getElementById("processing-text").hidden = false;
  document.getElementById("progress-bar").hidden = false;
  document.getElementById("progress-fill").style.width = "0%";
  document.getElementById("submitted-text").hidden = true;
  showScreen("submitted");

  animateProgress(() => {
    document.getElementById("processing-text").hidden = true;
    document.getElementById("progress-bar").hidden = true;
    const submittedText = document.getElementById("submitted-text");
    submittedText.hidden = false;
    submittedText.textContent = `Ticket #${ticketNumber} submitted. Please see support staff.`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateDropdown(document.getElementById("department"), SCENARIO.fields.department.options);
  populateDropdown(document.getElementById("issueCategory"), SCENARIO.fields.issueCategory.options);
  populateDropdown(document.getElementById("priority"), SCENARIO.fields.priority.options);
  document.getElementById("ticket-form").addEventListener("submit", handleSubmit);
});
```

- [ ] **Step 2: Manually verify in browser**

Run: `open index.html` (reload if already open).

Expected: Department, Issue Category, and Priority dropdowns are now populated (Department shows "Finance" as one of 8 options). Fill in Requester Name "Priya Shah", pick Finance / Network/VPN / High, Office Address "455 Market Street", click "Submit Ticket". Expected: screen switches to a "Processing request..." view with an animating blue progress bar (~1 second), then settles on "Ticket #XXXX submitted. Please see support staff." with a 4-digit ticket number.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add TriageOS dropdown population and submit flow"
```

---

### Task 4: Staff reveal screen and secret hotkey

**Files:**
- Modify: `index.html` (append to `<script>` tag after Task 3's code)

**Interfaces:**
- Consumes: `lastSubmission`, `showScreen`, `FIELD_LABELS`, `CORRECT_DISPLAY`, `SCENARIO` from Tasks 2–3.
- Produces: `revealStaffScreen()`, `escapeHtml(str) -> string`. Task 5's reset button lives in the markup already added in Task 1 (`new-ticket-btn`) but its click handler is added in Task 5.

- [ ] **Step 1: Add the reveal function and hotkey listener**

```javascript
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function revealStaffScreen() {
  const container = document.getElementById("staff-content");
  if (!lastSubmission) {
    container.innerHTML = "<p>No submission yet.</p>";
    showScreen("staff");
    return;
  }
  const { submission, graded, ticketNumber } = lastSubmission;
  const rows = FIELD_LABELS.map(({ key, label }) => {
    const correctDisplay = CORRECT_DISPLAY[key] || SCENARIO.fields[key].correct;
    const pass = graded.results[key];
    const submittedValue = submission[key] && submission[key].trim() ? submission[key] : "(blank)";
    return `<tr><td>${label}</td><td>${escapeHtml(submittedValue)}</td><td>${escapeHtml(correctDisplay)}</td><td>${pass ? "✓" : "✗"}</td></tr>`;
  }).join("");
  const recommendation = graded.score >= 4
    ? '<div class="banner approve">APPROVE — hand over a ticket</div>'
    : '<div class="banner deny">DENY — close but not quite</div>';
  container.innerHTML = `
    <p>Ticket #${ticketNumber} — Score: ${graded.score}/5</p>
    <table>
      <tr><th>Field</th><th>Submitted</th><th>Correct</th><th></th></tr>
      ${rows}
    </table>
    ${recommendation}
  `;
  showScreen("staff");
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === "R") {
    event.preventDefault();
    revealStaffScreen();
  }
});
```

- [ ] **Step 2: Manually verify in browser**

Run: `open index.html` (reload).

Test A — no submission: Immediately press `Ctrl+Shift+R`. Expected: staff screen shows "No submission yet."

Test B — correct submission: Fill Requester Name "Priya Shah", Department "Finance", Issue Category "Network/VPN", Priority "High", Office Address "455 Market Street". Submit, wait for the ticket-submitted screen, then press `Ctrl+Shift+R`. Expected: a table with all 5 rows showing ✓, "Score: 5/5", and a green "APPROVE — hand over a ticket" banner.

Test C — wrong submission: Reload the page, fill Requester Name "John Smith", Department "Accounting", Issue Category "Hardware", Priority "Low", Office Address "123 Elm Street". Submit, then press `Ctrl+Shift+R`. Expected: all 5 rows show ✗, "Score: 0/5", and a red "DENY — close but not quite" banner.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add TriageOS staff reveal screen and Ctrl+Shift+R hotkey"
```

---

### Task 5: New Ticket reset

**Files:**
- Modify: `index.html` (append to `<script>` tag after Task 4's code, inside the `DOMContentLoaded` listener from Task 3)

**Interfaces:**
- Consumes: `showScreen`, `lastSubmission` from Tasks 3–4; `new-ticket-btn` element from Task 1.
- Produces: fully reset state on click — no new exports for later tasks (this is the last functional task).

- [ ] **Step 1: Add the reset handler inside the existing `DOMContentLoaded` listener**

Find the `DOMContentLoaded` listener added in Task 3:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  populateDropdown(document.getElementById("department"), SCENARIO.fields.department.options);
  populateDropdown(document.getElementById("issueCategory"), SCENARIO.fields.issueCategory.options);
  populateDropdown(document.getElementById("priority"), SCENARIO.fields.priority.options);
  document.getElementById("ticket-form").addEventListener("submit", handleSubmit);
});
```

Replace it with:

```javascript
document.addEventListener("DOMContentLoaded", () => {
  populateDropdown(document.getElementById("department"), SCENARIO.fields.department.options);
  populateDropdown(document.getElementById("issueCategory"), SCENARIO.fields.issueCategory.options);
  populateDropdown(document.getElementById("priority"), SCENARIO.fields.priority.options);
  document.getElementById("ticket-form").addEventListener("submit", handleSubmit);
  document.getElementById("new-ticket-btn").addEventListener("click", () => {
    document.getElementById("ticket-form").reset();
    lastSubmission = null;
    showScreen("entry");
  });
});
```

- [ ] **Step 2: Manually verify in browser**

Run: `open index.html` (reload). Submit a filled-out ticket, press `Ctrl+Shift+R` to reach the staff screen, click "New Ticket".

Expected: returns to the entry screen with the title bar back to "TriageOS 3.1 — New Ticket", all 5 fields blank/unselected. Immediately pressing `Ctrl+Shift+R` again now shows "No submission yet." (confirming `lastSubmission` was cleared).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add TriageOS New Ticket reset flow"
```

---

### Task 6: Full end-to-end manual QA pass

**Files:**
- None (verification only; fix forward in `index.html` if any check fails)

**Interfaces:**
- Consumes: the complete app from Tasks 1–5.
- Produces: nothing — this task confirms the spec's Testing checklist passes in full before calling the game done.

- [ ] **Step 1: Run the full spec Testing checklist**

Run: `open index.html` (fresh reload) and walk through each check from the spec's Testing section in order:

1. All 5 fields render with correct control types and dropdown options — confirm Department has 8 named options plus the blank "-- select --" (9 total), Issue Category has 6 named options plus blank (7 total), Priority has 4 named options plus blank (5 total).
2. Submit with all-correct answers (Priya Shah / Finance / Network/VPN / High / 455 Market Street) → reveal shows 5/5 and the green APPROVE banner.
3. Reload, submit with all-wrong answers → reveal shows a lower score and, if ≤3, the red DENY banner.
4. Reload, submit with Requester Name "priya shah" (lowercase) and Office Address "455 market st." (extra punctuation/word) → both still grade ✓, confirming lenient matching.
5. Reload, press `Ctrl+Shift+R` before any submission → "No submission yet." notice appears.
6. From the staff screen, click "New Ticket" → form is fully cleared and hotkey again shows "No submission yet."

Expected: all six checks pass exactly as described. If any fails, fix the relevant code in `index.html` and re-run the full checklist from step 1.

- [ ] **Step 2: Commit final state (only if Step 1 required fixes)**

```bash
git add index.html
git commit -m "Fix issues found in TriageOS end-to-end QA pass"
```

If Step 1 passed with no changes needed, skip this commit — Task 5's commit already represents the final working state.
