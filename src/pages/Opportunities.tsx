import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/SourceBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { MascotSectionHeader, MascotBanner } from "@/components/MascotCast";
import { useClients, useOpportunities } from "@/hooks/use-api";
import { Target, FileSearch, Layers, Wrench, TrendingUp, ArrowRight, Zap, Eye } from "lucide-react";
import type { Opportunity } from "@/lib/api";

// Enhanced opportunity with AI fields
interface EnhancedOpportunity extends Opportunity {
  confidence: number;
  sources: string[];
  evidence: string;
  expected_impact: string;
  next_action: string;
}

const TYPE_META: Record<string, { label: string; icon: typeof Target; colorClass: string; bgClass: string; borderClass: string }> = {
  near_win: { label: "Near Win", icon: Target, colorClass: "text-amber-600", bgClass: "bg-amber-500/10", borderClass: "border-l-amber-500" },
  content_gap: { label: "Content Gap", icon: FileSearch, colorClass: "text-primary", bgClass: "bg-primary/10", borderClass: "border-l-primary" },
  page_expansion: { label: "Page Expansion", icon: Layers, colorClass: "text-violet-600", bgClass: "bg-violet-500/10", borderClass: "border-l-violet-500" },
  technical_fix: { label: "Technical Fix", icon: Wrench, colorClass: "text-destructive", bgClass: "bg-destructive/10", borderClass: "border-l-destructive" },
};

function buildEnhancedOpportunities(): EnhancedOpportunity[] {
  return [
    { id: "d1", type: "near_win", keyword: "renovation singapore", target_url: "https://renovo.sg/services", current_position: 12, recommended_action: 'Push from #12 to page 1 with internal links and content expansion', priority: "high", status: "open", created_at: new Date(Date.now() - 5 * 86400000).toISOString(), confidence: 92, sources: ["rankings", "keywords"], evidence: "Position improved from #18→#12 over 4 weeks. Competitor avg word count is 2,100 vs your 780.", expected_impact: "+45% organic traffic to /services", next_action: "Expand content to 1,500+ words and add 3 internal links" },
    { id: "d2", type: "near_win", keyword: "bathroom renovation cost singapore", target_url: "https://renovo.sg/bathroom", current_position: 15, recommended_action: 'Add pricing table and FAQ schema', priority: "high", status: "open", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), confidence: 85, sources: ["rankings", "competitor"], evidence: "Competitors in top 5 all have pricing tables. Your page lacks structured pricing content.", expected_impact: "+30% CTR with FAQ rich snippets", next_action: "Create comparison pricing table" },
    { id: "d3", type: "content_gap", keyword: "interior design trends 2026", target_url: null, current_position: null, recommended_action: 'Create new comprehensive guide', priority: "high", status: "open", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), confidence: 78, sources: ["keywords", "competitor"], evidence: "Competitor renocraft.sg ranks #4 with 3,200 words. No existing page on your domain.", expected_impact: "~2,400 monthly search volume opportunity", next_action: "Create SEO brief for new service page" },
    { id: "d4", type: "technical_fix", keyword: null, target_url: "https://renovo.sg/services", current_position: 12, recommended_action: 'Fix missing meta description', priority: "medium", status: "open", created_at: new Date(Date.now() - 7 * 86400000).toISOString(), confidence: 98, sources: ["audit"], evidence: "Meta description tag is empty. This directly impacts CTR in search results.", expected_impact: "+15-20% CTR improvement", next_action: "Add meta description under 160 chars" },
    { id: "d5", type: "page_expansion", keyword: "renovation singapore, condo renovation", target_url: "https://renovo.sg/services", current_position: 9, recommended_action: 'Split into dedicated service pages', priority: "medium", status: "open", created_at: new Date(Date.now() - 10 * 86400000).toISOString(), confidence: 71, sources: ["keywords", "audit"], evidence: "URL ranks for 2 distinct intents. Dedicated pages would improve relevance.", expected_impact: "Better ranking for both terms", next_action: "Create brief for condo renovation page" },
  ];
}

export default function Opportunities() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? [];
  const [clientId] = useState(clients[0]?.id ?? "");
  const { data: apiOpportunities, isLoading } = useOpportunities(clientId);
  const opportunities: EnhancedOpportunity[] = (apiOpportunities as any) ?? buildEnhancedOpportunities();

  const highCount = opportunities.filter(o => o.priority === "high").length;
  const totalImpact = opportunities.length;

  return (
    <PageTransition className="space-y-5">
      {/* Mascot header */}
      <MascotSectionHeader
        role="seo"
        title="AI Opportunities"
        subtitle={`Surfaced from audit, rankings, keywords & competitor data · ${highCount} high priority`}
      />

      {/* Summary strip */}
      <StaggerContainer className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {(["near_win", "content_gap", "page_expansion", "technical_fix"] as const).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const count = opportunities.filter(o => o.type === type).length;
          return (
            <StaggerItem key={type}>
              <Card className={`${meta.borderClass} border-l-4 hover-lift`}>
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${meta.bgClass}`}>
                    <Icon className={`h-4 w-4 ${meta.colorClass}`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{meta.label}</p>
                    <p className="text-xl font-bold text-foreground">{count}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Opportunity Cards — AI-styled */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">All Opportunities</h2>
          <Badge variant="outline" className="text-[10px] ml-auto">{totalImpact} total</Badge>
        </div>

        {isLoading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted/30 rounded-xl animate-pulse" />)}</div>}

        {!isLoading && opportunities.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No opportunities detected</p>
              <p className="text-xs text-muted-foreground mt-1">Check back after the next analysis cycle</p>
            </CardContent>
          </Card>
        )}

        {opportunities.map((o) => {
          const meta = TYPE_META[o.type] || TYPE_META.technical_fix;
          const Icon = meta.icon;
          return (
            <Card key={o.id} className={`${meta.borderClass} border-l-4 hover-lift group`}>
              <CardContent className="p-4">
                {/* Top row: type + keyword + badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <div className={`p-1.5 rounded-lg ${meta.bgClass} shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${meta.colorClass}`} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                    {o.keyword && <span className="text-sm font-semibold text-foreground truncate">{o.keyword}</span>}
                    {o.current_position && (
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{o.current_position}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ConfidenceChip value={o.confidence} />
                    <Badge variant={o.priority === "high" ? "destructive" : o.priority === "medium" ? "secondary" : "outline"} className="text-[10px]">
                      {o.priority}
                    </Badge>
                  </div>
                </div>

                {/* Evidence */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{o.evidence}</p>

                {/* Source badges + impact */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {o.sources.map((s) => <SourceBadge key={s} source={s} />)}
                  <FreshnessIndicator date={o.created_at} />
                </div>

                {/* Expected impact + Next action */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-medium text-emerald-600 truncate">{o.expected_impact}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {o.next_action} <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageTransition>
  );
}
