document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("historyContainer");
    container.innerHTML = "<p>Loading saved projects...</p>";

    async function fetchHistory() {
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

                // Use a readable project ID + placeholder date
                div.innerHTML = `
                    <span class="project-name">${project.name}</span>
                    <div class="buttons">
                        <button class="view-btn">View</button>
                        <button class="delete-btn">Delete</button>
                    </div>
                `;

                // View button → go to Results page
                div.querySelector(".view-btn").addEventListener("click", () => {
                    localStorage.setItem("projectId", project.id);
                    window.location.href = "ResultsPage.html";
                });

                // Delete button → remove project + refresh list
                div.querySelector(".delete-btn").addEventListener("click", async (e) => {
                    e.stopPropagation(); // Prevent click triggering "view"
                    const confirmDelete = confirm(`Delete project "${project.name}"?`);
                    if (!confirmDelete) return;

                    try {
                        const res = await fetch(`/api/project/${project.id}`, {
                            method: "DELETE",
                        });

                        const result = await res.json();
                        if (res.ok) {
                            alert(result.message);
                            fetchHistory(); // Refresh list after deletion
                        } else {
                            alert(result.error || "Failed to delete project.");
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Error deleting project.");
                    }
                });

                container.appendChild(div);
            });
        } catch (err) {
            console.error(err);
            container.innerHTML = "<p>Error loading projects.</p>";
        }
    }

   
    fetchHistory();
});
