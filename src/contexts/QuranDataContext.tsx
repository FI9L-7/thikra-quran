import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Chapter, Reciter, Juz } from '@/types';
import { fetchChapters, fetchReciters, fetchJuzs } from '@/api';
import { RECITERS } from '@/constants';

interface QuranDataContextValue {
  chapters: Chapter[];
  reciters: Reciter[];
  juzs: Juz[];
  loading: boolean;
  error: string | null;
}

const QuranDataContext = createContext<QuranDataContextValue | undefined>(undefined);

export function QuranDataProvider({ children }: { children: ReactNode }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>(RECITERS);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chs, recs, jzs] = await Promise.all([
          fetchChapters(),
          fetchReciters().catch(() => RECITERS),
          fetchJuzs(),
        ]);
        if (cancelled) return;
        setChapters(chs);
        setReciters(recs);
        setJuzs(jzs);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load data');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <QuranDataContext.Provider value={{ chapters, reciters, juzs, loading, error }}>
      {children}
    </QuranDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useQuranData(): QuranDataContextValue {
  const ctx = useContext(QuranDataContext);
  if (!ctx) throw new Error('useQuranData must be used within QuranDataProvider');
  return ctx;
}
