import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useActiveClient } from "@/contexts/ClientContext";
import { PageTransition } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, FileText, Share2, Video, ChevronLeft, ChevronRight, Circle } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface CalendarItem {
  id: string;
  type: "article" | "social" | "video";
  title: string;
  date: string;
  status: string;
  platform?: string;
}

const typeConfig = {
  article: { icon: FileText, color: "bg-primary/10 text-primary border-primary/30", label: "Article" },
  social: { icon: Share2, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", label: "Social" },
  video: { icon: Video, color: "bg-violet-500/10 text-violet-600 border-violet-500/30", label: "Video" },
};

const statusDot: Record<string, string> = {
  draft: "text-muted-foreground",
  review: "text-amber-500",
  approved: "text-primary",
  scheduled: "text-amber-500",
  published: "text-emerald-500",
  scripted: "text-amber-500",
  rendered: "text-emerald-500",
};

export default function ContentCalendar() {
  const { activeClientId } = useActiveClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "article" | "social" | "video">("all");

  const { data: articles = [] } = useQuery<any[]>({
    queryKey: ["articles", activeClientId],
    queryFn: () => request(`/clients/${activeClientId}/articles`),
    enabled: !!activeClientId,
  });

  const { data: socialPosts = [] } = useQuery<any[]>({
    queryKey: ["social-posts", activeClientId],
    queryFn: () => request(`/clients/${activeClientId}/social-posts`),
    enabled: !!activeClientId,
  });

  const { data: videos = [] } = useQuery<any[]>({
    queryKey: ["videos", activeClientId],
    queryFn: () => request(`/clients/${activeClientId}/videos`),
    enabled: !!activeClientId,
  });

  const calendarItems = useMemo<CalendarItem[]>(() => {
    const items: CalendarItem[] = [];
    articles.forEach((a: any) => {
      items.push({
        id: a.id, type: "article", title: a.title,
        date: a.publish_date || a.created_at, status: a.status,
      });
    });
    socialPosts.forEach((p: any) => {
      items.push({
        id: p.id, type: "social", title: p.content?.slice(0, 60) || "Social Post",
        date: p.scheduled_time || p.created_at, status: p.status, platform: p.platform,
      });
    });
    videos.forEach((v: any) => {
      items.push({
        id: v.id, type: "video", title: v.caption_text || v.video_script?.slice(0, 60) || "Video",
        date: v.created_at, status: v.status, platform: v.platform,
      });
    });
    return items;
  }, [articles, socialPosts, videos]);

  const filtered = filter === "all" ? calendarItems : calendarItems.filter(i => i.type === filter);

  // Calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return filtered.filter(item => {
      if (!item.date) return false;
      const itemDate = item.date.slice(0, 10);
      return itemDate === dateStr;
    });
  };

  // Timeline view
  const sortedItems = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Content Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Unified view of all content across articles, social posts, and videos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} className="text-xs">All</Button>
          <Button size="sm" variant={filter === "article" ? "default" : "outline"} onClick={() => setFilter("article")} className="text-xs gap-1"><FileText className="h-3 w-3" /> Articles</Button>
          <Button size="sm" variant={filter === "social" ? "default" : "outline"} onClick={() => setFilter("social")} className="text-xs gap-1"><Share2 className="h-3 w-3" /> Social</Button>
          <Button size="sm" variant={filter === "video" ? "default" : "outline"} onClick={() => setFilter("video")} className="text-xs gap-1"><Video className="h-3 w-3" /> Videos</Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Calendar</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Timeline ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <CardTitle className="text-base">{MONTHS[month]} {year}</CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] bg-muted/20 rounded-lg" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayItems = getItemsForDay(day);
                  const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                  return (
                    <div key={day} className={`min-h-[100px] border rounded-lg p-1.5 transition-colors ${isToday ? "border-primary/50 bg-primary/5" : "border-border/30 hover:bg-muted/30"}`}>
                      <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 3).map(item => {
                          const cfg = typeConfig[item.type];
                          return (
                            <div key={item.id} className={`text-[9px] px-1 py-0.5 rounded border truncate ${cfg.color}`}>
                              {item.title.slice(0, 20)}
                            </div>
                          );
                        })}
                        {dayItems.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{dayItems.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-2">
          {sortedItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Content Yet</h3>
                <p className="text-sm text-muted-foreground">Articles, social posts, and videos will appear here</p>
              </CardContent>
            </Card>
          ) : sortedItems.map(item => {
            const cfg = typeConfig[item.type];
            const Icon = cfg.icon;
            const dotColor = statusDot[item.status] || "text-muted-foreground";
            return (
              <Card key={item.id} className="hover:shadow-sm transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                      {item.platform && <Badge variant="outline" className="text-[10px] capitalize">{item.platform}</Badge>}
                      <div className="flex items-center gap-1">
                        <Circle className={`h-2 w-2 fill-current ${dotColor}`} />
                        <span className="text-[10px] text-muted-foreground capitalize">{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.date ? new Date(item.date).toLocaleDateString("en-SG", { day: "numeric", month: "short" }) : "—"}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
