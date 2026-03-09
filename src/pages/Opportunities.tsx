import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients, useOpportunities } from "@/hooks/use-api";
import { clients as dummyClients } from "@/data/dummy";
import { Target, FileSearch, Layers, Wrench, Lightbulb, TrendingUp } from "lucide-react";
import type { Opportunity } from "@/lib/api";

const TYPE_META: Record<Opportunity["type"], { label: string; icon: typeof Target; colorClass: string; bgClass: string; borderClass: string }> = {
  near_win: { label: "Near Win", icon: Target, colorClass: "text-amber-600", bgClass: "bg-amber-500/10", borderClass: "border-l-amber-500" },
  content_gap: { label: "Content Gap", icon: FileSearch, colorClass: "text-primary", bgClass: "bg-primary/10", borderClass: "border-l-primary" },
  page_expansion: { label: "Page Expansion", icon: Layers, colorClass: "text-violet-600", bgClass: "bg-violet-500/10", borderClass: "border-l-violet-500" },
  technical_fix: { label: "Technical Fix", icon: Wrench, colorClass: "text-destructive", bgClass: "bg-destructive/10", borderClass: "border-l-destructive" },
};

const PRIORITY_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

function buildDummyOpportunities(): Opportunity[] {
  return [
    { id: "d1", type: "near_win", keyword: "renovation singapore", target_url: "https://renovo.sg/services", current_position: 12, recommended_action: 'Push "renovation singapore" from #12 to page 1. Add internal links, expand content, and optimize headings.', priority: "high", status: "open", created_at: new Date().toISOString() },
    { id: "d2", type: "near_win", keyword: "bathroom renovation cost singapore", target_url: "https://renovo.sg/bathroom", current_position: 15, recommended_action: 'Push "bathroom renovation cost singapore" from #15 to page 1. Add internal links, expand content, and optimize headings.', priority: "high", status: "open", created_at: new Date().toISOString() },
    { id: "d3", type: "near_win", keyword: "interior design singapore", target_url: "https://renovo.sg/interior", current_position: 18, recommended_action: 'Push "interior design singapore" from #18 to page 1. Add internal links, expand content, and optimize headings.', priority: "medium", status: "open", created_at: new Date().toISOString() },
    { id: "d4", type: "content_gap", keyword: "interior design trends 2026", target_url: null, current_position: null, recommended_action: 'Create new page for "interior design trends 2026". Competitor renocraft.sg ranks #4.', priority: "high", status: "open", created_at: new Date().toISOString() },
    { id: "d5", type: "technical_fix", keyword: "renovation singapore", target_url: "https://renovo.sg/services", current_position: 12, recommended_action: "Fix technical issues: WARNING — Missing Meta Description. No meta description found. Add a compelling meta description under 160 characters.", priority: "medium", status: "open", created_at: new Date().toISOString() },
    { id: "d6", type: "page_expansion", keyword: "renovation singapore, condo renovation singapore", target_url: "https://renovo.sg/services", current_position: 9, recommended_action: "Expand page content. This URL ranks for 2 keywords. Consider splitting into dedicated pages.", priority: "medium", status: "open", created_at: new Date().toISOString() },
  ];
}

export default function Opportunities() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? dummyClients;
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const { data: apiOpportunities, isLoading } = useOpportunities(clientId);

  const opportunities: Opportunity[] = apiOpportunities ?? buildDummyOpportunities();

  const countByType = (type: Opportunity["type"]) => opportunities.filter((o) => o.type === type).length;
  const highPriorityCount = opportunities.filter(o => o.priority === "high").length;

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground text-sm mt-1">Weekly SEO action suggestions · <span className="font-medium text-foreground">{highPriorityCount} high priority</span></p>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-[200px] bg-card border"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards with accent borders */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-4">
        {(["near_win", "content_gap", "page_expansion", "technical_fix"] as const).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <StaggerItem key={type}>
            <Card className={`${meta.borderClass} border-l-4 hover-lift`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${meta.bgClass}`}>
                  <Icon className={`h-5 w-5 ${meta.colorClass}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{meta.label}</p>
                  <p className="text-2xl font-bold">{countByType(type)}</p>
                </div>
              </CardContent>
            </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Near Wins section */}
      {countByType("near_win") > 0 && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <Target className="h-4 w-4 text-amber-600" />
              </div>
              Near Wins — Positions 11–20
              <Badge variant="secondary" className="text-xs ml-auto">{countByType("near_win")} keywords</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.filter((o) => o.type === "near_win").map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/30 transition-colors px-2 rounded">
                <div>
                  <p className="text-sm font-medium">{o.keyword}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{o.target_url ?? ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-sm font-semibold">#{o.current_position}</span>
                  </div>
                  <Badge variant={PRIORITY_BADGE[o.priority]} className="text-xs">{o.priority}</Badge>
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
            <div className="p-1.5 rounded-md bg-primary/10">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            All Recommendations
            <Badge variant="outline" className="text-xs ml-auto">{opportunities.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && opportunities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm font-medium">No opportunities found this week.</p>
              <p className="text-xs mt-1">Check back after the next crawl cycle.</p>
            </div>
          )}
          {opportunities.map((o) => {
            const meta = TYPE_META[o.type];
            const Icon = meta.icon;
            return (
              <div key={o.id} className={`p-4 rounded-lg border ${meta.borderClass} border-l-4 bg-muted/10 hover-lift`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className={`p-1 rounded ${meta.bgClass}`}>
                    <Icon className={`h-3.5 w-3.5 ${meta.colorClass}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                  <span className="text-sm font-semibold">{o.keyword ?? "—"}</span>
                  {o.current_position && (
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{o.current_position}</span>
                  )}
                  <Badge variant={PRIORITY_BADGE[o.priority]} className="text-xs ml-auto">{o.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{o.recommended_action}</p>
                {o.target_url && <p className="text-xs font-mono text-muted-foreground/70 mt-1.5">{o.target_url}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
