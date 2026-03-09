import {
  LayoutDashboard,
  Users,
  BarChart3,
  Shield,
  Lightbulb,
  Search,
  TrendingUp,
  MapPin,
  Paintbrush,
  DollarSign,
  Command,
  Handshake,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const coreNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-foreground" },
  { title: "Command Center", url: "/command-center", icon: Command, color: "text-primary" },
];

const seoNav = [
  { title: "Rankings", url: "/rankings", icon: BarChart3, color: "text-seo-primary" },
  { title: "Audit", url: "/audit", icon: Shield, color: "text-seo-primary" },
  { title: "Opportunities", url: "/opportunities", icon: Lightbulb, color: "text-seo-primary" },
];

const channelNav = [
  { title: "Analytics", url: "/analytics", icon: TrendingUp, color: "text-analytics-primary" },
  { title: "Local SEO", url: "/local-seo", icon: MapPin, color: "text-gbp-primary" },
  { title: "Creative", url: "/creative", icon: Paintbrush, color: "text-content-primary" },
  { title: "Google Ads", url: "/google-ads", icon: DollarSign, color: "text-ads-primary" },
];

const businessNav = [
  { title: "Clients", url: "/clients", icon: Users, color: "text-foreground" },
  { title: "CRM", url: "/crm", icon: Handshake, color: "text-crm-primary" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof coreNav) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground/60 mb-1">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active}>
                  <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                    activeClassName=""
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                    )}
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

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
            <Search className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">Webby SEO</span>
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
      </SidebarContent>
      <SidebarFooter className="p-4 pt-2">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3 border border-border/30">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Version</p>
            <p className="text-xs font-mono text-muted-foreground">v2.0 — Phase 19</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
