import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import clientsRouter from "./routes/clients.js";
import keywordsRouter from "./routes/keywords.js";
import competitorsRouter from "./routes/competitors.js";
import rankingsRouter from "./routes/rankings.js";
import auditRouter from "./routes/audit.js";
import opportunitiesRouter from "./routes/opportunities.js";
import internalLinksRouter from "./routes/internal-links.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api/clients", clientsRouter);
app.use("/api/clients", keywordsRouter);
app.use("/api/clients", competitorsRouter);
app.use("/api/rankings", rankingsRouter);
app.use("/api/clients/:id/rankings", (req, res, next) => {
  req.params.id = req.params.id;
  next();
}, rankingsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/clients", opportunitiesRouter);
app.use("/api/clients", internalLinksRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Webby SEO API running on http://localhost:${PORT}`);
});
