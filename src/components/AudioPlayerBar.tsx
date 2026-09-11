import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, ChevronUp, Volume2, VolumeX } from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useQuranData } from '@/contexts/QuranDataContext';
import { toArabicNumber, verseKeyToArabic } from '@/constants';

export function AudioPlayerBar() {
  const {
    currentVerseIndex,
    isPlaying,
    isLoading,
    verses,
    reciterId,
    setReciterId,
    chapterId,
    toggle,
    next,
    prev,
    stop,
  } = useAudioPlayer();
  const { chapters, reciters } = useQuranData();
  const [showReciters, setShowReciters] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  if (verses.length === 0 || !chapterId) return null;

  const currentVerse = verses[currentVerseIndex];
  if (!currentVerse) return null;

  const chapter = chapters.find((c) => c.id === chapterId);
  const reciter = reciters.find((r) => r.id === reciterId);

  const handleVolume = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
    const audios = document.getElementsByTagName('audio');
    for (const a of audios) a.volume = v;
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    const v = newMuted ? 0 : volume || 1;
    const audios = document.getElementsByTagName('audio');
    for (const a of audios) a.volume = v;
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
      {/* Reciter dropdown */}
      {showReciters && (
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <div className="rounded-xl border border-primary-200 bg-white p-3 shadow-soft dark:border-primary-800 dark:bg-ink-900">
            <div className="mb-2 text-xs font-semibold text-ink-500 dark:text-ink-400">اختر القارئ</div>
            <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
              {reciters.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setReciterId(r.id);
                    setShowReciters(false);
                  }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-right text-sm transition-all ${
                    r.id === reciterId
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                      : 'text-ink-600 hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-ink-800'
                  }`}
                >
                  <span>{r.translated_name?.name || r.reciter_name}</span>
                  {r.style && <span className="text-[10px] opacity-60">{r.style}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main bar */}
      <div className="border-t border-primary-200 bg-white/95 glass dark:border-primary-900/40 dark:bg-ink-950/95">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          {/* Verse info */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 text-white">
              <span className="font-quran text-sm">{toArabicNumber(chapter?.id || 0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-quran text-sm font-bold text-ink-800 dark:text-ink-100">
                {chapter?.name_arabic} · {verseKeyToArabic(currentVerse.verse_key)}
              </div>
              <div className="truncate text-[11px] text-ink-500 dark:text-ink-400">
                {reciter?.translated_name?.name || reciter?.reciter_name || '—'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              disabled={currentVerseIndex === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-primary-50 disabled:opacity-30 dark:text-ink-400 dark:hover:bg-primary-900/20"
              aria-label="السابق"
            >
              <SkipBack size={18} className="rotate-180" />
            </button>

            <button
              onClick={toggle}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-glow transition-all hover:scale-105 hover:bg-primary-700 active:scale-95"
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : isPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="mr-0.5" />
              )}
            </button>

            <button
              onClick={next}
              disabled={currentVerseIndex >= verses.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-primary-50 disabled:opacity-30 dark:text-ink-400 dark:hover:bg-primary-900/20"
              aria-label="التالي"
            >
              <SkipForward size={18} className="rotate-180" />
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMute}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20 sm:flex"
              aria-label="كتم"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => handleVolume(parseFloat(e.target.value))}
              className="hidden w-20 accent-primary-600 sm:block"
            />

            <button
              onClick={() => setShowReciters((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
              aria-label="اختيار القارئ"
            >
              <ChevronUp size={18} className={showReciters ? 'rotate-180' : ''} />
            </button>

            <button
              onClick={stop}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-ink-400 dark:hover:bg-red-900/20"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
