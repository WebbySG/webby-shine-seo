import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import ClientList from "@/pages/ClientList";
import ClientDetail from "@/pages/ClientDetail";
import Rankings from "@/pages/Rankings";
import Audit from "@/pages/Audit";
import Opportunities from "@/pages/Opportunities";
import Analytics from "@/pages/Analytics";
import LocalSEO from "@/pages/LocalSEO";
import CreativeAssets from "@/pages/CreativeAssets";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/local-seo" element={<LocalSEO />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
