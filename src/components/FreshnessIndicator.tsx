import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreshnessIndicatorProps {
  date: string;
  className?: string;
}

function timeAgo(dateStr: string): { label: string; level: "fresh" | "recent" | "stale" } {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = diff / 3600000;
  const days = hours / 24;
  if (days < 1) return { label: `${Math.round(hours)}h ago`, level: "fresh" };
  if (days < 7) return { label: `${Math.round(days)}d ago`, level: "recent" };
  return { label: `${Math.round(days)}d ago`, level: "stale" };
}

const LEVEL_STYLES = {
  fresh: "text-emerald-600",
  recent: "text-muted-foreground",
  stale: "text-amber-600",
};

export function FreshnessIndicator({ date, className }: FreshnessIndicatorProps) {
  const { label, level } = timeAgo(date);
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", LEVEL_STYLES[level], className)}>
      <Clock className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
