export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: { language_name: string; name: string };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  translations?: { id: number; resource_id: number; text: string }[];
  words?: VerseWord[];
}

export interface VerseWord {
  char_type: string;
  text: string;
  highlight?: boolean;
  translation?: string;
  transliteration?: string;
}

export interface Reciter {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: { name: string; language_name: string };
}

export interface AudioFile {
  verse_key: string;
  url: string;
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

export interface SearchResult {
  verse_key: string;
  verse_id: number;
  text: string;
  highlighted: string | null;
  words: { char_type: string; text: string; highlight?: boolean }[];
  translations: { text: string }[];
}

export interface SearchResponse {
  query: string;
  total_results: number;
  current_page: number;
  total_pages: number;
  results: SearchResult[];
}
