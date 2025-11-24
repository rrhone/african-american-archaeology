// js/results.js

// 1. Same Firebase config as in game.js
// TODO: replace with your actual config (must match game.js)
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

// 2. Same questions as game.js
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

const container = document.getElementById("results-container");

// 3. Fetch all responses and build counts
db.collection("triviaResponses")
  .get()
  .then((snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = "<p>No responses have been recorded yet.</p>";
      return;
    }

    const counts = {};
    questions.forEach((q) => {
      counts[q.id] = new Array(q.options.length).fill(0);
    });

    snapshot.forEach((doc) => {
      const data = doc.data();
      const ans = data.answers || {};
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

    const totalResponses = snapshot.size;
    container.innerHTML = "";

    questions.forEach((q) => {
      const section = document.createElement("div");
      section.className = "theme-section";

      const title = document.createElement("h2");
      title.className = "section-heading";
      title.textContent = q.text;
      section.appendChild(title);

      const summary = document.createElement("p");
      summary.className = "page-subtitle";
      summary.textContent = `Responses: ${totalResponses}`;
      section.appendChild(summary);

      const list = document.createElement("ul");
      q.options.forEach((opt, index) => {
        const li = document.createElement("li");
        const count = counts[q.id][index];
        const percent =
          totalResponses > 0 ? ((count / totalResponses) * 100).toFixed(1) : 0;
        li.innerHTML = `<strong>${opt}</strong> – ${count} response(s) (${percent}%)`;
        list.appendChild(li);
      });

      section.appendChild(list);
      container.appendChild(section);
    });
  })
  .catch((err) => {
    console.error("Error loading results:", err);
    container.innerHTML =
      "<p>There was an error loading the results. Please try again later.</p>";
  });
