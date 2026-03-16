import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Rocket, ArrowRight, Sparkles, Globe, Users } from "lucide-react";

export default function SetupComplete() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-lg w-full border shadow-lg">
        <CardContent className="py-12 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
            <Rocket className="h-8 w-8 text-green-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Setup Complete! 🎉</h1>
            <p className="text-muted-foreground mt-2">
              Your marketing system is configured and ready to go.
            </p>
          </div>

          <div className="grid gap-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Keywords & Content Seeded</p>
                <p className="text-xs text-muted-foreground">Starter keywords and content topics are ready for review.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <Globe className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Dashboard Configured</p>
                <p className="text-xs text-muted-foreground">All modules are enabled based on your template selection.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Activation Checklist Ready</p>
                <p className="text-xs text-muted-foreground">Follow the checklist to complete your launch preparation.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="flex-1" onClick={() => navigate("/")}>
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/clients")}>
              View Clients
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
