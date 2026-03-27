import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star, ThumbsUp, ThumbsDown, TrendingUp, Users, BarChart3,
  MessageSquare,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444", "#6b7280"];

export default function CSATDashboard() {
  const { clientId } = useAuth();

  const { data: responses = [] } = useQuery<any[]>({
    queryKey: ["csat-responses", clientId],
    queryFn: () => request(`/csat?workspace_id=${clientId}`),
  });

  const { data: summary } = useQuery<any>({
    queryKey: ["csat-summary", clientId],
    queryFn: () => request(`/csat/summary?workspace_id=${clientId}`),
  });

  const avgRating = Number(summary?.avg_rating || 0).toFixed(1);
  const total = Number(summary?.total || 0);
  const satisfied = Number(summary?.satisfied || 0);
  const unsatisfied = Number(summary?.unsatisfied || 0);
  const csatScore = total > 0 ? Math.round((satisfied / total) * 100) : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: `${r}★`,
    count: responses.filter((res: any) => res.rating === r).length,
  }));

  const pieData = [
    { name: "Satisfied (4-5)", value: satisfied },
    { name: "Neutral (3)", value: total - satisfied - unsatisfied },
    { name: "Unsatisfied (1-2)", value: unsatisfied },
  ].filter((d) => d.value > 0);

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Satisfaction</h1>
          <p className="text-sm text-muted-foreground mt-1">Track CSAT scores and customer feedback</p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-3xl font-bold text-foreground">{avgRating}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold text-foreground">{csatScore}%</p>
              <p className="text-xs text-muted-foreground">CSAT Score</p>
              <Progress value={csatScore} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold text-foreground">{satisfied}</p>
              <p className="text-xs text-muted-foreground">Satisfied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Total Responses</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Rating Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingDistribution} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="rating" width={35} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Satisfaction Breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Satisfaction Breakdown</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Feedback</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {responses.slice(0, 10).map((resp: any) => (
                <div key={resp.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= resp.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <div className="flex-1">
                    {resp.feedback && <p className="text-sm text-foreground">{resp.feedback}</p>}
                    {!resp.feedback && <p className="text-sm text-muted-foreground italic">No comment</p>}
                    <p className="text-xs text-muted-foreground mt-1">{resp.conversation_subject || "General feedback"}</p>
                  </div>
                </div>
              ))}
              {responses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No CSAT responses yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
