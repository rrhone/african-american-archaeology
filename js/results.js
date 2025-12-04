
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

// 2. Icon lookup – same IDs as in player.js
const iconLookup = {
  goat:      { label: "Goat Figurine" },
  camera:    { label: "Field Camera" },
  map:       { label: "Site Map" },
  skull:     { label: "Human Remains" },
  vase:      { label: "Ceramic Vessel" },
  antelope:  { label: "Animal Fauna" },
  magnifier: { label: "Magnifying Glass" },
  archer:    { label: "Rock Art Figure" },
  bone:      { label: "Bone Fragment" }
};

// 3. Same questions as player.js, so we can compute per-question stats
const questions = [
  {
    id: "q1",
    text: "What is a central goal of African American archaeology?",
    correctIndex: 1
  },
  {
    id: "q2",
    text: "Why are plantation sites important in African American archaeology?",
    correctIndex: 1
  },
  {
    id: "q3",
    text: "Which of the following can be a source in African American archaeology?",
    correctIndex: 2
  }
];

const totalQuestions = questions.length;


// ---------- Load and render results ----------

async function loadResults() {
  const leaderboardContainer = document.getElementById("leaderboard");
  const breakdownContainer = document.getElementById("question-breakdown");

  leaderboardContainer.innerHTML = "<p>Loading results…</p>";
  breakdownContainer.innerHTML = "";

  try {
    const snap = await db.collection("triviaResponses").get();

    if (snap.empty) {
      leaderboardContainer.innerHTML =
        "<p>No results yet. Ask participants to join the game and complete the questions.</p>";
      return;
    }

    const players = [];
    const stats = questions.map(() => ({ correct: 0, total: 0 }));

    snap.forEach((doc) => {
      const data = doc.data();
      const iconId = data.iconId || "unknown";
      const iconInfo = iconLookup[iconId] || {
        label: "Unknown Icon",
        emoji: "❓"
      };

      const score = data.score || 0;
      players.push({ iconId, iconInfo, score });

      const answers = data.answers || {};
      questions.forEach((q, index) => {
        const ans = answers[q.id];
        if (ans !== null && ans !== undefined) {
          stats[index].total++;
          if (ans === q.correctIndex) {
            stats[index].correct++;
          }
        }
      });
    });

    // sort descending by score
    players.sort((a, b) => b.score - a.score);

    renderLeaderboard(leaderboardContainer, players);
    renderQuestionBreakdown(breakdownContainer, stats);
  } catch (err) {
    console.error("Error loading results:", err);
    leaderboardContainer.innerHTML =
      "<p>There was an error loading the results. Check the console for details.</p>";
  }
}

function renderLeaderboard(container, players) {
  if (!players.length) {
    container.innerHTML =
      "<p>No results yet. Have participants complete the trivia.</p>";
    return;
  }

  const maxScore = Math.max(...players.map((p) => p.score || 0)) || 1;

  // Create leaderboard list
  const list = document.createElement("ol");
  list.className = "leaderboard-list icons-only";

  players.forEach((p, index) => {
    const li = document.createElement("li");
    li.className = "leaderboard-item icon-only";

    // Rank number
    const rank = document.createElement("div");
    rank.className = "leaderboard-rank";
    rank.textContent = index + 1;

    // Icon image
    const img = document.createElement("img");
    img.src = `img/icon-${p.iconId}.png`;
    img.alt = p.iconInfo.label;
    img.className = "leaderboard-icon";

    // Score text (to the right of the icon)
    const scoreText = document.createElement("span");
    scoreText.className = "leaderboard-score-text";
    scoreText.textContent = `Scored: ${p.score}/${totalQuestions}`;

    // Score bar (under the score text, still on the right side)
    const barOuter = document.createElement("div");
    barOuter.className = "score-bar-outer";

    const barInner = document.createElement("div");
    barInner.className = "score-bar-inner";
    barOuter.appendChild(barInner);

    // compute target width
    const targetWidth = (p.score / maxScore) * 100;

    // animate on next frame so CSS transition runs
    requestAnimationFrame(() => {
    barInner.style.width = `${targetWidth}%`;
    });

    // Right side wrapper: score text + bar
    const rightSide = document.createElement("div");
    rightSide.className = "leaderboard-right";
    rightSide.appendChild(scoreText);
    rightSide.appendChild(barOuter);

    // Final layout: rank | icon | rightSide
    li.appendChild(rank);
    li.appendChild(img);
    li.appendChild(rightSide);

    list.appendChild(li);
  });

  container.innerHTML = "";
  container.appendChild(list);
}


function renderQuestionBreakdown(container, stats) {
  container.innerHTML = "";

  questions.forEach((q, index) => {
    const { correct, total } = stats[index];
    const pct =
      total === 0 ? 0 : Math.round((correct / total) * 100);

    const block = document.createElement("div");
    block.className = "question-row";

    const text = document.createElement("div");
    text.className = "question-text";
    text.textContent = `${index + 1}. ${q.text}`;

    const barOuter = document.createElement("div");
    barOuter.className = "score-bar-outer";

    const barInner = document.createElement("div");
    barInner.className = "score-bar-inner";
    barOuter.appendChild(barInner);

    requestAnimationFrame(() => {
    barInner.style.width = `${pct}%`;
    });

    const label = document.createElement("span");
    label.className = "leaderboard-score-text";
    label.textContent = `${correct}/${total} correct (${pct}%)`;

    barOuter.appendChild(barInner);

    const rowBottom = document.createElement("div");
    rowBottom.className = "question-row-bottom";
    rowBottom.appendChild(label);
    rowBottom.appendChild(barOuter);

    block.appendChild(text);
    block.appendChild(rowBottom);

    container.appendChild(block);
  });
}

// ---------- Reset game (clear DB) ----------

async function resetGame() {
  if (
    !confirm(
      "This will clear all trivia results and icon choices so you can start a new game. Continue?"
    )
  ) {
    return;
  }

  try {
    // delete triviaResponses
    const respSnap = await db.collection("triviaResponses").get();
    const batch = db.batch();
    respSnap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // delete iconClaims
    const iconSnap = await db.collection("iconClaims").get();
    const batch2 = db.batch();
    iconSnap.forEach((doc) => batch2.delete(doc.ref));
    await batch2.commit();

    alert("Game data cleared. You can start a new round.");
    window.location.reload();
  } catch (err) {
    console.error("Error resetting game:", err);
    alert("There was an error clearing the data. Check the console.");
  }
}

// Make resetGame available to the button in results.html
window.resetGame = resetGame;

// Load results when page is ready
window.addEventListener("load", loadResults);