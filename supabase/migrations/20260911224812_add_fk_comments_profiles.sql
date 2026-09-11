-- Add FK from khatmah_comments.user_id to profiles.id so PostgREST can detect the join
ALTER TABLE khatmah_comments 
  ADD CONSTRAINT khatmah_comments_user_id_fkey2 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
