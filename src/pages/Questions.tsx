import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Play, Loader2, Download, Filter, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import McqQuiz from "@/components/McqQuiz";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateSessionPdf } from "@/lib/generatePdf";
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
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [activeTopTab, setActiveTopTab] = useState("interview");
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!sessionId || !user) return;
    Promise.all([
      supabase.from("questions").select("*").eq("session_id", sessionId).eq("user_id", user.id).order("created_at"),
      supabase.from("sessions").select("*").eq("id", sessionId).eq("user_id", user.id).single(),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("answers").select("*").eq("user_id", user.id),
    ]).then(([qRes, sRes, pRes, aRes]) => {
      setQuestions(qRes.data || []);
      setSession(sRes.data);
      setProfile(pRes.data);
      setAnswers(aRes.data || []);
      setLoading(false);
    });
  }, [sessionId, user]);

  // Extract unique skills/categories from all questions
  const allSkills = useMemo(() => {
    const cats = new Set<string>();
    questions.forEach(q => {
      if (q.category) cats.add(q.category);
    });
    return Array.from(cats).sort();
  }, [questions]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const generateForSkills = async () => {
    if (selectedSkills.length === 0) { toast.error("Select at least one skill"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { focusedSkills: selectedSkills, resumeText: session?.resume_text || "" },
      });
      if (error) throw error;

      const newQuestions: any[] = [];
      for (const q of (data.open_ended || [])) {
        newQuestions.push({
          session_id: sessionId,
          user_id: user!.id,
          question_text: q.question,
          category: q.category,
          difficulty: q.difficulty || "Medium",
          question_type: "open_ended",
        });
      }
      for (const q of (data.mcq || [])) {
        newQuestions.push({
          session_id: sessionId,
          user_id: user!.id,
          question_text: q.question,
          category: q.category,
          difficulty: q.difficulty || "Medium",
          question_type: "mcq",
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        });
      }

      if (newQuestions.length > 0) {
        const { data: inserted, error: insertErr } = await supabase.from("questions").insert(newQuestions).select();
        if (insertErr) throw insertErr;
        setQuestions(prev => [...prev, ...(inserted || [])]);
        toast.success(`Generated ${newQuestions.length} new questions for ${selectedSkills.join(", ")}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const togglePracticed = async (id: string, current: boolean) => {
    const { error } = await supabase.from("questions").update({ is_practiced: !current }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, is_practiced: !current } : q));
  };

  const openEndedQs = questions.filter(q => (q.question_type || "open_ended") === "open_ended");
  const mcqQs = questions.filter(q => q.question_type === "mcq");

  // Filter by selected skills
  const filteredOpenEnded = selectedSkills.length === 0
    ? openEndedQs
    : openEndedQs.filter(q => selectedSkills.includes(q.category));

  const filteredMcqs = selectedSkills.length === 0
    ? mcqQs
    : mcqQs.filter(q => selectedSkills.includes(q.category));

  const categories = ["All", ...new Set(filteredOpenEnded.map(q => q.category))];

  const handleDownloadPdf = async () => {
    if (!session) return;
    setPdfLoading(true);
    try {
      const ats = session.ats_feedback || {};
      const questionsWithAnswers = questions.map(q => {
        const ans = answers.find(a => a.question_id === q.id);
        return { ...q, answer: ans || undefined };
      });

      const { data: mcqRes } = await supabase.from("mcq_results" as any).select("*").eq("session_id", sessionId).eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1);
      const mcqResult = (mcqRes as any)?.[0];

      generateSessionPdf({
        userName: profile?.full_name || user?.user_metadata?.full_name || "User",
        date: new Date(session.created_at).toLocaleDateString(),
        jobRole: session.job_description_interpreted || session.job_description_raw || "N/A",
        atsScore: session.ats_score || 0,
        skillsFound: ats.skills_found || [],
        skillsMissing: ats.skills_missing || [],
        recommendation: ats.recommendation || "",
        questions: questionsWithAnswers,
        mcqResults: mcqResult ? {
          total_questions: mcqResult.total_questions,
          correct_answers: mcqResult.correct_answers,
          score_percentage: mcqResult.score_percentage,
          weakest_topic: mcqResult.weakest_topic,
        } : undefined,
      });
      toast.success("Your PDF is ready!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setPdfLoading(false);
    }
  };

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
      <div className={`container mx-auto max-w-3xl px-4 pt-24 ${activeTopTab === "interview" ? "pb-28" : "pb-8"}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Your Interview Questions</h1>
              <p className="mt-2 text-muted-foreground">{openEndedQs.length} questions + {mcqQs.length} MCQs</p>
            </div>
            <Button onClick={handleDownloadPdf} disabled={pdfLoading} variant="outline" className="rounded-xl border-border/50 text-muted-foreground hover:text-foreground">
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Download PDF</span>
            </Button>
          </div>
        </motion.div>

        {/* Skill filter chips */}
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filter by skill</span>
            {selectedSkills.length > 0 && (
              <button onClick={() => setSelectedSkills([])} className="text-xs text-primary hover:underline ml-auto">
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allSkills.map(skill => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedSkills.includes(skill)
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted/50 text-muted-foreground border-border hover:text-foreground hover:border-primary/30"
                }`}
              >
                {skill}
              </button>
            ))}
            {selectedSkills.length > 0 && (
              <Button onClick={generateForSkills} disabled={generating} size="sm"
                className="glow-button rounded-full text-xs gap-1.5 text-primary-foreground h-7 px-3">
                {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {generating ? "Generating..." : `Generate 20+ for ${selectedSkills.join(", ")}`}
              </Button>
            )}
          </div>
        </div>

        {/* Top-level tabs */}
        <Tabs value={activeTopTab} onValueChange={setActiveTopTab} className="mt-6">
          <TabsList className="bg-muted/50 border border-border rounded-xl p-1 w-full">
            <TabsTrigger value="interview" className="flex-1 rounded-lg text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Interview Questions ({filteredOpenEnded.length})
            </TabsTrigger>
            <TabsTrigger value="mcq" className="flex-1 rounded-lg text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              MCQ Quiz ({filteredMcqs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interview" className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 border border-border rounded-xl p-1">
                {categories.map(c => (
                  <TabsTrigger key={c} value={c} className="rounded-lg text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{c}</TabsTrigger>
                ))}
              </TabsList>

              {categories.map(c => (
                <TabsContent key={c} value={c} className="mt-6 space-y-3">
                  {(c === "All" ? filteredOpenEnded : filteredOpenEnded.filter(q => q.category === c)).map((q, i) => (
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
          </TabsContent>

          <TabsContent value="mcq" className="mt-6">
            <McqQuiz questions={filteredMcqs.map(q => ({
              id: q.id,
              question_text: q.question_text,
              options: q.options || {},
              correct_answer: q.correct_answer || "A",
              explanation: q.explanation || "",
              difficulty: q.difficulty,
              category: q.category,
            }))} sessionId={sessionId || ""} />
          </TabsContent>
        </Tabs>

        {/* Only show practice button on interview tab */}
        {activeTopTab === "interview" && (
          <div className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/80 backdrop-blur-xl p-4 z-50">
            <div className="container mx-auto max-w-3xl">
              <Button onClick={() => {
                  const skillsParam = selectedSkills.length > 0 ? `&skills=${encodeURIComponent(selectedSkills.join(","))}` : "";
                  navigate(`/practice?session=${sessionId}${skillsParam}`);
                }}
                className="w-full glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground">
                <Play className="mr-2 h-4 w-4" /> Start Practice Mode
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questions;
