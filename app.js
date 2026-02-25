const challenges = [
  {
    id: "sum-array",
    title: "Sum of Array",
    description: "Return the sum of all numbers in the input array.",
    difficulty: "Easy",
    tags: ["Array", "Math"],
    starter: `function solve(input) {\n  // input: number[]\n  return 0;\n}`,
    timeLimitSec: 180,
    runtimeLimitMs: 400,
    publicTests: [
      { input: [1, 2, 3], expected: 6 },
      { input: [10, -5, 5], expected: 10 }
    ],
    hiddenTests: [
      { input: [], expected: 0 },
      { input: [99], expected: 99 },
      { input: [1, 2, 3, 4, 5], expected: 15 }
    ]
  },
  {
    id: "is-palindrome",
    title: "Palindrome Check",
    description: "Return true if input string is a palindrome (ignore case and spaces).",
    difficulty: "Easy",
    tags: ["String", "Two Pointers"],
    starter: `function solve(input) {\n  // input: string\n  return false;\n}`,
    timeLimitSec: 240,
    runtimeLimitMs: 450,
    publicTests: [
      { input: "racecar", expected: true },
      { input: "OpenAI", expected: false }
    ],
    hiddenTests: [
      { input: "Never odd or even", expected: true },
      { input: "A man a plan a canal Panama", expected: true },
      { input: "abcd", expected: false }
    ]
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    description: "Return an array from 1..n with Fizz/Buzz/FizzBuzz substitutions.",
    difficulty: "Easy",
    tags: ["Loop", "Conditionals"],
    starter: `function solve(input) {\n  // input: number\n  return [];\n}`,
    timeLimitSec: 300,
    runtimeLimitMs: 500,
    publicTests: [{ input: 5, expected: [1, 2, "Fizz", 4, "Buzz"] }],
    hiddenTests: [
      {
        input: 15,
        expected: [1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz", 11, "Fizz", 13, 14, "FizzBuzz"]
      },
      { input: 1, expected: [1] }
    ]
  }
];

const historyKey = "coding-test-history-v2";

const challengeList = document.getElementById("challenge-list");
const historyList = document.getElementById("history");
const titleEl = document.getElementById("challenge-title");
const descEl = document.getElementById("challenge-description");
const metaEl = document.getElementById("challenge-meta");
const editor = document.getElementById("editor");
const timerEl = document.getElementById("timer");
const resultsEl = document.getElementById("results");
const candidateNameInput = document.getElementById("candidate-name");
const revealPublicTestsCheckbox = document.getElementById("reveal-public-tests");

const startBtn = document.getElementById("start-test");
const runPublicBtn = document.getElementById("run-public-tests");
const submitBtn = document.getElementById("submit");
const resetBtn = document.getElementById("reset");
const clearHistoryBtn = document.getElementById("clear-history");
const downloadHistoryBtn = document.getElementById("download-history");

let selectedChallenge = null;
let deadline = null;
let timerRef = null;
let latestPublicScore = null;

function renderChallenges() {
  challengeList.innerHTML = "";
  for (const challenge of challenges) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "challenge-item";
    btn.textContent = `${challenge.title} • ${challenge.difficulty} • ${challenge.timeLimitSec}s`;
    btn.addEventListener("click", () => selectChallenge(challenge.id));
    if (selectedChallenge?.id === challenge.id) {
      btn.classList.add("active");
    }
    li.appendChild(btn);
    challengeList.appendChild(li);
  }
}

function selectChallenge(id) {
  selectedChallenge = challenges.find((c) => c.id === id);
  titleEl.textContent = selectedChallenge.title;
  descEl.textContent = selectedChallenge.description;
  metaEl.textContent = `Difficulty: ${selectedChallenge.difficulty} | Tags: ${selectedChallenge.tags.join(", ")} | Public tests: ${
    selectedChallenge.publicTests.length
  } | Hidden tests: ${selectedChallenge.hiddenTests.length}`;
  editor.value = selectedChallenge.starter;
  resultsEl.textContent = "Press Start Test to begin.";
  runPublicBtn.disabled = true;
  submitBtn.disabled = true;
  latestPublicScore = null;
  stopTimer();
  timerEl.textContent = "--:--";
  renderChallenges();
}

function startTest() {
  if (!selectedChallenge) {
    alert("Select a challenge first.");
    return;
  }
  deadline = Date.now() + selectedChallenge.timeLimitSec * 1000;
  runPublicBtn.disabled = false;
  submitBtn.disabled = false;
  updateTimer();
  stopTimer();
  timerRef = setInterval(updateTimer, 1000);
  resultsEl.textContent = "Test started. Run public tests as needed, then submit final.";
}

function stopTimer() {
  if (timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }
}

function updateTimer() {
  if (!deadline) {
    timerEl.textContent = "--:--";
    return;
  }
  const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  const mins = String(Math.floor(left / 60)).padStart(2, "0");
  const secs = String(left % 60).padStart(2, "0");
  timerEl.textContent = `${mins}:${secs}`;

  if (left <= 0) {
    stopTimer();
    runPublicBtn.disabled = true;
    submitBtn.disabled = true;
    appendResultLine("\nTime is up. Submission disabled.");
  }
}

