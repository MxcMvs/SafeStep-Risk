import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import os from "os";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// === Helper: Get local network IP ===
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// === SQLite helper ===
async function openDB() {
  const db = await open({
    filename: "./safestep.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS risks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      likelihood INTEGER,
      impact INTEGER,
      score INTEGER,
      mitigation TEXT,
      last_updated TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);

  return db;
}

// === Dummy Risk Analysis Endpoint ===
app.post("/api/analyze", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const dummyRisks = [
    {
      risk: "Budget overrun",
      likelihood: 3,
      impact: 4,
      score: 12,
      mitigation: "",
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      risk: "Delayed timeline",
      likelihood: 4,
      impact: 3,
      score: 12,
      mitigation: "",
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      risk: "Regulatory issues",
      likelihood: 2,
      impact: 5,
      score: 10,
      mitigation: "",
      lastUpdated: new Date().toLocaleDateString()
    },
    {
      risk: "Resource shortage",
      likelihood: 5,
      impact: 4,
      score: 20,
      mitigation: "",
      lastUpdated: new Date().toLocaleDateString()
    }
  ];

  res.json({ risks: dummyRisks });
});

// === Save Project and Risks ===
app.post("/api/save", async (req, res) => {
  const { projectName, ratings } = req.body;
  if (!projectName || !ratings)
    return res.status(400).json({ error: "Project name and ratings required" });

  try {
    const db = await openDB();
    const result = await db.run("INSERT INTO projects (name) VALUES (?)", projectName);
    const projectId = result.lastID;

    const insertRisk = await db.prepare(
      "INSERT INTO risks (project_id, name, likelihood, impact, score, mitigation, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    for (const r of ratings) {
      await insertRisk.run(
        projectId,
        r.risk,
        r.likelihood,
        r.impact,
        r.score,
        r.mitigation || "",
        r.lastUpdated || new Date().toLocaleDateString()
      );
    }
    await insertRisk.finalize();

    res.json({ success: true, projectId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save project" });
  }
});

// === Delete Project and Risks ===
app.delete("/api/project/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const db = await openDB();

    // First delete associated risks
    await db.run("DELETE FROM risks WHERE project_id = ?", projectId);

    // Then delete the project itself
    const result = await db.run("DELETE FROM projects WHERE id = ?", projectId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// === Get project risks for Results page ===
app.get("/api/project/:id", async (req, res) => {
  const projectId = req.params.id;
  try {
    const db = await openDB();
    const risks = await db.all("SELECT * FROM risks WHERE project_id = ?", projectId);
    if (risks.length === 0) {
      return res.status(404).json({ error: "No risks found for this project" });
    }
    res.json({ risks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project risks" });
  }
});

// === Get history of projects ===
app.get("/api/history", async (req, res) => {
  try {
    const db = await openDB();
    const projects = await db.all("SELECT * FROM projects ORDER BY id DESC");
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch projects history" });
  }
});

// === Serve static files ===
app.use(express.static(path.join(__dirname, "public")));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "HomePage.html"));
});

// === Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at:  http://localhost:${PORT}`);
  console.log(`Network access:     http://${getLocalIP()}:${PORT}`);
});
