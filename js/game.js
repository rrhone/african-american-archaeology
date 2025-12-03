// js/game.js

// 1. Firebase config – put YOUR actual values here
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
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
  loadQuestion();
});

// Load current question
function loadQuestion() {
  const q = questions[currentIndex];
  questionText.textContent = q.text;
  progress.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  optionsDiv.innerHTML = "";
  q.options.forEach((opt, index) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.value = index;

    if (answers[q.id] === index) {
      input.checked = true;
    }

    label.appendChild(input);
    label.appendChild(document.createTextNode(opt));
    optionsDiv.appendChild(label);
  });

  nextBtn.textContent =
    currentIndex === questions.length - 1 ? "Submit answers" : "Next";
}

// Next / Submit
nextBtn.addEventListener("click", () => {
  const q = questions[currentIndex];
  const selected = document.querySelector("input[name='option']:checked");

  if (!selected) {
    alert("Please select an answer before continuing.");
    return;
  }

  answers[q.id] = Number(selected.value);

  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion();
  } else {
    // end quiz visually, then send to Firestore
    quizScreen.style.display = "none";
    endScreen.style.display = "block";
    submitAnswers();
  }
});

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