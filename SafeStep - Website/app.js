// ==================== CONFIG ====================
// Replace with your OpenAI API key
const OPENAI_API_KEY = "YOUR_API_KEY_HERE";

// ==================== EVENT LISTENERS ====================
document.addEventListener("DOMContentLoaded", () => {
    const analyzeBtn = document.getElementById("analyzeBtn");
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", handleRiskAnalysis);
    }
});

// ==================== MAIN FUNCTION ====================
async function handleRiskAnalysis() {
    const promptInput = document.getElementById("projectPrompt");
    const resultsTable = document.getElementById("resultsTableBody");

    if (!promptInput.value.trim()) {
        alert("Please enter a project description.");
        return;
    }

    try {
        // Call OpenAI for risk analysis
        const risks = await getRiskAnalysisFromOpenAI(promptInput.value);

        // Clear old table rows
        resultsTable.innerHTML = "";

        // Populate results table
        risks.forEach(risk => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${risk.description}</td>
                <td contenteditable="true" oninput="updateRiskScore(this)">${risk.impact}</td>
                <td contenteditable="true" oninput="updateRiskScore(this)">${risk.likelihood}</td>
                <td>${risk.impact * risk.likelihood}</td>
            `;

            resultsTable.appendChild(row);
        });

        // Save to SQLite (placeholder — requires backend or Electron)
        // saveToSQLite(promptInput.value, risks);

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong while analyzing risks.");
    }
}

// ==================== OPENAI CALL ====================
async function getRiskAnalysisFromOpenAI(projectDescription) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a risk analysis assistant. Given a project description, output a JSON array of risks, each with a description, likelihood (1-5), and impact (1-5)."
                },
                {
                    role: "user",
                    content: `Project: ${projectDescription}`
                }
            ],
            temperature: 0.3
        })
    });

    const data = await response.json();

    let risks;
    try {
        risks = JSON.parse(data.choices[0].message.content);
    } catch {
        // If parsing fails, fallback to a dummy risk list
        risks = [
            { description: "Budget Overrun", likelihood: 4, impact: 5 },
            { description: "Delayed Supplier", likelihood: 3, impact: 4 },
            { description: "Regulatory Non-Compliance", likelihood: 2, impact: 5 }
        ];
    }

    return risks;
}

// ==================== SCORE UPDATE HANDLER ====================
function updateRiskScore(cell) {
    const row = cell.parentElement;
    const impact = parseInt(row.cells[1].innerText) || 0;
    const likelihood = parseInt(row.cells[2].innerText) || 0;
    row.cells[3].innerText = impact * likelihood;
}

// ==================== SQLITE PLACEHOLDER ====================
function saveToSQLite(projectName, risks) {
    // In a browser-only environment, SQLite needs sql.js or a backend API
    // Example: fetch("/save", { method: "POST", body: JSON.stringify({ projectName, risks }) })
    console.log("Saving to SQLite:", projectName, risks);
}
