import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  show_progress_public: boolean;
  created_at: string;
};

export type KhatmahGoal = {
  id: string;
  user_id: string;
  target_days: number;
  start_date: string;
  start_page: number;
  end_page: number;
  current_page: number;
  status: 'active' | 'completed' | 'cancelled';
  completed_at: string | null;
  created_at: string;
};

export type KhatmahDailyLog = {
  id: string;
  goal_id: string;
  user_id: string;
  log_date: string;
  pages_read: number;
  from_page: number;
  to_page: number;
  created_at: string;
};

export type VerseBookmark = {
  id: string;
  user_id: string;
  verse_key: string;
  page_number: number;
  color: 'red' | 'yellow' | 'blue' | 'green' | 'purple';
  note: string | null;
  created_at: string;
};

export type KhatmahComment = {
  id: string;
  user_id: string;
  content: string;
  goal_id: string | null;
  is_flagged: boolean;
  flagged_reason: string | null;
  is_hidden: boolean;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};
