import { cn } from "@/lib/utils";

interface ConfidenceChipProps {
  value: number; // 0-100
  className?: string;
}

export function ConfidenceChip({ value, className }: ConfidenceChipProps) {
  const level = value >= 80 ? "high" : value >= 50 ? "medium" : "low";
  const styles = {
    high: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", styles[level], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-emerald-500": level === "high",
        "bg-amber-500": level === "medium",
        "bg-destructive": level === "low",
      })} />
      {value}%
    </span>
  );
}
