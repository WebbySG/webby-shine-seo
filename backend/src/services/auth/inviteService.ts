import pool from "../../db.js";
import { generateToken, hashPassword } from "./authService.js";
import { setUserRole } from "./permissionService.js";

export async function createInvite(workspaceId: string, email: string, role: string) {
  // Check if already invited
  const { rows: existing } = await pool.query(
    `SELECT id FROM invites WHERE workspace_id = $1 AND email = $2 AND status = 'pending'`,
    [workspaceId, email]
  );
  if (existing.length > 0) throw new Error("User already invited");

  // Check if user already exists in workspace
  const { rows: existingUser } = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND workspace_id = $2`,
    [email, workspaceId]
  );
  if (existingUser.length > 0) throw new Error("User already in workspace");

  const token = generateToken();
  const { rows } = await pool.query(
    `INSERT INTO invites (workspace_id, email, role, token)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [workspaceId, email, role, token]
  );
  return rows[0];
}

export async function acceptInvite(token: string, password: string, firstName: string, lastName: string) {
  const { rows: invites } = await pool.query(
    `SELECT * FROM invites WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
    [token]
  );
  if (invites.length === 0) throw new Error("Invalid or expired invite");

  const invite = invites[0];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const passwordHash = await hashPassword(password);
    const fullName = `${firstName} ${lastName}`.trim();
    const { rows: userRows } = await client.query(
      `INSERT INTO users (workspace_id, first_name, last_name, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [invite.workspace_id, firstName, lastName, fullName, invite.email, passwordHash]
    );
    const user = userRows[0];

    await setUserRole(user.id, invite.workspace_id, invite.role);

    await client.query(
      `UPDATE invites SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
      [invite.id]
    );

    await client.query("COMMIT");
    const { password_hash, ...safeUser } = user;
    return safeUser;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getWorkspaceInvites(workspaceId: string) {
  const { rows } = await pool.query(
    `SELECT id, email, role, status, expires_at, created_at FROM invites WHERE workspace_id = $1 ORDER BY created_at DESC`,
    [workspaceId]
  );
  return rows;
}

export async function revokeInvite(inviteId: string) {
  await pool.query(`UPDATE invites SET status = 'revoked', updated_at = NOW() WHERE id = $1`, [inviteId]);
}

export async function expireOldInvites() {
  const { rowCount } = await pool.query(
    `UPDATE invites SET status = 'expired', updated_at = NOW() WHERE status = 'pending' AND expires_at < NOW()`
  );
  return rowCount || 0;
}
