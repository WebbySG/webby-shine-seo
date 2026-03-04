import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clients, rankings, auditIssues } from "@/data/dummy";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { Users, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const allGainers = rankings.filter((r) => r.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
  const allLosers = rankings.filter((r) => r.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
  const openIssues = auditIssues.filter((i) => i.status === "open").length;
  const criticalIssues = auditIssues.filter((i) => i.severity === "critical" && i.status !== "done").length;

  const stats = [
    { label: "Active Clients", value: clients.length, icon: Users },
    { label: "Avg. Improvement", value: `+${(rankings.filter(r => r.change > 0).reduce((s, r) => s + r.change, 0) / Math.max(rankings.filter(r => r.change > 0).length, 1)).toFixed(1)}`, icon: TrendingUp },
    { label: "Dropping Keywords", value: rankings.filter((r) => r.change < 0).length, icon: TrendingDown },
    { label: "Critical Issues", value: criticalIssues, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all SEO operations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allGainers.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.keyword}</p>
                  <p className="text-xs text-muted-foreground font-mono">pos {r.current_position}</p>
                </div>
                <RankChangeIndicator change={r.change} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allLosers.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.keyword}</p>
                  <p className="text-xs text-muted-foreground font-mono">pos {r.current_position}</p>
                </div>
                <RankChangeIndicator change={r.change} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Client Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clients.map((c) => (
              <Link
                key={c.id}
                to={`/clients/${c.id}`}
                className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/50 transition-colors border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.domain}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs font-mono">{c.keywords_count} kw</Badge>
                  <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${c.health_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">{c.health_score}%</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
