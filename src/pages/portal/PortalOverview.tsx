import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, TrendingUp, CheckCircle, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalOverview() {
  const { workspace, user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.first_name || "there"}</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's an overview of your marketing progress</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Articles Published", value: "—", icon: FileText, color: "text-content-primary" },
          { label: "Social Posts", value: "—", icon: TrendingUp, color: "text-social-primary" },
          { label: "Pending Approvals", value: "—", icon: Clock, color: "text-ads-primary" },
          { label: "SEO Score", value: "—", icon: BarChart3, color: "text-seo-primary" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <CheckCircle className="h-10 w-10 mx-auto text-status-success" />
            <p>No items pending your approval</p>
            <p className="text-xs">When your agency submits content for review, it will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
