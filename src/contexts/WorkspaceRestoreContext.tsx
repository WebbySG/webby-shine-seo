import React, { createContext, useContext, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types: Workspace State Contract ───
// This is the canonical shape for future backend persistence via:
//   GET  /api/workspace-state
//   PUT  /api/workspace-state

export interface WorkspaceEntityFocus {
  entityType: "opportunity" | "brief" | "draft" | "audit_run" | "audit_issue" | "keyword_job" | "article" | null;
  entityId: string | null;
}

export interface WorkspaceUIState {
  activeTab?: string;
  panelOpen?: boolean;
  panelEntityId?: string;
  expandedIds?: string[];
}

export interface WorkspaceFilters {
  [key: string]: string | string[] | boolean | number | undefined;
}

export interface UserWorkspaceState {
  userId: string;
  lastRoute: string;
  selectedClientId: string;
  moduleKey: string;
  entityFocus: WorkspaceEntityFocus;
  filters: WorkspaceFilters;
  uiState: WorkspaceUIState;
  updatedAt: string;
}

const STORAGE_KEY = "webby_workspace_state";

function loadState(): Partial<UserWorkspaceState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: Partial<UserWorkspaceState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
  } catch { /* quota exceeded — silent */ }
}

// ─── Context ───
interface WorkspaceRestoreContextType {
  /** Full saved state (may be partial on first load) */
  savedState: Partial<UserWorkspaceState>;
  /** Update specific fields */
  updateState: (patch: Partial<UserWorkspaceState>) => void;
  /** Save entity focus for current page */
  setEntityFocus: (entityType: WorkspaceEntityFocus["entityType"], entityId: string | null) => void;
  /** Save filters for current module */
  setModuleFilters: (filters: WorkspaceFilters) => void;
  /** Save UI state (tabs, panels) */
  setUIState: (ui: Partial<WorkspaceUIState>) => void;
  /** Clear all saved state (on logout) */
  clearState: () => void;
}

const WorkspaceRestoreContext = createContext<WorkspaceRestoreContextType | null>(null);

// Map routes to module keys
const ROUTE_MODULE_MAP: Record<string, string> = {
  "/": "dashboard",
  "/command-center": "command",
  "/opportunities": "opportunities",
  "/keyword-research": "keywords",
  "/brief-workflow": "briefs",
  "/audit": "audit",
  "/rankings": "rankings",
  "/analytics": "analytics",
  "/reports": "reports",
  "/competitor-benchmark": "competitors",
  "/content-studio": "content",
  "/articles": "articles",
  "/social-media": "social",
  "/google-ads": "ads",
  "/local-seo": "local",
};

export function WorkspaceRestoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const stateRef = useRef<Partial<UserWorkspaceState>>(loadState());

  // Track route changes
  useEffect(() => {
    const basePath = "/" + (location.pathname.split("/")[1] || "");
    const moduleKey = ROUTE_MODULE_MAP[basePath] || basePath.replace("/", "") || "dashboard";
    const patch: Partial<UserWorkspaceState> = {
      lastRoute: location.pathname,
      moduleKey,
      userId: user?.id || stateRef.current.userId,
    };
    stateRef.current = { ...stateRef.current, ...patch };
    saveState(stateRef.current);
  }, [location.pathname, user?.id]);

  const updateState = useCallback((patch: Partial<UserWorkspaceState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    saveState(stateRef.current);
  }, []);

  const setEntityFocus = useCallback((entityType: WorkspaceEntityFocus["entityType"], entityId: string | null) => {
    updateState({ entityFocus: { entityType, entityId } });
  }, [updateState]);

  const setModuleFilters = useCallback((filters: WorkspaceFilters) => {
    updateState({ filters });
  }, [updateState]);

  const setUIState = useCallback((ui: Partial<WorkspaceUIState>) => {
    const merged = { ...(stateRef.current.uiState || {}), ...ui };
    updateState({ uiState: merged });
  }, [updateState]);

  const clearState = useCallback(() => {
    stateRef.current = {};
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <WorkspaceRestoreContext.Provider value={{
      savedState: stateRef.current,
      updateState,
      setEntityFocus,
      setModuleFilters,
      setUIState,
      clearState,
    }}>
      {children}
    </WorkspaceRestoreContext.Provider>
  );
}

export function useWorkspaceRestore() {
  const ctx = useContext(WorkspaceRestoreContext);
  if (!ctx) throw new Error("useWorkspaceRestore must be used within WorkspaceRestoreProvider");
  return ctx;
}
