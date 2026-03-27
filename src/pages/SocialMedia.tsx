import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useActiveClient } from "@/contexts/ClientContext";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Share2, Plus, Facebook, Instagram, Linkedin, Twitter, Clock, CheckCircle2, Edit, Send,
} from "lucide-react";

const platformIcons: Record<string, typeof Facebook> = {
  facebook: Facebook, instagram: Instagram, linkedin: Linkedin, twitter: Twitter,
};
const platformColors: Record<string, string> = {
  facebook: "text-blue-600", instagram: "text-pink-500", linkedin: "text-blue-700", twitter: "text-sky-500",
};
const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
  approved: { color: "bg-primary/10 text-primary", label: "Approved" },
  scheduled: { color: "bg-amber-500/10 text-amber-600", label: "Scheduled" },
  published: { color: "bg-emerald-500/10 text-emerald-600", label: "Published" },
};

export default function SocialMedia() {
  const { activeClientId: clientId } = useActiveClient();

  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["social-posts", clientId],
    queryFn: () => request(`/clients/${clientId}/social-posts`),
    enabled: !!clientId,
  });

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled" || p.status === "approved").length,
    draft: posts.filter(p => p.status === "draft").length,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" /> Social Media
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create, schedule, and publish social media content across platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
        </div>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Posts", value: stats.total, icon: Share2, color: "text-primary" },
          { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-amber-500" },
          { label: "Drafts", value: stats.draft, icon: Edit, color: "text-muted-foreground" },
        ].map(s => (
          <StaggerItem key={s.label}>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Social Posts Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create social media content from articles or from scratch</p>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create First Post</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => {
            const PlatformIcon = platformIcons[post.platform] || Share2;
            const platColor = platformColors[post.platform] || "text-primary";
            const sc = statusConfig[post.status] || statusConfig.draft;
            return (
              <Card key={post.id} className="hover:shadow-md transition-all hover:border-primary/30">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon className={`h-5 w-5 ${platColor}`} />
                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                    </div>
                    <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">
                      {post.scheduled_time ? `Scheduled: ${new Date(post.scheduled_time).toLocaleDateString()}` : new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      {post.status === "approved" && <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3.5 w-3.5" /></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
