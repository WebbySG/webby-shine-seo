import pool from "../../db.js";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["view_dashboard", "manage_clients", "manage_articles", "approve_articles", "publish_articles", "manage_social", "manage_videos", "manage_gbp", "manage_ads", "view_analytics", "view_crm", "manage_crm", "view_billing", "manage_branding", "manage_team", "manage_settings"],
  admin: ["view_dashboard", "manage_clients", "manage_articles", "approve_articles", "publish_articles", "manage_social", "manage_videos", "manage_gbp", "manage_ads", "view_analytics", "view_crm", "manage_crm", "view_billing", "manage_branding", "manage_team", "manage_settings"],
  manager: ["view_dashboard", "manage_clients", "manage_articles", "approve_articles", "publish_articles", "manage_social", "manage_videos", "manage_gbp", "manage_ads", "view_analytics", "view_crm", "manage_crm"],
  seo: ["view_dashboard", "manage_articles", "view_analytics"],
  content: ["view_dashboard", "manage_articles", "manage_social", "manage_videos"],
  designer: ["view_dashboard", "manage_articles"],
  ads: ["view_dashboard", "manage_ads", "view_analytics"],
  client_admin: ["view_dashboard", "view_analytics", "view_crm"],
  client_user: ["view_dashboard"],
  viewer: ["view_dashboard"],
};

export function getDefaultPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || ["view_dashboard"];
}

export async function hasPermission(userId: string, workspaceId: string, permissionKey: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM user_permissions WHERE user_id = $1 AND workspace_id = $2 AND permission_key = $3`,
    [userId, workspaceId, permissionKey]
  );
  return rows.length > 0;
}

export async function hasRole(userId: string, workspaceId: string, role: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM user_roles WHERE user_id = $1 AND workspace_id = $2 AND role = $3`,
    [userId, workspaceId, role]
  );
  return rows.length > 0;
}

export async function isAgencyUser(userId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM users u JOIN workspaces w ON w.id = u.workspace_id WHERE u.id = $1 AND w.workspace_type = 'agency'`,
    [userId]
  );
  return rows.length > 0;
}

export async function setUserRole(userId: string, workspaceId: string, role: string) {
  // Remove existing roles in workspace
  await pool.query(`DELETE FROM user_roles WHERE user_id = $1 AND workspace_id = $2`, [userId, workspaceId]);
  await pool.query(
    `INSERT INTO user_roles (user_id, workspace_id, role) VALUES ($1, $2, $3)`,
    [userId, workspaceId, role]
  );

  // Set default permissions for role
  await pool.query(`DELETE FROM user_permissions WHERE user_id = $1 AND workspace_id = $2`, [userId, workspaceId]);
  const perms = getDefaultPermissionsForRole(role);
  for (const perm of perms) {
    await pool.query(
      `INSERT INTO user_permissions (user_id, workspace_id, permission_key) VALUES ($1, $2, $3)`,
      [userId, workspaceId, perm]
    );
  }
}
