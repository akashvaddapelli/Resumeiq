import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Timer, Send, SkipForward } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";

interface Question {
  id: string;
  category: string;
  question: string;
  difficulty: string;
}

const Practice = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("intervu_practice_queue");
    if (!raw) { navigate("/questions"); return; }
    setQueue(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const current = queue[currentIdx];
  if (!current) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerPct = (timeLeft / 120) * 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (timerPct / 100) * circumference;

  const handleSubmit = async () => {
    if (!answer.trim()) { toast.error("Please write your answer"); return; }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: { question: current.question, answer, category: current.category },
      });
      if (error) throw error;

      sessionStorage.setItem("intervu_feedback", JSON.stringify({
        ...data,
        question: current.question,
        userAnswer: answer,
        nextIdx: currentIdx + 1 < queue.length ? currentIdx + 1 : null,
      }));
      navigate("/feedback");
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate answer");
    } finally {
      setLoading(false);
    }
  };

  const skipQuestion = () => {
    if (currentIdx + 1 < queue.length) {
      setCurrentIdx((i) => i + 1);
      setAnswer("");
      setTimeLeft(120);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Progress */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm text-muted-foreground">
              Question {currentIdx + 1} of {queue.length}
            </span>
            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="relative flex items-center justify-center">
                <svg width="50" height="50" className="-rotate-90">
                  <circle cx="25" cy="25" r="20" stroke="hsl(var(--muted))" strokeWidth="3" fill="none" />
                  <circle
                    cx="25" cy="25" r="20"
                    stroke={timeLeft < 30 ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth="3" fill="none"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 - (timerPct / 100) * 2 * Math.PI * 20}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className={`absolute text-xs font-mono ${timeLeft < 30 ? "text-destructive" : "text-foreground"}`}>
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>
              <button onClick={() => setTimerActive(!timerActive)} className="text-xs text-muted-foreground hover:text-foreground">
                {timerActive ? "Pause" : "Resume"}
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-card p-8">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{current.category} · {current.difficulty}</span>
            <h2 className="mt-4 font-heading text-xl font-semibold text-foreground leading-relaxed">{current.question}</h2>
          </div>

          {/* Answer Area */}
          <div className="mt-6 input-glow">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={8}
              className="w-full bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
            />
          </div>
          <p className="mt-1 text-right text-xs text-muted-foreground">{answer.split(/\s+/).filter(Boolean).length} words</p>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground"
            >
              {loading ? "Evaluating..." : <><Send className="mr-2 h-4 w-4" /> Submit Answer</>}
            </Button>
            <Button
              variant="outline"
              onClick={skipQuestion}
              className="rounded-xl border-border/50 py-6 text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Practice;
