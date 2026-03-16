import { Router, Request, Response } from "express";
import { registerUser, loginUser, getUserById, hashPassword, verifyPassword } from "../services/auth/authService.js";
import { createSession, destroySession } from "../services/auth/sessionService.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import pool from "../db.js";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, workspaceName } = req.body;
    if (!email || !password || !firstName) {
      return res.status(400).json({ error: "Email, password, and first name required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const result = await registerUser({ email, password, firstName, lastName: lastName || "", workspaceName });
    const token = createSession(result.user.id, result.workspace.id);
    res.json({ user: result.user, workspace: result.workspace, token });
  } catch (e: any) {
    if (e.message?.includes("duplicate key") || e.message?.includes("unique")) {
      return res.status(409).json({ error: "Email already registered" });
    }
    res.status(500).json({ error: e.message });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const result = await loginUser(email, password);
    const token = createSession(result.user.id, result.user.workspace_id);
    res.json({ user: result.user, roles: result.roles, permissions: result.permissions, token });
  } catch (e: any) {
    res.status(401).json({ error: e.message || "Invalid credentials" });
  }
});

// Logout
router.post("/logout", authMiddleware, (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) destroySession(token);
  res.json({ success: true });
});

// Me
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = await getUserById(req.user.id);
    if (!data) return res.status(404).json({ error: "User not found" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Forgot Password (generates reset token, in production send email)
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ success: true, message: "If the email exists, a reset link will be sent." });
    }
    // In production: send email with reset token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    // Store token (using invites table temporarily or a separate password_resets table)
    await pool.query(
      `INSERT INTO invites (workspace_id, email, role, token, status, expires_at)
       VALUES ((SELECT workspace_id FROM users WHERE email = $1), $1, 'viewer', $2, 'pending', NOW() + INTERVAL '1 hour')`,
      [email, `reset_${token}`]
    );
    res.json({ success: true, message: "If the email exists, a reset link will be sent.", token: `reset_${token}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Reset Password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const { rows: invites } = await pool.query(
      `SELECT * FROM invites WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );
    if (invites.length === 0) return res.status(400).json({ error: "Invalid or expired reset token" });

    const passwordHash = await hashPassword(newPassword);
    await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2`, [passwordHash, invites[0].email]);
    await pool.query(`UPDATE invites SET status = 'accepted' WHERE id = $1`, [invites[0].id]);

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
