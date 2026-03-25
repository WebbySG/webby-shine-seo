/**
 * Activity Logger — centralised audit trail for all system actions.
 * Also creates in-app notifications for relevant events.
 */
import pool from "../db.js";

export interface LogEntry {
  workspaceId?: string;
  clientId?: string;
  userId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  metadata?: Record<string, any>;
}

export async function logActivity(entry: LogEntry): Promise<string> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO activity_log (workspace_id, client_id, user_id, actor_name, action, entity_type, entity_id, summary, metadata_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        entry.workspaceId || null,
        entry.clientId || null,
        entry.userId || null,
        entry.actorName || "system",
        entry.action,
        entry.entityType,
        entry.entityId || null,
        entry.summary || null,
        entry.metadata ? JSON.stringify(entry.metadata) : "{}",
      ]
    );
    return rows[0].id;
  } catch (err) {
    console.error("[ActivityLogger] Failed to log:", err);
    return "";
  }
}

export interface NotificationEntry {
  workspaceId?: string;
  userId?: string;
  type: "info" | "success" | "warning" | "error";
  category: "publish" | "report" | "approval" | "sync" | "system";
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
}

export async function createNotification(entry: NotificationEntry): Promise<string> {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (workspace_id, user_id, type, category, title, message, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        entry.workspaceId || null,
        entry.userId || null,
        entry.type,
        entry.category,
        entry.title,
        entry.message || null,
        entry.entityType || null,
        entry.entityId || null,
      ]
    );
    return rows[0].id;
  } catch (err) {
    console.error("[Notification] Failed to create:", err);
    return "";
  }
}

/**
 * Convenience: log activity + create notification in one call
 */
export async function logAndNotify(
  log: LogEntry,
  notif: Omit<NotificationEntry, "entityType" | "entityId">
): Promise<void> {
  await Promise.all([
    logActivity(log),
    createNotification({
      ...notif,
      workspaceId: log.workspaceId,
      entityType: log.entityType,
      entityId: log.entityId,
    }),
  ]);
}
