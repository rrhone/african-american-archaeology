
// 1. Firebase config – SAME as in game.js/results.js
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

// 2. Icons players can choose from
const icons = [
  { id: "goat",      label: "Goat Figurine",      src: "img/icon-goat.png" },
  { id: "camera",    label: "Field Camera",       src: "img/icon-camera.png" },
  { id: "map",       label: "Site Map",           src: "img/icon-map.png" },
  { id: "skull",     label: "Human Remains",      src: "img/icon-skull.png" },
  { id: "vase",      label: "Ceramic Vessel",     src: "img/icon-vase.png" },
  { id: "antelope",  label: "Animal Fauna",       src: "img/icon-stag.png" },
  { id: "magnifier", label: "Magnifying Glass",   src: "img/icon-magnifier.png" },
  { id: "archer",    label: "Rock Art Figure",    src: "img/icon-archer.png" },
  { id: "bone",      label: "Bone Fragment",      src: "img/icon-bone.png" }
];

const participantId = "p_" + Math.random().toString(36).substring(2, 9);
let chosenIcon = null;

// DOM
const iconScreen = document.getElementById("icon-screen");
const iconGrid = document.getElementById("icon-grid");
const iconMessage = document.getElementById("icon-message");
const quizScreen = document.getElementById("quiz-screen");
const endScreen = document.getElementById("end-screen");
const questionText = document.getElementById("question-text");
const optionsDiv = document.getElementById("options");
const nextBtn = document.getElementById("next-btn");
const timerEl = document.getElementById("timer");
const progress = document.getElementById("progress");

// Quiz state
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
let timerId = null;
let timeLeft = 15;

// ---------- Icon selection ----------

function renderIcons(taken) {
  iconGrid.innerHTML = "";
  icons.forEach((icon) => {
    const btn = document.createElement("button");
    btn.className = "icon-card";

    const img = document.createElement("img");
    img.src = icon.src;
    img.alt = icon.label;
    img.className = "icon-img";

    const label = document.createElement("span");
    label.className = "icon-label";
    label.textContent = icon.label;

    const isTaken = taken.has(icon.id);
    if (isTaken) {
      btn.classList.add("icon-taken");
      btn.disabled = true;
    }

    btn.addEventListener("click", () => tryClaimIcon(icon.id));

    btn.appendChild(img);
    btn.appendChild(label);
    iconGrid.appendChild(btn);
  });
}


async function loadTakenIconsAndRender() {
  const snapshot = await db.collection("iconClaims").get();
  const taken = new Set();
  snapshot.forEach((doc) => taken.add(doc.id));
  renderIcons(taken);
  iconMessage.textContent = "Tap one icon to claim it. First come, first served.";
}

async function tryClaimIcon(iconId) {
  iconMessage.textContent = "Claiming icon…";

  try {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("iconClaims").doc(iconId);
      const snap = await tx.get(ref);
      if (snap.exists) {
        throw new Error("taken");
      }
      tx.set(ref, {
        participantId,
        createdAt: new Date()
      });
    });

    chosenIcon = iconId;
    iconMessage.textContent = "Icon claimed! The quiz will start.";
    iconScreen.style.display = "none";
    quizScreen.style.display = "block";

    currentIndex = 0;
    loadQuestion();
  } catch (err) {
    if (err.message === "taken") {
      iconMessage.textContent =
        "Sorry, that icon was just taken by someone else. Pick a different one.";
      // reload claimed state
      loadTakenIconsAndRender();
    } else {
      console.error(err);
      iconMessage.textContent = "There was a problem claiming this icon. Try again.";
    }
  }
}

// ---------- Quiz logic ----------

function loadQuestion() {
  const q = questions[currentIndex];
  questionText.textContent = q.text;
  progress.textContent = `Question ${currentIndex + 1} of ${questions.length}`;

  // build options
  optionsDiv.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "option-card";
    card.textContent = opt;
    card.dataset.index = idx;
    card.addEventListener("click", () => selectOption(card, idx));
    optionsDiv.appendChild(card);
  });

  nextBtn.disabled = false;
  nextBtn.textContent =
    currentIndex === questions.length - 1 ? "Submit answers" : "Next";

  if (timerId) clearInterval(timerId);
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

let selectedIndex = null;

function selectOption(card, idx) {
  // visually select
  selectedIndex = idx;
  const cards = optionsDiv.querySelectorAll(".option-card");
  cards.forEach((c) => c.classList.remove("option-selected", "option-wrong"));
  card.classList.add("option-selected");
}

nextBtn.addEventListener("click", () => {
  if (timeLeft <= 0) return;

  const q = questions[currentIndex];
  if (selectedIndex == null) {
    alert("Tap an answer before continuing.");
    return;
  }

  // record answer
  answers[q.id] = selectedIndex;

  // feedback
  if (selectedIndex === q.correctIndex) {
    fireConfetti();
  } else {
    const cards = optionsDiv.querySelectorAll(".option-card");
    const chosen = Array.from(cards).find(
      (c) => Number(c.dataset.index) === selectedIndex
    );
    if (chosen) chosen.classList.add("option-wrong");
  }

  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  setTimeout(goToNextStep, 900);
});

// auto-advance when time is up
function lockAndAdvance() {
  const q = questions[currentIndex];
  if (!(q.id in answers)) {
    answers[q.id] = null;
  }
  progress.textContent = "Time is up. Stand by for the next question…";
  setTimeout(goToNextStep, 900);
}

function goToNextStep() {
  selectedIndex = null;
  currentIndex++;
  if (currentIndex < questions.length) {
    loadQuestion();
  } else {
    quizScreen.style.display = "none";
    endScreen.style.display = "block";
    submitAnswers();
  }
}

// ---------- Firestore persistence ----------

async function submitAnswers() {
  const timestamp = new Date();
  const responseData = {};
  questions.forEach((q) => {
    responseData[q.id] = answers[q.id] ?? null;
  });

  let score = 0;
  questions.forEach((q) => {
    if (responseData[q.id] === q.correctIndex) score++;
  });

  try {
    await db.collection("triviaResponses").add({
      participantId,
      iconId: chosenIcon,
      answers: responseData,
      score,
      finished: true,
      submittedAt: timestamp
    });
    console.log("Responses saved");
  } catch (err) {
    console.error("Error saving responses:", err);
  }
}

// ---------- Confetti ----------

function fireConfetti() {
  if (typeof confetti !== "function") return;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 }
  });
}

// initial load
loadTakenIconsAndRender();