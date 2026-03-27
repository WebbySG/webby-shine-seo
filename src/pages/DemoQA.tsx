import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, Circle, AlertTriangle, RotateCcw, ClipboardList,
  LayoutDashboard, Users, BarChart3, Shield, Lightbulb, TrendingUp,
  MapPin, Paintbrush, DollarSign, Command, Handshake, FileText,
  Share2, Video, LogIn, Rocket,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CheckItem {
  id: string;
  label: string;
  route?: string;
  category: string;
}

const qaChecklist: CheckItem[] = [
  // Auth
  { id: "login", label: "Login with demo@webby.seo / DemoPass123!", route: "/login", category: "Authentication" },
  { id: "register", label: "Register a new account", route: "/register", category: "Authentication" },
  { id: "forgot", label: "Forgot password flow", route: "/forgot-password", category: "Authentication" },
  { id: "logout", label: "Logout and re-login", category: "Authentication" },

  // Onboarding
  { id: "onboard-start", label: "Start onboarding wizard", route: "/onboarding", category: "Onboarding" },
  { id: "onboard-steps", label: "Complete all 7 wizard steps", route: "/onboarding", category: "Onboarding" },
  { id: "onboard-template", label: "Select industry template", route: "/onboarding", category: "Onboarding" },
  { id: "onboard-complete", label: "Reach setup complete screen", category: "Onboarding" },

  // Dashboard
  { id: "dash-charts", label: "Dashboard charts render with data", route: "/", category: "Dashboard" },
  { id: "dash-kpis", label: "KPI cards show realistic numbers", route: "/", category: "Dashboard" },
  { id: "dash-ctas", label: "Add Client / Generate Plan buttons work", route: "/", category: "Dashboard" },

  // Keywords & Rankings
  { id: "kw-list", label: "Keywords list loads for client", route: "/rankings", category: "Keywords & Rankings" },
  { id: "kw-trends", label: "Rank trend chart shows 30-day history", route: "/rankings", category: "Keywords & Rankings" },
  { id: "kw-competitors", label: "Competitor rankings display", route: "/rankings", category: "Keywords & Rankings" },

  // Audit
  { id: "audit-run", label: "Audit results display with score", route: "/audit", category: "Technical Audit" },
  { id: "audit-issues", label: "Issue list with severity badges", route: "/audit", category: "Technical Audit" },
  { id: "audit-fix", label: "Mark issue as in-progress / done", route: "/audit", category: "Technical Audit" },

  // Opportunities
  { id: "opps-list", label: "Opportunities page loads", route: "/opportunities", category: "Opportunities" },
  { id: "opps-near", label: "Near-win keywords highlighted", route: "/opportunities", category: "Opportunities" },

  // Articles & Content
  { id: "art-list", label: "Articles list shows all statuses", route: "/clients", category: "Articles & Content" },
  { id: "art-generate", label: "Generate article button visible", route: "/clients", category: "Articles & Content" },
  { id: "art-status", label: "Draft → Review → Approved → Published flow", route: "/clients", category: "Articles & Content" },

  // Social
  { id: "social-list", label: "Social posts display per platform", route: "/clients", category: "Social Posts" },
  { id: "social-generate", label: "Generate social posts button", route: "/clients", category: "Social Posts" },
  { id: "social-schedule", label: "Scheduling functionality", route: "/clients", category: "Social Posts" },

  // Videos
  { id: "video-list", label: "Video assets list loads", route: "/clients", category: "Videos" },
  { id: "video-script", label: "Video scripts display correctly", route: "/clients", category: "Videos" },

  // Analytics
  { id: "analytics-charts", label: "Analytics charts with 30-day data", route: "/analytics", category: "Analytics" },
  { id: "analytics-clicks", label: "Clicks/impressions trend visible", route: "/analytics", category: "Analytics" },
  { id: "analytics-ctr", label: "CTR chart renders", route: "/analytics", category: "Analytics" },

  // Local SEO / GBP
  { id: "gbp-profile", label: "GBP profile info displays", route: "/local-seo", category: "Local SEO" },
  { id: "gbp-reviews", label: "Reviews list with ratings", route: "/local-seo", category: "Local SEO" },
  { id: "gbp-posts", label: "GBP post drafts visible", route: "/local-seo", category: "Local SEO" },

  // Google Ads
  { id: "ads-page", label: "Google Ads page loads", route: "/google-ads", category: "Google Ads" },
  { id: "ads-recs", label: "Recommendations display", route: "/google-ads", category: "Google Ads" },

  // Command Center
  { id: "cmd-priorities", label: "Marketing priorities ranked", route: "/command-center", category: "Command Center" },
  { id: "cmd-plan", label: "Weekly action plan visible", route: "/command-center", category: "Command Center" },
  { id: "cmd-recs", label: "Cross-channel recommendations", route: "/command-center", category: "Command Center" },

  // Settings
  { id: "settings-team", label: "Team management tab", route: "/settings", category: "Settings" },
  { id: "settings-brand", label: "Branding / white-label tab", route: "/settings", category: "Settings" },
  { id: "settings-usage", label: "Usage / subscription tab", route: "/settings", category: "Settings" },

  // Portal
  { id: "portal-overview", label: "Client portal overview", route: "/portal", category: "Client Portal" },
  { id: "portal-perf", label: "Portal performance page", route: "/portal/performance", category: "Client Portal" },

  // Mobile
  { id: "mobile-sidebar", label: "Sidebar collapses on mobile", category: "Mobile" },
  { id: "mobile-charts", label: "Charts resize on mobile", category: "Mobile" },
  { id: "mobile-tables", label: "Tables scroll horizontally", category: "Mobile" },
];

