
-- answers: recreate policies targeting authenticated role only
DROP POLICY IF EXISTS "Users can view own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.answers;

CREATE POLICY "Users can view own answers" ON public.answers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON public.answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own answers" ON public.answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- mcq_results: recreate policies targeting authenticated role only
DROP POLICY IF EXISTS "Users can view own mcq_results" ON public.mcq_results;
DROP POLICY IF EXISTS "Users can insert own mcq_results" ON public.mcq_results;
DROP POLICY IF EXISTS "Users can update own mcq_results" ON public.mcq_results;

CREATE POLICY "Users can view own mcq_results" ON public.mcq_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mcq_results" ON public.mcq_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mcq_results" ON public.mcq_results
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- questions: recreate policies targeting authenticated role only
DROP POLICY IF EXISTS "Users can view own questions" ON public.questions;
DROP POLICY IF EXISTS "Users can insert own questions" ON public.questions;
DROP POLICY IF EXISTS "Users can update own questions" ON public.questions;

CREATE POLICY "Users can view own questions" ON public.questions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own questions" ON public.questions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own questions" ON public.questions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- streaks: recreate policies targeting authenticated role only
DROP POLICY IF EXISTS "Users can view own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON public.streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON public.streaks;

CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.streaks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
