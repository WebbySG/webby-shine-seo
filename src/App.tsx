import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import ClientPortalLayout from "@/components/ClientPortalLayout";
import Dashboard from "@/pages/Dashboard";
import ClientList from "@/pages/ClientList";
import ClientDetail from "@/pages/ClientDetail";
import Rankings from "@/pages/Rankings";
import Audit from "@/pages/Audit";
import Opportunities from "@/pages/Opportunities";
import Analytics from "@/pages/Analytics";
import LocalSEO from "@/pages/LocalSEO";
import CreativeAssets from "@/pages/CreativeAssets";
import GoogleAds from "@/pages/GoogleAds";
import CommandCenter from "@/pages/CommandCenter";
import CRM from "@/pages/CRM";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import WorkspaceSettings from "@/pages/WorkspaceSettings";
import PortalOverview from "@/pages/portal/PortalOverview";
import PortalPerformance from "@/pages/portal/PortalPerformance";
import PortalSettings from "@/pages/portal/PortalSettings";
import OnboardingWizard from "@/pages/OnboardingWizard";
import SetupComplete from "@/pages/SetupComplete";
import DemoQA from "@/pages/DemoQA";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/onboarding" element={<OnboardingWizard />} />
              <Route path="/setup-complete" element={<SetupComplete />} />

              {/* Agency / Internal routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/command-center" element={<CommandCenter />} />
                <Route path="/clients" element={<ClientList />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/rankings" element={<Rankings />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/opportunities" element={<Opportunities />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/local-seo" element={<LocalSEO />} />
                <Route path="/creative" element={<CreativeAssets />} />
                <Route path="/google-ads" element={<GoogleAds />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/settings" element={<WorkspaceSettings />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/qa" element={<DemoQA />} />
              </Route>

              {/* Client Portal routes */}
              <Route element={<ClientPortalLayout />}>
                <Route path="/portal" element={<PortalOverview />} />
                <Route path="/portal/performance" element={<PortalPerformance />} />
                <Route path="/portal/articles" element={<PortalOverview />} />
                <Route path="/portal/social" element={<PortalOverview />} />
                <Route path="/portal/videos" element={<PortalOverview />} />
                <Route path="/portal/local-seo" element={<PortalOverview />} />
                <Route path="/portal/ads" element={<PortalOverview />} />
                <Route path="/portal/leads" element={<PortalOverview />} />
                <Route path="/portal/tasks" element={<PortalOverview />} />
                <Route path="/portal/settings" element={<PortalSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
