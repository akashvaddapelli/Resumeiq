import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_QUESTION_LENGTH = 2000;
const MAX_ANSWER_LENGTH = 5000;
const MAX_CATEGORY_LENGTH = 200;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data, error: authError } = await supabaseClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { question, answer, category, isVoice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Input validation
    if (!question || typeof question !== "string" || question.length > MAX_QUESTION_LENGTH) {
      return new Response(JSON.stringify({ error: "Invalid question (max 2000 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!answer || typeof answer !== "string" || answer.length > MAX_ANSWER_LENGTH) {
      return new Response(JSON.stringify({ error: "Invalid answer (max 5000 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (category && (typeof category !== "string" || category.length > MAX_CATEGORY_LENGTH)) {
      return new Response(JSON.stringify({ error: "Invalid category" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const voiceExtra = isVoice
      ? `\nAlso evaluate communication clarity since this was a spoken answer transcribed to text. Note filler phrases, repetition, or lack of structure. Include a "clarity_note" field with one sentence about their communication clarity (e.g. "Your answer was clear and well structured" or "Try to be more concise — your answer had filler phrases"). Factor communication clarity into the confidence_score.`
      : "";

    const systemPrompt = `You are an expert interview coach. The user answered an interview question. Evaluate their answer on: clarity, relevance, confidence, and completeness.${voiceExtra}

Return a JSON object with this exact structure:
{
  "confidence_score": 0-100,
  "feedback": "2-3 sentences of constructive feedback",
  "sample_answer": "A strong model answer for this question",
  "weak_areas": ["area1", "area2"]${isVoice ? ',\n  "clarity_note": "one sentence about communication clarity"' : ""}
}

Be constructive and specific. The confidence score should reflect how well the answer would perform in a real interview.`;

    const userPrompt = `Category: ${category}
Question: ${question}
Candidate's Answer: ${answer}
${isVoice ? "Note: This answer was spoken aloud and transcribed." : ""}
Evaluate this answer. Return ONLY valid JSON.`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
    console.error("evaluate-answer error:", e instanceof Error ? e.message : "Unknown error");
    return new Response(JSON.stringify({ error: "An error occurred processing your request" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
