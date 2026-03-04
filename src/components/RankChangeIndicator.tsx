import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function RankChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-success font-mono text-sm font-semibold">
        <ArrowUp className="h-3.5 w-3.5" />+{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-destructive font-mono text-sm font-semibold">
        <ArrowDown className="h-3.5 w-3.5" />{change}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground font-mono text-sm">
      <Minus className="h-3.5 w-3.5" />0
    </span>
  );
}
