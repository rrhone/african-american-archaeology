
// 1. Firebase config – replace with your real values
const firebaseConfig = {
  apiKey: "AIzaSyB-hS7UcA9Invcobq2GTPh6a6dB1j7l_nI",
  authDomain: "african-american-archaeology.firebaseapp.com",
  projectId: "african-american-archaeology",
  storageBucket: "african-american-archaeology.firebasestorage.app",
  messagingSenderId: "901349237762",
  appId: "1:901349237762:web:96a08ed1c3c862d1d3b31b"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
var db = firebase.firestore();

// 2. Questions with correctIndex for scoring
const questions = [
  {
    id: "q1",
    text: "What is a central goal of African American archaeology?",
    options: [
      "To focus only on elite white households",
      "To center the lives and experiences of Black communities",
      "To ignore documents and only study artifacts",
      "To study only prehistoric sites"
    ],
    correctIndex: 1
  },
  {
    id: "q2",
    text: "Why are plantation sites important in African American archaeology?",
    options: [
      "They only document the lives of owners",
      "They reveal Black labor, family, and resistance under slavery",
      "They are easy to excavate",
      "They have no connection to Black history"
    ],
    correctIndex: 1
  },
  {
    id: "q3",
    text: "Which of the following can be a source in African American archaeology?",
    options: [
      "Artifacts and architecture only",
      "Written records only",
      "Artifacts, landscapes, documents, and oral histories",
      "DNA evidence only"
    ],
    correctIndex: 2
  }
];

let currentIndex = 0;
const answers = {};

const participantId = "p_" + Math.random().toString(36).substring(2, 9);
let participantName = "";

// Timer state
let timerId = null;
let timeLeft = 15;

// DOM elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const endScreen = document.getElementById("end-screen");
const startBtn = document.getElementById("start-btn");
const nameInput = document.getElementById("playerName");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const progress = document.getElementById("progress");
const timerEl = document.getElementById("timer");

// Start quiz
startBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter your first and last name to join the game.");
    return;
  }

  participantName = name;

  startScreen.style.display = "none";
  quizScreen.style.display = "block";
  currentIndex = 0;
  loadQuestion();
});

// Load current question and start 15s timer
function loadQuestion() {
  const q = questions[currentIndex];
  questionText.textContent = q.text;
  progress.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  // Build options
  optionsDiv.innerHTML = "";
  q.options.forEach((opt, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.value = index;
    label.appendChild(input);
    label.appendChild(document.createTextNode(opt));
    optionsDiv.appendChild(label);
  });

  // Enable controls
  setInputsEnabled(true);
  nextBtn.disabled = false;

  // Button text
  nextBtn.textContent =
    currentIndex === questions.length - 1 ? "Submit answers" : "Next";

  // Timer reset + start
  if (timerId) {
    clearInterval(timerId);
  }
  timeLeft = 15;
  updateTimerDisplay();
  timerId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerId);
      timerId = null;
      lockAndAdvance();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerEl.textContent = `Time left: ${timeLeft}s`;
}

// Enable/disable all answer inputs
function setInputsEnabled(enabled) {
  const radios = optionsDiv.querySelectorAll("input[name='option']");
  radios.forEach((r) => {
    r.disabled = !enabled;
  });
}

// When the student taps Next before time expires
nextBtn.addEventListener("click", () => {
  // If time already up, ignore clicks
  if (timeLeft <= 0) {
    return;
  }

  const q = questions[currentIndex];
  const selected = document.querySelector("input[name='option']:checked");

  if (!selected) {
    alert("Please select an answer before continuing.");
    return;
  }

  // Record answer
  answers[q.id] = Number(selected.value);

  // Stop timer
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  goToNextStep();
});

// Called when 15 seconds are up (auto-advance)
function lockAndAdvance() {
  // Lock inputs and button
  setInputsEnabled(false);
  nextBtn.disabled = true;
  progress.textContent = "Time is up. Stand by for the next question…";

  // Record answer if they chose one; otherwise leave null
  const q = questions[currentIndex];
  const selected = document.querySelector("input[name='option']:checked");
  if (selected) {
    answers[q.id] = Number(selected.value);
  } else if (!(q.id in answers)) {
    answers[q.id] = null;
  }

  // Short pause, then advance
  setTimeout(() => {
    goToNextStep();
  }, 1500);
}

// Advance to next question or end quiz
function goToNextStep() {
  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion();
  } else {
    // End of quiz
    quizScreen.style.display = "none";
    endScreen.style.display = "block";
    submitAnswers();
  }
}

// Save to Firestore
async function submitAnswers() {
  const timestamp = new Date();
  const responseData = {};
  questions.forEach((q) => {
    responseData[q.id] = answers[q.id] ?? null;
  });

  // compute score
  let score = 0;
  questions.forEach((q) => {
    if (responseData[q.id] === q.correctIndex) {
      score++;
    }
  });

  try {
    await db.collection("triviaResponses").add({
      participantId: participantId,
      participantName: participantName,
      answers: responseData,
      score: score,
      submittedAt: timestamp
    });
    console.log("Responses saved.");
  } catch (err) {
    console.error("Error saving responses:", err);
  }
}