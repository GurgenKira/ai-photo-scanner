import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

app.get("/ping", (req, res) => {
  res.json({ ok: true, message: "backend is alive", ts: new Date().toISOString() });
});

// Placeholder AI endpoint (next commit will implement real AI)
app.post("/analyze", (req, res) => {
  res.json({
    caption: "placeholder (AI not wired yet)",
    objects: ["placeholder-object"],
    text: "",
    language: "en",
    note: "Next commit will call OpenAI/Gemini from backend"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));