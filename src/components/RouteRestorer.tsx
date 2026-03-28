import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "webby_workspace_state";

// Routes that are valid restore targets (no auth/onboarding routes)
const RESTORABLE_ROUTES = new Set([
  "/", "/command-center", "/clients", "/rankings", "/keyword-research",
  "/competitor-benchmark", "/audit", "/opportunities", "/analytics",
  "/local-seo", "/creative", "/google-ads", "/settings", "/reports",
  "/ai-visibility", "/topical-maps", "/content-studio", "/bulk-content",
  "/calendar", "/articles", "/brief-workflow", "/social-media", "/videos",
  "/backlinks", "/schema-creator", "/site-explorer", "/serp-checker",
  "/operations",
]);

function isRestorableRoute(route: string): boolean {
  const base = "/" + (route.split("/")[1] || "");
  return RESTORABLE_ROUTES.has(base);
}

/**
 * Restores the user's last route on initial app load.
 * Only fires once per mount. Only redirects if the user landed on "/" (default).
 */
export function RouteRestorer() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRestored = useRef(false);

  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    // Only restore if user landed on the default route
    if (location.pathname !== "/") return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      const lastRoute = state?.lastRoute;

      if (
        lastRoute &&
        lastRoute !== "/" &&
        isRestorableRoute(lastRoute) &&
        // Don't restore stale state (older than 7 days)
        state?.updatedAt &&
        Date.now() - new Date(state.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
      ) {
        navigate(lastRoute, { replace: true });
      }
    } catch {
      // Silent — corrupted state
    }
  }, []);

  return null;
}
