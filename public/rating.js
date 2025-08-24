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
        <td>${riskObj.name || riskObj.risk || `Risk ${index + 1}`}</td>
        <td><input type="number" min="1" max="5" value="${riskObj.likelihood || 1}" id="likelihood-${index}"></td>
        <td><input type="number" min="1" max="5" value="${riskObj.impact || 1}" id="impact-${index}"></td>
        <td id="score-${index}">${(riskObj.likelihood || 1) * (riskObj.impact || 1)}</td>
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

    // Update only the changed fields, preserve everything else
    projectData.risks[index] = {
      ...projectData.risks[index],
      likelihood: like,
      impact: impact,
      score: like * impact
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
      name: risk.name || risk.risk || `Risk ${i + 1}`,
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
