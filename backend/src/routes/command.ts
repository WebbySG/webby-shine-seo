// =============================================================================
// Phase 18: Command Center API Routes
// =============================================================================

import { Router, Request, Response } from "express";
import pool from "../db.js";
import {
  recomputePriorities,
  generateCrossChannelRecommendations,
  generateWeeklyPlan,
  getCommandCenterSummary,
} from "../services/command/commandCenterService.js";

const router = Router();

// ====================================================================
// Command Center Summary
// ====================================================================
router.get("/:id/command-center", async (req: Request, res: Response) => {
  try {
    const clientId = req.params.id;
    const summary = await getCommandCenterSummary(clientId);
    res.json(summary);
  } catch (err: any) {
    console.error("Error fetching command center summary:", err);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// Marketing Goals
// ====================================================================
router.get("/:id/marketing-goals", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM marketing_goals WHERE client_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/marketing-goals", async (req: Request, res: Response) => {
  try {
    const { goal_type, goal_name, target_value, timeframe } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO marketing_goals (client_id, goal_type, goal_name, target_value, timeframe)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, goal_type, goal_name, target_value, timeframe]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/goals/:id", async (req: Request, res: Response) => {
  try {
    const { status, target_value, timeframe } = req.body;
    const { rows } = await pool.query(
      `UPDATE marketing_goals SET status = COALESCE($1, status),
       target_value = COALESCE($2, target_value), timeframe = COALESCE($3, timeframe),
       updated_at = NOW() WHERE id = $4 RETURNING *`,
      [status, target_value, timeframe, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// Marketing Priorities
// ====================================================================
router.get("/:id/marketing-priorities", async (req: Request, res: Response) => {
  try {
    const { status, priority_type, channel } = req.query;
    let query = `SELECT * FROM marketing_priorities WHERE client_id = $1`;
    const params: any[] = [req.params.id];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (priority_type) {
      params.push(priority_type);
      query += ` AND priority_type = $${params.length}`;
    }

    query += ` ORDER BY priority_score DESC, created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/priorities/:id", async (req: Request, res: Response) => {
  try {
    const { status, due_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE marketing_priorities SET status = COALESCE($1, status),
       due_date = COALESCE($2, due_date), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, due_date, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/priorities/recompute", async (req: Request, res: Response) => {
  try {
    const count = await recomputePriorities(req.params.id);
    res.json({ success: true, priorities_generated: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// Cross-Channel Recommendations
// ====================================================================
router.get("/:id/cross-channel-recommendations", async (req: Request, res: Response) => {
  try {
    const { status, target_channel } = req.query;
    let query = `SELECT * FROM cross_channel_recommendations WHERE client_id = $1`;
    const params: any[] = [req.params.id];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (target_channel) {
      params.push(target_channel);
      query += ` AND target_channel = $${params.length}`;
    }

    query += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/recommendations/:id", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const { rows } = await pool.query(
      `UPDATE cross_channel_recommendations SET status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/recommendations/generate", async (req: Request, res: Response) => {
  try {
    const count = await generateCrossChannelRecommendations(req.params.id);
    res.json({ success: true, recommendations_generated: count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// Weekly Action Plans
// ====================================================================
router.get("/:id/weekly-action-plans", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM weekly_action_plans WHERE client_id = $1
       ORDER BY week_start DESC LIMIT 10`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/plans/:id", async (req: Request, res: Response) => {
  try {
    const { rows: plans } = await pool.query(
      `SELECT * FROM weekly_action_plans WHERE id = $1`,
      [req.params.id]
    );
    if (plans.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const { rows: items } = await pool.query(
      `SELECT * FROM weekly_action_items WHERE plan_id = $1
       ORDER BY CASE status WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END`,
      [req.params.id]
    );

    res.json({ ...plans[0], items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/weekly-action-plan/generate", async (req: Request, res: Response) => {
  try {
    const planId = await generateWeeklyPlan(req.params.id);
    const { rows } = await pool.query(
      `SELECT * FROM weekly_action_plans WHERE id = $1`,
      [planId]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/plans/:id", async (req: Request, res: Response) => {
  try {
    const { status, summary, top_goal } = req.body;
    const { rows } = await pool.query(
      `UPDATE weekly_action_plans SET status = COALESCE($1, status),
       summary = COALESCE($2, summary), top_goal = COALESCE($3, top_goal),
       updated_at = NOW() WHERE id = $4 RETURNING *`,
      [status, summary, top_goal, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// Weekly Action Items
// ====================================================================
router.put("/items/:id", async (req: Request, res: Response) => {
  try {
    const { status, task_title, task_description, owner_type, due_date } = req.body;
    const { rows } = await pool.query(
      `UPDATE weekly_action_items SET status = COALESCE($1, status),
       task_title = COALESCE($2, task_title), task_description = COALESCE($3, task_description),
       owner_type = COALESCE($4, owner_type), due_date = COALESCE($5, due_date),
       updated_at = NOW() WHERE id = $6 RETURNING *`,
      [status, task_title, task_description, owner_type, due_date, req.params.id]
    );
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// Quick Wins (filtered priorities with low effort)
// ====================================================================
router.get("/:id/quick-wins", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM marketing_priorities
       WHERE client_id = $1 AND status = 'open' AND effort_score <= 35
       ORDER BY priority_score DESC
       LIMIT 10`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// High Impact (filtered priorities with high impact)
// ====================================================================
router.get("/:id/high-impact", async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM marketing_priorities
       WHERE client_id = $1 AND status = 'open' AND impact_score >= 60
       ORDER BY impact_score DESC
       LIMIT 10`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
