import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Play, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const difficultyColor: Record<string, string> = {
  Easy: "bg-primary/10 text-primary border-primary/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Hard: "bg-destructive/10 text-destructive border-destructive/20",
};

const Questions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session");
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !user) return;
    supabase.from("questions").select("*").eq("session_id", sessionId).eq("user_id", user.id)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) { toast.error("Failed to load questions"); return; }
        setQuestions(data || []);
        setLoading(false);
      });
  }, [sessionId, user]);

  const togglePracticed = async (id: string, current: boolean) => {
    const { error } = await supabase.from("questions").update({ is_practiced: !current }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_practiced: !current } : q));
  };

  const categories = ["All", ...new Set(questions.map(q => q.category))];
  const filtered = activeTab === "All" ? questions : questions.filter(q => q.category === activeTab);

  if (loading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto max-w-3xl px-4 pt-24 flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div></div>;
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container mx-auto max-w-3xl px-4 pt-24 text-center">
          <p className="text-muted-foreground">No questions found for this session.</p>
          <Button onClick={() => navigate("/setup")} className="mt-4 glow-button rounded-xl text-primary-foreground">Start New Session</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground">Your Interview Questions</h1>
          <p className="mt-2 text-muted-foreground">{questions.length} questions across {new Set(questions.map(q => q.category)).size} categories</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="bg-muted/50 border border-border rounded-xl p-1">
            {categories.map(c => (
              <TabsTrigger key={c} value={c} className="rounded-lg text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{c}</TabsTrigger>
            ))}
          </TabsList>

          {categories.map(c => (
            <TabsContent key={c} value={c} className="mt-6 space-y-3">
              {(c === "All" ? questions : questions.filter(q => q.category === c)).map((q, i) => (
                <motion.div key={q.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card-hover flex items-start gap-4 p-5 ${q.is_practiced ? "opacity-70" : ""}`}>
                  <button onClick={() => togglePracticed(q.id, q.is_practiced)} className="mt-0.5 shrink-0">
                    <CheckCircle className={`h-5 w-5 transition-colors ${q.is_practiced ? "text-primary" : "text-muted-foreground/30"}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{q.question_text}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs border-border">{q.category}</Badge>
                      <Badge variant="outline" className={`text-xs ${difficultyColor[q.difficulty] || ""}`}>{q.difficulty}</Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
          <div className="container mx-auto max-w-3xl">
            <Button onClick={() => navigate(`/practice?session=${sessionId}`)}
              className="w-full glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground">
              <Play className="mr-2 h-4 w-4" /> Start Practice Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questions;
