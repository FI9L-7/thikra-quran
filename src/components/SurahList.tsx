import { useState, useMemo } from 'react';
import { BookOpen, MapPin, Search, X } from 'lucide-react';
import type { Chapter } from '@/types';
import { useQuranData } from '@/contexts/QuranDataContext';
import { LoadingScreen, ErrorState } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { REVELATION_PLACE_LABEL, toArabicNumber } from '@/constants';

interface SurahListProps {
  onSelectSurah: (id: number) => void;
}

export function SurahList({ onSelectSurah }: SurahListProps) {
  const { t, lang } = useI18n();
  const { chapters, loading, error } = useQuranData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'makkah' | 'madinah'>('all');

  const filtered = useMemo(() => {
    if (!chapters) return [];
    return chapters.filter((c) => {
      const matchesFilter = filter === 'all' || c.revelation_place === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.name_arabic.includes(q) ||
        c.name_simple.toLowerCase().includes(q) ||
        c.translated_name?.name?.includes(q) ||
        String(c.id) === q;
      return matchesFilter && matchesQuery;
    });
  }, [chapters, query, filter]);

  if (loading) return <LoadingScreen message={t('loading_chapters')} />;
  if (error) return <ErrorState message={`${t('error_occurred')}: ${error}`} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Search & Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن سورة بالاسم أو الرقم..."
            className="w-full rounded-xl border border-ink-200 bg-white py-3 pr-10 pl-10 text-sm text-ink-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-primary-800"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'الكل' },
            { key: 'makkah', label: 'مكية' },
            { key: 'madinah', label: 'مدنية' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                filter === key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="mb-4 text-xs text-ink-500 dark:text-ink-400">
        {toArabicNumber(filtered.length)} سورة
      </div>

      {/* List */}
      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((chapter) => (
          <SurahCard key={chapter.id} chapter={chapter} onClick={() => onSelectSurah(chapter.id)} lang={lang} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-ink-400 dark:text-ink-500">
          لا توجد نتائج مطابقة
        </div>
      )}
    </div>
  );
}

function SurahCard({ chapter, onClick, lang }: { chapter: Chapter; onClick: () => void; lang: string }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-3.5 text-right transition-all hover:border-primary-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-700"
    >
      {/* Number badge */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <svg viewBox="0 0 40 40" className="absolute inset-0 text-primary-200 group-hover:text-primary-400 dark:text-primary-800 dark:group-hover:text-primary-600 transition-colors" fill="currentColor">
          <path d="M20 0 L25 5 L32 5 L35 10 L40 15 L40 25 L35 30 L32 35 L25 35 L20 40 L15 35 L8 35 L5 30 L0 25 L0 15 L5 10 L8 5 L15 5 Z" />
        </svg>
        <span className="relative text-sm font-bold text-primary-700 dark:text-primary-300">
          {toArabicNumber(chapter.id)}
        </span>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate font-quran text-lg font-bold text-ink-800 dark:text-ink-100">
            {chapter.name_arabic}
          </span>
          <span className="text-xs text-ink-400 dark:text-ink-500">
            {chapter.translated_name?.name}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {REVELATION_PLACE_LABEL[chapter.revelation_place]?.[lang] || REVELATION_PLACE_LABEL[chapter.revelation_place]?.ar || chapter.revelation_place}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            {toArabicNumber(chapter.verses_count)} آية
          </span>
        </div>
      </div>

      {/* English name */}
      <div className="hidden shrink-0 text-left sm:block">
        <span className="text-xs font-medium text-ink-400 dark:text-ink-500">
          {chapter.name_simple}
        </span>
      </div>
    </button>
  );
}
