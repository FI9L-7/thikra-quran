import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen, Library, Search, Clock, Target, TrendingUp, Play,
  Calendar, Sparkles, ChevronLeft, Flag, CheckCircle2, XCircle,
  Bookmark as BookmarkIcon, Users
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuranData } from '@/contexts/QuranDataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { supabase } from '@/lib/supabase';
import type { KhatmahGoal, VerseBookmark, KhatmahComment, Profile } from '@/lib/supabase';
import {
  toArabicNumber, verseKeyToArabic, REVELATION_PLACE_LABEL,
  KHATMAH_DURATIONS, TOTAL_PAGES, BOOKMARK_COLORS
} from '@/constants';
import type { Page } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  onSelectSurah: (id: number) => void;
  onOpenMushaf: (page: number) => void;
  onOpenSettings: () => void;
}

export function HomePage({ onNavigate, onSelectSurah, onOpenMushaf, onOpenSettings }: HomePageProps) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const { chapters } = useQuranData();
  const [activeGoal, setActiveGoal] = useState<KhatmahGoal | null>(null);
  const [bookmarks, setBookmarks] = useState<VerseBookmark[]>([]);
  const [comments, setComments] = useState<(KhatmahComment & { profiles?: Profile | null })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [showAuth, setShowAuth] = useState(false);

  // Load active goal
  const loadGoal = useCallback(async () => {
    if (!user) { setActiveGoal(null); return; }
    const { data } = await supabase
      .from('khatmah_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveGoal(data as KhatmahGoal | null);
  }, [user]);

  // Load bookmarks
  const loadBookmarks = useCallback(async () => {
    if (!user) { setBookmarks([]); return; }
    const { data } = await supabase
      .from('verse_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setBookmarks((data as VerseBookmark[]) || []);
  }, [user]);

  // Load comments
  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('khatmah_comments')
      .select(`
        *,
        profiles:user_id (display_name, avatar_url)
      `)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(20);
    setComments((data as (KhatmahComment & { profiles?: Profile | null })[]) || []);
  }, []);

  useEffect(() => { loadGoal(); }, [loadGoal]);
  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);
  useEffect(() => { loadComments(); }, [loadComments]);

  const startGoal = async () => {
    if (!user) return;
    const pagesPerDay = Math.ceil(TOTAL_PAGES / selectedDays);
    const { data } = await supabase
      .from('khatmah_goals')
      .insert({
        user_id: user.id,
        target_days: selectedDays,
        start_page: 1,
        end_page: TOTAL_PAGES,
        current_page: 1,
      })
      .select('*')
      .maybeSingle();
    if (data) {
      setActiveGoal(data as KhatmahGoal);
      setShowGoalSetup(false);
      onOpenMushaf(1);
    }
  };

  const cancelGoal = async () => {
    if (!activeGoal || !user) return;
    await supabase
      .from('khatmah_goals')
      .update({ status: 'cancelled' })
      .eq('id', activeGoal.id);
    setActiveGoal(null);
  };

  const postComment = async () => {
    if (!user || !newComment.trim()) return;
    setCommentError(null);

    // Profanity check
    const { data: profanityResult } = await supabase.rpc('check_profanity', { input_text: newComment });
    if (profanityResult) {
      setCommentError(t('comment_flagged'));
      // Still insert but flagged
      await supabase.from('khatmah_comments').insert({
        user_id: user.id,
        content: newComment.trim(),
        is_flagged: true,
        flagged_reason: 'profanity_filter',
        is_hidden: true,
      });
      setNewComment('');
      loadComments();
      return;
    }

    const { data } = await supabase
      .from('khatmah_comments')
      .insert({
        user_id: user.id,
        content: newComment.trim(),
      })
      .select(`*, profiles:user_id (display_name, avatar_url)`)
      .maybeSingle();

    if (data) {
      setComments((prev) => [data as (KhatmahComment & { profiles?: Profile | null }), ...prev]);
      setNewComment('');
    }
  };

  const goalInfo = useMemo(() => {
    if (!activeGoal) return null;
    const elapsedDays = Math.floor((Date.now() - new Date(activeGoal.start_date).getTime()) / 86400000) + 1;
    const progressPercent = Math.round(((activeGoal.current_page - activeGoal.start_page) / (activeGoal.end_page - activeGoal.start_page)) * 100);
    const pagesPerDay = Math.ceil((activeGoal.end_page - activeGoal.start_page + 1) / activeGoal.target_days);
    const remainingDays = Math.max(activeGoal.target_days - elapsedDays + 1, 0);
    const remainingPages = Math.max(activeGoal.end_page - activeGoal.current_page, 0);
    const expectedPage = Math.min(activeGoal.start_page + (elapsedDays * pagesPerDay) - 1, activeGoal.end_page);
    const isOnTrack = activeGoal.current_page >= expectedPage;
    return { elapsedDays, progressPercent, pagesPerDay, remainingDays, remainingPages, expectedPage, isOnTrack };
  }, [activeGoal]);

  const featuredSurahs = useMemo(() => {
    const featured = [1, 18, 36, 55, 67, 78, 112, 114];
    return featured.map((id) => chapters.find((c) => c.id === id)).filter(Boolean);
  }, [chapters]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 p-8 text-center text-white sm:p-12">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="islamic-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                <circle cx="30" cy="30" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
          </svg>
        </div>
        <div className="relative">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <span className="font-quran text-4xl">۞</span>
          </div>
          <h1 className="font-quran text-4xl font-bold leading-tight sm:text-5xl">{t('app_name')}</h1>
          <p className="mt-3 text-sm text-primary-100 sm:text-base">{t('app_tagline')}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenMushaf(1)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-primary-700 transition-all hover:scale-105 hover:shadow-lg"
            >
              <BookOpen size={16} />
              {t('start_reading')}
            </button>
            <button
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <Search size={16} />
              {t('search')}
            </button>
          </div>
        </div>
      </div>

      {/* Khatmah Goal Section */}
      <div className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
          <Target size={16} className="text-gold-500" />
          {t('khatmah_goal')}
        </h2>

        {activeGoal && goalInfo ? (
          <div className="rounded-2xl border border-gold-300/40 bg-gradient-to-br from-warm-50 to-gold-50/30 p-5 dark:border-gold-800/30 dark:from-ink-900 dark:to-gold-950/10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gold-600 dark:text-gold-400" />
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">
                  {toArabicNumber(activeGoal.target_days)} {t('khatmah_days')}
                </span>
                {goalInfo.isOnTrack ? (
                  <span className="flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400">
                    <CheckCircle2 size={12} /> على المسار
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-gold-600 dark:text-gold-400">
                    <TrendingUp size={12} /> {t('khatmah_continue')}
                  </span>
                )}
              </div>
              <button onClick={cancelGoal} className="text-[11px] text-ink-400 hover:text-red-500">
                {t('khatmah_cancel')}
              </button>
            </div>

            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-ink-500 dark:text-ink-400">{t('khatmah_progress')}: {toArabicNumber(goalInfo.progressPercent)}%</span>
                <span className="text-ink-500 dark:text-ink-400">
                  {toArabicNumber(activeGoal.current_page)} / {toArabicNumber(activeGoal.end_page)} {t('page')}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-warm-200 dark:bg-ink-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-gold-500 transition-all duration-500"
                  style={{ width: `${goalInfo.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={<TrendingUp size={14} />} label={t('khatmah_pages_day')} value={toArabicNumber(goalInfo.pagesPerDay)} />
              <StatCard icon={<Clock size={14} />} label={t('khatmah_remaining_days')} value={toArabicNumber(goalInfo.remainingDays)} />
              <StatCard icon={<BookOpen size={14} />} label={t('page')} value={`${toArabicNumber(activeGoal.current_page)}`} />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onOpenMushaf(activeGoal.current_page)}
                className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-glow"
              >
                {t('khatmah_continue')} ← {t('page')} {toArabicNumber(activeGoal.current_page)}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-ink-400 dark:text-ink-500">
              {t('khatmah_day')} {toArabicNumber(goalInfo.elapsedDays)} / {toArabicNumber(activeGoal.target_days)} · {t('khatmah_daily_target')}: {toArabicNumber(goalInfo.pagesPerDay)} {t('pages')}
            </p>
          </div>
        ) : user ? (
          showGoalSetup ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
              <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">{t('khatmah_select_days')}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {KHATMAH_DURATIONS.map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedDays(days)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-3 transition-all ${
                      selectedDays === days
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/30'
                        : 'border-primary-200 bg-primary-50/50 hover:border-primary-400 dark:border-primary-800 dark:bg-primary-950/20'
                    }`}
                  >
                    <span className="font-quran text-lg font-bold text-primary-700 dark:text-primary-400">
                      {toArabicNumber(days)}
                    </span>
                    <span className="text-[10px] text-ink-500">{t('khatmah_days')}</span>
                    <span className="text-[9px] text-gold-600 dark:text-gold-400">
                      {toArabicNumber(Math.ceil(TOTAL_PAGES / days))} {t('page')}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowGoalSetup(false)}
                  className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm dark:border-ink-700"
                >
                  {t('back')}
                </button>
                <button
                  onClick={startGoal}
                  className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700"
                >
                  {t('khatmah_start')} →
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowGoalSetup(true)}
              className="w-full rounded-2xl border border-gold-300/40 bg-gradient-to-br from-warm-50 to-gold-50/30 p-5 text-center transition-all hover:shadow-soft dark:border-gold-800/30 dark:from-ink-900 dark:to-gold-950/10"
            >
              <Target size={28} className="mx-auto mb-2 text-gold-500" />
              <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{t('khatmah_start')}</p>
              <p className="mt-1 text-[11px] text-ink-400">{t('khatmah_select_days')}</p>
            </button>
          )
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="w-full rounded-2xl border border-ink-100 bg-white p-5 text-center transition-all hover:shadow-soft dark:border-ink-800 dark:bg-ink-900"
          >
            <Target size={28} className="mx-auto mb-2 text-gold-400" />
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {t('sign_in')} {t('khatmah_goal').toLowerCase()}
            </p>
          </button>
        )}
      </div>

      {/* Bookmarks */}
      {user && bookmarks.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
            <BookmarkIcon size={16} className="text-primary-500" />
            {t('bookmarks')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {bookmarks.map((bm) => {
              const color = BOOKMARK_COLORS.find((c) => c.key === bm.color);
              return (
                <button
                  key={bm.id}
                  onClick={() => onOpenMushaf(bm.page_number)}
                  className={`flex items-center gap-2 rounded-lg border ${color?.border || 'border-ink-200'} bg-white px-3 py-2 text-sm transition-all hover:shadow-soft dark:bg-ink-900 dark:border-ink-700`}
                >
                  <span className={`h-3 w-3 rounded-full ${color?.bg}`} />
                  <span className="font-quran text-primary-700 dark:text-primary-400">{verseKeyToArabic(bm.verse_key)}</span>
                  {bm.note && <span className="text-xs text-ink-400 truncate max-w-[100px]">{bm.note}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick access */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickCard icon={<BookOpen size={24} />} title={t('nav_surahs')} description={t('browse_surahs')} onClick={() => onNavigate('surahs')} />
        <QuickCard icon={<Library size={24} />} title={t('nav_juzs')} description={t('browse_juzs')} onClick={() => onNavigate('juzs')} />
        <QuickCard icon={<Search size={24} />} title={t('nav_search')} description={t('search_quran_short')} onClick={() => onNavigate('search')} />
      </div>

      {/* Community comments */}
      <div className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
          <Users size={16} className="text-primary-500" />
          {t('comments')}
        </h2>
        <div className="rounded-2xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
          {user ? (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('comment_placeholder')}
                maxLength={500}
                className="flex-1 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                onKeyDown={(e) => { if (e.key === 'Enter') postComment(); }}
              />
              <button
                onClick={postComment}
                disabled={!newComment.trim()}
                className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {t('comment_post')}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} className="mb-4 block w-full text-center text-xs text-primary-600 hover:underline dark:text-primary-400">
              {t('sign_in')} {t('comments').toLowerCase()}
            </button>
          )}

          {commentError && (
            <p className="mb-3 text-xs text-red-500">{commentError}</p>
          )}

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-400">{t('no_results')}</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 rounded-xl bg-warm-50 p-3 dark:bg-ink-800/50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      (c.profiles?.display_name || '؟').charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-ink-700 dark:text-ink-300">
                        {c.profiles?.display_name || 'مستخدم'}
                      </span>
                      <span className="text-[10px] text-ink-400">
                        {new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-400 break-words">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Featured surahs */}
      {featuredSurahs.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
            <Sparkles size={16} className="text-gold-500" />
            {t('featured_surahs')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {featuredSurahs.map((ch) => ch && (
              <button
                key={ch.id}
                onClick={() => onSelectSurah(ch.id)}
                className="group rounded-xl border border-ink-100 bg-white p-4 text-center transition-all hover:border-primary-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-700"
              >
                <div className="mb-2 font-quran text-lg font-bold text-primary-700 dark:text-primary-400">
                  {ch.name_arabic}
                </div>
                <div className="text-[11px] text-ink-400 dark:text-ink-500">
                  {REVELATION_PLACE_LABEL[ch.revelation_place]?.[lang] || REVELATION_PLACE_LABEL[ch.revelation_place]?.ar} · {toArabicNumber(ch.verses_count)} {t('verses')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-24" />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 p-3 text-center dark:bg-ink-800/60">
      <div className="mb-1 flex items-center justify-center text-primary-500 dark:text-primary-400">{icon}</div>
      <div className="font-quran text-lg font-bold text-ink-800 dark:text-ink-100">{value}</div>
      <div className="text-[10px] text-ink-400 dark:text-ink-500">{label}</div>
    </div>
  );
}

function QuickCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 text-right transition-all hover:border-primary-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-700"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 transition-all group-hover:from-primary-600 group-hover:to-primary-800 group-hover:text-white dark:from-primary-900/40 dark:to-primary-800/40 dark:text-primary-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-ink-800 dark:text-ink-100">{title}</div>
        <div className="text-xs text-ink-400 dark:text-ink-500">{description}</div>
      </div>
      <ChevronLeft size={20} className="mr-auto text-ink-300 transition-transform group-hover:-translate-x-1 group-hover:text-primary-500" />
    </button>
  );
}
