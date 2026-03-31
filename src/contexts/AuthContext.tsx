import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

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
  clientId: string;
  roles: string[];
  permissions: string[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAgency: boolean;
  isClientUser: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; workspaceName?: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
  toggleDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ALL_PERMISSIONS = [
  "view_dashboard", "manage_clients", "manage_articles", "approve_articles",
  "publish_articles", "manage_social", "manage_videos", "manage_gbp",
  "manage_ads", "view_analytics", "view_billing",
  "manage_branding", "manage_team", "manage_settings",
];

const DEMO_USER: User = {
  id: "00000000-0000-0000-0000-000000000100",
  workspace_id: "00000000-0000-0000-0000-000000000010",
  first_name: "Demo", last_name: "Admin", full_name: "Demo Admin",
  email: "demo@webby.seo", status: "active",
};

const DEMO_WORKSPACE: Workspace = {
  id: "00000000-0000-0000-0000-000000000010",
  name: "Webby Digital Agency", slug: "webby-agency",
  workspace_type: "agency", status: "active", brand_name: "Webby SEO",
};

function mapSupabaseUser(su: SupabaseUser, profile?: any): User {
  return {
    id: su.id,
    workspace_id: profile?.workspace_id || su.id,
    first_name: profile?.first_name || su.user_metadata?.first_name || su.email?.split("@")[0] || "",
    last_name: profile?.last_name || su.user_metadata?.last_name || "",
    full_name: profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || su.email?.split("@")[0] || "",
    email: su.email || "",
    status: "active",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const clearAuth = useCallback(() => {
    setUser(null);
    setWorkspace(null);
    setRoles([]);
    setPermissions([]);
    setToken(null);
    setIsLoading(false);
  }, []);

  const activateDemoMode = useCallback(() => {
    setUser(DEMO_USER);
    setWorkspace(DEMO_WORKSPACE);
    setRoles(["owner"]);
    setPermissions(ALL_PERMISSIONS);
    setToken(null);
    setIsDemoMode(true);
    setIsLoading(false);
  }, []);

  const loadUserData = useCallback(async (supabaseUser: SupabaseUser, sessionToken: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supabaseUser.id);

      const mappedUser = mapSupabaseUser(supabaseUser, profile);
      const roleList = userRoles?.map((r: any) => r.role) || ["owner"];

      setUser(mappedUser);
      setWorkspace({
        id: mappedUser.workspace_id,
        name: "My Workspace",
        slug: "workspace",
        workspace_type: "agency",
        status: "active",
        brand_name: "Webby SEO",
      });
      setRoles(roleList);
      setPermissions(ALL_PERMISSIONS);
      setToken(sessionToken);
      setIsDemoMode(false);
    } catch (err) {
      console.error("Failed to load user data:", err);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setTimeout(() => loadUserData(session.user, session.access_token), 0);
        } else if (event === "SIGNED_OUT") {
          clearAuth();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user, session.access_token);
      } else {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData, clearAuth]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      await loadUserData(data.user, data.session.access_token);
    }
  };

  const register = async (regData: { email: string; password: string; firstName: string; lastName: string; workspaceName?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: regData.email,
      password: regData.password,
      options: {
        data: {
          first_name: regData.firstName,
          last_name: regData.lastName,
          full_name: `${regData.firstName} ${regData.lastName}`.trim(),
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
    if (data.session) {
      await loadUserData(data.user!, data.session.access_token);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWorkspace(null);
    setRoles([]);
    setPermissions([]);
    setToken(null);
    activateDemoMode();
    setIsDemoMode(true);
    localStorage.setItem("demo_mode", "true");
  };

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem("demo_mode", String(next));
      if (next) {
        supabase.auth.signOut();
        activateDemoMode();
      }
      return next;
    });
  }, [activateDemoMode]);

  const hasPermission = (perm: string) => permissions.includes(perm);
  const hasRole = (role: string) => roles.includes(role);

  const isAuthenticated = !!user;
  const isAgency = workspace?.workspace_type === "agency";
  const isClientUser = roles.some((r) => r === "client_admin" || r === "client_user");

  return (
    <AuthContext.Provider
      value={{ user, workspace, clientId: workspace?.id || "", roles, permissions, token, isLoading, isAuthenticated, isAgency, isClientUser, isDemoMode, login, register, logout, hasPermission, hasRole, toggleDemoMode }}
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
