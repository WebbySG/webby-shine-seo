import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const PAGE_TITLES: Record<string, { label: string; module?: string }> = {
  "/": { label: "Dashboard" },
  "/command-center": { label: "Command Center", module: "core" },
  "/clients": { label: "Clients" },
  "/rankings": { label: "Rankings", module: "seo" },
  "/audit": { label: "Site Audit", module: "seo" },
  "/opportunities": { label: "Opportunities", module: "seo" },
  "/analytics": { label: "Analytics", module: "analytics" },
  "/local-seo": { label: "Local SEO", module: "gbp" },
  "/creative": { label: "Creative Assets", module: "content" },
  "/google-ads": { label: "Google Ads", module: "ads" },
  "/crm": { label: "CRM", module: "crm" },
};

const MODULE_BADGE_STYLES: Record<string, string> = {
  seo: "bg-seo-background text-seo-primary border-seo-border",
  content: "bg-content-background text-content-primary border-content-border",
  analytics: "bg-analytics-background text-analytics-primary border-analytics-border",
  gbp: "bg-gbp-background text-gbp-primary border-gbp-border",
  ads: "bg-ads-background text-ads-primary border-ads-border",
  crm: "bg-crm-background text-crm-primary border-crm-border",
  core: "bg-primary/10 text-primary border-primary/20",
};

export function AppLayout() {
  const location = useLocation();
  const basePath = "/" + (location.pathname.split("/")[1] || "");
  const page = PAGE_TITLES[basePath] || { label: "Webby SEO" };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-1" />
              <div className="h-4 w-px bg-border/50" />
              <span className="text-sm font-semibold text-foreground tracking-tight">
                {page.label}
              </span>
              {page.module && (
                <Badge variant="outline" className={`text-[10px] font-medium ${MODULE_BADGE_STYLES[page.module] || ""}`}>
                  {page.module.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                SEO Operating System
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
