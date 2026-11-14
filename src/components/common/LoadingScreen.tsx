interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading mission systems...' }: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <strong>{message}</strong>
    </div>
  );
}
