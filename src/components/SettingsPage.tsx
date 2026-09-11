import { useState, useEffect } from 'react';
import { User, Globe, Moon, Sun, Type, Shield, LogOut, Save, Check, ArrowRight, LogIn } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { supabase } from '@/lib/supabase';
import { LANGUAGES, type Language } from '@/i18n/dictionaries';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { t, lang, setLang } = useI18n();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useLocalStorage<'sm' | 'md' | 'lg' | 'xl'>('zikra-font-size', 'lg');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
      setShowProgress(profile.show_progress_public);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        show_progress_public: showProgress,
      })
      .eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-primary-50 dark:text-ink-400 dark:hover:bg-primary-900/20"
        >
          <ArrowRight size={18} />
          {t('back')}
        </button>
        <h1 className="text-xl font-bold text-ink-800 dark:text-ink-100">{t('settings')}</h1>
      </div>

      {/* Auth section */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        {user ? (
          <>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
              <User size={16} className="text-primary-500" />
              {t('profile')}
            </h2>

            {/* Avatar preview */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="font-quran text-2xl">{(displayName || '؟').charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{user.email}</p>
                <p className="text-xs text-ink-400">{t('profile')}</p>
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">{t('profile_name')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              />
            </div>

            {/* Avatar URL */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-ink-500 dark:text-ink-400">{t('profile_avatar')} URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
              />
            </div>

            {/* Privacy */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProgress}
                  onChange={(e) => setShowProgress(e.target.checked)}
                  className="h-5 w-5 accent-primary-600"
                />
                <div>
                  <span className="text-sm text-ink-700 dark:text-ink-300">{t('profile_privacy')}</span>
                  <p className="text-[11px] text-ink-400">{t('community')}</p>
                </div>
              </label>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50"
            >
              {saved ? <Check size={16} /> : saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save size={16} />}
              {saved ? '✓' : t('profile_save')}
            </button>

            {/* Sign out */}
            <button
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/10"
            >
              <LogOut size={16} />
              {t('sign_out')}
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <User size={40} className="mx-auto mb-3 text-ink-300" />
            <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">{t('sign_in')}</p>
            <button
              onClick={() => setShowAuth(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-ink-200 px-6 py-3 text-sm font-medium text-ink-700 transition-all hover:shadow-soft dark:border-ink-700 dark:text-ink-300"
            >
              <LogIn size={18} />
              {t('sign_in')}
            </button>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
          <Sun size={16} className="text-gold-500" />
          {t('theme')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
              theme === 'light' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400'
            }`}
          >
            <Sun size={16} /> {t('theme_light')}
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
              theme === 'dark' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400'
            }`}
          >
            <Moon size={16} /> {t('theme_dark')}
          </button>
        </div>
      </div>

      {/* Font size */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
          <Type size={16} className="text-primary-500" />
          {t('font_size')}
        </h2>
        <div className="flex gap-2">
          {([
            { key: 'sm', label: t('font_small'), sample: 'text-lg' },
            { key: 'md', label: t('font_medium'), sample: 'text-xl' },
            { key: 'lg', label: t('font_large'), sample: 'text-2xl' },
            { key: 'xl', label: 'XL', sample: 'text-3xl' },
          ] as const).map(({ key, label, sample }) => (
            <button
              key={key}
              onClick={() => setFontSize(key)}
              className={`flex-1 rounded-xl py-3 text-center transition-all ${
                fontSize === key ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400'
              }`}
            >
              <div className={`font-quran ${sample}`}>بسم</div>
              <div className="mt-1 text-[10px]">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-400">
          <Globe size={16} className="text-primary-500" />
          {t('language')}
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code as Language)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-sm transition-all ${
                lang === l.code
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-950/30'
                  : 'border-ink-200 hover:border-primary-300 dark:border-ink-700'
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <div className="text-right">
                <div className="font-medium text-ink-700 dark:text-ink-300">{l.nativeName}</div>
                <div className="text-[10px] text-ink-400">{l.name}</div>
              </div>
              {lang === l.code && <Check size={16} className="mr-auto text-primary-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="h-24" />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
