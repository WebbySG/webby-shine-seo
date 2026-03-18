import { Router } from "express";
import * as reportService from "../services/reports/reportService.js";

const router = Router();

// Report Templates
router.get("/report-templates", async (req, res) => {
  try {
    const list = await reportService.getReportTemplates(req.query.workspace_id as string);
    res.json(list);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/report-templates/:id", async (req, res) => {
  try {
    const t = await reportService.getReportTemplate(req.params.id);
    if (!t) return res.status(404).json({ error: "Template not found" });
    res.json(t);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/report-templates", async (req, res) => {
  try {
    const t = await reportService.createReportTemplate(req.body);
    res.json(t);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Generate Report
router.post("/reports/generate", async (req, res) => {
  try {
    const { workspace_id, client_id, template_id, date_from, date_to } = req.body;
    if (!client_id || !template_id || !date_from || !date_to) return res.status(400).json({ error: "client_id, template_id, date_from, date_to required" });
    const report = await reportService.generateReport({ workspace_id, client_id, template_id, date_from, date_to });
    res.json(report);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// List reports for client
router.get("/clients/:id/reports", async (req, res) => {
  try {
    const reports = await reportService.getReportRuns(req.params.id);
    res.json(reports);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Shareable report view
router.get("/reports/share/:token", async (req, res) => {
  try {
    const report = await reportService.getReportByShareToken(req.params.token);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(report);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Scheduled Reports
router.get("/workspaces/:id/scheduled-reports", async (req, res) => {
  try {
    const list = await reportService.getScheduledReports(req.params.id);
    res.json(list);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/scheduled-reports", async (req, res) => {
  try {
    const s = await reportService.createScheduledReport(req.body);
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/scheduled-reports/:id", async (req, res) => {
  try {
    const s = await reportService.updateScheduledReport(req.params.id, req.body);
    res.json(s);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/scheduled-reports/:id", async (req, res) => {
  try {
    const result = await reportService.deleteScheduledReport(req.params.id);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
