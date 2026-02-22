import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";
import { supabase } from "@/integrations/supabase/client";

const experienceLevels = ["Fresher", "Mid-Level", "Senior"];
const interviewTypes = ["Technical", "Behavioral", "HR", "Managerial"];

const Setup = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (file && file.type === "application/pdf") {
      setResumeFile(file);
      // Extract text via FileReader for simple text extraction
      const reader = new FileReader();
      reader.onload = () => setResumeText("Resume uploaded: " + file.name);
      reader.readAsText(file);
      toast.success("Resume uploaded!");
    } else {
      toast.error("Please upload a PDF file");
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

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please describe the role you're targeting");
      return;
    }
    setLoading(true);

    try {
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

      // Store in sessionStorage for the questions page
      sessionStorage.setItem("intervu_questions", JSON.stringify(data.questions));
      sessionStorage.setItem("intervu_ats", JSON.stringify(data.atsScore));
      sessionStorage.setItem("intervu_setup", JSON.stringify({ jobDescription, experience, types, company }));

      navigate("/ats-score");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-3xl font-bold text-foreground">Set Up Your Session</h1>
          <p className="mt-2 text-muted-foreground">Upload your resume and describe the role to get started.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-8 space-y-6"
        >
          {/* Resume Upload */}
          <div
            {...getRootProps()}
            className={`glass-card-hover cursor-pointer border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive ? "border-primary/50 bg-primary/5" : "border-border"
            }`}
          >
            <input {...getInputProps()} />
            {resumeFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm text-foreground">{resumeFile.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); setResumeText(""); }}>
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

          {/* Job Description */}
          <div>
            <label className="text-sm font-medium text-foreground">Describe the role</label>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              Paste a full JD, or just type naturally — e.g. "fresher frontend developer" or "senior react role at Google"
            </p>
            <div className="input-glow">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder='e.g. "We are looking for a React developer with 3+ years..." or simply "frontend dev job"'
                rows={5}
                className="w-full bg-transparent p-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
              />
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">{jobDescription.length} chars</p>
          </div>

          {/* Experience Level */}
          <div>
            <label className="text-sm font-medium text-foreground">Experience Level</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {experienceLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setExperience(lvl)}
                  className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                    experience === lvl
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Types */}
          <div>
            <label className="text-sm font-medium text-foreground">Interview Type</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {interviewTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                    types.includes(t)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="text-sm font-medium text-foreground">Company (optional)</label>
            <div className="input-glow mt-2">
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Meta, startup..."
                className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
            </div>
          </div>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full glow-button rounded-xl py-6 text-base font-semibold text-primary-foreground"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Sparkles className="h-4 w-4" />
                </motion.div>
                Generating...
              </span>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Questions
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Setup;
