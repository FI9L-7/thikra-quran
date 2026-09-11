import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, ArrowLeft, Play, Loader2, Settings, BookOpen,
  Bookmark, X, ChevronLeft, ChevronRight, BookMarked
} from 'lucide-react';
import type { Verse, AudioFile } from '@/types';
import { fetchPageWithAudio, fetchTafsir } from '@/api';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useQuranData } from '@/contexts/QuranDataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { supabase } from '@/lib/supabase';
import type { KhatmahGoal, VerseBookmark } from '@/lib/supabase';
import { LoadingScreen, ErrorState } from '@/components/ui';
import {
  TRANSLATIONS, TAFSIRS, REVELATION_PLACE_LABEL, toArabicNumber,
  verseKeyToArabic, BOOKMARK_COLORS, TOTAL_PAGES, type BookmarkColor
} from '@/constants';

interface MushafReaderProps {
  initialPage: number;
  onBack: () => void;
}

export function MushafReader({ initialPage, onBack }: MushafReaderProps) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const { chapters, reciters, reciterId, setReciterId } = useQuranDataFromReader();
  const audioPlayer = useAudioPlayer();
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationId, setTranslationId] = useLocalStorage<number | null>('zikra-translation', 149);
  const [tafsirId, setTafsirId] = useLocalStorage<number>('zikra-tafsir', 91);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useLocalStorage<'sm' | 'md' | 'lg' | 'xl'>('zikra-font-size', 'lg');
  const [showTranslation, setShowTranslation] = useLocalStorage<boolean>('zikra-show-translation', true);
  const [bookmarks, setBookmarks] = useState<VerseBookmark[]>([]);
  const [bookmarkModalVerse, setBookmarkModalVerse] = useState<Verse | null>(null);
  const [tafsirModal, setTafsirModal] = useState<{ verse: Verse; text: string; loading: boolean } | null>(null);
  const [activeGoal, setActiveGoal] = useState<KhatmahGoal | null>(null);
  const [showFinishDay, setShowFinishDay] = useState(false);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const isPlayerActive = audioPlayer.verses.length > 0 &&
    verses.some((v) => v.page_number === pageNumber) &&
    audioPlayer.chapterId === pageNumber;

  // Load goal
  useEffect(() => {
    if (!user) return;
    supabase
      .from('khatmah_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setActiveGoal(data as KhatmahGoal | null);
      });
  }, [user]);

  // Load bookmarks for this page
  useEffect(() => {
    if (!user) { setBookmarks([]); return; }
    supabase
      .from('verse_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('page_number', pageNumber)
      .then(({ data }) => {
        setBookmarks((data as VerseBookmark[]) || []);
      });
  }, [user, pageNumber]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { verses: vs, audioFiles: af } = await fetchPageWithAudio(
        pageNumber,
        reciterId,
        translationId
      );
      setVerses(vs);
      setAudioFiles(af);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load page');
      setLoading(false);
    }
  }, [pageNumber, reciterId, translationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update goal current page
  useEffect(() => {
    if (activeGoal && user && pageNumber >= activeGoal.start_page && pageNumber <= activeGoal.end_page) {
      supabase
        .from('khatmah_goals')
        .update({ current_page: pageNumber })
        .eq('id', activeGoal.id)
        .then(() => {
          setActiveGoal({ ...activeGoal, current_page: pageNumber });
        });
    }
  }, [pageNumber, activeGoal, user]);

  const handlePlayPage = useCallback(() => {
    if (audioFiles.length === 0 || verses.length === 0) return;
    audioPlayer.loadChapter(verses, audioFiles, pageNumber, 0);
    setTimeout(() => audioPlayer.playVerse(0), 100);
  }, [audioFiles, verses, pageNumber, audioPlayer]);

  const handlePlayVerse = useCallback((index: number) => {
    if (audioFiles.length === 0) return;
    if (isPlayerActive) {
      audioPlayer.playVerse(index);
    } else {
      audioPlayer.loadChapter(verses, audioFiles, pageNumber, index);
      setTimeout(() => audioPlayer.playVerse(index), 100);
    }
  }, [audioFiles, verses, pageNumber, isPlayerActive, audioPlayer]);

  const goToPage = (p: number) => {
    if (p < 1 || p > TOTAL_PAGES) return;
    setPageNumber(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addBookmark = async (verse: Verse, color: BookmarkColor, note: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('verse_bookmarks')
      .insert({
        user_id: user.id,
        verse_key: verse.verse_key,
        page_number: verse.page_number,
        color,
        note: note || null,
      })
      .select('*')
      .maybeSingle();
    if (data) {
      setBookmarks((prev) => [...prev, data as VerseBookmark]);
    }
    setBookmarkModalVerse(null);
  };

  const removeBookmark = async (bookmarkId: string) => {
    if (!user) return;
    await supabase.from('verse_bookmarks').delete().eq('id', bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  const openTafsir = async (verse: Verse) => {
    setTafsirModal({ verse, text: '', loading: true });
    const result = await fetchTafsir(tafsirId, verse.verse_key);
    setTafsirModal({ verse, text: result?.text || 'لا يوجد تفسير متاح', loading: false });
  };

  const markDayDone = async () => {
    if (!activeGoal || !user) return;
    const today = new Date().toISOString().split('T')[0];
    const pagesRead = pageNumber - activeGoal.current_page + 1;
    if (pagesRead <= 0) { setShowFinishDay(false); return; }

    // Check if already logged today
    const { data: existing } = await supabase
      .from('khatmah_daily_log')
      .select('*')
      .eq('goal_id', activeGoal.id)
      .eq('log_date', today)
      .maybeSingle();

    if (existing) {
      // Update existing log
      await supabase
        .from('khatmah_daily_log')
        .update({ to_page: pageNumber, pages_read: pageNumber - activeGoal.start_page + 1 })
        .eq('id', existing.id);
    } else {
      await supabase.from('khatmah_daily_log').insert({
        goal_id: activeGoal.id,
        user_id: user.id,
        log_date: today,
        from_page: activeGoal.current_page,
        to_page: pageNumber,
        pages_read: pagesRead,
      });
    }

    // Update goal current page
    const isComplete = pageNumber >= activeGoal.end_page;
    await supabase
      .from('khatmah_goals')
      .update({
        current_page: pageNumber,
        status: isComplete ? 'completed' : 'active',
        completed_at: isComplete ? new Date().toISOString() : null,
      })
      .eq('id', activeGoal.id);

    setActiveGoal((prev) => prev ? {
      ...prev,
      current_page: pageNumber,
      status: isComplete ? 'completed' : 'active',
    } : null);
    setShowFinishDay(false);
  };

  if (loading) return <LoadingScreen message={`${t('loading')} ${t('page')} ${toArabicNumber(pageNumber)}...`} />;
  if (error) return <ErrorState message={`${t('error_occurred')}: ${error}`} onRetry={loadData} />;
  if (verses.length === 0) return <ErrorState message="لم يتم العثور على بيانات" />;

  const fontClass = {
    sm: 'text-xl leading-loose',
    md: 'text-2xl leading-[2.6]',
    lg: 'text-3xl leading-[2.8]',
    xl: 'text-4xl leading-[3.0]',
  }[fontSize];

  const firstChapterId = parseInt(verses[0].verse_key.split(':')[0]);
  const chapter = chapters.find((c) => c.id === firstChapterId);

  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
        >
          <ArrowRight size={18} />
          {t('back')}
        </button>

        <div className="flex items-center gap-2">
          {/* Page jump */}
          <div className="flex items-center gap-1">
            <input
              ref={pageInputRef}
              type="number"
              min={1}
              max={TOTAL_PAGES}
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-center text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            />
            <span className="text-xs text-ink-400">/ {toArabicNumber(TOTAL_PAGES)}</span>
          </div>

          <button
            onClick={() => setShowSettings((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
            aria-label={t('settings')}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 animate-slide-down rounded-xl border border-primary-200 bg-white p-4 shadow-soft dark:border-primary-800 dark:bg-ink-900">
          <div className="space-y-4">
            {/* Reciter */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">{t('reciter')}</label>
              <select
                value={reciterId}
                onChange={(e) => setReciterId(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                {reciters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.translated_name?.name || r.reciter_name}{r.style ? ` (${r.style})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Translation */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">{t('translation')}</label>
              <select
                value={translationId ?? ''}
                onChange={(e) => setTranslationId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                {TRANSLATIONS.map((tr) => (
                  <option key={tr.id ?? 'none'} value={tr.id ?? ''}>{tr.name} ({tr.lang})</option>
                ))}
              </select>
            </div>

            {/* Tafsir */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">{t('tafsir')}</label>
              <select
                value={tafsirId}
                onChange={(e) => setTafsirId(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                {TAFSIRS.map((tf) => (
                  <option key={tf.id} value={tf.id}>{tf.name}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">{t('font_size')}</label>
              <div className="flex gap-2">
                {([
                  { key: 'sm', label: t('font_small') },
                  { key: 'md', label: t('font_medium') },
                  { key: 'lg', label: t('font_large') },
                  { key: 'xl', label: 'XL' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFontSize(key)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      fontSize === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show/Hide translation */}
            <label className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
              <input
                type="checkbox"
                checked={showTranslation}
                onChange={(e) => setShowTranslation(e.target.checked)}
                className="accent-primary-600"
              />
              {t('translation')}
            </label>
          </div>
        </div>
      )}

      {/* Khatmah progress bar */}
      {activeGoal && (
        <div className="mb-4 rounded-xl border border-gold-300/40 bg-gradient-to-r from-warm-50 to-gold-50/30 p-3 dark:border-gold-800/30 dark:from-ink-900 dark:to-gold-950/10">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gold-700 dark:text-gold-400">
              {t('khatmah_goal')}: {toArabicNumber(activeGoal.target_days)} {t('khatmah_days')}
            </span>
            <span className="text-ink-500 dark:text-ink-400">
              {t('page')} {toArabicNumber(activeGoal.current_page)} / {toArabicNumber(activeGoal.end_page)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-warm-200 dark:bg-ink-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-gold-500 transition-all duration-500"
              style={{
                width: `${Math.round(((activeGoal.current_page - activeGoal.start_page) / (activeGoal.end_page - activeGoal.start_page)) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-ink-500 dark:text-ink-400">
              {t('khatmah_day')} {toArabicNumber(Math.floor((Date.now() - new Date(activeGoal.start_date).getTime()) / 86400000) + 1)} / {toArabicNumber(activeGoal.target_days)}
            </span>
            <button
              onClick={() => setShowFinishDay(true)}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('khatmah_mark_day_done')}
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-br from-primary-50 to-warm-50 p-3 text-center dark:from-ink-900 dark:to-primary-950/20">
        <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
          {chapter && (
            <span className="font-quran text-sm font-bold text-primary-700 dark:text-primary-400">
              {chapter.name_arabic}
            </span>
          )}
        </div>
        <span className="font-quran text-lg font-bold text-primary-700 dark:text-primary-400">
          {toArabicNumber(pageNumber)}
        </span>
        <button
          onClick={handlePlayPage}
          disabled={audioFiles.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50"
        >
          {audioPlayer.isPlaying && isPlayerActive ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          {t('play_all')}
        </button>
      </div>

      {/* Verses - flowing like a Mushaf */}
      <div className="rounded-xl border border-warm-200 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        <p className={`font-quran ${fontClass} text-ink-900 dark:text-ink-100 text-justify`} style={{ lineHeight: fontSize === 'xl' ? 3.0 : fontSize === 'lg' ? 2.8 : 2.6 }}>
          {verses.map((verse, index) => {
            const isCurrent = isPlayerActive && index === audioPlayer.currentVerseIndex;
            const bookmark = bookmarks.find((b) => b.verse_key === verse.verse_key);
            const bookmarkColor = bookmark ? BOOKMARK_COLORS.find((c) => c.key === bookmark.color) : null;
            return (
              <span key={verse.id}>
                <span
                  className={`cursor-pointer transition-colors ${isCurrent ? 'bg-primary-200/60 rounded px-1 dark:bg-primary-700/30' : ''} ${bookmarkColor ? `${bookmarkColor.text} font-bold` : ''}`}
                  onClick={() => handlePlayVerse(index)}
                >
                  {verse.text_uthmani}
                </span>
                {/* Ayah number marker */}
                <span
                  className="mx-1 inline-flex items-center justify-center text-base font-normal text-primary-600 dark:text-primary-400 select-none"
                  title={verse.verse_key}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${bookmarkColor ? bookmarkColor.border : 'border-primary-300 dark:border-primary-700'} bg-primary-50 text-xs dark:bg-primary-900/30`}>
                    {toArabicNumber(verse.verse_number)}
                  </span>
                </span>{' '}
                {/* Action buttons - shown on hover via group */}
                {showTranslation && verse.translations && verse.translations[0]?.text && (
                  <span className="block text-sm leading-relaxed text-ink-500 dark:text-ink-400 mb-2 mt-1">
                    {verse.translations[0].text}
                    <button
                      onClick={() => openTafsir(verse)}
                      className="mr-2 text-[11px] text-gold-600 hover:underline dark:text-gold-400"
                    >
                      {t('tafsir')}
                    </button>
                    {user && (
                      <button
                        onClick={() => bookmark ? removeBookmark(bookmark.id) : setBookmarkModalVerse(verse)}
                        className="text-[11px] text-primary-600 hover:underline dark:text-primary-400"
                      >
                        <Bookmark size={10} className="inline" /> {bookmark ? t('bookmark_remove') : t('bookmark_add')}
                      </button>
                    )}
                  </span>
                )}
                {!showTranslation && user && (
                  <button
                    onClick={() => bookmark ? removeBookmark(bookmark.id) : setBookmarkModalVerse(verse)}
                    className="text-[11px] text-primary-600 opacity-0 hover:underline"
                  >
                    {bookmark ? t('bookmark_remove') : t('bookmark_add')}
                  </button>
                )}
              </span>
            );
          })}
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={() => goToPage(pageNumber - 1)}
          disabled={pageNumber <= 1}
          className="flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 transition-all hover:bg-primary-50 disabled:opacity-30 dark:border-primary-800 dark:bg-ink-900 dark:text-primary-400"
        >
          <ChevronRight size={18} />
          {t('prev_page')}
        </button>

        <span className="text-xs text-ink-400">
          {toArabicNumber(pageNumber)} / {toArabicNumber(TOTAL_PAGES)}
        </span>

        <button
          onClick={() => goToPage(pageNumber + 1)}
          disabled={pageNumber >= TOTAL_PAGES}
          className="flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-700 transition-all hover:bg-primary-50 disabled:opacity-30 dark:border-primary-800 dark:bg-ink-900 dark:text-primary-400"
        >
          {t('next_page')}
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Bookmark modal */}
      {bookmarkModalVerse && (
        <BookmarkModal
          verse={bookmarkModalVerse}
          onClose={() => setBookmarkModalVerse(null)}
          onAdd={addBookmark}
          t={t}
        />
      )}

      {/* Tafsir modal */}
      {tafsirModal && (
        <TafsirModal
          verse={tafsirModal.verse}
          text={tafsirModal.text}
          loading={tafsirModal.loading}
          onClose={() => setTafsirModal(null)}
          t={t}
        />
      )}

      {/* Finish day modal */}
      {showFinishDay && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowFinishDay(false)}>
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-4xl">✅</div>
            <h3 className="mb-2 font-bold text-ink-800 dark:text-ink-100">{t('day_completed')}</h3>
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
              {t('page')} {toArabicNumber(activeGoal.current_page)} → {toArabicNumber(pageNumber)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFinishDay(false)}
                className="flex-1 rounded-lg border border-ink-200 py-2 text-sm dark:border-ink-700"
              >
                {t('back')}
              </button>
              <button
                onClick={markDayDone}
                className="flex-1 rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('khatmah_mark_day_done')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}

// Helper hook to get reciterId/setReciterId from QuranDataContext
function useQuranDataFromReader() {
  const { chapters, reciters } = useQuranData();
  const [reciterId, setReciterId] = useLocalStorage<number>('zikra-reciter', 7);
  return { chapters, reciters, reciterId, setReciterId };
}

function BookmarkModal({
  verse, onClose, onAdd, t
}: {
  verse: Verse;
  onClose: () => void;
  onAdd: (verse: Verse, color: BookmarkColor, note: string) => void;
  t: (key: string) => string;
}) {
  const [color, setColor] = useState<BookmarkColor>('yellow');
  const [note, setNote] = useState('');
  const { lang } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-ink-800 dark:text-ink-100">{t('bookmark_add')}</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X size={18} /></button>
        </div>
        <p className="mb-4 font-quran text-lg text-primary-700 dark:text-primary-400">{verseKeyToArabic(verse.verse_key)}</p>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-ink-500">{t('bookmark_color')}</label>
          <div className="flex gap-2">
            {BOOKMARK_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => setColor(c.key)}
                className={`h-10 w-10 rounded-full ${c.bg} transition-all ${color === c.key ? 'ring-2 ring-offset-2 ring-ink-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                title={c.label[lang] || c.label.ar}
              />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-ink-500">{t('bookmark_note')}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            placeholder="..."
          />
        </div>

        <button
          onClick={() => onAdd(verse, color, note)}
          className="w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          {t('bookmark_add')}
        </button>
      </div>
    </div>
  );
}

function TafsirModal({
  verse, text, loading, onClose, t
}: {
  verse: Verse;
  text: string;
  loading: boolean;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-100 p-4 dark:border-ink-800">
          <div>
            <h3 className="font-bold text-ink-800 dark:text-ink-100">{t('tafsir')}</h3>
            <p className="font-quran text-sm text-primary-700 dark:text-primary-400">{verseKeyToArabic(verse.verse_key)}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X size={18} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-500" size={24} /></div>
          ) : (
            <div
              className="font-arabic text-sm leading-relaxed text-ink-700 dark:text-ink-300 [&_.arabic]:font-quran [&_.arabic]:text-base [&_.arabic]:text-primary-700 dark:[&_.arabic]:text-primary-400 [&_span]:text-ink-700 dark:[&_span]:text-ink-300"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
