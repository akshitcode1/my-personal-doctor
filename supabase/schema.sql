-- ═══════════════════════════════════════════════════════════════════
-- My Personal Doctor — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ── PROFILES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email       TEXT NOT NULL,
    full_name   TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── CHATS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chats (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title       TEXT NOT NULL DEFAULT 'New Consultation',
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id    ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(user_id, updated_at DESC);

-- ── MESSAGES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id              UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role                 TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content              TEXT NOT NULL,
    selected_specialists TEXT[],
    specialist_responses JSONB,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id    ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(chat_id, created_at ASC);

-- ── UPLOADED DOCUMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.uploaded_documents (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id           UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename          TEXT NOT NULL,
    file_size         INTEGER,
    storage_path      TEXT NOT NULL,
    extracted_text    TEXT,
    summary           TEXT,
    processing_status TEXT NOT NULL DEFAULT 'pending'
                      CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message     TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_chat_id ON public.uploaded_documents(chat_id);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Chats: own rows only
DROP POLICY IF EXISTS "chats_own" ON public.chats;
CREATE POLICY "chats_own" ON public.chats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messages: only in own chats
DROP POLICY IF EXISTS "messages_own_chats" ON public.messages;
CREATE POLICY "messages_own_chats" ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chats WHERE id = messages.chat_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chats WHERE id = messages.chat_id AND user_id = auth.uid())
  );

-- Documents: only in own chats
DROP POLICY IF EXISTS "documents_own_chats" ON public.uploaded_documents;
CREATE POLICY "documents_own_chats" ON public.uploaded_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chats WHERE id = uploaded_documents.chat_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chats WHERE id = uploaded_documents.chat_id AND user_id = auth.uid())
  );

-- ── STORAGE ─────────────────────────────────────────────────────────
-- Run this manually in Supabase Dashboard → Storage → Create bucket:
-- Name: medical-documents
-- Public: false (private)
-- Max file size: 20971520 (20MB)
--
-- Then add a policy for service role only:
-- "Only service role can read/write" policy on the bucket.
