import { useState } from 'react';
import { LogIn, Mail, Lock, User, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { t } = useI18n();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const result = mode === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      if (mode === 'signup') {
        setError(t('sign_in') + ' - ' + 'تم إنشاء الحساب بنجاح');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-800 dark:text-ink-100">
            {mode === 'signin' ? t('sign_in') : t('profile')}
          </h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600"><X size={18} /></button>
        </div>

        {/* Google sign-in */}
        <button
          onClick={signInWithGoogle}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white py-3 text-sm font-medium text-ink-700 transition-all hover:shadow-soft dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {t('sign_in_google')}
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          <span className="text-xs text-ink-400">أو</span>
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('profile_name') + ' / Email'}
              required
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pr-10 pl-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pr-10 pl-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {mode === 'signin' ? t('sign_in') : t('profile_save')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-xs text-primary-600 hover:underline dark:text-primary-400"
          >
            {mode === 'signin' ? 'إنشاء حساب جديد' : 'لديك حساب؟ تسجيل الدخول'}
          </button>
        </div>
      </div>
    </div>
  );
}
