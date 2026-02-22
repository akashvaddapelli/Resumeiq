import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Play } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Question {
  id: string;
  category: string;
  question: string;
  difficulty: string;
}

const difficultyColor: Record<string, string> = {
  Easy: "bg-primary/10 text-primary border-primary/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Hard: "bg-destructive/10 text-destructive border-destructive/20",
};

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [practiced, setPracticed] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("Technical");

  useEffect(() => {
    const raw = sessionStorage.getItem("intervu_questions");
    if (!raw) { navigate("/setup"); return; }
    setQuestions(JSON.parse(raw));
  }, [navigate]);

  const categories = [...new Set(questions.map((q) => q.category))];
  const filtered = questions.filter((q) => q.category === activeTab);

  const togglePracticed = (id: string) => {
    setPracticed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startPractice = (questionId?: string) => {
    sessionStorage.setItem("intervu_practice_queue",
      JSON.stringify(questionId ? [questions.find(q => q.id === questionId)] : filtered)
    );
    navigate("/practice");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground">Your Interview Questions</h1>
          <p className="mt-2 text-muted-foreground">{questions.length} questions generated across {categories.length} categories</p>
        </motion.div>

        {categories.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="bg-muted/50 border border-border rounded-xl p-1">
              {categories.map((c) => (
                <TabsTrigger key={c} value={c} className="rounded-lg text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((c) => (
              <TabsContent key={c} value={c} className="mt-6 space-y-3">
                {questions.filter((q) => q.category === c).map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card-hover flex items-start gap-4 p-5"
                  >
                    <button
                      onClick={() => togglePracticed(q.id)}
                      className="mt-0.5 shrink-0"
                    >
                      <CheckCircle className={`h-5 w-5 transition-colors ${practiced.has(q.id) ? "text-primary" : "text-muted-foreground/30"}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{q.question}</p>
                      <div className="mt-2">
                        <Badge variant="outline" className={`text-xs ${difficultyColor[q.difficulty] || ""}`}>
                          {q.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startPractice(q.id)}
                      className="shrink-0 text-muted-foreground hover:text-primary"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
          <div className="container mx-auto max-w-3xl">
            <Button
              onClick={() => startPractice()}
              className="w-full glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground"
            >
              <Play className="mr-2 h-4 w-4" /> Start Practice Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questions;
