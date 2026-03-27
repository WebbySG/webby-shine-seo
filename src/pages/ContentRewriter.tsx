import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Wand2, ArrowRight, Copy, Check } from "lucide-react";

const modes = [
  { value: "improve", label: "Improve", desc: "Better flow and clarity" },
  { value: "simplify", label: "Simplify", desc: "Easier reading level" },
  { value: "expand", label: "Expand", desc: "Add more detail" },
  { value: "shorten", label: "Shorten", desc: "Concise version" },
  { value: "paraphrase", label: "Paraphrase", desc: "Different wording" },
  { value: "tone_shift", label: "Tone Shift", desc: "Change writing tone" },
];

export default function ContentRewriter() {
  const { clientId } = useAuth();
  const [originalText, setOriginalText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [mode, setMode] = useState("improve");
  const [tone, setTone] = useState("professional");
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: history = [] } = useQuery({
    queryKey: ["content-rewrites", clientId],
    queryFn: () => request(`/clients/${clientId}/rewrites`),
  });

  const handleRewrite = async () => {
    if (!originalText.trim()) return;
    setIsRewriting(true);
    try {
      const result = await request("/content-rewriter/rewrite", {
        method: "POST",
        body: JSON.stringify({ client_id: clientId, original_text: originalText, rewrite_mode: mode, target_tone: tone }),
      });
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

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Rewriter</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered content rewriting and paraphrasing tool</p>
        </div>

        <Tabs defaultValue="rewrite">
          <TabsList>
            <TabsTrigger value="rewrite">Rewrite</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="rewrite" className="mt-4">
            {/* Mode Selection */}
            <div className="flex gap-2 mb-4">
              {modes.map((m) => (
                <Button key={m.value} size="sm" variant={mode === m.value ? "default" : "outline"}
                  onClick={() => setMode(m.value)} className="text-xs">
                  {m.label}
                </Button>
              ))}
            </div>

            {mode === "tone_shift" && (
              <div className="mb-4">
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

            <div className="grid grid-cols-2 gap-4">
              {/* Original */}
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

              {/* Rewritten */}
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

            <div className="flex justify-center mt-4">
              <Button size="lg" className="gap-2 px-8" onClick={handleRewrite} disabled={!originalText.trim() || isRewriting}>
                {isRewriting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {isRewriting ? "Rewriting..." : `Rewrite (${modes.find(m => m.value === mode)?.label})`}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {history.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs capitalize">{item.rewrite_mode}</Badge>
                    {item.original_score && item.rewritten_score && (
                      <span className="text-xs text-muted-foreground">
                        Score: {item.original_score} → {item.rewritten_score}
                      </span>
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
      </div>
    </FadeIn>
  );
}
