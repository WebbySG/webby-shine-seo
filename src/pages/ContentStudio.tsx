import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useActiveClient } from "@/contexts/ClientContext";
import { PageTransition, FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Gauge, Sparkles, AlertTriangle, CheckCircle2, XCircle, FileText,
  Link2, Type, BarChart3, BookOpen, Search, Target, Wand2, RefreshCw, Copy, Check, ArrowRight,
} from "lucide-react";

// ─── Content Score types ───
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

// ─── Rewriter modes ───
const rewriteModes = [
  { value: "improve", label: "Improve", desc: "Better flow and clarity" },
  { value: "simplify", label: "Simplify", desc: "Easier reading level" },
  { value: "expand", label: "Expand", desc: "Add more detail" },
  { value: "shorten", label: "Shorten", desc: "Concise version" },
  { value: "paraphrase", label: "Paraphrase", desc: "Different wording" },
  { value: "tone_shift", label: "Tone Shift", desc: "Change writing tone" },
];

// ─── Score Detail View ───
function ScoreDetail({ score: s, onBack }: { score: ContentScore; onBack: () => void }) {
  const issues = Array.isArray(s.issues_json) ? s.issues_json : [];
  const suggestions = Array.isArray(s.suggestions_json) ? s.suggestions_json : [];
  const focusTerms = Array.isArray(s.focus_terms_json) ? s.focus_terms_json : [];
  const scoreColor = s.overall_score >= 80 ? "text-green-600 dark:text-green-400" : s.overall_score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
          <p className="text-sm text-muted-foreground">Keyword: <span className="font-medium text-foreground">{s.target_keyword}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
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
              <div className="space-y-2">{suggestions.map((sg, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{sg}</span>
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

export default function ContentStudio() {
  const { clientId } = useAuth();
  const { data: clients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const cId = selectedClient || clients?.[0]?.id || clientId || "";
  const queryClient = useQueryClient();

  // ─── Score state ───
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<ContentScore | null>(null);
  const [formData, setFormData] = useState({ title: "", keyword: "", content: "", metaTitle: "", metaDesc: "" });

  const { data: scores = [], isLoading: scoresLoading } = useQuery<ContentScore[]>({
    queryKey: ["content-scores", cId],
    queryFn: () => request(`/clients/${cId}/content-scores`),
    enabled: !!cId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () =>
      request<ContentScore>("/content-score/analyze", {
        method: "POST",
        body: JSON.stringify({ client_id: cId, title: formData.title, target_keyword: formData.keyword, content: formData.content, meta_title: formData.metaTitle, meta_description: formData.metaDesc }),
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

  // ─── Rewriter state ───
  const [originalText, setOriginalText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [mode, setMode] = useState("improve");
  const [tone, setTone] = useState("professional");
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: rewriteHistory = [] } = useQuery<any[]>({
    queryKey: ["content-rewrites", cId],
    queryFn: () => request(`/clients/${cId}/rewrites`),
    enabled: !!cId,
  });

  const handleRewrite = async () => {
    if (!originalText.trim()) return;
    setIsRewriting(true);
    try {
      const result = await request("/content-rewriter/rewrite", {
        method: "POST",
        body: JSON.stringify({ client_id: cId, original_text: originalText, rewrite_mode: mode, target_tone: tone }),
      }) as any;
      setRewrittenText(result.rewritten_text || "");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rewrittenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  if (selectedScore) {
    return <PageTransition><ScoreDetail score={selectedScore} onBack={() => setSelectedScore(null)} /></PageTransition>;
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" /> Content Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Score, optimize, and rewrite content — all in one place</p>
        </div>
        {clients && clients.length > 1 && (
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="score" className="space-y-4">
        <TabsList>
          <TabsTrigger value="score" className="gap-1.5"><Gauge className="h-3.5 w-3.5" /> Content Score</TabsTrigger>
          <TabsTrigger value="rewriter" className="gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Rewriter</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Rewrite History ({rewriteHistory.length})</TabsTrigger>
        </TabsList>

        {/* ─── Score Tab ─── */}
        <TabsContent value="score" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Sparkles className="h-4 w-4" /> Analyze Content</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" /> Content Analysis</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Title *</Label><Input placeholder="Article title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
                    <div><Label>Target Keyword *</Label><Input placeholder="Primary keyword" value={formData.keyword} onChange={e => setFormData(p => ({ ...p, keyword: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Meta Title</Label><Input placeholder="SEO title tag" value={formData.metaTitle} onChange={e => setFormData(p => ({ ...p, metaTitle: e.target.value }))} /></div>
                    <div><Label>Meta Description</Label><Input placeholder="Meta description" value={formData.metaDesc} onChange={e => setFormData(p => ({ ...p, metaDesc: e.target.value }))} /></div>
                  </div>
                  <div><Label>Content (Markdown) *</Label><Textarea placeholder="Paste your article content here..." rows={10} value={formData.content} onChange={e => setFormData(p => ({ ...p, content: e.target.value }))} /></div>
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

          {scoresLoading ? (
            <div className="grid gap-4">{[1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded-lg" /></CardContent></Card>)}</div>
          ) : scores.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Gauge className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Content Analyzed Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Paste article content to get an SEO score with actionable suggestions</p>
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
        </TabsContent>

        {/* ─── Rewriter Tab ─── */}
        <TabsContent value="rewriter" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {rewriteModes.map((m) => (
              <Button key={m.value} size="sm" variant={mode === m.value ? "default" : "outline"} onClick={() => setMode(m.value)} className="text-xs">
                {m.label}
              </Button>
            ))}
          </div>

          {mode === "tone_shift" && (
            <div>
              <Label className="text-xs mb-1">Target Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["professional", "casual", "friendly", "formal", "persuasive", "authoritative"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Original</CardTitle>
                  <span className="text-xs text-muted-foreground">{wordCount(originalText)} words</span>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Paste your content here..." className="min-h-[300px] resize-none" value={originalText} onChange={(e) => setOriginalText(e.target.value)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Rewritten</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{wordCount(rewrittenText)} words</span>
                    {rewrittenText && (
                      <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={handleCopy}>
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea className="min-h-[300px] resize-none" value={rewrittenText} onChange={(e) => setRewrittenText(e.target.value)}
                  placeholder={isRewriting ? "Rewriting..." : "Rewritten content will appear here..."} />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button size="lg" className="gap-2 px-8" onClick={handleRewrite} disabled={!originalText.trim() || isRewriting}>
              {isRewriting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {isRewriting ? "Rewriting..." : `Rewrite (${rewriteModes.find(m => m.value === mode)?.label})`}
            </Button>
          </div>
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history" className="space-y-3">
          {rewriteHistory.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Wand2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Rewrites Yet</h3>
                <p className="text-sm text-muted-foreground">Use the Rewriter tab to create your first content rewrite</p>
              </CardContent>
            </Card>
          ) : rewriteHistory.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs capitalize">{item.rewrite_mode}</Badge>
                  {item.original_score && item.rewritten_score && (
                    <span className="text-xs text-muted-foreground">Score: {item.original_score} → {item.rewritten_score}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.original_text}</p>
                <ArrowRight className="h-4 w-4 text-primary my-2" />
                <p className="text-sm text-foreground line-clamp-2">{item.rewritten_text}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
