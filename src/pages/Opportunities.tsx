import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RankChangeIndicator } from "@/components/RankChangeIndicator";
import { useClients, useOpportunities } from "@/hooks/use-api";
import { clients as dummyClients, getOpportunities as getDummyOpportunities, getClientRankings } from "@/data/dummy";
import { Target, FileSearch, Layers, Wrench, Lightbulb } from "lucide-react";
import type { Opportunity } from "@/lib/api";

const TYPE_META: Record<Opportunity["type"], { label: string; icon: typeof Target; colorClass: string }> = {
  near_win: { label: "Near Win", icon: Target, colorClass: "text-warning" },
  content_gap: { label: "Content Gap", icon: FileSearch, colorClass: "text-primary" },
  page_expansion: { label: "Page Expansion", icon: Layers, colorClass: "text-accent-foreground" },
  technical_fix: { label: "Technical Fix", icon: Wrench, colorClass: "text-destructive" },
};

function buildDummyOpportunities(clientId: string): Opportunity[] {
  const kws = getClientRankings(clientId);
  const opps: Opportunity[] = [];

  for (const r of kws) {
    if (r.current_position >= 11 && r.current_position <= 20) {
      opps.push({
        type: "near_win",
        keyword: r.keyword,
        current_position: r.current_position,
        last_position: r.last_position,
        change: r.change,
        target_page: r.ranking_url,
        recommended_action: `Push from #${r.current_position} to page 1. Optimize on-page content, strengthen internal links, and build topical authority.`,
        priority: r.current_position <= 15 ? "high" : "medium",
      });
    }
  }

  // Dummy content gap
  opps.push({
    type: "content_gap",
    keyword: "interior design trends 2026",
    current_position: null,
    last_position: null,
    change: null,
    target_page: null,
    recommended_action: "Competitor renocraft.sg ranks #4. Create a dedicated page targeting this keyword.",
    priority: "high",
  });

  // Dummy technical fix
  opps.push({
    type: "technical_fix",
    keyword: "renovation singapore",
    current_position: 12,
    last_position: null,
    change: null,
    target_page: "https://renovo.sg/services",
    recommended_action: "WARNING: Missing Meta Description — No meta description found. Add a compelling meta description under 160 characters.",
    priority: "medium",
  });

  opps.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2));
  return opps;
}

export default function Opportunities() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? dummyClients;
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const { data: apiOpportunities, isLoading } = useOpportunities(clientId);

  const opportunities: Opportunity[] = apiOpportunities ?? buildDummyOpportunities(clientId);

  const countByType = (type: Opportunity["type"]) => opportunities.filter((o) => o.type === type).length;

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

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {(["near_win", "content_gap", "page_expansion", "technical_fix"] as const).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <Card key={type}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-8 w-8 ${meta.colorClass}`} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{meta.label}</p>
                  <p className="text-2xl font-bold">{countByType(type)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Near Wins section */}
      {countByType("near_win") > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" />Near Wins — Positions 11–20
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.filter((o) => o.type === "near_win").map((o, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{o.keyword}</p>
                  <p className="text-xs text-muted-foreground font-mono">{o.target_page ?? ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">#{o.current_position}</span>
                  {o.change != null && <RankChangeIndicator change={o.change} />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />All Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && opportunities.length === 0 && <p className="text-sm text-muted-foreground">No opportunities found this week.</p>}
          {opportunities.map((o, i) => {
            const meta = TYPE_META[o.type];
            const Icon = meta.icon;
            return (
              <div key={i} className="p-3 rounded-md border bg-muted/20">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Icon className={`h-3.5 w-3.5 ${meta.colorClass}`} />
                  <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                  <span className="text-sm font-semibold">{o.keyword}</span>
                  {o.current_position && <span className="text-xs font-mono text-muted-foreground">#{o.current_position}</span>}
                  <Badge variant={o.priority === "high" ? "destructive" : o.priority === "medium" ? "secondary" : "outline"} className="text-xs ml-auto">{o.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{o.recommended_action}</p>
                {o.target_page && <p className="text-xs font-mono text-muted-foreground mt-1">{o.target_page}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
