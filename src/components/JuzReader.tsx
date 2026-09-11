import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Play, Loader2, Settings, Library } from 'lucide-react';
import type { Verse, AudioFile } from '@/types';
import { fetchVersesByChapter, fetchAudioByChapter } from '@/api';
import { useI18n } from '@/contexts/I18nContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useQuranData } from '@/contexts/QuranDataContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LoadingScreen, ErrorState } from '@/components/ui';
import { toArabicNumber, verseKeyToArabic, REVELATION_PLACE_LABEL } from '@/constants';

interface JuzReaderProps {
  juzNumber: number;
  onBack: () => void;
}

interface JuzSegment {
  chapterId: number;
  startAyah: number;
  endAyah: number;
}

export function JuzReader({ juzNumber, onBack }: JuzReaderProps) {
  const { t, lang } = useI18n();
  const { juzs, chapters } = useQuranData();
  const { reciterId, loadChapter, currentVerseIndex, isPlaying, verses: playerVerses, playVerse } = useAudioPlayer();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationId] = useLocalStorage<number | null>('zikra-translation', 149);
  const [fontSize] = useLocalStorage<'sm' | 'md' | 'lg'>('quran-font-size', 'md');
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const juz = juzs.find((j) => j.juz_number === juzNumber);

  const isPlayerActive = playerVerses.length > 0 && playerVerses[0]?.juz_number === juzNumber;

  const segments: JuzSegment[] = juz
    ? Object.entries(juz.verse_mapping).map(([chId, range]) => {
        const [start, end] = range.split('-').map(Number);
        return { chapterId: Number(chId), startAyah: start, endAyah: end };
      })
    : [];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allVerses: Verse[] = [];
      const allAudio: AudioFile[] = [];

      for (const seg of segments) {
        // Fetch all verses for the chapter, then filter by ayah range
        let page = 1;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { verses: chapterVerses, pagination } = await fetchVersesByChapter(seg.chapterId, page, 50, translationId);
          const filtered = chapterVerses.filter(
            (v: Verse) => v.verse_number >= seg.startAyah && v.verse_number <= seg.endAyah
          );
          allVerses.push(...filtered);
          if (!pagination.next_page) break;
          page = pagination.next_page;
          if (chapterVerses[chapterVerses.length - 1]?.verse_number > seg.endAyah) break;
        }

        // Fetch audio for this chapter
        try {
          const audio = await fetchAudioByChapter(reciterId, seg.chapterId);
          const filteredAudio = audio.filter((a) => {
            const [chStr, ayahStr] = a.verse_key.split(':');
            const ayah = parseInt(ayahStr);
            const ch = parseInt(chStr);
            return ch === seg.chapterId && ayah >= seg.startAyah && ayah <= seg.endAyah;
          });
          allAudio.push(...filteredAudio);
        } catch {
          // ignore audio errors
        }
      }

      setVerses(allVerses);
      setAudioFiles(allAudio);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load juz');
      setLoading(false);
    }
  }, [juzNumber, translationId, reciterId, segments.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Scroll to current verse when playing
  useEffect(() => {
    if (isPlayerActive && currentVerseIndex >= 0) {
      const el = verseRefs.current[currentVerseIndex];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentVerseIndex, isPlayerActive]);

  const handlePlayVerse = useCallback((index: number) => {
    if (audioFiles.length === 0) return;
    if (isPlayerActive) {
      playVerse(index);
    } else {
      loadChapter(verses, audioFiles, juzNumber, index);
      setTimeout(() => playVerse(index), 100);
    }
  }, [audioFiles, verses, juzNumber, isPlayerActive, loadChapter, playVerse]);

  const handlePlayAll = useCallback(() => {
    if (audioFiles.length === 0 || verses.length === 0) return;
    loadChapter(verses, audioFiles, juzNumber, 0);
    setTimeout(() => playVerse(0), 100);
  }, [audioFiles, verses, juzNumber, loadChapter, playVerse]);

  if (loading) return <LoadingScreen message={`${t('loading_juz')} ${toArabicNumber(juzNumber)}...`} />;
  if (error) return <ErrorState message={`${t('error_occurred')}: ${error}`} onRetry={loadData} />;
  if (verses.length === 0) return <ErrorState message={t('no_results')} />;

  const fontClass = fontSize === 'sm' ? 'text-xl leading-loose' : fontSize === 'lg' ? 'text-3xl leading-[2.8]' : 'text-2xl leading-[2.6]';

  let lastChapterId = 0;

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
      </div>

      {/* Juz header */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-gold-300/40 bg-gradient-to-br from-warm-50 to-primary-50/30 p-6 text-center dark:border-gold-800/30 dark:from-ink-900 dark:to-primary-950/20">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-glow">
          <Library size={24} />
        </div>
        <h1 className="font-quran text-3xl font-bold text-primary-800 dark:text-primary-300">{t('juz')} {toArabicNumber(juzNumber)}</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {toArabicNumber(verses.length)} {t('verses')} · {toArabicNumber(segments.length)} {t('surahs')}
        </p>
        {audioFiles.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-glow"
          >
            <Play size={16} fill="currentColor" />
            {t('play_juz')}
          </button>
        )}
      </div>

      {/* Verses */}
      <div className="space-y-1">
        {verses.map((verse, index) => {
          const chapterId = parseInt(verse.verse_key.split(':')[0]);
          const showChapterHeader = chapterId !== lastChapterId;
          lastChapterId = chapterId;
          const chapter = chapters.find((c) => c.id === chapterId);
          const isCurrent = isPlayerActive && index === currentVerseIndex;

          return (
            <div key={verse.id + '-' + index}>
              {showChapterHeader && (
                <div className="mt-6 mb-2 flex items-center gap-3 border-b border-primary-100 pb-2 dark:border-primary-900/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <span className="font-quran text-sm font-bold text-primary-700 dark:text-primary-400">
                      {toArabicNumber(chapterId)}
                    </span>
                  </div>
                  <span className="font-quran text-lg font-bold text-primary-700 dark:text-primary-400">
                    {chapter?.name_arabic || `سورة ${chapterId}`}
                  </span>
                  {chapter && (
                    <span className="text-[11px] text-ink-400 dark:text-ink-500">
                      {REVELATION_PLACE_LABEL[chapter.revelation_place]?.[lang] || REVELATION_PLACE_LABEL[chapter.revelation_place]?.ar}
                    </span>
                  )}
                </div>
              )}
              <div
                ref={(el) => { verseRefs.current[index] = el; }}
                className={`group relative rounded-xl p-4 transition-all ${
                  isCurrent
                    ? 'ayah-highlight ring-1 ring-primary-400/30'
                    : 'hover:bg-warm-50/60 dark:hover:bg-ink-900/40'
                }`}
              >
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
                    {verse.translations && verse.translations.length > 0 && verse.translations[0].text && (
                      <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                        {verse.translations[0].text}
                      </p>
                    )}
                  </div>
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
            </div>
          );
        })}
      </div>

      <div className="h-24" />
    </div>
  );
}
