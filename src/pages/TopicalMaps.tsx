import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Network, Plus, Sparkles, Target, TrendingUp, FileText, ChevronRight,
  Layers, BarChart3, BookOpen, Zap, Trash2,
} from "lucide-react";
import { MotionDiv } from "@/components/motion";

interface TopicalMap {
  id: string;
  name: string;
  seed_keyword: string;
  status: string;
  cluster_count: number;
  article_count: number;
  created_at: string;
  clusters?: Cluster[];
  articles?: MapArticle[];
}

interface Cluster {
  id: string;
  cluster_name: string;
  pillar_keyword: string;
  search_intent: string;
  estimated_volume: number;
  difficulty_score: number;
  priority: string;
}

interface MapArticle {
  id: string;
  cluster_id: string;
  title: string;
  target_keyword: string;
  content_type: string;
  search_intent: string;
  estimated_volume: number;
  difficulty_score: number;
  word_count_target: number;
  status: string;
}

const intentColors: Record<string, string> = {
  informational: "bg-seo-background text-seo-primary border-seo-border",
  commercial: "bg-content-background text-content-primary border-content-border",
  transactional: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  navigational: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  low: "bg-muted text-muted-foreground border-border",
};

const typeIcons: Record<string, typeof FileText> = {
  pillar_page: Layers,
  blog_post: FileText,
  comparison: BarChart3,
  listicle: BookOpen,
  how_to: Zap,
  faq: Target,
};

export default function TopicalMaps() {
  const { selectedClientId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMap, setSelectedMap] = useState<TopicalMap | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seedKeyword, setSeedKeyword] = useState("");
  const [mapName, setMapName] = useState("");

  const { data: maps = [], isLoading } = useQuery<TopicalMap[]>({
    queryKey: ["topical-maps", selectedClientId],
    queryFn: () => request(`/clients/${selectedClientId}/topical-maps`),
    enabled: !!selectedClientId,
  });

  const generateMutation = useMutation({
    mutationFn: (data: { seed_keyword: string; name: string }) =>
      request<TopicalMap>("/topical-maps/generate", { method: "POST", body: JSON.stringify({ client_id: selectedClientId, ...data }) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["topical-maps"] });
      setSelectedMap(data);
      setDialogOpen(false);
      setSeedKeyword("");
      setMapName("");
      toast.success(`Topical map generated with ${data.cluster_count} clusters and ${data.article_count} articles`);
    },
    onError: () => toast.error("Failed to generate topical map"),
  });

  const loadMapDetail = useMutation({
    mutationFn: (mapId: string) => request<TopicalMap>(`/topical-maps/${mapId}`),
    onSuccess: setSelectedMap,
  });

  const deleteMutation = useMutation({
    mutationFn: (mapId: string) => request(`/topical-maps/${mapId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topical-maps"] });
      setSelectedMap(null);
      toast.success("Topical map deleted");
    },
  });

  const getClusterArticles = (clusterId: string) =>
    selectedMap?.articles?.filter(a => a.cluster_id === clusterId) || [];

  if (selectedMap?.clusters) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMap(null)}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{selectedMap.name}</h1>
              <p className="text-sm text-muted-foreground">
                Seed: <span className="font-medium text-foreground">{selectedMap.seed_keyword}</span> · {selectedMap.cluster_count} clusters · {selectedMap.article_count} articles
              </p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedMap.id)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete Map
          </Button>
        </div>

        {/* Cluster Grid */}
        <div className="grid gap-5">
          {selectedMap.clusters.map((cluster, idx) => {
            const articles = getClusterArticles(cluster.id);
            return (
              <MotionDiv key={cluster.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Network className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{cluster.cluster_name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Pillar: {cluster.pillar_keyword} · {articles.length} articles
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={intentColors[cluster.search_intent] || ""}>
                          {cluster.search_intent}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[cluster.priority] || ""}>
                          {cluster.priority}
                        </Badge>
                        <div className="text-right ml-3">
                          <p className="text-sm font-semibold">{cluster.estimated_volume?.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">est. volume</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="border rounded-lg divide-y divide-border">
                      {articles.map(article => {
                        const Icon = typeIcons[article.content_type] || FileText;
                        return (
                          <div key={article.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-foreground">{article.title}</p>
                                <p className="text-xs text-muted-foreground">{article.target_keyword}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <Badge variant="outline" className={intentColors[article.search_intent] || ""}>
                                {article.content_type?.replace("_", " ")}
                              </Badge>
                              <div className="text-right">
                                <span className="font-mono text-muted-foreground">{article.estimated_volume?.toLocaleString()} vol</span>
                                <span className="ml-2 font-mono text-muted-foreground">KD {article.difficulty_score}</span>
                              </div>
                              <span className="text-muted-foreground">{article.word_count_target} words</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </MotionDiv>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            Topical Maps
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate full content strategy maps from seed keywords with topic hierarchy and article suggestions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Generate Map
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Generate Topical Map
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Seed Keyword *</label>
                <Input
                  placeholder="e.g., digital marketing, plumbing services, web design"
                  value={seedKeyword}
                  onChange={e => setSeedKeyword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">The AI will generate clusters and articles around this topic</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Map Name (optional)</label>
                <Input
                  placeholder="Auto-generated from seed keyword"
                  value={mapName}
                  onChange={e => setMapName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => generateMutation.mutate({ seed_keyword: seedKeyword, name: mapName })}
                disabled={!seedKeyword.trim() || generateMutation.isPending}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Maps", value: maps.length, icon: Network, color: "text-primary" },
          { label: "Total Clusters", value: maps.reduce((s, m) => s + (m.cluster_count || 0), 0), icon: Layers, color: "text-content-primary" },
          { label: "Total Articles", value: maps.reduce((s, m) => s + (m.article_count || 0), 0), icon: FileText, color: "text-seo-primary" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Maps List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded-lg" /></CardContent></Card>
          ))}
        </div>
      ) : maps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Network className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Topical Maps Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate your first topical map from a seed keyword to create a full content strategy</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Generate Your First Map
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {maps.map((map, idx) => (
            <MotionDiv key={map.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
                onClick={() => loadMapDetail.mutate(map.id)}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Network className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{map.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Seed: <span className="font-medium">{map.seed_keyword}</span> · Created {new Date(map.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{map.cluster_count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Clusters</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{map.article_count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Articles</p>
                    </div>
                    <Badge variant={map.status === "ready" ? "default" : "secondary"}>
                      {map.status}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          ))}
        </div>
      )}
    </div>
  );
}
