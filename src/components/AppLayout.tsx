import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import { Outlet, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { WorkspaceRestoreProvider } from "@/contexts/WorkspaceRestoreContext";
import { GlobalClientSelector } from "@/components/GlobalClientSelector";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  "/settings": { label: "Settings" },
  "/content-studio": { label: "Content Studio", module: "content" },
  "/articles": { label: "Articles", module: "content" },
  "/social-media": { label: "Social Media", module: "content" },
  "/videos": { label: "Video Assets", module: "content" },
  "/backlinks": { label: "Backlinks", module: "seo" },
  "/site-explorer": { label: "Site Explorer", module: "seo" },
  "/serp-checker": { label: "SERP Checker", module: "seo" },
  "/schema-creator": { label: "Schema Creator", module: "seo" },
  "/topical-maps": { label: "Topical Maps", module: "content" },
  "/bulk-content": { label: "Bulk Content", module: "content" },
  "/operations": { label: "Operations" },
  "/reports": { label: "Reports", module: "analytics" },
  "/ai-visibility": { label: "AI Visibility", module: "analytics" },
  "/calendar": { label: "Content Calendar", module: "content" },
};

const MODULE_BADGE_STYLES: Record<string, string> = {
  seo: "bg-seo-background text-seo-primary border-seo-border",
  content: "bg-content-background text-content-primary border-content-border",
  analytics: "bg-analytics-background text-analytics-primary border-analytics-border",
  gbp: "bg-gbp-background text-gbp-primary border-gbp-border",
  ads: "bg-ads-background text-ads-primary border-ads-border",
  core: "bg-primary/10 text-primary border-primary/20",
};

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, workspace } = useAuth();
  const basePath = "/" + (location.pathname.split("/")[1] || "");
  const page = PAGE_TITLES[basePath] || { label: workspace?.brand_name || "Webby SEO" };
  const initials = user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U" : "U";

  return (
    <ClientProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 shrink-0 sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="mr-1" />
                <div className="h-4 w-px bg-border/50" />
                <span className="text-sm font-semibold text-foreground tracking-tight">{page.label}</span>
                {page.module && (
                  <Badge variant="outline" className={`text-[10px] font-medium ${MODULE_BADGE_STYLES[page.module] || ""}`}>
                    {page.module.toUpperCase()}
                  </Badge>
                )}
                <div className="h-4 w-px bg-border/50 ml-1" />
                <GlobalClientSelector />
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full hover:bg-muted/60 p-1 pr-2 transition-colors">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-muted-foreground hidden sm:inline">{user?.full_name}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/settings")}><UserIcon className="h-4 w-4 mr-2" /> Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Sign Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 lg:p-8">
              <Outlet />
            </main>
          </div>
          
        </div>
      </SidebarProvider>
    </ClientProvider>
  );
}
