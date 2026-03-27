import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Globe, TrendingUp, Link2, Search as SearchIcon, RefreshCw,
  ArrowUpRight, BarChart3, Users, ExternalLink,
} from "lucide-react";

export default function SiteExplorer() {
  const { clientId } = useAuth();
  const [domain, setDomain] = useState("");

  const { data: overview } = useQuery({
    queryKey: ["domain-overview", clientId],
    queryFn: () => request(`/clients/${clientId}/domain-overview`),
  });

  const metrics = overview ? [
    { label: "Domain Authority", value: overview.domain_authority || 0, max: 100, icon: Globe, color: "text-primary" },
    { label: "Organic Keywords", value: overview.organic_keywords || 0, icon: SearchIcon, color: "text-blue-500" },
    { label: "Organic Traffic", value: (overview.organic_traffic || 0).toLocaleString(), icon: TrendingUp, color: "text-green-500" },
    { label: "Total Backlinks", value: (overview.backlinks_total || 0).toLocaleString(), icon: Link2, color: "text-purple-500" },
    { label: "Referring Domains", value: overview.referring_domains || 0, icon: Users, color: "text-orange-500" },
  ] : [];

  const topKeywords = overview?.top_keywords || [];
  const trafficTrend = overview?.traffic_trend || [];

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Domain overview and competitive intelligence</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Enter domain (e.g., example.com)" className="pl-9" value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>
              <Button className="gap-2"><SearchIcon className="h-4 w-4" /> Analyze</Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        {overview && (
          <>
            <div className="grid grid-cols-5 gap-4">
              {metrics.map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-4 text-center">
                    <m.icon className={`h-6 w-6 mx-auto mb-2 ${m.color}`} />
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    {"max" in m && (
                      <Progress value={(Number(m.value) / m.max) * 100} className="h-1.5 mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Top Keywords */}
              <Card>
                <CardHeader><CardTitle className="text-base">Top Organic Keywords</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topKeywords.length > 0 ? topKeywords.map((kw: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{kw.keyword}</p>
                          <p className="text-xs text-muted-foreground">Vol: {kw.volume?.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">#{kw.position}</Badge>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Run analysis to see top keywords</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Competitor Overlap */}
              <Card>
                <CardHeader><CardTitle className="text-base">Competitor Overlap</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(overview.competitor_overlap || []).length > 0 ? (overview.competitor_overlap || []).map((comp: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{comp.domain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{comp.shared_keywords} shared</span>
                          <Progress value={comp.overlap_pct || 0} className="w-16 h-1.5" />
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No competitor data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!overview && (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Enter a domain to explore</h3>
              <p className="text-sm text-muted-foreground">Get a full overview of any domain's SEO metrics, keywords, and backlinks</p>
            </CardContent>
          </Card>
        )}
      </div>
    </FadeIn>
  );
}
