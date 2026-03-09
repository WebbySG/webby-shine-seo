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
import contentPlanRouter from "./routes/content-plan.js";
import briefsRouter from "./routes/briefs.js";
import articlesRouter from "./routes/articles.js";
import cmsRouter from "./routes/cms.js";
import socialRouter from "./routes/social.js";
import videosRouter from "./routes/videos.js";
import publishingRouter from "./routes/publishing.js";
import aiRouter from "./routes/ai.js";
import analyticsRouter from "./routes/analytics.js";
import gbpRouter from "./routes/gbp.js";
import creativeRouter from "./routes/creative.js";
import adsRouter from "./routes/ads.js";
import commandRouter from "./routes/command.js";
import crmRouter from "./routes/crm.js";

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
app.use("/api/clients", contentPlanRouter);
app.use("/api/clients", briefsRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/clients", articlesRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/clients", cmsRouter);
app.use("/api/articles", socialRouter);
app.use("/api/social", socialRouter);
app.use("/api/clients", videosRouter);
app.use("/api/videos", videosRouter);
app.use("/api/publishing", publishingRouter);
app.use("/api/clients", publishingRouter);
app.use("/api/ai", aiRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/clients", analyticsRouter);
app.use("/api/gbp", gbpRouter);
app.use("/api/clients", gbpRouter);
app.use("/api/creative", creativeRouter);
app.use("/api/clients", creativeRouter);
app.use("/api/ads", adsRouter);
app.use("/api/clients", adsRouter);
app.use("/api/command", commandRouter);
app.use("/api/clients", commandRouter);
app.use("/api/crm", crmRouter);
app.use("/api/clients", crmRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Webby SEO API running on http://localhost:${PORT}`);
});
