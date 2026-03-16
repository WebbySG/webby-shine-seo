import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  workspace_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  status: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  workspace_type: string;
  status: string;
  brand_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  theme_mode?: string;
}

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  roles: string[];
  permissions: string[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAgency: boolean;
  isClientUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; workspaceName?: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setWorkspace(null);
    setRoles([]);
    setPermissions([]);
    setToken(null);
    localStorage.removeItem("auth_token");
  }, []);

  // Fetch current user on mount / token change
  useEffect(() => {
    if (!token) {
      // No token — allow access in demo/preview mode with full permissions
      setUser({ id: "demo", workspace_id: "demo", first_name: "Demo", last_name: "User", full_name: "Demo User", email: "demo@webby.seo", status: "active" });
      setWorkspace({ id: "demo", name: "Webby SEO", slug: "demo", workspace_type: "agency", status: "active" });
      setRoles(["owner"]);
      setPermissions([
        "view_dashboard", "manage_clients", "manage_articles", "approve_articles",
        "publish_articles", "manage_social", "manage_videos", "manage_gbp",
        "manage_ads", "view_analytics", "view_crm", "manage_crm", "view_billing",
        "manage_branding", "manage_team", "manage_settings"
      ]);
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setWorkspace(data.workspace);
        setRoles(data.roles?.map((r: any) => r.role) || []);
        setPermissions(data.permissions?.map((p: any) => p.permission_key) || []);
      })
      .catch(() => clearAuth())
      .finally(() => setIsLoading(false));
  }, [token, clearAuth]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setRoles(data.roles?.map((r: any) => r.role) || []);
    setPermissions(data.permissions?.map((p: any) => p.permission_key) || []);
  };

  const register = async (regData: { email: string; password: string; firstName: string; lastName: string; workspaceName?: string }) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regData),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setWorkspace(data.workspace);
  };

  const logout = () => {
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearAuth();
  };

  const hasPermission = (perm: string) => permissions.includes(perm);
  const hasRole = (role: string) => roles.includes(role);

  const isAuthenticated = !!user;
  const isAgency = workspace?.workspace_type === "agency";
  const isClientUser = roles.some((r) => r === "client_admin" || r === "client_user");

  return (
    <AuthContext.Provider
      value={{ user, workspace, roles, permissions, token, isLoading, isAuthenticated, isAgency, isClientUser, login, register, logout, hasPermission, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
