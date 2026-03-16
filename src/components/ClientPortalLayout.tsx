import { useAuth } from "@/contexts/AuthContext";
import { Outlet, Navigate } from "react-router-dom";
import {
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  LayoutDashboard, BarChart3, FileText, Share2, Video, MapPin, DollarSign, Users, ClipboardList, Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

const portalNav = [
  { title: "Overview", url: "/portal", icon: LayoutDashboard },
  { title: "Performance", url: "/portal/performance", icon: BarChart3 },
  { title: "Articles", url: "/portal/articles", icon: FileText },
  { title: "Social", url: "/portal/social", icon: Share2 },
  { title: "Videos", url: "/portal/videos", icon: Video },
  { title: "Local SEO", url: "/portal/local-seo", icon: MapPin },
  { title: "Ads", url: "/portal/ads", icon: DollarSign },
  { title: "Leads", url: "/portal/leads", icon: Users },
  { title: "Tasks", url: "/portal/tasks", icon: ClipboardList },
  { title: "Settings", url: "/portal/settings", icon: Settings },
];

function PortalSidebar() {
  const { workspace } = useAuth();
  const location = useLocation();
  const brandName = workspace?.brand_name || "Client Portal";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          {workspace?.logo_url ? (
            <img src={workspace.logo_url} alt={brandName} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
              <LayoutDashboard className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">{brandName}</span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Client Portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {portalNav.map((item) => {
                const active = item.url === "/portal" ? location.pathname === "/portal" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.url === "/portal"}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}
                        activeClassName="">
                        <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 pt-2">
        <div className="rounded-lg bg-muted/50 p-3 border border-border/30">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Powered by</p>
          <p className="text-xs font-mono text-muted-foreground">Webby SEO</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function ClientPortalLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <PortalSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-1" />
              <span className="text-sm font-semibold text-foreground">Client Portal</span>
              <Badge variant="outline" className="text-[10px]">PORTAL</Badge>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
