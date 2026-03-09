import { Link } from "react-router-dom";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-api";
import { clients as dummyClients, rankings as dummyRankings, auditIssues as dummyAuditIssues } from "@/data/dummy";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, ArrowRight,
  BarChart3, Zap, Target, Activity
} from "lucide-react";

export default function Dashboard() {
  const { data: apiClients, isLoading, isError } = useClients();
  const clients = apiClients ?? dummyClients;
  const rankings = dummyRankings;
  const auditIssues = dummyAuditIssues;

  const allGainers = rankings.filter((r) => r.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
  const allLosers = rankings.filter((r) => r.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
  const criticalIssues = auditIssues.filter((i) => i.severity === "critical" && i.status !== "done").length;

  const stats = [
    { label: "Active Clients", value: clients.length, icon: Users, color: "from-primary/10 to-primary/5", iconColor: "text-primary", border: "border-l-primary" },
    { label: "Avg. Improvement", value: `+${(rankings.filter(r => r.change > 0).reduce((s, r) => s + r.change, 0) / Math.max(rankings.filter(r => r.change > 0).length, 1)).toFixed(1)}`, icon: TrendingUp, color: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500", border: "border-l-emerald-500" },
    { label: "Dropping Keywords", value: rankings.filter((r) => r.change < 0).length, icon: TrendingDown, color: "from-amber-500/10 to-amber-500/5", iconColor: "text-amber-500", border: "border-l-amber-500" },
    { label: "Critical Issues", value: criticalIssues, icon: AlertTriangle, color: "from-destructive/10 to-destructive/5", iconColor: "text-destructive", border: "border-l-destructive" },
  ];

  return (
    <PageTransition className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            Overview of all SEO operations
            {isError && <span className="text-amber-500 ml-2 text-xs">(demo data)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono gap-1.5">
            <Activity className="h-3 w-3" />
            {clients.length} active
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
          <Card className={`hover-lift border-l-4 ${s.border} overflow-hidden`}>
            <CardContent className="p-5 relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} pointer-events-none`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
                  <p className="text-3xl font-bold mt-2 text-foreground">{s.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.iconColor} bg-background/80 shadow-sm`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Gainers & Losers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {allGainers.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.keyword}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">position {r.current_position}</p>
                </div>
                <RankChangeIndicator change={r.change} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {allLosers.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.keyword}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">position {r.current_position}</p>
                </div>
                <RankChangeIndicator change={r.change} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Client Overview */}
      <Card className="hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Client Overview
            </CardTitle>
            <Link to="/clients" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : (
            <div className="space-y-1">
              {clients.map((c) => (
                <Link
                  key={c.id}
                  to={`/clients/${c.id}`}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/40 transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs font-mono bg-seo-background text-seo-primary border-seo-border">
                      {c.keywords_count} kw
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            c.health_score >= 80 ? "bg-emerald-500" : c.health_score >= 60 ? "bg-amber-500" : "bg-destructive"
                          }`}
                          style={{ width: `${c.health_score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${
                        c.health_score >= 80 ? "text-emerald-600" : c.health_score >= 60 ? "text-amber-600" : "text-destructive"
                      }`}>
                        {c.health_score}%
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
