import pool from "../../db.js";
import crypto from "crypto";

// Simple bcrypt-like hashing with crypto (no external dep)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return hash === computed;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createWorkspace(name: string, slug: string, type: string = "agency") {
  const { rows } = await pool.query(
    `INSERT INTO workspaces (name, slug, workspace_type) VALUES ($1, $2, $3) RETURNING *`,
    [name, slug, type]
  );
  return rows[0];
}

export async function registerUser(data: {
  email: string; password: string; firstName: string; lastName: string;
  workspaceName?: string; workspaceSlug?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create workspace
    const wsName = data.workspaceName || `${data.firstName}'s Workspace`;
    const wsSlug = data.workspaceSlug || data.email.split("@")[0].replace(/[^a-z0-9]/g, "-");
    const { rows: wsRows } = await client.query(
      `INSERT INTO workspaces (name, slug, workspace_type) VALUES ($1, $2, 'agency') RETURNING *`,
      [wsName, wsSlug + "-" + crypto.randomBytes(3).toString("hex")]
    );
    const workspace = wsRows[0];

    const passwordHash = await hashPassword(data.password);
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const { rows: userRows } = await client.query(
      `INSERT INTO users (workspace_id, first_name, last_name, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [workspace.id, data.firstName, data.lastName, fullName, data.email, passwordHash]
    );
    const user = userRows[0];

    // Assign owner role
    await client.query(
      `INSERT INTO user_roles (user_id, workspace_id, role) VALUES ($1, $2, 'owner')`,
      [user.id, workspace.id]
    );

    // Assign all permissions
    const allPerms = [
      "view_dashboard", "manage_clients", "manage_articles", "approve_articles",
      "publish_articles", "manage_social", "manage_videos", "manage_gbp",
      "manage_ads", "view_analytics", "view_crm", "manage_crm", "view_billing",
      "manage_branding", "manage_team", "manage_settings"
    ];
    for (const perm of allPerms) {
      await client.query(
        `INSERT INTO user_permissions (user_id, workspace_id, permission_key) VALUES ($1, $2, $3)`,
        [user.id, workspace.id, perm]
      );
    }

    // Create default subscription (trial)
    const { rows: planRows } = await client.query(
      `SELECT id FROM subscription_plans WHERE plan_type = 'starter' LIMIT 1`
    );
    if (planRows.length > 0) {
      await client.query(
        `INSERT INTO workspace_subscriptions (workspace_id, plan_id, status, ends_at)
         VALUES ($1, $2, 'trial', NOW() + INTERVAL '14 days')`,
        [workspace.id, planRows[0].id]
      );
    }

    await client.query("COMMIT");
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, workspace };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function loginUser(email: string, password: string) {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (rows.length === 0) throw new Error("Invalid credentials");
  const user = rows[0];
  if (user.status === "disabled") throw new Error("Account disabled");
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");

  await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

  // Get roles and permissions
  const { rows: roles } = await pool.query(
    `SELECT role, workspace_id FROM user_roles WHERE user_id = $1`, [user.id]
  );
  const { rows: perms } = await pool.query(
    `SELECT permission_key, workspace_id FROM user_permissions WHERE user_id = $1`, [user.id]
  );

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, roles, permissions: perms };
}

export async function getUserById(userId: string) {
  const { rows } = await pool.query(
    `SELECT id, workspace_id, first_name, last_name, full_name, email, status, last_login_at, created_at
     FROM users WHERE id = $1`, [userId]
  );
  if (rows.length === 0) return null;

  const { rows: roles } = await pool.query(
    `SELECT role, workspace_id FROM user_roles WHERE user_id = $1`, [userId]
  );
  const { rows: perms } = await pool.query(
    `SELECT permission_key, workspace_id FROM user_permissions WHERE user_id = $1`, [userId]
  );
  const { rows: wsRows } = await pool.query(
    `SELECT w.*, wb.brand_name, wb.logo_url, wb.primary_color, wb.secondary_color, wb.accent_color, wb.theme_mode
     FROM workspaces w LEFT JOIN workspace_branding wb ON wb.workspace_id = w.id
     WHERE w.id = $1`, [rows[0].workspace_id]
  );

  return { user: rows[0], roles, permissions: perms, workspace: wsRows[0] || null };
}
