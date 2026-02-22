import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

interface ATSData {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
}

const ATSScore = () => {
  const navigate = useNavigate();
  const [ats, setAts] = useState<ATSData | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("intervu_ats");
    if (!raw) { navigate("/setup"); return; }
    setAts(JSON.parse(raw));
  }, [navigate]);

  useEffect(() => {
    if (!ats) return;
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= ats.score) { clearInterval(interval); current = ats.score; }
      setAnimatedScore(current);
    }, 20);
    return () => clearInterval(interval);
  }, [ats]);

  if (!ats) return null;

  const color = ats.score >= 70 ? "text-primary" : ats.score >= 40 ? "text-yellow-400" : "text-destructive";
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground text-center">ATS Compatibility Score</h1>

          {/* Score Ring */}
          <div className="mt-10 flex justify-center">
            <div className="relative">
              <svg width="200" height="200" className="-rotate-90">
                <circle cx="100" cy="100" r="80" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <circle
                  cx="100" cy="100" r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className={`${color} transition-all duration-100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-heading text-5xl font-bold ${color}`}>{animatedScore}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-muted-foreground">{ats.summary}</p>

          {/* Keywords */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Matched Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ats.matchedKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{k}</span>
                ))}
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">Missing Keywords</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ats.missingKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">{k}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button
              onClick={() => navigate("/questions")}
              className="glow-button rounded-xl px-8 py-6 text-base font-semibold text-primary-foreground"
            >
              Proceed to Questions <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ATSScore;
