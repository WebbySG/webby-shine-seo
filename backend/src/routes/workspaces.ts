import { Router, Response } from "express";
import { authMiddleware, AuthRequest, requireRole } from "../middleware/auth.js";
import { createInvite, getWorkspaceInvites, revokeInvite, acceptInvite } from "../services/auth/inviteService.js";
import { setUserRole } from "../services/auth/permissionService.js";
import { getUsageSummary, getSubscription } from "../services/billing/usageService.js";
import pool from "../db.js";

const router = Router();

// Create workspace
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, workspace_type } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO workspaces (name, slug, workspace_type) VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, workspace_type || "client"]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get workspace
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM workspaces WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update workspace
router.put("/:id", authMiddleware, requireRole("owner", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE workspaces SET name = COALESCE($1, name), status = COALESCE($2, status), updated_at = NOW() WHERE id = $3 RETURNING *`,
      [name, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Invites
router.post("/:id/invites", authMiddleware, requireRole("owner", "admin", "manager"), async (req: AuthRequest, res: Response) => {
  try {
    const invite = await createInvite(req.params.id, req.body.email, req.body.role || "viewer");
    res.json(invite);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/:id/invites", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const invites = await getWorkspaceInvites(req.params.id);
    res.json(invites);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Users in workspace
router.get("/:id/users", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.full_name, u.email, u.status, u.last_login_at, u.created_at,
              (SELECT array_agg(role) FROM user_roles WHERE user_id = u.id AND workspace_id = $1) as roles
       FROM users u WHERE u.workspace_id = $1 ORDER BY u.created_at`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update user role
router.put("/:id/users/:userId/role", authMiddleware, requireRole("owner", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    await setUserRole(req.params.userId, req.params.id, req.body.role);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update user permissions
router.put("/:id/users/:userId/permissions", authMiddleware, requireRole("owner", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { permissions } = req.body;
    await pool.query(`DELETE FROM user_permissions WHERE user_id = $1 AND workspace_id = $2`, [req.params.userId, req.params.id]);
    for (const perm of permissions) {
      await pool.query(
        `INSERT INTO user_permissions (user_id, workspace_id, permission_key) VALUES ($1, $2, $3)`,
        [req.params.userId, req.params.id, perm]
      );
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update user status
router.put("/:id/users/:userId/status", authMiddleware, requireRole("owner", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(`UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3`, [req.body.status, req.params.userId, req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Usage
router.get("/:id/usage", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const usage = await getUsageSummary(req.params.id);
    res.json(usage);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Subscription
router.get("/:id/subscription", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sub = await getSubscription(req.params.id);
    res.json(sub);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Branding
router.put("/:id/branding", authMiddleware, requireRole("owner", "admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { brand_name, logo_url, favicon_url, primary_color, secondary_color, accent_color, theme_mode, custom_domain, support_email } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO workspace_branding (workspace_id, brand_name, logo_url, favicon_url, primary_color, secondary_color, accent_color, theme_mode, custom_domain, support_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (workspace_id) DO UPDATE SET
         brand_name = COALESCE($2, workspace_branding.brand_name),
         logo_url = COALESCE($3, workspace_branding.logo_url),
         favicon_url = COALESCE($4, workspace_branding.favicon_url),
         primary_color = COALESCE($5, workspace_branding.primary_color),
         secondary_color = COALESCE($6, workspace_branding.secondary_color),
         accent_color = COALESCE($7, workspace_branding.accent_color),
         theme_mode = COALESCE($8, workspace_branding.theme_mode),
         custom_domain = COALESCE($9, workspace_branding.custom_domain),
         support_email = COALESCE($10, workspace_branding.support_email),
         updated_at = NOW()
       RETURNING *`,
      [req.params.id, brand_name, logo_url, favicon_url, primary_color, secondary_color, accent_color, theme_mode, custom_domain, support_email]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
