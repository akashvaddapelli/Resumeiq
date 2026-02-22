import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, Star, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";

const Feedback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const nextIdx = parseInt(searchParams.get("idx") || "0");
  const [data, setData] = useState<any>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("resumiq_feedback");
    if (!raw) { navigate("/dashboard"); return; }
    setData(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (!data) return;
    let current = 0;
    const score = data.confidence_score || data.confidenceScore || 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= score) { clearInterval(interval); current = score; }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [data]);

  if (!data) return null;

  const score = data.confidence_score || data.confidenceScore || 0;
  const scoreColor = score >= 75 ? "text-primary" : score >= 50 ? "text-yellow-400" : "text-destructive";
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (animatedScore / 100) * circumference;
  const feedback = data.feedback || data.feedbackText || "";
  const sampleAnswer = data.sample_answer || data.sampleAnswer || "";
  const weakAreas = data.weak_areas || data.weakAreas || [];
  const hasNext = data.hasNext;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">Answer Feedback</h1>

          <div className="mt-8 flex justify-center">
            <div className="relative">
              <svg width="160" height="160" className="-rotate-90">
                <circle cx="80" cy="80" r="60" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                <circle cx="80" cy="80" r="60" stroke="currentColor" strokeWidth="6" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                  className={`${scoreColor} transition-all duration-100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-heading text-4xl font-bold ${scoreColor}`}>{animatedScore}</span>
                <span className="text-xs text-muted-foreground">Confidence</span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="glass-card mt-8 p-5">
              <p className="text-sm text-muted-foreground">{feedback}</p>
            </div>
          )}

          {/* Your Answer */}
          <div className="glass-card mt-4 p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your Answer</p>
            <p className="text-sm text-foreground">{data.userAnswer}</p>
          </div>

          {/* Weak Areas */}
          {weakAreas.length > 0 && (
            <div className="mt-4 glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground">Areas to Improve</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((w: string) => (
                  <span key={w} className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs text-yellow-400">{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Sample Answer */}
          {sampleAnswer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.3 }} className="mt-4 glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Sample Strong Answer</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{sampleAnswer}</p>
            </motion.div>
          )}

          {/* STAR Method Tip */}
          <div className="mt-4 glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-foreground">STAR Method Tip</span>
            </div>
            <p className="text-sm text-muted-foreground">Structure answers using <strong className="text-foreground">S</strong>ituation, <strong className="text-foreground">T</strong>ask, <strong className="text-foreground">A</strong>ction, <strong className="text-foreground">R</strong>esult for maximum impact in behavioral questions.</p>
          </div>

          <div className="mt-8 flex gap-3">
            {hasNext ? (
              <Button onClick={() => navigate(`/practice?session=${sessionId}`)}
                className="flex-1 glow-button rounded-xl px-8 py-6 text-base font-semibold text-primary-foreground">
                Next Question <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => navigate("/dashboard")}
                className="flex-1 glow-button rounded-xl px-8 py-6 text-base font-semibold text-primary-foreground">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/questions?session=${sessionId}`)}
              className="rounded-xl border-border/50 py-6 text-muted-foreground hover:text-foreground">
              All Questions
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Feedback;
