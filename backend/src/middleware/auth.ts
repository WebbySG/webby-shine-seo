import { Request, Response, NextFunction } from "express";
import { getSession } from "../services/auth/sessionService.js";
import { getUserById } from "../services/auth/authService.js";
import { hasPermission } from "../services/auth/permissionService.js";

export interface AuthRequest extends Request {
  user?: any;
  workspace?: any;
  roles?: any[];
  permissions?: any[];
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  getUserById(session.userId).then((data) => {
    if (!data) return res.status(401).json({ error: "User not found" });
    req.user = data.user;
    req.workspace = data.workspace;
    req.roles = data.roles;
    req.permissions = data.permissions;
    next();
  }).catch(() => res.status(500).json({ error: "Auth error" }));
}

export function requirePermission(...permissions: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const workspaceId = req.workspace?.id || req.user.workspace_id;
    
    for (const perm of permissions) {
      const allowed = await hasPermission(req.user.id, workspaceId, perm);
      if (!allowed) {
        return res.status(403).json({ error: `Missing permission: ${perm}` });
      }
    }
    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const userRoles = req.roles?.map((r: any) => r.role) || [];
    const hasRole = roles.some(r => userRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}
