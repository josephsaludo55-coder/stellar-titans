interface ProgressBarProps {
  value: number;
  label?: string;
  max?: number;
}

export function ProgressBar({ value, label, max = 100 }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="progress-block">
      {label ? <div className="progress-label-row"><span>{label}</span><strong>{value}%</strong></div> : null}
      <div className="progress-shell" aria-label={label ?? 'Progress'}>
        <span className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
