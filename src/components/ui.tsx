export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400"
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingScreen({ message = 'جارٍ التحميل...' }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Spinner size={40} />
      <p className="text-sm text-ink-500 dark:text-ink-400">{message}</p>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer-bg animate-shimmer rounded-lg ${className}`} />;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl opacity-50">۞</div>
      <p className="text-ink-600 dark:text-ink-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
