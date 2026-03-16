import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Globe } from "lucide-react";

export default function PortalPerformance() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-analytics-primary" /> Performance
      </h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Organic Traffic", value: "—", icon: Globe },
          { label: "Keywords Ranking", value: "—", icon: TrendingUp },
          { label: "Avg. Position", value: "—", icon: BarChart3 },
        ].map(k => (
          <Card key={k.label} className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <k.icon className="h-8 w-8 text-analytics-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-border/50">
        <CardHeader><CardTitle>Performance Charts</CardTitle></CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          Performance data will appear once analytics are connected.
        </CardContent>
      </Card>
    </div>
  );
}
