-- Force RLS even for table owners to prevent any bypass
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;