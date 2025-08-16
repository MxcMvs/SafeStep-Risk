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