const categoryIcons: Record<string, any> = {
  "Authentication": LogIn,
  "Onboarding": Rocket,
  "Dashboard": LayoutDashboard,
  "Keywords & Rankings": BarChart3,
  "Technical Audit": Shield,
  "Opportunities": Lightbulb,
  "Articles & Content": FileText,
  "Social Posts": Share2,
  "Videos": Video,
  "Analytics": TrendingUp,
  "Local SEO": MapPin,
  "Google Ads": DollarSign,
  
  "Command Center": Command,
  "Settings": ClipboardList,
  "Client Portal": Users,
  "Mobile": Paintbrush,
};

export default function DemoQA() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  const resetAll = () => setChecked({});

  const categories = [...new Set(qaChecklist.map((i) => i.category))];
  const total = qaChecklist.length;
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            QA Test Checklist
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Demo Mode — Verify all features end-to-end
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={pct === 100 ? "default" : "secondary"} className="text-sm px-3 py-1">
            {done}/{total} ({pct}%)
          </Badge>
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            ← Back to App
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Demo Credentials */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Agency Login:</span>{" "}
              <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono text-xs">demo@webby.seo</code>
              {" / "}
              <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono text-xs">DemoPass123!</code>
            </div>
            <div>
              <span className="text-muted-foreground">Client Login:</span>{" "}
              <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono text-xs">client@renovo.sg</code>
              {" / "}
              <code className="bg-muted px-2 py-0.5 rounded text-foreground font-mono text-xs">DemoPass123!</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist by Category */}
      {categories.map((cat) => {
        const items = qaChecklist.filter((i) => i.category === cat);
        const catDone = items.filter((i) => checked[i.id]).length;
        const Icon = categoryIcons[cat] || Circle;

        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {cat}
                </CardTitle>
                <Badge variant={catDone === items.length ? "default" : "outline"} className="text-xs">
                  {catDone}/{items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors ${
                    checked[item.id] ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={checked[item.id] || false}
                    onCheckedChange={() => toggle(item.id)}
                    className="shrink-0"
                  />
                  <span className={`text-sm flex-1 ${checked[item.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </span>
                  {item.route && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(item.route!)}
                    >
                      Go →
                    </Button>
                  )}
                  {checked[item.id] ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Separator />

      {/* Local Setup Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Local Docker Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-1">
            <p className="text-foreground font-semibold"># 1. Start all services</p>
            <p>docker compose up -d --build</p>
            <p className="text-foreground font-semibold mt-3"># 2. Run all migrations</p>
            <p>{"for f in backend/db/migrations/*.sql; do"}</p>
            <p>{"  docker exec -i $(docker compose ps -q db) psql -U postgres -d webby_seo < \"$f\""}</p>
            <p>done</p>
            <p className="text-foreground font-semibold mt-3"># 3. Run demo seed</p>
            <p>{"docker exec -i $(docker compose ps -q db) psql -U postgres -d webby_seo < backend/db/migrations/031_demo_seed.sql"}</p>
            <p className="text-foreground font-semibold mt-3"># 4. Reset demo data</p>
            <p>{"docker exec -i $(docker compose ps -q db) psql -U postgres -d webby_seo < backend/db/reset-demo.sql"}</p>
            <p>{"docker exec -i $(docker compose ps -q db) psql -U postgres -d webby_seo < backend/db/migrations/031_demo_seed.sql"}</p>
            <p className="text-foreground font-semibold mt-3"># 5. Open app</p>
            <p>open http://localhost:5173</p>
          </div>
          <div className="space-y-1">
            <p>• <strong>Frontend:</strong> http://localhost:5173 (Vite dev server)</p>
            <p>• <strong>Backend API:</strong> http://localhost:3001</p>
            <p>• <strong>Database:</strong> postgres://postgres:postgres@localhost:5432/webby_seo</p>
            <p>• <strong>Worker:</strong> runs as separate container for background jobs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
