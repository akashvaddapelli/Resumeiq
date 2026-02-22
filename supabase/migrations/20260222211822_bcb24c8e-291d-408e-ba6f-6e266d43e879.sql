
-- Add question_type column to questions table (open_ended or mcq)
ALTER TABLE public.questions ADD COLUMN question_type text NOT NULL DEFAULT 'open_ended';

-- Add MCQ-specific columns
ALTER TABLE public.questions ADD COLUMN options jsonb;
ALTER TABLE public.questions ADD COLUMN correct_answer text;
ALTER TABLE public.questions ADD COLUMN explanation text;

-- Create mcq_results table for storing quiz scores
CREATE TABLE public.mcq_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  score_percentage numeric NOT NULL DEFAULT 0,
  weakest_topic text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mcq_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mcq_results" ON public.mcq_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mcq_results" ON public.mcq_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mcq_results" ON public.mcq_results FOR UPDATE USING (auth.uid() = user_id);
