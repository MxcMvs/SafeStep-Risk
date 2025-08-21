<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", () => {
  // Load project data from localStorage
  const projectData = JSON.parse(localStorage.getItem("projectData"));
  if (!projectData) {
    alert("No project data found. Returning to Home page.");
    window.location.href = "HomePage.html";
    return;
  }

  document.getElementById("projectNameDisplay").textContent = projectData.name;

  const risksContainer = document.getElementById("risksContainer");

  // Render table without mitigation/filter/last updated
  function renderTable() {
    risksContainer.innerHTML = "";
    projectData.risks.forEach((riskObj, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${riskObj}</td>
        <td><input type="number" min="1" max="5" value="${riskObj.likelihood || 1}" id="likelihood-${index}"></td>
        <td><input type="number" min="1" max="5" value="${riskObj.impact || 1}" id="impact-${index}"></td>
        <td id="score-${index}">${(riskObj.likelihood||1)*(riskObj.impact||1)}</td>
      `;
      risksContainer.appendChild(tr);
    });
    applyColorCoding();
  }

  // Color-code score cells
  function applyColorCoding() {
    projectData.risks.forEach((_, index) => {
      const scoreEl = document.getElementById(`score-${index}`);
      const score = parseInt(scoreEl.textContent);
      if (score >= 15) scoreEl.style.background = "red";
      else if (score >= 8) scoreEl.style.background = "orange";
      else scoreEl.style.background = "green";
    });
  }

  // Update scores on input change
  function updateScores(index) {
    const like = parseInt(document.getElementById(`likelihood-${index}`).value);
    const impact = parseInt(document.getElementById(`impact-${index}`).value);
    document.getElementById(`score-${index}`).textContent = like * impact;

    // Auto-save to localStorage
    projectData.risks[index] = {
      name: projectData.risks[index],
      likelihood: like,
      impact: impact
    };
    localStorage.setItem("projectData", JSON.stringify(projectData));
    applyColorCoding();
  }

  // Initial render
  renderTable();

  // Add event listeners for inputs
  projectData.risks.forEach((_, index) => {
    document.getElementById(`likelihood-${index}`).addEventListener("change", () => updateScores(index));
    document.getElementById(`impact-${index}`).addEventListener("change", () => updateScores(index));
  });

  // Go to Results page
  document.getElementById("goToResults").addEventListener("click", async () => {
    const ratings = projectData.risks.map((risk, i) => ({
      risk,
      likelihood: parseInt(document.getElementById(`likelihood-${i}`).value),
      impact: parseInt(document.getElementById(`impact-${i}`).value),
      score: parseInt(document.getElementById(`score-${i}`).textContent)
    }));

    localStorage.setItem("ratedRisks", JSON.stringify(ratings));

    // Save to SQLite via API
    try {
      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: projectData.name, ratings })
      });
    } catch (err) {
      console.error("Failed to save project to database:", err);
    }

    window.location.href = "ResultsPage.html";
  });
});
=======
function loadRisksForRating() {
    const risks = JSON.parse(localStorage.getItem("risksList") || "[]");
    const container = document.getElementById("risksContainer");
    if (!risks.length || !container) return;

    container.innerHTML = "";

    risks.forEach((risk, index) => {
        const riskBlock = document.createElement("div");
        riskBlock.classList.add("range-container");

        riskBlock.innerHTML = `
            <p>${risk}</p>
            Likelihood: <input type="range" min="1" max="5" value="3" oninput="updateScore(${index})" id="likelihood-${index}">
            Impact: <input type="range" min="1" max="5" value="3" oninput="updateScore(${index})" id="impact-${index}">
            <span class="score" id="score-${index}" style="background:yellow;">Score: 9</span>
        `;

        container.appendChild(riskBlock);
    });
}

function updateScore(index) {
    const likelihood = parseInt(document.getElementById(`likelihood-${index}`).value);
    const impact = parseInt(document.getElementById(`impact-${index}`).value);
    const score = likelihood * impact;
    const scoreEl = document.getElementById(`score-${index}`);
    scoreEl.textContent = `Score: ${score}`;
    scoreEl.style.background = score >= 15 ? "red" : score >= 8 ? "orange" : "green";
}

// Calculate results and go to ResultsPage
document.getElementById("calcResultsBtn")?.addEventListener("click", () => {
    const risks = JSON.parse(localStorage.getItem("risksList") || "[]");

    const ratedRisks = risks.map((risk, index) => {
        const likelihood = parseInt(document.getElementById(`likelihood-${index}`).value);
        const impact = parseInt(document.getElementById(`impact-${index}`).value);
        return { name: risk, likelihood, impact, score: likelihood * impact };
    });

    localStorage.setItem("ratedRisks", JSON.stringify(ratedRisks));
    window.location.href = "ResultsPage.html";
});

loadRisksForRating();
>>>>>>> ab62237b4846a3a5f9ff51c087a96ea62fec3b15
