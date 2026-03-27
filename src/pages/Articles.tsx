import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useClients } from "@/hooks/use-api";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Plus, Eye, Edit, ExternalLink, CheckCircle2, Clock, AlertCircle, BookOpen, ClipboardList,
} from "lucide-react";

const statusConfig: Record<string, { color: string; label: string }> = {
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
  review: { color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "In Review" },
  approved: { color: "bg-primary/10 text-primary", label: "Approved" },
  published: { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", label: "Published" },
};

export default function Articles() {
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const clientId = selectedClient || clients?.[0]?.id || "";

  const { data: articles = [], isLoading } = useQuery<any[]>({
    queryKey: ["articles", clientId],
    queryFn: () => request(`/clients/${clientId}/articles`),
    enabled: !!clientId,
  });

  const { data: briefs = [] } = useQuery<any[]>({
    queryKey: ["briefs", clientId],
    queryFn: () => request(`/clients/${clientId}/briefs`),
    enabled: !!clientId,
  });

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === "published").length,
    draft: articles.filter(a => a.status === "draft").length,
    review: articles.filter(a => a.status === "review").length,
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Articles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage content briefs, drafts, and published articles</p>
        </div>
        <div className="flex items-center gap-2">
          {clients && clients.length > 1 && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Article</Button>
        </div>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
          { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "In Review", value: stats.review, icon: Clock, color: "text-amber-500" },
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

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Articles ({articles.length})</TabsTrigger>
          <TabsTrigger value="briefs" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Briefs ({briefs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : articles.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No articles yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create a brief or generate content to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Keyword</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Published</TableHead>
                      <TableHead className="text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((art: any) => {
                      const sc = statusConfig[art.status] || statusConfig.draft;
                      return (
                        <TableRow key={art.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-foreground">{art.title}</p>
                              <p className="text-xs text-muted-foreground">{art.slug}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{art.target_keyword}</TableCell>
                          <TableCell><Badge className={`text-[10px] ${sc.color}`}>{sc.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {art.publish_date ? new Date(art.publish_date).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                              {art.cms_post_url && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(art.cms_post_url, "_blank")}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="briefs">
          <Card>
            <CardContent className="p-0">
              {briefs.length === 0 ? (
                <div className="flex flex-col items-center py-16">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">No briefs yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate content briefs from your keyword strategy</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Keyword</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {briefs.map((brief: any) => (
                      <TableRow key={brief.id}>
                        <TableCell className="text-sm font-medium">{brief.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{brief.keyword}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] capitalize">{brief.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(brief.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
