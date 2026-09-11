import { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, Library, Moon, Settings, User, LogIn, Globe, Check } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { LANGUAGES, type Language } from '@/i18n/dictionaries';

export type Page = 'home' | 'surahs' | 'juzs' | 'search' | 'settings';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { t, lang, setLang } = useI18n();
  const { user, profile } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems: { key: Page; label: string; icon: typeof BookOpen }[] = [
    { key: 'home', label: t('nav_home'), icon: Moon },
    { key: 'surahs', label: t('nav_surahs'), icon: BookOpen },
    { key: 'juzs', label: t('nav_juzs'), icon: Library },
    { key: 'search', label: t('nav_search'), icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/80 glass dark:border-primary-900/30 dark:bg-ink-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-glow">
            <span className="font-quran text-xl">۞</span>
          </div>
          <div className="hidden text-right sm:block">
            <div className="font-quran text-lg font-bold leading-none text-primary-700 dark:text-primary-400">
              {t('app_name')}
            </div>
            <div className="text-[10px] text-ink-400 dark:text-ink-500">Zikra</div>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                currentPage === key
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'text-ink-600 hover:bg-primary-50 hover:text-primary-600 dark:text-ink-400 dark:hover:bg-primary-900/20 dark:hover:text-primary-400'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {/* Language switcher */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setShowLangMenu((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
              aria-label={t('language')}
            >
              <Globe size={18} />
            </button>
            {showLangMenu && (
              <div className="absolute left-0 mt-2 w-44 rounded-xl border border-ink-100 bg-white p-2 shadow-lg dark:border-ink-800 dark:bg-ink-900 z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code as Language); setShowLangMenu(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      lang === l.code ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'text-ink-600 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800'
                    }`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <span className="flex-1 text-right">{l.nativeName}</span>
                    {lang === l.code && <Check size={14} className="text-primary-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          {/* Auth / Settings */}
          {user ? (
            <button
              onClick={() => onNavigate('settings')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
              aria-label={t('settings')}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-primary-700"
            >
              <LogIn size={14} />
              <span className="hidden sm:inline">{t('sign_in')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="flex items-center justify-around border-t border-primary-50 px-2 py-1.5 dark:border-primary-900/20 md:hidden">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-all ${
              currentPage === key
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-ink-500 dark:text-ink-500'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-all ${
            currentPage === 'settings'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-ink-500 dark:text-ink-500'
          }`}
        >
          <Settings size={18} />
          {t('settings')}
        </button>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  );
}
