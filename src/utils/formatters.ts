export function formatMissionLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}
