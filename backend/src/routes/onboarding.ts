import { Router } from "express";
import * as onboarding from "../services/onboarding/onboardingService.js";
import * as templates from "../services/onboarding/templateService.js";
import * as setupEngine from "../services/onboarding/setupEngine.js";

const router = Router();

// Onboarding
router.post("/onboarding/start", async (req, res) => {
  try {
    const { workspace_id } = req.body;
    if (!workspace_id) return res.status(400).json({ error: "workspace_id required" });
    const session = await onboarding.startOnboarding(workspace_id);
    res.json(session);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/onboarding/:workspaceId", async (req, res) => {
  try {
    const session = await onboarding.getOnboarding(req.params.workspaceId);
    res.json(session);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/onboarding/:workspaceId", async (req, res) => {
  try {
    const session = await onboarding.updateOnboarding(req.params.workspaceId, req.body);
    res.json(session);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/onboarding/:workspaceId/complete", async (req, res) => {
  try {
    const session = await onboarding.completeOnboarding(req.params.workspaceId);
    res.json(session);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Templates
router.get("/templates", async (req, res) => {
  try {
    const list = await templates.getTemplates(req.query.industry as string);
    res.json(list);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/templates/:id", async (req, res) => {
  try {
    const t = await templates.getTemplate(req.params.id);
    if (!t) return res.status(404).json({ error: "Template not found" });
    res.json(t);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Setup
router.post("/setup/run", async (req, res) => {
  try {
    const { workspace_id, client_id, template_id } = req.body;
    if (!workspace_id || !client_id || !template_id) return res.status(400).json({ error: "workspace_id, client_id, template_id required" });
    const result = await setupEngine.runSetup(workspace_id, client_id, template_id);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/setup/:workspaceId/status", async (req, res) => {
  try {
    const status = await setupEngine.getSetupStatus(req.params.workspaceId);
    res.json(status);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Activation Checklist
router.get("/clients/:id/activation-checklist", async (req, res) => {
  try {
    const items = await onboarding.getActivationChecklist(req.params.id);
    res.json(items);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/activation-checklist/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const item = await onboarding.updateChecklistItem(req.params.id, status);
    if (!item) return res.status(404).json({ error: "Checklist item not found" });
    res.json(item);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
