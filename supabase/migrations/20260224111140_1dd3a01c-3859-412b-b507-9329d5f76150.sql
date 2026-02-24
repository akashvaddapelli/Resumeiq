
-- Add DELETE policies for all user-owned tables
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.sessions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers"
ON public.answers FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
ON public.questions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mcq_results"
ON public.mcq_results FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks"
ON public.streaks FOR DELETE
USING (auth.uid() = user_id);
