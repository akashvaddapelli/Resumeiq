import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, Lightbulb, Star } from "lucide-react";
import Navbar from "@/components/Navbar";

interface FeedbackData {
  confidenceScore: number;
  sampleAnswer: string;
  weakAreas: string[];
  tips: string[];
  question: string;
  userAnswer: string;
  nextIdx: number | null;
}

const Feedback = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("intervu_feedback");
    if (!raw) { navigate("/questions"); return; }
    setData(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (!data) return;
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= data.confidenceScore) { clearInterval(interval); current = data.confidenceScore; }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [data]);

  if (!data) return null;

  const scoreColor = data.confidenceScore >= 70 ? "text-primary" : data.confidenceScore >= 40 ? "text-yellow-400" : "text-destructive";
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (animatedScore / 100) * circumference;

  const handleNext = () => {
    if (data.nextIdx !== null) {
      const queue = JSON.parse(sessionStorage.getItem("intervu_practice_queue") || "[]");
      sessionStorage.setItem("intervu_practice_queue", JSON.stringify(queue));
      // Navigate back to practice — the Practice component will use the next index
      sessionStorage.setItem("intervu_practice_idx", String(data.nextIdx));
      navigate("/practice");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">Answer Feedback</h1>

          {/* Score */}
          <div className="mt-8 flex justify-center">
            <div className="relative">
              <svg width="160" height="160" className="-rotate-90">
                <circle cx="80" cy="80" r="60" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                <circle
                  cx="80" cy="80" r="60"
                  stroke="currentColor" strokeWidth="6" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={`${scoreColor} transition-all duration-100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-heading text-4xl font-bold ${scoreColor}`}>{animatedScore}</span>
                <span className="text-xs text-muted-foreground">Confidence</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="glass-card mt-8 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Question</p>
            <p className="text-sm text-foreground">{data.question}</p>
          </div>

          {/* Weak Areas */}
          {data.weakAreas.length > 0 && (
            <div className="mt-4 glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground">Areas to Improve</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.weakAreas.map((w) => (
                  <span key={w} className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-400">{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sample Answer */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.3 }}
            className="mt-4 glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Sample Strong Answer</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.sampleAnswer}</p>
          </motion.div>

          {/* Tips */}
          {data.tips.length > 0 && (
            <div className="mt-4 glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">STAR Method Tips</span>
              </div>
              <ul className="space-y-2">
                {data.tips.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next */}
          <div className="mt-8 text-center">
            <Button
              onClick={handleNext}
              className="glow-button rounded-xl px-8 py-6 text-base font-semibold text-primary-foreground"
            >
              {data.nextIdx !== null ? (
                <>Next Question <ArrowRight className="ml-2 h-4 w-4" /></>
              ) : (
                <>Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Feedback;
