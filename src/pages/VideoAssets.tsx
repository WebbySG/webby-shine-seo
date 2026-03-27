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
import { Video, Plus, Play, Edit, Clock, CheckCircle2, Film, Youtube, Monitor } from "lucide-react";

const platformLabels: Record<string, string> = {
  youtube_shorts: "YouTube Shorts", tiktok: "TikTok", instagram_reels: "IG Reels", youtube: "YouTube",
};
const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
  scripted: { color: "bg-amber-500/10 text-amber-600", label: "Scripted" },
  rendering: { color: "bg-primary/10 text-primary", label: "Rendering" },
  rendered: { color: "bg-emerald-500/10 text-emerald-600", label: "Rendered" },
  published: { color: "bg-emerald-500/10 text-emerald-600", label: "Published" },
};

export default function VideoAssets() {
  const { activeClientId: clientId } = useActiveClient();

  const { data: videos = [], isLoading } = useQuery<any[]>({
    queryKey: ["videos", clientId],
    queryFn: () => request(`/clients/${clientId}/videos`),
    enabled: !!clientId,
  });

  const stats = {
    total: videos.length,
    rendered: videos.filter(v => v.status === "rendered" || v.status === "published").length,
    draft: videos.filter(v => v.status === "draft" || v.status === "scripted").length,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" /> Video Assets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated video scripts, rendering queue, and published videos</p>
        </div>
        <div className="flex items-center gap-2">
          {clients && clients.length > 1 && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Video</Button>
        </div>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Videos", value: stats.total, icon: Film, color: "text-primary" },
          { label: "Rendered", value: stats.rendered, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "In Progress", value: stats.draft, icon: Clock, color: "text-amber-500" },
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}</div>
      ) : videos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Videos Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate video scripts from articles and render short-form video content</p>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create First Video</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((vid: any) => {
            const sc = statusConfig[vid.status] || statusConfig.draft;
            return (
              <Card key={vid.id} className="hover:shadow-md transition-all hover:border-primary/30 overflow-hidden">
                <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
                  {vid.thumbnail_url ? (
                    <img src={vid.thumbnail_url} alt={vid.caption_text} className="w-full h-full object-cover" />
                  ) : (
                    <Monitor className="h-12 w-12 text-muted-foreground/20" />
                  )}
                  {vid.video_url && (
                    <Button size="icon" className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-primary/90 hover:bg-primary">
                      <Play className="h-5 w-5 text-primary-foreground" />
                    </Button>
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{platformLabels[vid.platform] || vid.platform}</Badge>
                    <Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{vid.caption_text || vid.video_script?.slice(0, 80)}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">{new Date(vid.created_at).toLocaleDateString()}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
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
