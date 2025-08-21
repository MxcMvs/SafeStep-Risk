document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("historyContainer");
    container.innerHTML = "<p>Loading saved projects...</p>";

    try {
        const res = await fetch("/api/history");
        const data = await res.json();

        container.innerHTML = ""; 

        if (!data.projects || data.projects.length === 0) {
            container.innerHTML = "<p>No saved projects found.</p>";
            return;
        }

        data.projects.forEach(project => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.textContent = `${project.name} - ${new Date(project.id).toLocaleDateString()}`;
            div.style.cursor = "pointer";

            div.addEventListener("click", () => {
                
                localStorage.setItem("projectId", project.id);
                window.location.href = "ResultsPage.html";
            });

            container.appendChild(div);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading projects.</p>";
    }
});
