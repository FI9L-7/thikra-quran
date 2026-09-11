/*
# Create Zikra Quran App Schema

## Overview
Creates the full database schema for the "Zikra" (ذكرى) Quran web application.
This is a multi-user app with Google OAuth authentication.

## New Tables

1. **profiles** — Extended user profile data (display name, avatar, privacy settings)
   - `id` (uuid, PK, references auth.users)
   - `display_name` (text, nullable — defaults to email before Oauth)
   - `avatar_url` (text, nullable)
   - `show_progress_public` (boolean, default false — whether to show khatmah progress publicly)
   - `created_at` (timestamptz)

2. **khatmah_goals** — A user's Quran completion goal (one active at a time)
   - `id` (uuid, PK)
   - `user_id` (uuid, references auth.users)
   - `target_days` (int — 1, 7, 30, 60, 180, 365)
   - `start_date` (timestamptz)
   - `start_page` (int, default 1)
   - `end_page` (int, default 604)
   - `current_page` (int, default 1 — tracks where they are)
   - `status` (text: 'active' | 'completed' | 'cancelled')
   - `completed_at` (timestamptz, nullable)
   - `created_at` (timestamptz)

3. **khatmah_daily_log** — Daily reading log per goal
   - `id` (uuid, PK)
   - `goal_id` (uuid, references khatmah_goals)
   - `user_id` (uuid, references auth.users)
   - `log_date` (date — which day was completed)
   - `pages_read` (int — pages read that day)
   - `from_page` (int)
   - `to_page` (int)
   - `created_at` (timestamptz)

4. **verse_bookmarks** — Personal colored bookmarks on verses
   - `id` (uuid, PK)
   - `user_id` (uuid, references auth.users)
   - `verse_key` (text, e.g. "2:255")
   - `page_number` (int)
   - `color` (text: 'red' | 'yellow' | 'blue' | 'green' | 'purple')
   - `note` (text, nullable — optional private note)
   - `created_at` (timestamptz)

5. **khatmah_comments** — Community comments on khatmah progress
   - `id` (uuid, PK)
   - `user_id` (uuid, references auth.users)
   - `content` (text, 1-500 chars)
   - `goal_id` (uuid, nullable — linked to a specific khatmah goal)
   - `is_flagged` (boolean, default false)
   - `flagged_reason` (text, nullable)
   - `is_hidden` (boolean, default false — hidden by moderation)
   - `created_at` (timestamptz)

## Security (RLS)
- All tables have RLS enabled
- profiles: users can read their own profile + update own; public profiles visible if show_progress_public=true
- khatmah_goals: owner-only CRUD
- khatmah_daily_log: owner-only CRUD
- verse_bookmarks: owner-only CRUD
- khatmah_comments: all authenticated users can read non-hidden comments; users can only insert/update/delete their own
- A profanity filter function is included as a SECURITY DEFINER function for comment moderation
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  show_progress_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_own_or_public" ON profiles;
CREATE POLICY "profiles_read_own_or_public"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR show_progress_public = true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============ KHATMAH GOALS ============
CREATE TABLE IF NOT EXISTS khatmah_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_days int NOT NULL DEFAULT 30,
  start_date timestamptz DEFAULT now(),
  start_page int NOT NULL DEFAULT 1,
  end_page int NOT NULL DEFAULT 604,
  current_page int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE khatmah_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own" ON khatmah_goals;
CREATE POLICY "goals_select_own"
ON khatmah_goals FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_insert_own" ON khatmah_goals;
CREATE POLICY "goals_insert_own"
ON khatmah_goals FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_update_own" ON khatmah_goals;
CREATE POLICY "goals_update_own"
ON khatmah_goals FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_delete_own" ON khatmah_goals;
CREATE POLICY "goals_delete_own"
ON khatmah_goals FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============ KHATMAH DAILY LOG ============
CREATE TABLE IF NOT EXISTS khatmah_daily_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES khatmah_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  pages_read int NOT NULL DEFAULT 0,
  from_page int NOT NULL,
  to_page int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE khatmah_daily_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_log_select_own" ON khatmah_daily_log;
CREATE POLICY "daily_log_select_own"
ON khatmah_daily_log FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_log_insert_own" ON khatmah_daily_log;
CREATE POLICY "daily_log_insert_own"
ON khatmah_daily_log FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_log_update_own" ON khatmah_daily_log;
CREATE POLICY "daily_log_update_own"
ON khatmah_daily_log FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_log_delete_own" ON khatmah_daily_log;
CREATE POLICY "daily_log_delete_own"
ON khatmah_daily_log FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============ VERSE BOOKMARKS ============
CREATE TABLE IF NOT EXISTS verse_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_key text NOT NULL,
  page_number int NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verse_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON verse_bookmarks;
CREATE POLICY "bookmarks_select_own"
ON verse_bookmarks FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON verse_bookmarks;
CREATE POLICY "bookmarks_insert_own"
ON verse_bookmarks FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_update_own" ON verse_bookmarks;
CREATE POLICY "bookmarks_update_own"
ON verse_bookmarks FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON verse_bookmarks;
CREATE POLICY "bookmarks_delete_own"
ON verse_bookmarks FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============ KHATMAH COMMENTS ============
CREATE TABLE IF NOT EXISTS khatmah_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  goal_id uuid REFERENCES khatmah_goals(id) ON DELETE SET NULL,
  is_flagged boolean NOT NULL DEFAULT false,
  flagged_reason text,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE khatmah_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see non-hidden comments
DROP POLICY IF EXISTS "comments_select_all" ON khatmah_comments;
CREATE POLICY "comments_select_all"
ON khatmah_comments FOR SELECT
TO authenticated USING (is_hidden = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_insert_own" ON khatmah_comments;
CREATE POLICY "comments_insert_own"
ON khatmah_comments FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update_own" ON khatmah_comments;
CREATE POLICY "comments_update_own"
ON khatmah_comments FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON khatmah_comments;
CREATE POLICY "comments_delete_own"
ON khatmah_comments FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
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

-- ============ PROFANITY FILTER ============
-- Simple Arabic + English profanity check function
CREATE OR REPLACE FUNCTION public.check_profanity(input_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  lower_text text;
  bad_word text;
  bad_words text[] := ARRAY[
    'لعن', 'سب', 'حمار', 'كلب', 'خنزير', 'shit', 'fuck', 'damn', 'asshole', 'bitch',
    'idiot', 'stupid', 'غبي', 'أحمق', 'تبا', 'حقير', 'wtf', 'astaghfirullah'
  ];
BEGIN
  lower_text := lower(input_text);
  FOREACH bad_word SLICE 1 IN ARRAY bad_words LOOP
    IF lower_text LIKE '%' || bad_word || '%' THEN
      RETURN true;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_khatmah_goals_user_id ON khatmah_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_khatmah_daily_log_goal_id ON khatmah_daily_log(goal_id);
CREATE INDEX IF NOT EXISTS idx_verse_bookmarks_user_id ON verse_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_khatmah_comments_created_at ON khatmah_comments(created_at DESC);
