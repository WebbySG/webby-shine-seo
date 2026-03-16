import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivationChecklist, useUpdateChecklistItem } from "@/hooks/use-api";
import { CheckCircle2, Circle, Loader2, Plug, Settings, Rocket, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const ICON_MAP: Record<string, any> = {
  integration: Plug,
  setup: Settings,
  launch: Rocket,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-primary",
  completed: "text-green-600",
  skipped: "text-muted-foreground/50",
};

export default function ActivationChecklist({ clientId }: { clientId: string }) {
  const { data: items, isLoading } = useActivationChecklist(clientId);
  const updateItem = useUpdateChecklistItem(clientId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="py-12 text-center">
          <Rocket className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No activation checklist yet.</p>
          <Button className="mt-4" onClick={() => navigate("/onboarding")}>
            Start Setup <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completed = items.filter((i: any) => i.status === "completed").length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleToggle = async (item: any) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      await updateItem.mutateAsync({ itemId: item.id, status: newStatus });
    } catch (e: any) {
      toast.error("Failed to update item");
    }
  };

  const grouped = items.reduce((acc: any, item: any) => {
    const type = item.checklist_type || "setup";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium">Activation Progress</span>
            <span className="text-sm text-muted-foreground">{completed}/{total} complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {progress === 100 && (
          <Badge className="bg-green-100 text-green-700 border-green-200">🎉 All Done</Badge>
        )}
      </div>

      {/* Grouped items */}
      {Object.entries(grouped).map(([type, typeItems]: [string, any]) => {
        const Icon = ICON_MAP[type] || Settings;
        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold capitalize">{type} Steps</h3>
            </div>
            <div className="space-y-2">
              {typeItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => handleToggle(item)}
                  className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:bg-accent/50 ${
                    item.status === "completed" ? "bg-green-50/50 border-green-200/50 dark:bg-green-950/20" : "border-border"
                  }`}
                >
                  <div className="mt-0.5">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : updateItem.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[item.status]}`}>
                    {item.status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
