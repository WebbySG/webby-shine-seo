import { Shield, Globe, Search, BarChart3, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCE_CONFIG: Record<string, { icon: typeof Shield; className: string }> = {
  audit: { icon: Shield, className: "bg-destructive/10 text-destructive border-destructive/20" },
  competitor: { icon: Globe, className: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  keywords: { icon: Search, className: "bg-seo-background text-seo-primary border-seo-border" },
  rankings: { icon: BarChart3, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  analytics: { icon: TrendingUp, className: "bg-analytics-background text-analytics-primary border-analytics-border" },
  content: { icon: FileText, className: "bg-content-background text-content-primary border-content-border" },
};

interface SourceBadgeProps {
  source: string;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.keywords;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", config.className, className)}>
      <Icon className="h-2.5 w-2.5" />
      {source}
    </span>
  );
}
