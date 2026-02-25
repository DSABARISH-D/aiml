# Coding Test Platform

A more complete browser-based coding assessment platform built with vanilla HTML/CSS/JavaScript.

## What this version includes

- Timed coding assessments with per-challenge time limits.
- Public test execution during the test session.
- Final submission scoring based on **public + hidden tests**.
- Runtime protection per test using a Web Worker timeout.
- Candidate name capture and detailed attempt history.
- Export attempt history as JSON.
- Clear/reset controls for code and historical submissions.

## Quick Preview

Run this command from the project root:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open:

- `http://localhost:4173` (same machine)
- `http://127.0.0.1:4173` (loopback)

## Usage flow

1. Select a challenge.
2. Enter candidate name.
3. Click **Start Test**.
4. Implement `solve(input)` in the editor.
5. Use **Run Public Tests** while iterating.
6. Click **Submit Final** to evaluate against hidden tests and save history.
