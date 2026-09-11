import { useMemo, useState } from 'react';
import { Library, Search, X, ChevronLeft } from 'lucide-react';
import { useQuranData } from '@/contexts/QuranDataContext';
import { LoadingScreen, ErrorState } from '@/components/ui';
import { toArabicNumber } from '@/constants';
import type { Juz } from '@/types';

interface JuzListProps {
  onSelectJuz: (juzNumber: number) => void;
}

export function JuzList({ onSelectJuz }: JuzListProps) {
  const { juzs, chapters, loading, error } = useQuranData();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!juzs) return [];
    return juzs.filter((j) => {
      const q = query.trim();
      if (!q) return true;
      return String(j.juz_number) === q || toArabicNumber(j.juz_number).includes(q);
    });
  }, [juzs, query]);

  if (loading) return <LoadingScreen message="جارٍ تحميل الأجزاء..." />;
  if (error) return <ErrorState message={`خطأ: ${error}`} />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 font-quran text-2xl font-bold text-primary-700 dark:text-primary-400">الأجزاء</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">تصفح القرآن الكريم حسب الأجزاء الثلاثين</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن جزء برقمه..."
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

      {/* Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((juz) => (
          <JuzCard key={juz.id} juz={juz} chapters={chapters} onClick={() => onSelectJuz(juz.juz_number)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-ink-400 dark:text-ink-500">لا توجد نتائج</div>
      )}
    </div>
  );
}

function JuzCard({ juz, chapters, onClick }: { juz: Juz; chapters: { id: number; name_arabic: string }[]; onClick: () => void }) {
  const surahIds = Object.keys(juz.verse_mapping).map(Number);
  const surahNames = surahIds
    .map((id) => chapters.find((c) => c.id === id)?.name_arabic)
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-4 text-right transition-all hover:border-primary-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-700"
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm">
        <span className="text-[10px] opacity-80">جزء</span>
        <span className="font-quran text-lg font-bold leading-none">{toArabicNumber(juz.juz_number)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink-700 dark:text-ink-300">
          {surahNames.join(' ← ')}
        </div>
        <div className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">
          {toArabicNumber(juz.verses_count)} آية · {toArabicNumber(surahIds.length)} سورة
        </div>
      </div>
      <ChevronLeft size={18} className="shrink-0 text-ink-300 transition-transform group-hover:-translate-x-1 group-hover:text-primary-500" />
    </button>
  );
}
