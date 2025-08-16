function renderCharts() {
    let risks = loadFromLocal("ratedRisks");
    if (!risks) return;


    let tableBody = document.getElementById("riskTableBody");
    tableBody.innerHTML = "";
    risks.forEach(risk => {
        tableBody.innerHTML += `
            <tr>
                <td>${risk.name}</td>
                <td>${risk.impact}</td>
                <td>${risk.likelihood}</td>
                <td>${risk.score}</td>
            </tr>
        `;
    });


    new Chart(document.getElementById("riskMatrix"), {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Risks',
                data: risks.map(r => ({ x: r.likelihood, y: r.impact })),
                backgroundColor: risks.map(r => r.score >= 15 ? "red" : r.score >= 8 ? "orange" : "green")
            }]
        },
        options: {
            scales: {
                x: { min: 1, max: 5, title: { display: true, text: "Likelihood" } },
                y: { min: 1, max: 5, title: { display: true, text: "Impact" } }
            }
        }
    });


    new Chart(document.getElementById("riskGraph"), {
        type: 'bar',
        data: {
            labels: risks.map(r => r.name),
            datasets: [{
                label: 'Risk Score',
                data: risks.map(r => r.score),
                backgroundColor: risks.map(r => r.score >= 15 ? "red" : r.score >= 8 ? "orange" : "green")
            }]
        }
    });
}

renderCharts();
