import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobDescription, resumeText, experience, interviewTypes, company, focusedSkills } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Skill-focused generation mode
    if (focusedSkills && focusedSkills.length > 0) {
      const skillList = focusedSkills.join(", ");
      const skillPrompt = `You are an expert interview preparation assistant. Generate exactly 20 open-ended interview questions AND 20 MCQ questions focused ONLY on these specific skills/technologies: ${skillList}.

For open-ended questions:
- Make them deep, specific, and practical — not generic definitions
- Mix difficulty: 30% Easy, 50% Medium, 20% Hard
- Categories should match the skill names provided
${resumeText ? `- Reference the candidate's actual projects and experience from their resume when possible` : ""}

For MCQ questions:
- Each must have: question, 4 options (A-D), correct_answer (letter), explanation (1 sentence), difficulty, category
- Difficulty split: 30% Easy, 50% Medium, 20% Hard
- Categories should match the skill names provided

Return ONLY valid JSON:
{
  "open_ended": [{ "id": "q1", "category": "SkillName", "question": "...", "difficulty": "Easy|Medium|Hard" }],
  "mcq": [{ "id": "m1", "category": "SkillName", "question": "...", "options": {"A":"..","B":"..","C":"..","D":".."}, "correct_answer": "B", "explanation": "...", "difficulty": "Easy|Medium|Hard" }]
}`;

      const userMsg = `Skills to focus on: ${skillList}
${resumeText ? `Resume: ${resumeText}` : ""}
Generate exactly 20 open-ended and 20 MCQ questions. Return ONLY valid JSON.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: skillPrompt },
            { role: "user", content: userMsg },
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Original full generation mode
    const systemPrompt = `You are an expert interview preparation assistant and ATS scoring system.

STEP 1 - INTERPRET THE JOB DESCRIPTION:
The user has described their target job in natural language. It may be short, vague, or contain typos. Interpret their intent and extract: job role, required skills, experience level, and domain. Use the resume content to fill in any missing gaps. Respond as if you received a complete formal job description. Never ask the user to retype. Always produce output.

STEP 2 - ATS SCORING:
You are an ATS system. Read the ENTIRE resume text carefully — including all sections: summary, skills, frontend, backend, database, tools, projects, education. List every single technology and skill you find in the resume. Then compare them to the interpreted job description and give a match score from 0 to 100.

STEP 3 - GENERATE 40 OPEN-ENDED INTERVIEW QUESTIONS:
Generate exactly 40 open-ended interview questions with this breakdown:
- Behavioral (8 questions)
- Technical (16 questions)
- Situational (8 questions)
- HR (8 questions)

For open-ended questions — reference the candidate's actual projects, skills, and experience from their resume. Make every question specific and relevant, not generic. For example, instead of "What is React?" ask "Explain how you handled state management in your [specific project] using React.js".

STEP 4 - GENERATE 20 MCQ QUESTIONS:
Generate exactly 20 multiple-choice questions based strictly on the technologies listed in the candidate's resume.
Each MCQ must have:
- question: the question text
- options: exactly 4 options labeled A, B, C, D
- correct_answer: the letter of the correct option (A, B, C, or D)
- explanation: one sentence explaining why the correct answer is right
- difficulty: Easy (30%), Medium (50%), Hard (20%)
- category: the technology/topic area

Return a JSON object with this exact structure:
{
  "interpreted_jd": "A 1-sentence interpreted job description",
  "open_ended": [
    { "id": "q1", "category": "Technical", "question": "...", "difficulty": "Easy|Medium|Hard" }
  ],
  "mcq": [
    { "id": "m1", "category": "React", "question": "...", "options": {"A": "...", "B": "...", "C": "...", "D": "..."}, "correct_answer": "B", "explanation": "...", "difficulty": "Easy|Medium|Hard" }
  ],
  "atsScore": {
    "score": 0-100,
    "skills_found": ["every", "skill", "found", "in", "resume"],
    "skills_missing": ["skills", "in", "JD", "not", "in", "resume"],
    "recommendation": "2-3 sentences of advice"
  }
}

IMPORTANT: You MUST generate exactly 40 open-ended questions and exactly 20 MCQs. Never less.
IMPORTANT for ATS: You MUST identify ALL skills in the resume including backend skills like Node.js, Express.js, MongoDB, MySQL, RESTful APIs, TypeScript, Python, Java — not just frontend skills.`;

    const userPrompt = `Job Description (raw user input): ${jobDescription}
Full Resume Text: ${resumeText || "Not provided"}
Experience Level: ${experience || "Not specified"}
Interview Types: ${interviewTypes?.join(", ") || "Technical, Behavioral"}
Company: ${company || "Not specified"}

Generate 40 open-ended interview questions AND 20 MCQs for this candidate. For open-ended questions — reference the candidate's actual projects, skills, and experience. Make every question specific and relevant, not generic. For MCQs — create questions based strictly on the technologies listed in their resume. Each MCQ must have 4 options, one correct answer marked, and a one-sentence explanation. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(content);

    // Backward compat: also expose as "questions" for Setup.tsx
    if (parsed.open_ended && !parsed.questions) {
      parsed.questions = parsed.open_ended;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
