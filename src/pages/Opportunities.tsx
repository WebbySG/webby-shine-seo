import { useState, useEffect } from "react";
import { usePageRestore } from "@/hooks/use-workspace-restore";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/SourceBadge";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { FreshnessIndicator } from "@/components/FreshnessIndicator";
import { MascotSectionHeader } from "@/components/MascotCast";
import { PlanningMemoryTrail, LifecycleStatusBar } from "@/components/PlanningMemoryTrail";
import { useClients, useOpportunities } from "@/hooks/use-api";
import { Target, FileSearch, Layers, Wrench, TrendingUp, ArrowRight, Eye, ChevronDown, ChevronUp } from "lucide-react";
import type { OpportunityWithMemory } from "@/lib/api";

const TYPE_META: Record<string, { label: string; icon: typeof Target; colorClass: string; bgClass: string; borderClass: string }> = {
  near_win: { label: "Near Win", icon: Target, colorClass: "text-amber-600", bgClass: "bg-amber-500/10", borderClass: "border-l-amber-500" },
  content_gap: { label: "Content Gap", icon: FileSearch, colorClass: "text-primary", bgClass: "bg-primary/10", borderClass: "border-l-primary" },
  page_expansion: { label: "Page Expansion", icon: Layers, colorClass: "text-violet-600", bgClass: "bg-violet-500/10", borderClass: "border-l-violet-500" },
  technical_fix: { label: "Technical Fix", icon: Wrench, colorClass: "text-destructive", bgClass: "bg-destructive/10", borderClass: "border-l-destructive" },
};

export default function Opportunities() {
  const { data: apiClients } = useClients();
  const clients = apiClients ?? [];
  const [clientId] = useState(clients[0]?.id ?? "");
  const { data: apiOpportunities, isLoading } = useOpportunities(clientId);
  const opportunities: OpportunityWithMemory[] = (apiOpportunities as any) ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const highCount = opportunities.filter(o => o.priority === "high").length;
  const totalImpact = opportunities.length;

  return (
    <PageTransition className="space-y-5">
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

      {/* Opportunity Cards */}
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
          const isExpanded = expandedId === o.id;
          return (
            <Card key={o.id} className={`${meta.borderClass} border-l-4 hover-lift group`}>
              <CardContent className="p-4">
                {/* Top row */}
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
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{o.evidence_text}</p>

                {/* Source badges + lifecycle status bar */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {o.sources?.map((s) => <SourceBadge key={s} source={s} />)}
                  <FreshnessIndicator date={o.created_at} />
                  <div className="ml-auto">
                    <LifecycleStatusBar
                      briefId={o.brief_id}
                      draftId={o.draft_id}
                      articleId={o.article_id}
                      publishingJobId={o.publishing_job_id}
                      performanceSummaryId={o.performance_summary_id}
                    />
                  </div>
                </div>

                {/* Expected impact + toggle */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-medium text-emerald-600 truncate">{o.expected_impact}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {o.next_action} <ArrowRight className="h-3 w-3" />
                    </Button>
                    {o.lifecycle && o.lifecycle.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground"
                        onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded: Planning Memory Trail */}
                {isExpanded && o.lifecycle && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Decision History</p>
                    <PlanningMemoryTrail lifecycle={o.lifecycle} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageTransition>
  );
}
