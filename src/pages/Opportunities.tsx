import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { useClients, useKeywords } from "@/hooks/use-api";
import { clients as dummyClients, getOpportunities } from "@/data/dummy";
import { Target, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";

export default function Opportunities() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? dummyClients;
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const { data: apiKeywords } = useKeywords(clientId);

  // Compute opportunities from API or dummy
  const kws = apiKeywords ?? getOpportunities(clientId).nearWins.concat(
    getOpportunities(clientId).improving,
    getOpportunities(clientId).dropping
  );

  const nearWins = kws.filter((r) => (r.current_position ?? 100) >= 11 && (r.current_position ?? 100) <= 20);
  const improving = [...kws].filter((r) => (r.change ?? 0) > 0).sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
  const dropping = [...kws].filter((r) => (r.change ?? 0) < 0).sort((a, b) => (a.change ?? 0) - (b.change ?? 0));

  const suggestions = [
    ...nearWins.map((r) => ({
      keyword: r.keyword,
      action: `Push from #${r.current_position} to page 1. Optimize on-page content and build internal links.`,
      priority: "high" as const,
    })),
    ...improving.slice(0, 3).map((r) => ({
      keyword: r.keyword,
      action: `Momentum detected (+${r.change}). Double down with fresh content and backlinks.`,
      priority: "medium" as const,
    })),
    ...dropping.slice(0, 2).map((r) => ({
      keyword: r.keyword,
      action: `Dropped ${Math.abs(r.change ?? 0)} positions. Review content freshness and competitor activity.`,
      priority: "high" as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground text-sm mt-1">Weekly SEO action suggestions</p>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Target className="h-8 w-8 text-warning" /><div><p className="text-xs text-muted-foreground uppercase tracking-wide">Near Wins</p><p className="text-2xl font-bold">{nearWins.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-success" /><div><p className="text-xs text-muted-foreground uppercase tracking-wide">Improving</p><p className="text-2xl font-bold">{improving.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingDown className="h-8 w-8 text-destructive" /><div><p className="text-xs text-muted-foreground uppercase tracking-wide">Dropping</p><p className="text-2xl font-bold">{dropping.length}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-warning" />Near Wins — Positions 11–20</CardTitle></CardHeader>
        <CardContent>
          {nearWins.length === 0 && <p className="text-sm text-muted-foreground">No keywords in striking distance.</p>}
          {nearWins.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{r.keyword}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.ranking_url ?? ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm">#{r.current_position}</span>
                <RankChangeIndicator change={r.change ?? 0} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Weekly Action Suggestions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length === 0 && <p className="text-sm text-muted-foreground">No suggestions this week.</p>}
          {suggestions.map((s, i) => (
            <div key={i} className="p-3 rounded-md border bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{s.keyword}</span>
                <Badge variant={s.priority === "high" ? "destructive" : "secondary"} className="text-xs">{s.priority}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{s.action}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
