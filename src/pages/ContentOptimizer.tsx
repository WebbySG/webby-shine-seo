import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useClients } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Gauge, Sparkles, AlertTriangle, CheckCircle2, XCircle, FileText,
  Link2, Type, BarChart3, BookOpen, Search, Target,
} from "lucide-react";

interface ContentScore {
  id: string; title: string; target_keyword: string; overall_score: number;
  word_count: number; word_count_target: number; word_count_score: number;
  heading_score: number; keyword_density: number; keyword_score: number;
  readability_score: number; focus_terms_found: number; focus_terms_total: number;
  focus_terms_score: number; internal_links_count: number; external_links_count: number;
  link_score: number; meta_title_length: number; meta_desc_length: number; meta_score: number;
  issues_json: { type: string; severity: string; message: string }[];
  suggestions_json: string[];
  focus_terms_json: { term: string; found: boolean }[];
  scored_at: string;
}

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number; icon: typeof FileText }) {
  const color = score >= 80 ? "bg-green-500 dark:bg-green-600" : score >= 60 ? "bg-amber-500 dark:bg-amber-600" : "bg-destructive";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium text-foreground">{label}</span></div>
        <span className="text-xs font-mono font-semibold">{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ContentOptimizer() {
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const clientId = selectedClient || clients?.[0]?.id || "";
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<ContentScore | null>(null);
  const [formData, setFormData] = useState({ title: "", keyword: "", content: "", metaTitle: "", metaDesc: "" });

  const { data: scores = [], isLoading } = useQuery<ContentScore[]>({
    queryKey: ["content-scores", clientId],
    queryFn: () => request(`/clients/${clientId}/content-scores`),
    enabled: !!clientId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      request<ContentScore>("/content-score/analyze", {
        method: "POST",
        body: JSON.stringify({ client_id: clientId, title: formData.title, target_keyword: formData.keyword, content: formData.content, meta_title: formData.metaTitle, meta_description: formData.metaDesc }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["content-scores"] });
      setSelectedScore(data);
      setDialogOpen(false);
      setFormData({ title: "", keyword: "", content: "", metaTitle: "", metaDesc: "" });
      toast.success(`Content scored: ${data.overall_score}/100`);
    },
    onError: () => toast.error("Analysis failed"),
  });

  if (selectedScore) {
    const s = selectedScore;
    const issues = Array.isArray(s.issues_json) ? s.issues_json : [];
    const suggestions = Array.isArray(s.suggestions_json) ? s.suggestions_json : [];
    const focusTerms = Array.isArray(s.focus_terms_json) ? s.focus_terms_json : [];
    const scoreColor = s.overall_score >= 80 ? "text-green-600 dark:text-green-400" : s.overall_score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-destructive";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedScore(null)}>← Back</Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{s.title}</h1>
            <p className="text-sm text-muted-foreground">Keyword: <span className="font-medium text-foreground">{s.target_keyword}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <div className={`text-6xl font-bold ${scoreColor}`}>{s.overall_score}</div>
              <p className="text-sm font-semibold text-foreground">
                {s.overall_score >= 80 ? "Great" : s.overall_score >= 60 ? "Good" : s.overall_score >= 40 ? "Needs Work" : "Poor"}
              </p>
              <p className="text-xs text-muted-foreground">Overall Content Score</p>
              <div className="w-full space-y-1 text-xs border-t pt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Word Count</span><span className="font-mono">{s.word_count} / {s.word_count_target}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Keyword Density</span><span className="font-mono">{(s.keyword_density * 100).toFixed(2)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Focus Terms</span><span className="font-mono">{s.focus_terms_found}/{s.focus_terms_total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Internal Links</span><span className="font-mono">{s.internal_links_count}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">External Links</span><span className="font-mono">{s.external_links_count}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Score Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ScoreBar label="Keyword Usage" score={s.keyword_score} icon={Search} />
              <ScoreBar label="Word Count" score={s.word_count_score} icon={FileText} />
              <ScoreBar label="Heading Structure" score={s.heading_score} icon={Type} />
              <ScoreBar label="Focus Terms" score={s.focus_terms_score} icon={Target} />
              <ScoreBar label="Readability" score={s.readability_score} icon={BookOpen} />
              <ScoreBar label="Links" score={s.link_score} icon={Link2} />
              <ScoreBar label="Meta Tags" score={s.meta_score} icon={BarChart3} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Issues ({issues.length})</CardTitle></CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> No issues found!</p>
              ) : (
                <div className="space-y-2">{issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                    {issue.severity === "high" ? <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" /> : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                    <span className="text-sm text-foreground">{issue.message}</span>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Suggestions</CardTitle></CardHeader>
            <CardContent>
              {suggestions.length === 0 ? <p className="text-sm text-muted-foreground">No additional suggestions</p> : (
                <div className="space-y-2">{suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{s}</span>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {focusTerms.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Focus Terms Coverage</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">{focusTerms.map((t, i) => (
                <Badge key={i} variant={t.found ? "default" : "outline"} className={t.found ? "" : "text-muted-foreground border-dashed"}>
                  {t.found ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}{t.term}
                </Badge>
              ))}</div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" /> Content Optimizer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Analyze content against NLP focus terms, heading structure, and SEO best practices</p>
        </div>
        <div className="flex items-center gap-2">
          {clients && clients.length > 1 && (
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Sparkles className="h-4 w-4" /> Analyze Content</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" /> Content Analysis</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-1 block">Title *</label><Input placeholder="Article title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Target Keyword *</label><Input placeholder="Primary keyword" value={formData.keyword} onChange={e => setFormData(p => ({ ...p, keyword: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-1 block">Meta Title</label><Input placeholder="SEO title tag" value={formData.metaTitle} onChange={e => setFormData(p => ({ ...p, metaTitle: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium mb-1 block">Meta Description</label><Input placeholder="Meta description" value={formData.metaDesc} onChange={e => setFormData(p => ({ ...p, metaDesc: e.target.value }))} /></div>
                </div>
                <div><label className="text-sm font-medium mb-1 block">Content (Markdown) *</label><Textarea placeholder="Paste your article content here..." rows={10} value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => analyzeMutation.mutate()} disabled={!formData.keyword.trim() || !formData.content.trim() || analyzeMutation.isPending} className="gap-2">
                  {analyzeMutation.isPending ? <><div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4" /> Analyze</>}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded-lg" /></CardContent></Card>)}</div>
      ) : scores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Gauge className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Content Analyzed Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Paste your article content to get an SEO optimization score with actionable suggestions</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2"><Sparkles className="h-4 w-4" /> Analyze Your First Article</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">{scores.map((score, idx) => {
          const color = score.overall_score >= 80 ? "text-green-600 dark:text-green-400" : score.overall_score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
          return (
            <motion.div key={score.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Card className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30" onClick={() => setSelectedScore(score)}>
                <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${color}`}>{score.overall_score}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{score.title}</h3>
                      <p className="text-xs text-muted-foreground">{score.target_keyword} · {score.word_count} words · {new Date(score.scored_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3"><Progress value={score.overall_score} className="w-32 h-2" /><span className="text-xs text-muted-foreground">{score.overall_score}/100</span></div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}</div>
      )}
    </div>
  );
}
