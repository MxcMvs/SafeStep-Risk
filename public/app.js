
document.addEventListener("DOMContentLoaded", () => {
  const promptForm = document.getElementById("promptForm");
  const resultsContainer = document.getElementById("resultsContainer");

  promptForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const projectName = document.getElementById("projectName").value.trim();
    const prompt = document.getElementById("projectPrompt").value.trim();

    if (!projectName || !prompt) {
      alert("Please enter both project name and description.");
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

  
      const projectData = {
        name: projectName,
        risks: data.risks
      };
      localStorage.setItem("projectData", JSON.stringify(projectData));

    
      window.location.href = "RatingPage.html";

    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML = "<p style='color:red;'>An error occurred.</p>";
    }
  });
});