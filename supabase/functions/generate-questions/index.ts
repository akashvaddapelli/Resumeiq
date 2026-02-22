import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobDescription, resumeText, experience, interviewTypes, company } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert interview preparation assistant and ATS scoring system.

STEP 1 - INTERPRET THE JOB DESCRIPTION:
The user has described their target job in natural language. It may be short, vague, or contain typos. Interpret their intent and extract: job role, required skills, experience level, and domain. Use the resume content to fill in any missing gaps. Respond as if you received a complete formal job description. Never ask the user to retype. Always produce output.

STEP 2 - ATS SCORING:
You are an ATS system. Read the ENTIRE resume text carefully — including all sections: summary, skills, frontend, backend, database, tools, projects, education. List every single technology and skill you find in the resume. Then compare them to the interpreted job description and give a match score from 0 to 100.

STEP 3 - GENERATE QUESTIONS:
Generate 3-5 interview questions per category requested. Vary difficulty levels (Easy, Medium, Hard).

Return a JSON object with this exact structure:
{
  "interpreted_jd": "A 1-sentence interpreted job description",
  "questions": [
    { "id": "q1", "category": "Technical", "question": "...", "difficulty": "Easy|Medium|Hard" }
  ],
  "atsScore": {
    "score": 0-100,
    "skills_found": ["every", "skill", "found", "in", "resume"],
    "skills_missing": ["skills", "in", "JD", "not", "in", "resume"],
    "recommendation": "2-3 sentences of advice"
  }
}

IMPORTANT for ATS: You MUST identify ALL skills in the resume including backend skills like Node.js, Express.js, MongoDB, MySQL, RESTful APIs, TypeScript, Python, Java — not just frontend skills.`;

    const userPrompt = `Job Description (raw user input): ${jobDescription}
Full Resume Text: ${resumeText || "Not provided"}
Experience Level: ${experience || "Not specified"}
Interview Types: ${interviewTypes?.join(", ") || "Technical, Behavioral"}
Company: ${company || "Not specified"}

Interpret the JD, score the resume, and generate questions. Return ONLY valid JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
