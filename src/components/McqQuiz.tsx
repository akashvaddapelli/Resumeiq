import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface McqQuestion {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  category: string;
}

interface Props {
  questions: McqQuestion[];
  sessionId: string;
}

const McqQuiz = ({ questions, sessionId }: Props) => {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { selected: string; correct: boolean }>>({});
  const [finished, setFinished] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [categoryWrong, setCategoryWrong] = useState<Record<string, number>>({});

  const current = questions[currentIdx];

  const handleAnswer = useCallback((letter: string) => {
    if (answered) return;
    setSelectedAnswer(letter);
    setAnswered(true);
    const isCorrect = letter === current.correct_answer;
    if (isCorrect) setScore(s => s + 1);
    else setCategoryWrong(prev => ({ ...prev, [current.category]: (prev[current.category] || 0) + 1 }));
    setAnswers(prev => ({ ...prev, [currentIdx]: { selected: letter, correct: isCorrect } }));
  }, [answered, current, currentIdx]);

  useEffect(() => {
    if (!timerEnabled || answered || finished) return;
    if (timeLeft <= 0) { handleAnswer("X"); return; }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timerEnabled, timeLeft, answered, finished, handleAnswer]);

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      finishQuiz();
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedAnswer(null);
    setAnswered(false);
    setTimeLeft(30);
  };

  const finishQuiz = async () => {
    setFinished(true);
    const pct = (score / questions.length) * 100;
    const weakest = Object.entries(categoryWrong).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    if (user) {
      await supabase.from("mcq_results" as any).insert({
        user_id: user.id,
        session_id: sessionId,
        total_questions: questions.length,
        correct_answers: score,
        score_percentage: pct,
        weakest_topic: weakest,
      } as any);
    }
    toast.success("MCQ Quiz completed!");
  };

  const restart = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setAnswers({});
    setFinished(false);
    setCategoryWrong({});
    setTimeLeft(30);
  };

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground mt-8">No MCQ questions available for this session.</p>;
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const weakest = Object.entries(categoryWrong).sort((a, b) => b[1] - a[1])[0]?.[0];
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="glass-card p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground">Quiz Complete!</h2>
          <p className="mt-2 text-4xl font-bold gradient-text">{score}/{questions.length}</p>
          <p className="text-muted-foreground mt-1">{pct}% correct</p>
          {weakest && <p className="mt-3 text-sm text-yellow-400">Weakest area: {weakest}</p>}
        </div>

        <div className="space-y-2">
          {questions.map((q, i) => {
            const a = answers[i];
            return (
              <div key={q.id} className={`glass-card p-4 flex items-start gap-3 ${a?.correct ? "border-primary/20" : "border-destructive/20"}`}>
                {a?.correct ? <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{q.question_text}</p>
                  {!a?.correct && <p className="text-xs text-primary mt-1">Correct: {q.correct_answer}) {q.options[q.correct_answer]}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={restart} className="w-full glow-button rounded-xl py-6 text-primary-foreground">
          <RotateCcw className="mr-2 h-4 w-4" /> Retry Quiz
        </Button>
      </motion.div>
    );
  }

  const optionKeys = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      {/* Score & timer header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Question {currentIdx + 1}/{questions.length}</span>
        <span className="font-heading text-lg font-bold text-primary">{score}/{currentIdx + (answered ? 1 : 0)} correct</span>
      </div>

      <div className="w-full bg-muted rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${((currentIdx + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      {/* Timer toggle */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => { setTimerEnabled(!timerEnabled); setTimeLeft(30); }}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${timerEnabled ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
          <Timer className="h-3 w-3" /> {timerEnabled ? `${timeLeft}s` : "Timer: Off"}
        </button>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs border-border">{current.category}</Badge>
              <Badge variant="outline" className={`text-xs ${current.difficulty === "Easy" ? "text-primary border-primary/20" : current.difficulty === "Hard" ? "text-destructive border-destructive/20" : "text-yellow-400 border-yellow-500/20"}`}>
                {current.difficulty}
              </Badge>
            </div>
            <p className="font-heading text-lg font-semibold text-foreground">{current.question_text}</p>
          </div>

          {/* Options */}
          <div className="mt-4 space-y-3">
            {optionKeys.map(letter => {
              const optionText = current.options[letter];
              if (!optionText) return null;
              const isSelected = selectedAnswer === letter;
              const isCorrect = letter === current.correct_answer;

              let cls = "glass-card-hover p-4 cursor-pointer flex items-start gap-3 transition-all";
              if (answered) {
                if (isCorrect) cls = "glass-card p-4 border-primary/50 bg-primary/5 flex items-start gap-3";
                else if (isSelected && !isCorrect) cls = "glass-card p-4 border-destructive/50 bg-destructive/5 flex items-start gap-3";
                else cls = "glass-card p-4 opacity-50 flex items-start gap-3";
              }

              return (
                <motion.button key={letter} onClick={() => handleAnswer(letter)} disabled={answered}
                  whileTap={!answered ? { scale: 0.98 } : {}} className={`w-full text-left ${cls}`}>
                  <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium ${
                    answered && isCorrect ? "border-primary bg-primary text-primary-foreground" :
                    answered && isSelected ? "border-destructive bg-destructive text-destructive-foreground" :
                    "border-border text-muted-foreground"
                  }`}>{letter}</span>
                  <span className="text-sm text-foreground pt-0.5">{optionText}</span>
                  {answered && isCorrect && <CheckCircle className="ml-auto h-5 w-5 text-primary shrink-0" />}
                  {answered && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-destructive shrink-0" />}
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {answered && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 glass-card p-4 border-primary/20">
                <p className="text-xs text-primary font-medium mb-1">Explanation</p>
                <p className="text-sm text-muted-foreground">{current.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {answered && (
            <Button onClick={nextQuestion} className="mt-4 w-full glow-button rounded-xl py-5 text-primary-foreground">
              {currentIdx + 1 >= questions.length ? "Finish Quiz" : "Next Question →"}
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default McqQuiz;
