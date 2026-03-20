import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import AddTransaction from "./pages/AddTransaction";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";
import AppSettings from "./pages/AppSettings";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background safe-top">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/settings" element={<AppSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
