import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn, StaggerContainer } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search, Globe, Monitor, Smartphone, MapPin, Play,
  ExternalLink, Star, Image, MessageSquare,
} from "lucide-react";

export default function SerpChecker() {
  const { clientId } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Singapore");
  const [device, setDevice] = useState("desktop");
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["serp-checks", clientId],
    queryFn: () => request(`/clients/${clientId}/serp-checks`),
  });

  const handleCheck = async () => {
    if (!keyword.trim()) return;
    setIsChecking(true);
    try {
      const data = await request("/serp-checker/check", {
        method: "POST",
        body: JSON.stringify({ client_id: clientId, keyword, location, device }),
      });
      setResults(data);
    } finally {
      setIsChecking(false);
    }
  };

  const serpResults = results?.results || [];
  const featuredSnippet = results?.featured_snippet;
  const paa = results?.people_also_ask || [];
  const relatedSearches = results?.related_searches || [];

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SERP Checker</h1>
          <p className="text-sm text-muted-foreground mt-1">Check live search engine results for any keyword</p>
        </div>

        {/* Search Form */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Enter keyword to check..." className="pl-9" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheck()} />
                </div>
              </div>
              <div className="w-40">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "India"].map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Device</label>
                <Select value={device} onValueChange={setDevice}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop"><div className="flex items-center gap-2"><Monitor className="h-3.5 w-3.5" /> Desktop</div></SelectItem>
                    <SelectItem value="mobile"><div className="flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> Mobile</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="gap-2 h-10" onClick={handleCheck} disabled={isChecking || !keyword.trim()}>
                {isChecking ? <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Play className="h-4 w-4" />}
                Check SERP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main Results */}
            <div className="col-span-2 space-y-4">
              {featuredSnippet && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-4">
                    <Badge className="mb-2">Featured Snippet</Badge>
                    <h3 className="font-semibold text-foreground">{featuredSnippet.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{featuredSnippet.text}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-base">Search Results — "{keyword}"</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {serpResults.map((result: any) => (
                      <div key={result.position} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-foreground">{result.position}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground truncate">{result.url}</p>
                            <h4 className="text-sm font-medium text-primary hover:underline cursor-pointer mt-0.5">{result.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                          </div>
                          <a href={result.url} target="_blank" rel="noopener">
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {paa.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">People Also Ask</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {paa.map((q: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/50 text-xs text-foreground">{q.question || q}</div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {relatedSearches.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Related Searches</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {relatedSearches.map((s: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-primary/10">{s.query || s}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Checks */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Recent Checks</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {history.slice(0, 5).map((check: any) => (
                    <button key={check.id} onClick={() => { setKeyword(check.keyword); setResults(check); }}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <p className="text-xs font-medium text-foreground truncate">{check.keyword}</p>
                      <p className="text-[10px] text-muted-foreground">{check.location} · {check.device}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!results && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Check any keyword's SERP</h3>
              <p className="text-sm text-muted-foreground">Enter a keyword above to see live search results, featured snippets, and SERP features</p>
            </CardContent>
          </Card>
        )}
      </div>
    </FadeIn>
  );
}
