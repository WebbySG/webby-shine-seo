import { Badge } from "@/components/ui/badge";
import {
  Search, FileText, Edit, CheckCircle, Send, BarChart3,
  XCircle, RotateCcw, Clock, Sparkles, AlertTriangle,
} from "lucide-react";

const EVENT_CONFIG: Record<string, { icon: typeof Clock; label: string; colorClass: string }> = {
  created: { icon: Sparkles, label: "Detected", colorClass: "text-primary" },
  brief_created: { icon: FileText, label: "Brief Created", colorClass: "text-violet-500" },
  draft_generated: { icon: Edit, label: "Draft Generated", colorClass: "text-amber-500" },
  approved: { icon: CheckCircle, label: "Approved", colorClass: "text-emerald-500" },
  published: { icon: Send, label: "Published", colorClass: "text-primary" },
  performance_checked: { icon: BarChart3, label: "Performance", colorClass: "text-emerald-500" },
  dismissed: { icon: XCircle, label: "Dismissed", colorClass: "text-muted-foreground" },
  reopened: { icon: RotateCcw, label: "Reopened", colorClass: "text-amber-500" },
};

interface LifecycleEvent {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  actor: string | null;
  created_at: string;
}

interface PlanningMemoryTrailProps {
  lifecycle: LifecycleEvent[];
  compact?: boolean;
}

export function PlanningMemoryTrail({ lifecycle, compact = false }: PlanningMemoryTrailProps) {
  if (!lifecycle || lifecycle.length === 0) return null;

  const sorted = [...lifecycle].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {sorted.map((event, i) => {
          const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.created;
          const Icon = config.icon;
          const isLast = i === sorted.length - 1;
          return (
            <div key={event.id} className="flex items-center gap-0.5" title={event.summary}>
              <div className={`p-0.5 rounded ${isLast ? "bg-primary/10" : ""}`}>
                <Icon className={`h-3 w-3 ${config.colorClass} ${isLast ? "" : "opacity-50"}`} />
              </div>
              {i < sorted.length - 1 && (
                <div className="w-2 h-px bg-border" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => {
        const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.created;
        const Icon = config.icon;
        const isLast = i === sorted.length - 1;
        const date = new Date(event.created_at);
        const daysAgo = Math.floor((Date.now() - date.getTime()) / 86400000);
        const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

        return (
          <div key={event.id} className="flex items-start gap-2.5 relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[9px] top-5 w-px h-[calc(100%-4px)] bg-border" />
            )}
            {/* Icon */}
            <div className={`relative z-10 p-1 rounded-full bg-background border border-border shrink-0 ${isLast ? "border-primary/40" : ""}`}>
              <Icon className={`h-3 w-3 ${config.colorClass}`} />
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-foreground">{config.label}</span>
                <span className="text-[9px] text-muted-foreground">{timeLabel}</span>
                {event.actor && (
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1">{event.actor}</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 truncate">
                {event.summary}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact status indicator showing where an item is in the lifecycle
interface LifecycleStatusProps {
  briefId: string | null;
  draftId: string | null;
  articleId: string | null;
  publishingJobId: string | null;
  performanceSummaryId: string | null;
}

const STAGES = [
  { key: "briefId", label: "Brief", icon: FileText },
  { key: "draftId", label: "Draft", icon: Edit },
  { key: "articleId", label: "Article", icon: FileText },
  { key: "publishingJobId", label: "Published", icon: Send },
  { key: "performanceSummaryId", label: "Tracked", icon: BarChart3 },
] as const;

export function LifecycleStatusBar(props: LifecycleStatusProps) {
  const reached = STAGES.findIndex(
    (s) => !(props as any)[s.key]
  );
  const completedCount = reached === -1 ? STAGES.length : reached;

  return (
    <div className="flex items-center gap-0.5">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isCompleted = i < completedCount;
        return (
          <div key={stage.key} className="flex items-center gap-0.5" title={stage.label}>
            <div className={`p-0.5 rounded ${isCompleted ? "bg-primary/10" : "bg-muted/30"}`}>
              <Icon className={`h-2.5 w-2.5 ${isCompleted ? "text-primary" : "text-muted-foreground/40"}`} />
            </div>
            {i < STAGES.length - 1 && (
              <div className={`w-1.5 h-px ${isCompleted ? "bg-primary/30" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
