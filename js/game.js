// js/game.js

// 1. Firebase config
// TODO: replace the placeholder values with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB-hS7UcA9Invcobq2GTPh6a6dBlj7L_nI",
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

// 2. Questions for the trivia
// TODO: customize questions to match your readings/themes
const questions = [
  {
    id: "q1",
    text: "What is a central goal of African American archaeology?",
    options: [
      "To focus only on elite white households",
      "To center the lives and experiences of Black communities",
      "To ignore documents and only study artifacts",
      "To study only prehistoric sites"
    ]
  },
  {
    id: "q2",
    text: "Why are plantation sites important in African American archaeology?",
    options: [
      "They only document the lives of owners",
      "They reveal Black labor, family, and resistance under slavery",
      "They are easy to excavate",
      "They have no connection to Black history"
    ]
  },
  {
    id: "q3",
    text: "Which of the following can be a source in African American archaeology?",
    options: [
      "Artifacts and architecture only",
      "Written records only",
      "Artifacts, landscapes, documents, and oral histories",
      "DNA evidence only"
    ]
  }
];

let currentIndex = 0;
const answers = {};

// Simple participant ID so each device is tracked
const participantId = "p_" + Math.random().toString(36).substring(2, 9);

// DOM elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const endScreen = document.getElementById("end-screen");
const startBtn = document.getElementById("start-btn");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const progress = document.getElementById("progress");

// Start button behavior
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  quizScreen.style.display = "block";
  loadQuestion();
});

// Load the current question
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
}

// Next button behavior
nextBtn.addEventListener("click", async () => {
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
    await submitAnswers();
    quizScreen.style.display = "none";
    endScreen.style.display = "block";
  }
});

// Save answers to Firestore
async function submitAnswers() {
  const timestamp = new Date();

  const responseData = {};
  questions.forEach((q) => {
    responseData[q.id] = answers[q.id] ?? null;
  });

  try {
    await db.collection("triviaResponses").add({
      participantId: participantId,
      answers: responseData,
      submittedAt: timestamp
    });
  } catch (err) {
    console.error("Error saving responses:", err);
    // Even if error, still show thank-you screen
  }
}
