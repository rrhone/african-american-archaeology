
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
    id: "q2",
    text: "Which of the following can be a source in African American archaeology?",
    options: [
      "Artifacts and architecture only",
      "Written records only",
      "Artifacts, landscapes, documents, and oral histories",
      "DNA evidence only"
    ],
    correctIndex: 2
  },
  {
    id: "q3",
    text: "What did Maria Franklin argue about 'apolitical archaeology'?",
    options: [
      "It improves representation of Black communities",
      "It is a myth that hides power and racial inequality in research",
      "It is a neutral approach that avoids bias",
      "It focuses solely on technological analysis"
    ],
    correctIndex: 1
  },
  {
    id: "q4",
    text: "Why is descendant community involvement important in African American archaeology?",
    options: [
      "It eliminates the need for archival records",
      "It replaces archaeological methods entirely",
      "It ensures interpretations reflect lived experience and community memory",
      "It slows down research progress"
    ],
    correctIndex: 2
  },
  {
    id: "q5",
    text: "Which case study best highlights conflict over representation and public memory?",
    options: [
      "Roman Forum reconstruction",
      "New York African Burial Ground excavation",
      "Mayan temple architecture study",
      "Colonial Jamestown silver trade"
    ],
    correctIndex: 1
  },
  {
    id: "q6",
    text: "How were historic photographs, such as the Agnes Street outhouse image, used publicly?",
    options: [
      "To support neutral scientific observation",
      "To document elite wealth and architecture",
      "To sensationalize Black neighborhoods as slums",
      "To promote tourism"
    ],
    correctIndex: 2
  },
  {
    id: "q7",
    text: "What is a primary goal of community-accountable archaeology?",
    options: [
      "To co-produce narratives with descendants and share interpretive authority",
      "To prioritize academic authority over local voices",
      "To remove oral history from research",
      "To limit access to archaeological findings"
    ],
    correctIndex: 0
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