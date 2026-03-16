import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import pool from "../db.js";

const router = Router();

// Approve
router.post("/:id/approve", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE client_approvals SET status = 'approved', acted_by = $1, comment = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [req.user.id, req.body.comment || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Approval not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Reject
router.post("/:id/reject", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE client_approvals SET status = 'rejected', acted_by = $1, comment = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [req.user.id, req.body.comment || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Approval not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
