document.addEventListener("DOMContentLoaded", () => {
    const promptForm = document.getElementById("promptForm");
    const resultsContainer = document.getElementById("resultsContainer");

    promptForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const prompt = document.getElementById("projectPrompt").value;

        if (!prompt.trim()) {
            alert("Please enter a project description.");
            return;
        }

        resultsContainer.innerHTML = "<p>Analyzing risks... Please wait.</p>";

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });

            const data = await res.json();

            if (data.error) {
                resultsContainer.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
                return;
            }

            // Save risks to localStorage and go to RatingPage
            localStorage.setItem("risksList", JSON.stringify(data.risks));
            window.location.href = "RatingPage.html";

        } catch (err) {
            console.error(err);
            resultsContainer.innerHTML = "<p style='color:red;'>An error occurred.</p>";
        }
    });
});
