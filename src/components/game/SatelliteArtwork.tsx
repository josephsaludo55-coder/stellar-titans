import type { CSSProperties } from 'react';

export function SatelliteArtwork({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 100 60" role="img" aria-label="Deployed mission satellite">
    <path d="M39 19h22v22H39z" fill="#d7e8f2" stroke="#fff" strokeWidth="2" />
    <path d="M4 15h30v30H4zM66 15h30v30H66z" fill="#267bb2" stroke="#9ce9ff" strokeWidth="2" />
    <path d="M12 15v30m10-30v30m52-30v30m10-30v30" stroke="#d0f5ff" strokeWidth="1" />
    <path d="M50 19V5l8-6" fill="none" stroke="#fff1c4" strokeWidth="2" />
    <circle cx="50" cy="30" r="4" fill="#73ecff" />
  </svg>;
}
