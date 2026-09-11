import type { Reciter } from '@/types';

export const TRANSLATIONS: { id: number | null; name: string; lang: string; langCode: string }[] = [
  { id: 149, name: 'Fadel Soliman (Bridges)', lang: 'English', langCode: 'en' },
  { id: 20, name: 'Saheeh International', lang: 'English', langCode: 'en' },
  { id: 85, name: 'M.A.S. Abdel Haleem', lang: 'English', langCode: 'en' },
  { id: 22, name: 'A. Yusuf Ali', lang: 'English', langCode: 'en' },
  { id: 19, name: 'M. Pickthall', lang: 'English', langCode: 'en' },
  { id: 84, name: 'T. Usmani', lang: 'English', langCode: 'en' },
  { id: 234, name: 'Fatah Muhammad Jalandhari', lang: 'Urdu', langCode: 'ur' },
  { id: 54, name: 'Maulana Muhammad Junagarhi', lang: 'Urdu', langCode: 'ur' },
  { id: 97, name: 'Tafheem e Qur\'an (Maududi)', lang: 'Urdu', langCode: 'ur' },
  { id: 158, name: 'Bayan-ul-Quran', lang: 'Urdu', langCode: 'ur' },
  { id: 31, name: 'Muhammad Hamidullah', lang: 'French', langCode: 'fr' },
  { id: 136, name: 'Montada Islamic Foundation', lang: 'French', langCode: 'fr' },
  { id: 33, name: 'Indonesian Islamic Affairs Ministry', lang: 'Indonesian', langCode: 'id' },
  { id: 134, name: 'King Fahad Quran Complex', lang: 'Indonesian', langCode: 'id' },
  { id: 39, name: 'Abdullah Muhammad Basmeih', lang: 'Malay', langCode: 'id' },
  { id: null, name: 'بدون ترجمة / No translation', lang: '—', langCode: 'ar' },
];

export const TAFSIRS: { id: number; name: string; lang: string }[] = [
  { id: 91, name: 'السعدي (Al-Sa\'di)', lang: 'ar' },
  { id: 16, name: 'الميسر (Muyassar)', lang: 'ar' },
  { id: 14, name: 'ابن كثير (Ibn Kathir)', lang: 'ar' },
  { id: 15, name: 'الطبري (Al-Tabari)', lang: 'ar' },
  { id: 90, name: 'القرطبي (Al-Qurtubi)', lang: 'ar' },
  { id: 93, name: 'التفسير الوسيط (Tantawi)', lang: 'ar' },
  { id: 94, name: 'البغوي (Al-Baghawi)', lang: 'ar' },
];

export const RECITERS: Reciter[] = [
  { id: 7, reciter_name: 'Mishari Rashid al-`Afasy', style: null, translated_name: { name: 'مشاري راشد العفاسي', language_name: 'arabic' } },
  { id: 3, reciter_name: 'Abdur-Rahman as-Sudais', style: null, translated_name: { name: 'عبدالرحمن السديس', language_name: 'arabic' } },
  { id: 10, reciter_name: 'Sa`ud ash-Shuraym', style: null, translated_name: { name: 'سعود الشريم', language_name: 'arabic' } },
  { id: 1, reciter_name: 'AbdulBaset AbdulSamad', style: 'Mujawwad', translated_name: { name: 'عبد الباسط عبد الصمد (مجود)', language_name: 'arabic' } },
  { id: 2, reciter_name: 'AbdulBaset AbdulSamad', style: 'Murattal', translated_name: { name: 'عبد الباسط عبد الصمد (مرتل)', language_name: 'arabic' } },
  { id: 4, reciter_name: 'Abu Bakr al-Shatri', style: null, translated_name: { name: 'أبو بكر الشاطرى', language_name: 'arabic' } },
  { id: 5, reciter_name: 'Hani ar-Rifai', style: null, translated_name: { name: 'هاني الرفاعي', language_name: 'arabic' } },
  { id: 6, reciter_name: 'Mahmoud Khalil Al-Husary', style: null, translated_name: { name: 'محمود خليل الحصري', language_name: 'arabic' } },
  { id: 12, reciter_name: 'Mahmoud Khalil Al-Husary', style: 'Muallim', translated_name: { name: 'محمود خليل الحصري (معلم)', language_name: 'arabic' } },
  { id: 9, reciter_name: 'Mohamed Siddiq al-Minshawi', style: 'Murattal', translated_name: { name: 'محمد صديق المنشاوي (مرتل)', language_name: 'arabic' } },
  { id: 8, reciter_name: 'Mohamed Siddiq al-Minshawi', style: 'Mujawwad', translated_name: { name: 'محمد صديق المنشاوي (مجود)', language_name: 'arabic' } },
  { id: 11, reciter_name: 'Mohamed al-Tablawi', style: null, translated_name: { name: 'محمد الطبلاوي', language_name: 'arabic' } },
];

export const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicNumber(num: number): string {
  return String(num).replace(/[0-9]/g, (d) => ARABIC_DIGITS[parseInt(d)]);
}

export function verseKeyToArabic(verseKey: string): string {
  const [surah, ayah] = verseKey.split(':');
  return `${toArabicNumber(parseInt(surah))}:${toArabicNumber(parseInt(ayah))}`;
}

export const REVELATION_PLACE_LABEL: Record<string, Record<string, string>> = {
  makkah: { ar: 'مكية', en: 'Meccan', ur: 'مکی', fr: 'Mecquoise', id: 'Makkiyah' },
  madinah: { ar: 'مدنية', en: 'Medinan', ur: 'مدنی', fr: 'Médinoise', id: 'Madaniyah' },
};

export const TOTAL_PAGES = 604;

export const KHATMAH_DURATIONS = [1, 7, 30, 60, 180, 365];

export const BOOKMARK_COLORS = [
  { key: 'red', label: { ar: 'أحمر', en: 'Red', ur: 'سرخ', fr: 'Rouge', id: 'Merah' }, bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-400' },
  { key: 'yellow', label: { ar: 'أصفر', en: 'Yellow', ur: 'پیلا', fr: 'Jaune', id: 'Kuning' }, bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-400' },
  { key: 'blue', label: { ar: 'أزرق', en: 'Blue', ur: 'نیلا', fr: 'Bleu', id: 'Biru' }, bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-400' },
  { key: 'green', label: { ar: 'أخضر', en: 'Green', ur: 'سبز', fr: 'Vert', id: 'Hijau' }, bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-400' },
  { key: 'purple', label: { ar: 'بنفسجي', en: 'Purple', ur: 'بنفشی', fr: 'Violet', id: 'Ungu' }, bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-400' },
] as const;

export type BookmarkColor = typeof BOOKMARK_COLORS[number]['key'];
