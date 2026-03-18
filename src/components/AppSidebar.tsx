import {
  LayoutDashboard, Users, BarChart3, Shield, Lightbulb, Search, TrendingUp,
  MapPin, Paintbrush, DollarSign, Command, Handshake, Settings, LogOut,
  ClipboardList, FlaskConical, FileText,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const coreNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-foreground", perm: "view_dashboard" },
  { title: "Command Center", url: "/command-center", icon: Command, color: "text-primary", perm: "view_dashboard" },
];

const seoNav = [
  { title: "Rankings", url: "/rankings", icon: BarChart3, color: "text-seo-primary", perm: "view_dashboard" },
  { title: "Audit", url: "/audit", icon: Shield, color: "text-seo-primary", perm: "view_dashboard" },
  { title: "Opportunities", url: "/opportunities", icon: Lightbulb, color: "text-seo-primary", perm: "view_dashboard" },
];

const channelNav = [
  { title: "Analytics", url: "/analytics", icon: TrendingUp, color: "text-analytics-primary", perm: "view_analytics" },
  { title: "Local SEO", url: "/local-seo", icon: MapPin, color: "text-gbp-primary", perm: "manage_gbp" },
  { title: "Creative", url: "/creative", icon: Paintbrush, color: "text-content-primary", perm: "manage_articles" },
  { title: "Google Ads", url: "/google-ads", icon: DollarSign, color: "text-ads-primary", perm: "manage_ads" },
];

const businessNav = [
  { title: "Clients", url: "/clients", icon: Users, color: "text-foreground", perm: "manage_clients" },
  { title: "CRM", url: "/crm", icon: Handshake, color: "text-crm-primary", perm: "view_crm" },
  { title: "Reports", url: "/reports", icon: FileText, color: "text-analytics-primary", perm: "view_analytics" },
];

const settingsNav = [
  { title: "Settings", url: "/settings", icon: Settings, color: "text-foreground", perm: "manage_settings" },
  { title: "QA Checklist", url: "/qa", icon: ClipboardList, color: "text-muted-foreground", perm: "view_dashboard" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { hasPermission, logout, workspace, isDemoMode } = useAuth();
  const brandName = workspace?.brand_name || "Webby SEO";

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof coreNav) => {
    const visible = items.filter(i => hasPermission(i.perm));
    if (visible.length === 0) return null;
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/60 mb-1">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visible.map((item) => {
              const active = isActive(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={active}>
                    <NavLink to={item.url} end={item.url === "/"}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                      activeClassName="">
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />}
                      <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary" : item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          {workspace?.logo_url ? (
            <img src={workspace.logo_url} alt={brandName} className="h-8 w-8 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
              <Search className="h-4 w-4" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">{brandName}</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Operating System</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-2">
        {renderGroup("Core", coreNav)}
        {renderGroup("SEO", seoNav)}
        {renderGroup("Channels", channelNav)}
        {renderGroup("Business", businessNav)}
        {renderGroup("System", settingsNav)}
      </SidebarContent>
      <SidebarFooter className="p-4 pt-2 space-y-2">
        {!collapsed && isDemoMode && (
          <div className="rounded-lg bg-primary/10 p-2.5 border border-primary/20 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-primary">Demo Mode</span>
          </div>
        )}
        {!collapsed && (
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        )}
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3 border border-border/30">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Version</p>
            <p className="text-xs font-mono text-muted-foreground">v3.1 — Phase 22</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
