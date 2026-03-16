import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import pool from "../db.js";

const router = Router();

// Get approvals for client
router.get("/:id/approvals", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT ca.*, u.full_name as acted_by_name
       FROM client_approvals ca
       LEFT JOIN users u ON u.id = ca.acted_by
       WHERE ca.client_id = $1
       ORDER BY ca.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
