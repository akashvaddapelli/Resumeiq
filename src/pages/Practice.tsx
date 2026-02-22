import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, SkipForward, CheckCircle, Loader2, Keyboard, Mic } from "lucide-react";
import Navbar from "@/components/Navbar";
import VoiceRecorder from "@/components/VoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const TIMER_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "No timer", seconds: 0 },
];

const Practice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get("session");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answerMode, setAnswerMode] = useState<"type" | "voice">("type");
  const [timerDuration, setTimerDuration] = useState(120);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId || !user) return;
    supabase.from("questions").select("*").eq("session_id", sessionId).eq("user_id", user.id)
      .eq("is_practiced", false).order("created_at")
      .then(({ data }) => {
        setQuestions(data || []);
        setLoading(false);
        if (data && data.length > 0 && timerDuration > 0) setTimerActive(true);
      });
  }, [sessionId, user]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || timerDuration === 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, timerDuration]);

  const current = questions[currentIdx];

  if (loading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container mx-auto max-w-2xl px-4 pt-24 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!current || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container mx-auto max-w-2xl px-4 pt-24 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-primary mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground">All questions practiced! 🎉</h2>
          <p className="mt-2 text-muted-foreground">You've completed all questions in this session.</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-6 glow-button rounded-xl px-8 py-6 text-primary-foreground">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerPct = timerDuration > 0 ? (timeLeft / timerDuration) * 100 : 100;
  const progressPct = (currentIdx / questions.length) * 100;

  const handleSubmit = async () => {
    if (!answer.trim()) { toast.error("Please provide your answer"); return; }
    setSubmitting(true);

    try {
      const isVoice = answerMode === "voice";
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: { question: current.question_text, answer, category: current.category, isVoice },
      });
      if (error) throw error;

      await supabase.from("answers").insert({
        question_id: current.id,
        user_id: user!.id,
        answer_text: answer,
        confidence_score: data.confidence_score,
        feedback_text: data.feedback,
        sample_answer: data.sample_answer,
        weak_areas: data.weak_areas || [],
      });

      await supabase.from("questions").update({ is_practiced: true }).eq("id", current.id);

      sessionStorage.setItem("resumiq_feedback", JSON.stringify({
        ...data,
        question: current.question_text,
        userAnswer: answer,
        questionId: current.id,
        sessionId,
        hasNext: currentIdx + 1 < questions.length,
      }));
      navigate(`/feedback?session=${sessionId}&idx=${currentIdx + 1}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate answer");
    } finally {
      setSubmitting(false);
    }
  };

  const skipQuestion = async () => {
    await supabase.from("questions").update({ is_practiced: true }).eq("id", current.id);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setAnswer("");
      setTimeLeft(timerDuration);
    } else {
      navigate("/dashboard");
    }
  };

  const selectTimer = (secs: number) => {
    setTimerDuration(secs);
    setTimeLeft(secs);
    setTimerActive(secs > 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mb-6">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="flex items-center justify-between mb-8">
            <span className="text-sm text-muted-foreground">Question {currentIdx + 1} of {questions.length}</span>
            <div className="flex items-center gap-2">
              {TIMER_OPTIONS.map((opt) => (
                <button key={opt.label} onClick={() => selectTimer(opt.seconds)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${timerDuration === opt.seconds ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          {timerDuration > 0 && (
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg width="60" height="60" className="-rotate-90">
                  <circle cx="30" cy="30" r="24" stroke="hsl(var(--muted))" strokeWidth="3" fill="none" />
                  <circle cx="30" cy="30" r="24"
                    stroke={timeLeft < 10 ? "hsl(var(--destructive))" : timeLeft < 30 ? "hsl(45,100%,60%)" : "hsl(var(--primary))"}
                    strokeWidth="3" fill="none"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 - (timerPct / 100) * 2 * Math.PI * 24}
                    strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-xs font-mono ${timeLeft < 10 ? "text-destructive" : "text-foreground"}`}>
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          )}

          {/* Question */}
          <div className="glass-card p-8">
            <span className="text-xs font-medium text-primary uppercase tracking-wider">{current.category} · {current.difficulty}</span>
            <h2 className="mt-4 font-heading text-xl font-semibold text-foreground leading-relaxed">{current.question_text}</h2>
          </div>

          {/* Answer Mode Tabs */}
          <div className="mt-6 mb-4">
            <div className="flex bg-muted rounded-lg p-1 relative">
              <motion.div
                className="absolute inset-y-1 rounded-md bg-card border border-border/50"
                animate={{ x: answerMode === "type" ? 0 : "100%", width: "50%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ width: "calc(50% - 4px)", left: 2 }}
              />
              <button
                onClick={() => { setAnswerMode("type"); setAnswer(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md z-10 transition-colors ${answerMode === "type" ? "text-foreground" : "text-muted-foreground"}`}
              >
                <Keyboard className="h-4 w-4" /> Type Answer
              </button>
              <button
                onClick={() => { setAnswerMode("voice"); setAnswer(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md z-10 transition-colors ${answerMode === "voice" ? "text-foreground" : "text-muted-foreground"}`}
              >
                <Mic className="h-4 w-4" /> Speak Answer
              </button>
            </div>
          </div>

          {/* Type Mode */}
          {answerMode === "type" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="type">
              <div className="input-glow">
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..." rows={8}
                  className="w-full bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none" />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">{answer.split(/\s+/).filter(Boolean).length} words</p>
            </motion.div>
          )}

          {/* Voice Mode */}
          {answerMode === "voice" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="voice">
              <VoiceRecorder onTranscription={(text) => setAnswer(text)} disabled={submitting} />
            </motion.div>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSubmit} disabled={submitting || !answer.trim()}
              className="flex-1 glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</> : <><Send className="mr-2 h-4 w-4" /> Submit Answer</>}
            </Button>
            <Button variant="outline" onClick={skipQuestion}
              className="rounded-xl border-border/50 py-6 text-muted-foreground hover:text-foreground">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Practice;
