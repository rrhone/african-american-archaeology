// js/results.js

// 1. Firebase config – same as in game.js
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

// 2. Questions
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

const container = document.getElementById("results-container");
const overview = document.getElementById("result-summary");
const leaderboardRows = document.getElementById("leaderboard-rows");

db.collection("triviaResponses")
  .get()
  .then((snapshot) => {
    const totalResponses = snapshot.size;
    if (totalResponses === 0) {
      overview.textContent = "No responses have been recorded yet.";
      container.innerHTML = "";
      leaderboardRows.innerHTML = "<p>No players have joined yet.</p>";
      return;
    }

    overview.textContent = `Total participants: ${totalResponses}. Each bar below shows how the class answered. Green labels mark the correct answers.`;

    const counts = {};
    const players = [];
    questions.forEach((q) => {
      counts[q.id] = new Array(q.options.length).fill(0);
    });

    snapshot.forEach((doc) => {
      const data = doc.data();
      const ans = data.answers || {};
      const name = (data.participantName || "Anonymous").trim() || "Anonymous";

      let score = typeof data.score === "number" ? data.score : 0;
      if (typeof data.score !== "number") {
        questions.forEach((q) => {
          if (ans[q.id] === q.correctIndex) score++;
        });
      }

      players.push({ name, score });

      questions.forEach((q) => {
        const idx = ans[q.id];
        if (
          idx !== undefined &&
          idx !== null &&
          counts[q.id][idx] !== undefined
        ) {
          counts[q.id][idx] += 1;
        }
      });
    });

    // Leaderboard
    players.sort((a, b) => b.score - a.score);
    leaderboardRows.innerHTML = "";
    players.forEach((p, index) => {
      const row = document.createElement("div");
      row.className = "answer-row";

      const rankLabel = document.createElement("div");
      rankLabel.className = "answer-count";
      rankLabel.textContent = `#${index + 1}`;

      const nameLabel = document.createElement("div");
      nameLabel.className = "answer-label";
      nameLabel.textContent = p.name;

      const scoreLabel = document.createElement("div");
      scoreLabel.className = "answer-count";
      scoreLabel.textContent = `${p.score} correct`;

      row.appendChild(rankLabel);
      row.appendChild(nameLabel);
      row.appendChild(scoreLabel);

      leaderboardRows.appendChild(row);
    });

    // Per-question breakdown
    container.innerHTML = "";
    questions.forEach((q, qi) => {
      const section = document.createElement("div");
      section.className = "theme-section question-result";

      const title = document.createElement("h2");
      title.className = "section-heading";
      title.textContent = `Question ${qi + 1}: ${q.text}`;
      section.appendChild(title);

      const list = document.createElement("div");
      const total = totalResponses;

      q.options.forEach((opt, index) => {
        const row = document.createElement("div");
        row.className = "answer-row";

        const label = document.createElement("div");
        label.className = "answer-label";
        if (index === q.correctIndex) {
          label.classList.add("correct-answer");
        }
        label.textContent = opt;

        const barOuter = document.createElement("div");
        barOuter.className = "answer-bar";

        const barFill = document.createElement("div");
        barFill.className = "answer-bar-fill";

        const count = counts[q.id][index];
        const percent = total > 0 ? (count / total) * 100 : 0;
        barFill.style.width = `${percent}%`;

        barOuter.appendChild(barFill);

        const countLabel = document.createElement("div");
        countLabel.className = "answer-count";
        countLabel.textContent = `${count} (${percent.toFixed(0)}%)`;

        row.appendChild(label);
        row.appendChild(barOuter);
        row.appendChild(countLabel);

        list.appendChild(row);
      });

      section.appendChild(list);
      container.appendChild(section);
    });
  })
  .catch((err) => {
    console.error("Error loading results:", err);
    overview.textContent =
      "There was an error loading the results. Please try again later.";
    leaderboardRows.innerHTML = "";
    container.innerHTML = "";
  });