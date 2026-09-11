import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { Verse, AudioFile } from '@/types';
import { getAudioUrl } from '@/api';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AudioPlayerState {
  currentVerseIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  verses: Verse[];
  audioFiles: AudioFile[];
  reciterId: number;
  chapterId: number | null;
  setReciterId: (id: number) => void;
  loadChapter: (verses: Verse[], audioFiles: AudioFile[], chapterId: number, startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  playVerse: (index: number) => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerState | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [reciterId, setReciterId] = useLocalStorage<number>('quran-reciter', 7);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [chapterId, setChapterId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const versesLengthRef = useRef(0);
  versesLengthRef.current = verses.length;

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'auto';

    const onEnded = () => {
      setCurrentVerseIndex((prev) => {
        if (prev + 1 < versesLengthRef.current) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load audio source when verse index changes
  useEffect(() => {
    if (!audioRef.current || verses.length === 0 || audioFiles.length === 0) return;
    if (currentVerseIndex >= verses.length) return;

    const verse = verses[currentVerseIndex];
    const audioFile = audioFiles.find((a) => a.verse_key === verse.verse_key);
    if (!audioFile) return;

    const audio = audioRef.current;
    const url = getAudioUrl(audioFile);
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentVerseIndex, verses, audioFiles, isPlaying]);

  const loadChapter = useCallback((newVerses: Verse[], newAudioFiles: AudioFile[], newChapterId: number, startIndex: number = 0) => {
    setVerses(newVerses);
    setAudioFiles(newAudioFiles);
    setChapterId(newChapterId);
    setCurrentVerseIndex(startIndex);
    setIsPlaying(false);
    // Start playing after a brief moment
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const play = useCallback(() => {
    if (!audioRef.current || verses.length === 0) return;
    setIsPlaying(true);
    audioRef.current.play().catch(() => setIsPlaying(false));
  }, [verses.length]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const next = useCallback(() => {
    setCurrentVerseIndex((prev) => {
      if (prev + 1 < verses.length) {
        return prev + 1;
      }
      setIsPlaying(false);
      return prev;
    });
  }, [verses.length]);

  const prev = useCallback(() => {
    setCurrentVerseIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const playVerse = useCallback((index: number) => {
    setCurrentVerseIndex(index);
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setVerses([]);
    setAudioFiles([]);
    setChapterId(null);
    setCurrentVerseIndex(0);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentVerseIndex,
        isPlaying,
        isLoading,
        verses,
        audioFiles,
        reciterId,
        chapterId,
        setReciterId,
        loadChapter,
        play,
        pause,
        toggle,
        next,
        prev,
        playVerse,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioPlayer(): AudioPlayerState {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}
