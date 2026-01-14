import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Earnings from "./pages/Earnings";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AIAdvisor from "./pages/AIAdvisor";
import Integrations from "./pages/Integrations";
import TaxCalculator from "./pages/TaxCalculator";
import APIDocumentation from "./pages/APIDocumentation";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/earnings" element={<Earnings />} />
            <Route path="/dashboard/expenses" element={<Expenses />} />
            <Route path="/dashboard/goals" element={<Goals />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/ai-advisor" element={<AIAdvisor />} />
            <Route path="/dashboard/integrations" element={<Integrations />} />
            <Route path="/dashboard/taxes" element={<TaxCalculator />} />
            <Route path="/dashboard/api" element={<APIDocumentation />} />
            <Route path="/dashboard/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
