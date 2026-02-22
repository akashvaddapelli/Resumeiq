import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import ATSScore from "./pages/ATSScore";
import Questions from "./pages/Questions";
import Practice from "./pages/Practice";
import Feedback from "./pages/Feedback";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HotToaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(240 15% 8%)",
            color: "hsl(210 40% 96%)",
            border: "1px solid hsl(240 10% 18%)",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/ats-score" element={<ATSScore />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
