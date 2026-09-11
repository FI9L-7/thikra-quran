import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QuranDataProvider } from '@/contexts/QuranDataContext';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { Header, type Page } from '@/components/Header';
import { HomePage } from '@/components/HomePage';
import { SurahList } from '@/components/SurahList';
import { Reader } from '@/components/Reader';
import { JuzList } from '@/components/JuzList';
import { JuzReader } from '@/components/JuzReader';
import { SearchPage } from '@/components/SearchPage';
import { MushafReader } from '@/components/MushafReader';
import { SettingsPage } from '@/components/SettingsPage';
import { AudioPlayerBar } from '@/components/AudioPlayerBar';

type View =
  | { name: 'home' }
  | { name: 'surahs' }
  | { name: 'juzs' }
  | { name: 'search' }
  | { name: 'settings' }
  | { name: 'reader'; chapterId: number }
  | { name: 'juzReader'; juzNumber: number }
  | { name: 'mushaf'; pageNumber: number };

function AppContent() {
  const [page, setPage] = useState<Page>('home');
  const [view, setView] = useState<View>({ name: 'home' });

  const navigate = (p: Page) => {
    setPage(p);
    if (p === 'home') setView({ name: 'home' });
    else if (p === 'surahs') setView({ name: 'surahs' });
    else if (p === 'juzs') setView({ name: 'juzs' });
    else if (p === 'search') setView({ name: 'search' });
    else if (p === 'settings') setView({ name: 'settings' });
  };

  const selectSurah = (id: number) => {
    setView({ name: 'reader', chapterId: id });
    setPage('surahs');
  };

  const selectJuz = (juzNumber: number) => {
    setView({ name: 'juzReader', juzNumber });
    setPage('juzs');
  };

  const openMushaf = (pageNumber: number) => {
    setView({ name: 'mushaf', pageNumber });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const renderView = () => {
    switch (view.name) {
      case 'home':
        return (
          <HomePage
            onNavigate={navigate}
            onSelectSurah={selectSurah}
            onOpenMushaf={openMushaf}
            onOpenSettings={() => navigate('settings')}
          />
        );
      case 'surahs':
        return <SurahList onSelectSurah={selectSurah} />;
      case 'juzs':
        return <JuzList onSelectJuz={selectJuz} />;
      case 'search':
        return <SearchPage onSelectVerse={(chId) => selectSurah(chId)} />;
      case 'settings':
        return <SettingsPage onBack={() => navigate('home')} />;
      case 'reader':
        return <Reader chapterId={view.chapterId} onBack={() => navigate('surahs')} />;
      case 'juzReader':
        return <JuzReader juzNumber={view.juzNumber} onBack={() => navigate('juzs')} />;
      case 'mushaf':
        return <MushafReader initialPage={view.pageNumber} onBack={() => navigate('home')} />;
      default:
        return (
          <HomePage
            onNavigate={navigate}
            onSelectSurah={selectSurah}
            onOpenMushaf={openMushaf}
            onOpenSettings={() => navigate('settings')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 text-ink-900 transition-colors dark:bg-ink-950 dark:text-ink-100">
      <Header currentPage={page} onNavigate={navigate} />
      <main className="animate-fade-in">{renderView()}</main>
      <AudioPlayerBar />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <QuranDataProvider>
            <AudioPlayerProvider>
              <AppContent />
            </AudioPlayerProvider>
          </QuranDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
