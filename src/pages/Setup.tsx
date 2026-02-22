import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Sparkles, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const experienceLevels = ["Fresher", "Mid-Level", "Senior"];
const interviewTypes = ["Technical", "Behavioral", "HR", "Managerial", "Mixed"];

type Step = { label: string; status: "pending" | "loading" | "done" };

const Setup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeCharCount, setResumeCharCount] = useState(0);
  const [jobDescription, setJobDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [generating, setGenerating] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText.trim();
  };

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setResumeFile(file);
    try {
      const text = await extractPdfText(file);
      setResumeText(text);
      setResumeCharCount(text.length);
      toast.success(`Resume parsed — ${text.length.toLocaleString()} characters extracted`);
    } catch (err) {
      toast.error("Failed to parse PDF. Please try another file.");
      setResumeFile(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const toggleType = (t: string) => {
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const updateStep = (index: number, status: Step["status"]) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please describe the role you're targeting");
      return;
    }
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    setGenerating(true);
    setSteps([
      { label: "Resume parsed", status: resumeText ? "done" : "pending" },
      { label: "Interpreting job description...", status: "loading" },
      { label: "Running ATS analysis...", status: "pending" },
      { label: "Generating your questions...", status: "pending" },
    ]);

    try {
      // Step 2 & 3 & 4: Call edge function
      setTimeout(() => updateStep(1, "done"), 1500);
      setTimeout(() => updateStep(2, "loading"), 1500);

      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: {
          jobDescription,
          resumeText,
          experience,
          interviewTypes: types.length ? types : ["Technical", "Behavioral"],
          company,
        },
      });
      if (error) throw error;

      updateStep(2, "done");
      updateStep(3, "loading");

      // Save session to DB
      const { data: session, error: sessionErr } = await supabase.from("sessions").insert({
        user_id: user.id,
        resume_text: resumeText,
        job_description_raw: jobDescription,
        job_description_interpreted: data.interpreted_jd || jobDescription,
        experience_level: experience,
        interview_type: types.length ? types : ["Technical", "Behavioral"],
        company_name: company,
        ats_score: data.atsScore?.score,
        ats_feedback: data.atsScore,
      }).select().single();

      if (sessionErr) throw sessionErr;

      // Save questions to DB
      const questionsToInsert = (data.questions || []).map((q: any) => ({
        session_id: session.id,
        user_id: user.id,
        category: q.category,
        question_text: q.question,
        difficulty: q.difficulty || "Medium",
      }));

      if (questionsToInsert.length > 0) {
        const { error: qErr } = await supabase.from("questions").insert(questionsToInsert);
        if (qErr) throw qErr;
      }

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const { data: streakData } = await supabase.from("streaks").select("*").eq("user_id", user.id).single();
      if (streakData) {
        const lastActive = streakData.last_active_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let newStreak = streakData.current_streak;
        if (lastActive === yesterday) {
          newStreak += 1;
        } else if (lastActive !== today) {
          newStreak = 1;
        }
        await supabase.from("streaks").update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streakData.longest_streak),
          last_active_date: today,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      }

      updateStep(3, "done");

      // Store session ID for navigation
      sessionStorage.setItem("resumiq_session_id", session.id);

      setTimeout(() => navigate("/ats-score?session=" + session.id), 800);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate questions");
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <AnimatePresence mode="wait">
          {generating ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh]">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-8">Preparing your session...</h2>
              <div className="space-y-4 w-full max-w-sm">
                {steps.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-3">
                    {step.status === "done" ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : step.status === "loading" ? (
                      <Loader2 className="h-5 w-5 text-secondary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-border" />
                    )}
                    <span className={`text-sm ${step.status === "done" ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="font-heading text-3xl font-bold text-foreground">Set Up Your Session</h1>
              <p className="mt-2 text-muted-foreground">Upload your resume and describe the role to get started.</p>

              <div className="mt-8 space-y-6">
                {/* Step 1: Resume Upload */}
                <div>
                  <label className="text-sm font-medium text-foreground">Step 1 — Upload Resume (PDF)</label>
                  <div {...getRootProps()}
                    className={`mt-2 glass-card-hover cursor-pointer border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                    <input {...getInputProps()} />
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                          <span className="text-sm text-foreground">{resumeFile.name}</span>
                          <p className="text-xs text-primary mt-1">✅ Resume parsed — {resumeCharCount.toLocaleString()} characters extracted</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); setResumeText(""); setResumeCharCount(0); }}>
                          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          Drag & drop your resume PDF, or <span className="text-primary">browse</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Step 2: Job Description */}
                <div>
                  <label className="text-sm font-medium text-foreground">Step 2 — Describe the role</label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Paste a full JD, or just type naturally — anything works!
                  </p>
                  <div className="input-glow">
                    <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                      placeholder='e.g. "We are looking for a React developer..." or simply "frontend dev job"'
                      rows={5} className="w-full bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none" />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <div className="space-y-0.5">
                      <p>✅ "I am a fresher looking for a full stack UI developer role in IT"</p>
                      <p>✅ "Senior Node.js backend engineer at a startup"</p>
                      <p>✅ "fresher IT job react"</p>
                    </div>
                    <span>{jobDescription.length} chars</span>
                  </div>
                </div>

                {/* Step 3: Preferences */}
                <div>
                  <label className="text-sm font-medium text-foreground">Step 3 — Preferences</label>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Experience Level</p>
                    <div className="flex flex-wrap gap-2">
                      {experienceLevels.map((lvl) => (
                        <button key={lvl} onClick={() => setExperience(lvl)}
                          className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${experience === lvl ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Interview Type</p>
                    <div className="flex flex-wrap gap-2">
                      {interviewTypes.map((t) => (
                        <button key={t} onClick={() => toggleType(t)}
                          className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${types.includes(t) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Company (optional)</p>
                    <div className="input-glow">
                      <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Infosys, TCS, Google (optional)"
                        className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleGenerate} disabled={generating}
                  className="w-full glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground">
                  <Sparkles className="mr-2 h-4 w-4" /> Analyse & Generate Questions
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Setup;
