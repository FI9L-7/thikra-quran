import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import type { SearchResponse } from '@/types';
import { searchQuran } from '@/api';
import { useQuranData } from '@/contexts/QuranDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { toArabicNumber, verseKeyToArabic } from '@/constants';

interface SearchPageProps {
  onSelectVerse: (chapterId: number, verseKey: string) => void;
}

export function SearchPage({ onSelectVerse }: SearchPageProps) {
  const { t } = useI18n();
  const { chapters } = useQuranData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await searchQuran(q.trim(), 0, 25);
      setResults(res);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query), 500);
    } else {
      setResults(null);
      setSearched(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const getChapterName = (verseKey: string): string => {
    const chapterId = parseInt(verseKey.split(':')[0]);
    const ch = chapters.find((c) => c.id === chapterId);
    return ch?.name_arabic || `سورة ${chapterId}`;
  };

  const renderHighlightedText = (result: { words: { char_type: string; text: string; highlight?: boolean }[] }) => {
    return result.words.map((word, i) => {
      if (word.char_type === 'end') return null;
      return (
        <span
          key={i}
          className={word.highlight ? 'rounded bg-gold-200/60 px-0.5 font-medium text-gold-800 dark:bg-gold-700/30 dark:text-gold-300' : ''}
        >
          {word.text}{' '}
        </span>
      );
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Search header */}
      <div className="mb-6">
        <h1 className="mb-1 font-quran text-2xl font-bold text-primary-700 dark:text-primary-400">{t('search_quran')}</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400">{t('search_hint')}</p>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          autoFocus
          className="w-full rounded-xl border border-ink-200 bg-white py-3.5 pr-11 pl-11 text-base text-ink-800 outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:focus:ring-primary-800"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setSearched(false); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Results count */}
      {results && (
        <div className="mb-4 text-xs text-ink-500 dark:text-ink-400">
          {toArabicNumber(results.total_results)} {t('search_results')}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-ink-500 dark:text-ink-400">
          <Loader2 size={20} className="animate-spin text-primary-500" />
          <span className="text-sm">{t('loading')}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="py-12 text-center text-sm text-red-500">{error}</div>
      )}

      {/* Results */}
      {!loading && results && results.results.length > 0 && (
        <div className="space-y-2">
          {results.results.map((result) => {
            const chapterId = parseInt(result.verse_key.split(':')[0]);
            return (
              <button
                key={result.verse_key}
                onClick={() => onSelectVerse(chapterId, result.verse_key)}
                className="group w-full rounded-xl border border-ink-100 bg-white p-4 text-right transition-all hover:border-primary-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900 dark:hover:border-primary-700"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      <BookOpen size={14} />
                    </div>
                    <span className="text-sm font-medium text-ink-700 dark:text-ink-300">
                      {getChapterName(result.verse_key)}
                    </span>
                    <span className="text-xs text-ink-400 dark:text-ink-500">
                      {verseKeyToArabic(result.verse_key)}
                    </span>
                  </div>
                  <ArrowLeft size={16} className="text-ink-300 transition-transform group-hover:-translate-x-1 group-hover:text-primary-500" />
                </div>
                <p className="font-quran text-lg leading-relaxed text-ink-900 dark:text-ink-100">
                  {renderHighlightedText(result)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!loading && searched && results && results.results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="text-4xl opacity-30">۞</div>
          <p className="text-sm text-ink-500 dark:text-ink-400">{t('no_results')}</p>
        </div>
      )}

      {/* Initial state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950/30">
            <Search size={28} className="text-primary-400" />
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400">{t('search_hint')}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {['الرحمن', 'الجنة', 'الصبر', 'العلم'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm text-primary-700 transition-all hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-950/20 dark:text-primary-400"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="h-24" />
    </div>
  );
}
