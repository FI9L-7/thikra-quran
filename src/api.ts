import type { Chapter, Verse, Reciter, AudioFile, Juz, SearchResult, SearchResponse } from '@/types';

const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://verses.quran.com';

export async function fetchChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_BASE}/chapters?language=ar&info=true`);
  if (!res.ok) throw new Error('Failed to fetch chapters');
  const data = await res.json();
  return data.chapters as Chapter[];
}

export async function fetchChapter(id: number): Promise<Chapter | null> {
  const res = await fetch(`${API_BASE}/chapters/${id}?language=ar&info=true`);
  if (!res.ok) throw new Error('Failed to fetch chapter');
  const data = await res.json();
  return data.chapter as Chapter;
}

export async function fetchVersesByPage(
  pageNumber: number,
  translationId: number | null = null
): Promise<Verse[]> {
  let url = `${API_BASE}/verses/by_page/${pageNumber}?words=false&fields=text_uthmani,verse_key,verse_number,page_number,juz_number,hizb_number,sajdah_number`;
  if (translationId) {
    url += `&translations=${translationId}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch verses by page');
  const data = await res.json();
  return data.verses as Verse[];
}

export async function fetchVersesByChapter(
  chapterId: number,
  page: number = 1,
  perPage: number = 50,
  translationId: number | null = null
): Promise<{ verses: Verse[]; pagination: { per_page: number; current_page: number; next_page: number | null; total_pages: number; total_records: number } }> {
  let url = `${API_BASE}/verses/by_chapter/${chapterId}?language=ar&words=false&fields=text_uthmani,verse_key,verse_number,page_number,juz_number,hizb_number,rub_el_hizb_number,ruku_number,manzil_number,sajdah_number&page=${page}&per_page=${perPage}`;
  if (translationId) {
    url += `&translations=${translationId}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch verses');
  const data = await res.json();
  return {
    verses: data.verses as Verse[],
    pagination: data.pagination,
  };
}

export async function fetchAllVersesByChapter(
  chapterId: number,
  translationId: number | null = null
): Promise<Verse[]> {
  const allVerses: Verse[] = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { verses, pagination } = await fetchVersesByChapter(chapterId, page, 50, translationId);
    allVerses.push(...verses);
    if (!pagination.next_page) break;
    page = pagination.next_page;
  }
  return allVerses;
}

export async function fetchReciters(): Promise<Reciter[]> {
  const res = await fetch(`${API_BASE}/resources/recitations?language=ar`);
  if (!res.ok) throw new Error('Failed to fetch reciters');
  const data = await res.json();
  return data.recitations as Reciter[];
}

export async function fetchAudioByChapter(recitationId: number, chapterId: number): Promise<AudioFile[]> {
  const res = await fetch(`${API_BASE}/recitations/${recitationId}/by_chapter/${chapterId}`);
  if (!res.ok) throw new Error('Failed to fetch audio');
  const data = await res.json();
  return data.audio_files as AudioFile[];
}

export async function fetchAudioByPage(recitationId: number, pageNumber: number): Promise<AudioFile[]> {
  const res = await fetch(`${API_BASE}/recitations/${recitationId}/by_page/${pageNumber}`);
  if (!res.ok) throw new Error('Failed to fetch audio by page');
  const data = await res.json();
  return data.audio_files as AudioFile[];
}

export function getAudioUrl(audioFile: AudioFile): string {
  return `${AUDIO_BASE}/${audioFile.url}`;
}

export async function fetchJuzs(): Promise<Juz[]> {
  const res = await fetch(`${API_BASE}/juzs`);
  if (!res.ok) throw new Error('Failed to fetch juzs');
  const data = await res.json();
  return (data.juzs as Juz[]).sort((a, b) => a.juz_number - b.juz_number);
}

export async function searchQuran(
  query: string,
  page: number = 0,
  size: number = 20
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&size=${size}&page=${page}`);
  if (!res.ok) throw new Error('Failed to search');
  const data = await res.json();
  const s = data.search;
  return {
    query: s.query,
    total_results: s.total_results,
    current_page: s.current_page,
    total_pages: s.total_pages,
    results: s.results as SearchResult[],
  };
}

export interface TafsirResult {
  resource_id: number;
  resource_name: string;
  text: string;
}

export async function fetchTafsir(tafsirId: number, verseKey: string): Promise<TafsirResult | null> {
  const res = await fetch(`${API_BASE}/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
  if (!res.ok) return null;
  const data = await res.json();
  const t = data.tafsir;
  if (!t) return null;
  return {
    resource_id: t.resource_id,
    resource_name: t.resource_name,
    text: t.text,
  };
}

// Get all verses for a page with their audio files (combined helper)
export async function fetchPageWithAudio(
  pageNumber: number,
  recitationId: number,
  translationId: number | null = null
): Promise<{ verses: Verse[]; audioFiles: AudioFile[] }> {
  const [verses, audioFiles] = await Promise.all([
    fetchVersesByPage(pageNumber, translationId),
    fetchAudioByPage(recitationId, pageNumber).catch(() => [] as AudioFile[]),
  ]);
  return { verses, audioFiles };
}