function appendResultLine(line) {
  resultsEl.textContent = `${resultsEl.textContent}\n${line}`.trim();
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function runCodeWithTimeout(code, input, timeoutMs) {
  return new Promise((resolve) => {
    const workerSource = `
      self.onmessage = function (event) {
        const { code, input } = event.data;
        try {
          const solve = new Function(code + '; return solve;')();
          if (typeof solve !== 'function') {
            self.postMessage({ ok: false, error: 'Your code must define function solve(input).' });
            return;
          }
          const output = solve(input);
          self.postMessage({ ok: true, output });
        } catch (error) {
          self.postMessage({ ok: false, error: error.message });
        }
      };
    `;

    const worker = new Worker(URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" })));
    const timeout = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, error: `Timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    worker.onmessage = (event) => {
      clearTimeout(timeout);
      worker.terminate();
      resolve(event.data);
    };

    worker.postMessage({ code, input });
  });
}

async function runTestGroup(tests, isPublic) {
  if (!selectedChallenge) {
    return { passed: 0, total: 0, lines: [] };
  }

  let passed = 0;
  const lines = [];
  const revealDetails = revealPublicTestsCheckbox.checked || !isPublic;

  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index];
    // eslint-disable-next-line no-await-in-loop
    const result = await runCodeWithTimeout(editor.value, test.input, selectedChallenge.runtimeLimitMs);

    if (!result.ok) {
      lines.push(`ERROR #${index + 1}: ${result.error}`);
      continue;
    }

    const ok = deepEqual(result.output, test.expected);
    if (ok) {
      passed += 1;
    }
    if (revealDetails) {
      lines.push(
        `${ok ? "PASS" : "FAIL"} #${index + 1} input=${JSON.stringify(test.input)} expected=${JSON.stringify(
          test.expected
        )} actual=${JSON.stringify(result.output)}`
      );
    } else {
      lines.push(`${ok ? "PASS" : "FAIL"} #${index + 1}`);
    }
  }

  return { passed, total: tests.length, lines };
}

async function runPublicTests() {
  if (!selectedChallenge) {
    return;
  }
  resultsEl.textContent = "Running public tests...";
  const report = await runTestGroup(selectedChallenge.publicTests, true);
  latestPublicScore = Math.round((report.passed / report.total) * 100);
  report.lines.push(`\nPublic score: ${latestPublicScore}% (${report.passed}/${report.total})`);
  resultsEl.textContent = report.lines.join("\n");
}

function getRemainingSeconds() {
  if (!deadline) {
    return null;
  }
  return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
}

async function submitAttempt() {
  if (!selectedChallenge) {
    alert("Select a challenge first.");
    return;
  }

  const candidateName = candidateNameInput.value.trim();
  if (!candidateName) {
    alert("Please enter candidate name before submitting.");
    return;
  }

  resultsEl.textContent = "Evaluating final submission (public + hidden tests)...";
  const publicReport = await runTestGroup(selectedChallenge.publicTests, true);
  const hiddenReport = await runTestGroup(selectedChallenge.hiddenTests, false);

  const totalPassed = publicReport.passed + hiddenReport.passed;
  const totalTests = publicReport.total + hiddenReport.total;
  const finalScore = Math.round((totalPassed / totalTests) * 100);

  const item = {
    id: crypto.randomUUID(),
    candidateName,
    challengeId: selectedChallenge.id,
    challenge: selectedChallenge.title,
    publicScore: Math.round((publicReport.passed / publicReport.total) * 100),
    finalScore,
    passed: totalPassed,
    total: totalTests,
    submittedAt: new Date().toISOString(),
    remainingSeconds: getRemainingSeconds()
  };

  const existing = JSON.parse(localStorage.getItem(historyKey) || "[]");
  existing.unshift(item);
  localStorage.setItem(historyKey, JSON.stringify(existing));
  renderHistory();

  const outputLines = [
    ...publicReport.lines,
    "",
    `Hidden tests: ${hiddenReport.passed}/${hiddenReport.total} passed`,
    `Final score: ${finalScore}% (${totalPassed}/${totalTests})`
  ];
  resultsEl.textContent = outputLines.join("\n");
}

function renderHistory() {
  const attempts = JSON.parse(localStorage.getItem(historyKey) || "[]");
  historyList.innerHTML = "";

  if (attempts.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No attempts yet.";
    historyList.appendChild(li);
    return;
  }

  attempts.slice(0, 20).forEach((attempt) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <strong>${attempt.candidateName}</strong> — ${attempt.challenge}<br/>
      <span class="${attempt.finalScore >= 70 ? "pass" : "fail"}">Final: ${attempt.finalScore}%</span>
      <span class="muted">(public ${attempt.publicScore}%)</span><br/>
      <small>${new Date(attempt.submittedAt).toLocaleString()}${
        attempt.remainingSeconds === null ? "" : ` • ${attempt.remainingSeconds}s left`
      }</small>
    `;
    historyList.appendChild(li);
  });
}

function resetWorkspace() {
  if (!selectedChallenge) {
    return;
  }
  editor.value = selectedChallenge.starter;
  latestPublicScore = null;
  resultsEl.textContent = "Code reset to starter template.";
}

function clearHistory() {
  const confirmed = window.confirm("Clear all saved attempts?");
  if (!confirmed) {
    return;
  }
  localStorage.removeItem(historyKey);
  renderHistory();
}

function exportHistory() {
  const attempts = JSON.parse(localStorage.getItem(historyKey) || "[]");
  const blob = new Blob([JSON.stringify(attempts, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coding-test-history.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

startBtn.addEventListener("click", startTest);
runPublicBtn.addEventListener("click", runPublicTests);
submitBtn.addEventListener("click", submitAttempt);
resetBtn.addEventListener("click", resetWorkspace);
clearHistoryBtn.addEventListener("click", clearHistory);
downloadHistoryBtn.addEventListener("click", exportHistory);

renderHistory();
renderChallenges();
