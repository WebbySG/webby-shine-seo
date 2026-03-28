import { useEffect, useCallback } from "react";
import { useWorkspaceRestore, type WorkspaceFilters, type WorkspaceUIState, type WorkspaceEntityFocus } from "@/contexts/WorkspaceRestoreContext";

/**
 * Per-page hook that wires up workspace restore for a specific module.
 * Returns saved state for that module and setters for filters/entity/ui.
 *
 * Usage:
 *   const { savedFilters, savedEntity, savedUI, trackFilters, trackEntity, trackUI } = usePageRestore("briefs");
 */
export function usePageRestore(moduleKey: string) {
  const { savedState, setEntityFocus, setModuleFilters, setUIState, updateState } = useWorkspaceRestore();

  // Only return state if it matches the current module
  const isCurrentModule = savedState.moduleKey === moduleKey;

  const savedFilters: WorkspaceFilters = isCurrentModule ? (savedState.filters || {}) : {};
  const savedEntity: WorkspaceEntityFocus = isCurrentModule
    ? (savedState.entityFocus || { entityType: null, entityId: null })
    : { entityType: null, entityId: null };
  const savedUI: Partial<WorkspaceUIState> = isCurrentModule ? (savedState.uiState || {}) : {};

  const trackFilters = useCallback((filters: WorkspaceFilters) => {
    setModuleFilters(filters);
  }, [setModuleFilters]);

  const trackEntity = useCallback((entityType: WorkspaceEntityFocus["entityType"], entityId: string | null) => {
    setEntityFocus(entityType, entityId);
  }, [setEntityFocus]);

  const trackUI = useCallback((ui: Partial<WorkspaceUIState>) => {
    setUIState(ui);
  }, [setUIState]);

  // Set module key on mount
  useEffect(() => {
    updateState({ moduleKey });
  }, [moduleKey, updateState]);

  return { savedFilters, savedEntity, savedUI, trackFilters, trackEntity, trackUI };
}
