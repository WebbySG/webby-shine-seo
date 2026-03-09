import { Link } from "react-router-dom";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/use-api";
import { clients as dummyClients } from "@/data/dummy";
import { Plus, Globe, Key, Users2, ArrowRight, Activity, Building2 } from "lucide-react";

export default function ClientList() {
  const { data: apiClients, isLoading, isError } = useClients();
  const clients = apiClients ?? dummyClients;

  const avgHealth = clients.length > 0 ? Math.round(clients.reduce((a, c) => a + c.health_score, 0) / clients.length) : 0;
  const totalKeywords = clients.reduce((a, c) => a + c.keywords_count, 0);

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} active clients
            {isError && <span className="text-amber-500 ml-2">(using demo data)</span>}
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      {/* Summary KPIs */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        <StaggerItem><Card className="border-l-4 border-l-primary hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Clients</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
          </CardContent>
        </Card></StaggerItem>
        <StaggerItem><Card className="border-l-4 border-l-blue-500 hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Key className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Keywords</p>
              <p className="text-2xl font-bold">{totalKeywords}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Health</p>
              <p className="text-2xl font-bold">{avgHealth}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover-lift">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const healthColor = c.health_score >= 80 ? "text-green-600 bg-green-500" : c.health_score >= 60 ? "text-amber-600 bg-amber-500" : "text-red-600 bg-red-500";
            const healthBadge = c.health_score >= 80 ? "default" as const : c.health_score >= 60 ? "secondary" as const : "destructive" as const;
            return (
              <Link key={c.id} to={`/clients/${c.id}`}>
                <Card className="hover-lift cursor-pointer h-full group border-l-4 border-l-transparent hover:border-l-primary transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{c.name}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3" /> {c.domain}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Key className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{c.keywords_count}</span> keywords
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users2 className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{c.competitors_count}</span> competitors
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${healthColor.split(" ")[1]} transition-all duration-500`}
                          style={{ width: `${c.health_score}%` }}
                        />
                      </div>
                      <Badge variant={healthBadge} className="text-xs font-mono min-w-[3rem] justify-center">
                        {c.health_score}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
