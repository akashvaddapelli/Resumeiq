import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ATSScore = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session");
  const [ats, setAts] = useState<any>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || !user) return;
    supabase.from("sessions").select("*").eq("id", sessionId).eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.ats_feedback) {
          setAts(data.ats_feedback);
        }
        setLoading(false);
      });
  }, [sessionId, user]);

  useEffect(() => {
    if (!ats?.score) return;
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= ats.score) { clearInterval(interval); current = ats.score; }
      setAnimatedScore(current);
    }, 15);
    return () => clearInterval(interval);
  }, [ats]);

  if (loading) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto max-w-2xl px-4 pt-24"><div className="glass-card h-64 animate-pulse" /></div></div>;
  }

  if (!ats) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container mx-auto max-w-2xl px-4 pt-24 text-center">
          <p className="text-muted-foreground">No ATS data found.</p>
          <Button onClick={() => navigate("/setup")} className="mt-4 glow-button rounded-xl text-primary-foreground">Start New Session</Button>
        </div>
      </div>
    );
  }

  const score = ats.score || 0;
  const color = score >= 70 ? "text-primary" : score >= 40 ? "text-yellow-400" : "text-destructive";
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (animatedScore / 100) * circumference;
  const skillsFound = ats.skills_found || ats.matchedKeywords || [];
  const skillsMissing = ats.skills_missing || ats.missingKeywords || [];
  const recommendation = ats.recommendation || ats.summary || "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground text-center">Your Resume Match Score</h1>

          <div className="mt-10 flex justify-center">
            <div className="relative">
              <svg width="200" height="200" className="-rotate-90">
                <circle cx="100" cy="100" r="80" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="8" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                  className={`${color} transition-all duration-100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-heading text-5xl font-bold ${color}`}>{animatedScore}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>

          {recommendation && (
            <div className="mt-6 glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-foreground">AI Recommendation</span>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Skills Found in Resume</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsFound.map((k: string) => (
                  <span key={k} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{k}</span>
                ))}
                {skillsFound.length === 0 && <p className="text-xs text-muted-foreground">No skills detected</p>}
              </div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">Skills Suggested to Add</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillsMissing.map((k: string) => (
                  <span key={k} className="rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">{k}</span>
                ))}
                {skillsMissing.length === 0 && <p className="text-xs text-muted-foreground">Great match!</p>}
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button onClick={() => navigate(`/questions?session=${sessionId}`)}
              className="glow-button rounded-xl px-8 py-6 text-base font-semibold text-primary-foreground">
              View My Questions <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ATSScore;
