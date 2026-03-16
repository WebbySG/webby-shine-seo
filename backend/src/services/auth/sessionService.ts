import crypto from "crypto";

// In-memory session store (replace with Redis in production)
const sessions = new Map<string, { userId: string; workspaceId: string; expiresAt: number }>();

export function createSession(userId: string, workspaceId: string): string {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  sessions.set(token, { userId, workspaceId, expiresAt });
  return token;
}

export function getSession(token: string) {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token: string) {
  sessions.delete(token);
}

export function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now > session.expiresAt) sessions.delete(token);
  }
}
