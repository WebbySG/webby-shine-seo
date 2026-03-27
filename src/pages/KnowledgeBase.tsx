import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn, StaggerContainer } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Book, Plus, Search, Eye, ThumbsUp, ThumbsDown, Folder,
  FileText, MoreVertical, ExternalLink, Edit2,
} from "lucide-react";

export default function KnowledgeBase() {
  const { clientId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["kb-categories", clientId],
    queryFn: () => request(`/knowledge-base/categories?workspace_id=${clientId}`),
  });

  const { data: articles = [] } = useQuery({
    queryKey: ["kb-articles", clientId, selectedCategory],
    queryFn: () => request(`/knowledge-base/articles?workspace_id=${clientId}${selectedCategory ? `&category_id=${selectedCategory}` : ""}`),
  });

  const filteredArticles = articles.filter((a: any) =>
    !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalViews = articles.reduce((s: number, a: any) => s + (a.views_count || 0), 0);
  const publishedCount = articles.filter((a: any) => a.status === "published").length;

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground mt-1">Help center articles and documentation for customers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Category</Button>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Article</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Categories", value: categories.length, icon: Folder, color: "text-primary" },
            { label: "Articles", value: articles.length, icon: FileText, color: "text-blue-500" },
            { label: "Published", value: publishedCount, icon: Eye, color: "text-green-500" },
            { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-purple-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Categories Sidebar */}
          <div className="w-56 shrink-0 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Categories</h3>
            <button onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
              All Articles ({articles.length})
            </button>
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                {cat.name} ({cat.articles_count || 0})
              </button>
            ))}
          </div>

          {/* Articles */}
          <div className="flex-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <StaggerContainer className="space-y-3">
              {filteredArticles.map((article: any) => (
                <FadeIn key={article.id}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{article.title}</h3>
                            <Badge variant={article.status === "published" ? "default" : "secondary"} className="text-[10px]">{article.status}</Badge>
                          </div>
                          {article.category_name && <p className="text-xs text-muted-foreground mb-2">{article.category_name}</p>}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.views_count || 0} views</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{article.helpful_count || 0}</span>
                            <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3" />{article.not_helpful_count || 0}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8"><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
