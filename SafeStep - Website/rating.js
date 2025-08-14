function loadRisksForRating() {
    let risks = loadFromLocal("risksList");
    let container = document.getElementById("risksContainer");

    if (!risks || !container) return;

    container.innerHTML = "";

    risks.forEach((risk, index) => {
        let riskBlock = document.createElement("div");
        riskBlock.classList.add("range-container");

        riskBlock.innerHTML = `
            <p>${risk.name}</p>
            Likelihood: <input type="range" min="1" max="5" value="3" oninput="updateScore(${index})" id="likelihood-${index}">
            Impact: <input type="range" min="1" max="5" value="3" oninput="updateScore(${index})" id="impact-${index}">
            <span class="score" id="score-${index}" style="background:yellow;">Score: 9</span>
        `;

        container.appendChild(riskBlock);
    });
}

function updateScore(index) {
    let likelihood = parseInt(document.getElementById(`likelihood-${index}`).value);
    let impact = parseInt(document.getElementById(`impact-${index}`).value);
    let score = likelihood * impact;

    let scoreElement = document.getElementById(`score-${index}`);
    scoreElement.textContent = `Score: ${score}`;
    scoreElement.style.background = score >= 15 ? "red" : score >= 8 ? "orange" : "green";
}

document.getElementById("calcResultsBtn")?.addEventListener("click", () => {
    let risks = loadFromLocal("risksList");

    risks = risks.map((risk, index) => {
        let likelihood = parseInt(document.getElementById(`likelihood-${index}`).value);
        let impact = parseInt(document.getElementById(`impact-${index}`).value);
        return { ...risk, likelihood, impact, score: likelihood * impact };
    });

    saveToLocal("ratedRisks", risks);
    window.location.href = "results.html";
});

// Load risks when page starts
loadRisksForRating();
