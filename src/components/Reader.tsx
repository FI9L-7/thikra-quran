import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Play, Loader2, Settings, BookOpen, Sparkles } from 'lucide-react';
import type { Chapter, Verse, AudioFile } from '@/types';
import { fetchChapter, fetchAllVersesByChapter, fetchAudioByChapter } from '@/api';
import { useI18n } from '@/contexts/I18nContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LoadingScreen, ErrorState } from '@/components/ui';
import { TRANSLATIONS, REVELATION_PLACE_LABEL, toArabicNumber, verseKeyToArabic } from '@/constants';

interface ReaderProps {
  chapterId: number;
  onBack: () => void;
}

export function Reader({ chapterId, onBack }: ReaderProps) {
  const { t, lang } = useI18n();
  const { reciterId, loadChapter, currentVerseIndex, isPlaying, verses: playerVerses, playVerse } = useAudioPlayer();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationId, setTranslationId] = useLocalStorage<number | null>('zikra-translation', 149);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useLocalStorage<'sm' | 'md' | 'lg'>('quran-font-size', 'md');
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Save last read position
  const [lastRead, setLastRead] = useLocalStorage<{ chapterId: number; verseKey: string; verseNumber: number; timestamp: number } | null>('quran-last-read', null);

  const isPlayerActive = playerVerses.length > 0 && playerVerses[0]?.verse_key?.split(':')[0] === String(chapterId);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ch, vs, audio] = await Promise.all([
        fetchChapter(chapterId),
        fetchAllVersesByChapter(chapterId, translationId),
        fetchAudioByChapter(reciterId, chapterId).catch(() => [] as AudioFile[]),
      ]);
      setChapter(ch);
      setVerses(vs);
      setAudioFiles(audio);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chapter');
      setLoading(false);
    }
  }, [chapterId, translationId, reciterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save last read when player verse changes
  useEffect(() => {
    if (isPlayerActive && playerVerses[currentVerseIndex]) {
      const v = playerVerses[currentVerseIndex];
      setLastRead({
        chapterId,
        verseKey: v.verse_key,
        verseNumber: v.verse_number,
        timestamp: Date.now(),
      });
    }
  }, [currentVerseIndex, isPlayerActive, playerVerses, chapterId, setLastRead]);

  // Scroll to current verse when playing
  useEffect(() => {
    if (isPlayerActive && currentVerseIndex >= 0) {
      const el = verseRefs.current[currentVerseIndex];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentVerseIndex, isPlayerActive]);

  const handlePlayVerse = useCallback((index: number) => {
    if (audioFiles.length === 0) return;
    if (isPlayerActive) {
      playVerse(index);
    } else {
      loadChapter(verses, audioFiles, chapterId, index);
      // Auto-start playing after load
      setTimeout(() => playVerse(index), 100);
    }
  }, [audioFiles, verses, chapterId, isPlayerActive, loadChapter, playVerse]);

  const handlePlayAll = useCallback(() => {
    if (audioFiles.length === 0 || verses.length === 0) return;
    loadChapter(verses, audioFiles, chapterId, 0);
    setTimeout(() => playVerse(0), 100);
  }, [audioFiles, verses, chapterId, loadChapter, playVerse]);

  if (loading) return <LoadingScreen message={t('loading_verses')} />;
  if (error) return <ErrorState message={`${t('error_occurred')}: ${error}`} onRetry={loadData} />;
  if (!chapter || verses.length === 0) return <ErrorState message={t('no_results')} />;

  const fontClass = fontSize === 'sm' ? 'text-xl leading-loose' : fontSize === 'lg' ? 'text-3xl leading-[2.8]' : 'text-2xl leading-[2.6]';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
        >
          <ArrowRight size={18} />
          {t('back')}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
            aria-label="الإعدادات"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-6 animate-slide-down rounded-xl border border-primary-200 bg-white p-4 shadow-soft dark:border-primary-800 dark:bg-ink-900">
          <div className="space-y-4">
            {/* Translation selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">الترجمة</label>
              <select
                value={translationId ?? ''}
                onChange={(e) => setTranslationId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              >
                {TRANSLATIONS.map((t) => (
                  <option key={t.id ?? 'none'} value={t.id ?? ''}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Font size */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">حجم الخط</label>
              <div className="flex gap-2">
                {([
                  { key: 'sm', label: 'صغير' },
                  { key: 'md', label: 'متوسط' },
                  { key: 'lg', label: 'كبير' },
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
          </div>
        </div>
      )}

      {/* Chapter header card */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gold-300/40 bg-gradient-to-br from-warm-50 to-primary-50/30 p-6 text-center dark:border-gold-800/30 dark:from-ink-900 dark:to-primary-950/20">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-glow">
          <span className="font-quran text-2xl">{toArabicNumber(chapter.id)}</span>
        </div>
        <h1 className="font-quran text-3xl font-bold text-primary-800 dark:text-primary-300">{chapter.name_arabic}</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {chapter.translated_name?.name} · {REVELATION_PLACE_LABEL[chapter.revelation_place]?.[lang] || REVELATION_PLACE_LABEL[chapter.revelation_place]?.ar}
          · {toArabicNumber(chapter.verses_count)} {t('verses')}
        </p>

        {/* Play all button */}
        {audioFiles.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-glow"
          >
            <Play size={16} fill="currentColor" />
            {t('play_all')}
          </button>
        )}
        {audioFiles.length === 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gold-600 dark:text-gold-400">
            <Loader2 size={14} className="animate-spin" />
            {t('loading_audio')}
          </div>
        )}
      </div>

      {/* Bismillah (if applicable) */}
      {chapter.bismillah_pre && (
        <div className="mb-6 text-center">
          <p className="font-quran text-2xl text-primary-700 dark:text-primary-400">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}

      {/* Verses */}
      <div className="space-y-1">
        {verses.map((verse, index) => {
          const isCurrent = isPlayerActive && index === currentVerseIndex;
          return (
            <div
              key={verse.id}
              ref={(el) => { verseRefs.current[index] = el; }}
              className={`group relative rounded-xl p-4 transition-all ${
                isCurrent
                  ? 'ayah-highlight ring-1 ring-primary-400/30'
                  : 'hover:bg-warm-50/60 dark:hover:bg-ink-900/40'
              }`}
            >
              {/* Verse text */}
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className={`font-quran ${fontClass} text-ink-900 dark:text-ink-100`}>
                    {verse.text_uthmani}
                    <span className="mr-2 inline-flex items-center justify-center text-base font-normal text-primary-600 dark:text-primary-400">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary-300 bg-primary-50 text-xs dark:border-primary-700 dark:bg-primary-900/30">
                        {toArabicNumber(verse.verse_number)}
                      </span>
                    </span>
                  </p>

                  {/* Translation */}
                  {verse.translations && verse.translations.length > 0 && verse.translations[0].text && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                      {verse.translations[0].text}
                    </p>
                  )}
                </div>

                {/* Play button */}
                {audioFiles.length > 0 && (
                  <button
                    onClick={() => handlePlayVerse(index)}
                    className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                      isCurrent && isPlaying
                        ? 'bg-primary-600 text-white shadow-glow'
                        : 'text-primary-500 opacity-0 hover:bg-primary-100 group-hover:opacity-100 dark:hover:bg-primary-900/30'
                    }`}
                    aria-label={`تشغيل الآية ${verseKeyToArabic(verse.verse_key)}`}
                  >
                    {isCurrent && isPlaying ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Play size={16} fill="currentColor" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50/50 p-4 text-center dark:border-primary-900/20 dark:bg-primary-950/20">
        <Sparkles size={16} className="text-gold-500" />
        <span className="text-xs text-ink-500 dark:text-ink-400">
          {t('sadaqah_jariyah')}
        </span>
      </div>

      {/* Bottom padding for audio bar */}
      <div className="h-24" />
    </div>
  );
}
