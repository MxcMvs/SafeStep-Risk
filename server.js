<<<<<<< HEAD
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

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

  // Dummy risks
  const dummyRisks = [
    "Budget overrun",
    "Delayed timeline",
    "Regulatory issues",
    "Resource shortage"
  ];

  res.json({ risks: dummyRisks });
});

// === Save Project + Risks ===
app.post("/api/save", async (req, res) => {
  const { projectName, ratings } = req.body;
  if (!projectName || !ratings) return res.status(400).json({ error: "Project name and ratings required" });

  try {
    const db = await openDB();

    // Insert project
    const result = await db.run("INSERT INTO projects (name) VALUES (?)", projectName);
    const projectId = result.lastID;

    // Insert risks
    const insertRisk = db.prepare(
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

// === Get project risks for Results page ===
app.get("/api/project/:id", async (req, res) => {
  const projectId = req.params.id;
  try {
    const db = await openDB();
    const risks = await db.all("SELECT * FROM risks WHERE project_id = ?", projectId);
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

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "HomePage.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
=======
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Check API key
console.log(
  "OPENAI_API_KEY loaded:",
  process.env.OPENAI_API_KEY ? "✅" : "❌"
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// === SQLite helper ===
async function openDB() {
  const db = await open({
    filename: "./safestep.db",
    driver: sqlite3.Database
  });

  // Create tables if they don’t exist
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
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);

  return db;
}

// === AI Risk Analysis Endpoint ===
app.post("/api/analyze", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const systemMessage = `
You are a project risk analysis assistant. 
Given a detailed project description, your task is to:
1. Identify potential risks that could impact the project.
2. List each risk as a short, clear bullet point.
3. Avoid numbering, explanations, or extra text — only one risk per line.
4. Keep the response concise and actionable.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", 
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    });

    const risksText = completion.choices[0].message.content.trim();
    const risksArray = risksText.split("\n").filter(r => r.trim() !== "");

    res.json({ risks: risksArray });
  } catch (error) {
    console.error("=== OpenAI API call failed ===");
    console.error(error);

    const dummyRisks = [
      "Budget overrun",
      "Delayed timeline",
      "Regulatory issues",
      "Resource shortage"
    ];

    res.json({ risks: dummyRisks, warning: "Used fallback risks due to API error" });
  }
});

// === Save Risks Endpoint ===
app.post("/api/save", async (req, res) => {
  const { projectName, ratings } = req.body;

  if (!projectName || !ratings) {
    return res.status(400).json({ error: "Project name and ratings required" });
  }

  try {
    const db = await openDB();

    // Insert project
    const result = await db.run(
      "INSERT INTO projects (name) VALUES (?)",
      projectName
    );
    const projectId = result.lastID;

    // Insert each risk
    const insertRisk = db.prepare(
      "INSERT INTO risks (project_id, name, likelihood, impact, score) VALUES (?, ?, ?, ?, ?)"
    );

    for (const risk of ratings) {
      await insertRisk.run(projectId, risk.risk, risk.likelihood, risk.impact, risk.score);
    }
    await insertRisk.finalize();

    res.json({ success: true, projectId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save project" });
  }
});

// === Fetch project risks for Results page ===
app.get("/api/project/:id", async (req, res) => {
  const projectId = req.params.id;

  try {
    const db = await openDB();
    const risks = await db.all(
      "SELECT name, likelihood, impact, score FROM risks WHERE project_id = ?",
      projectId
    );

    res.json({ risks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project risks" });
  }
});

// === Serve Frontend Files ===
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback for non-API requests
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "HomePage.html"));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
>>>>>>> ab62237b4846a3a5f9ff51c087a96ea62fec3b15
