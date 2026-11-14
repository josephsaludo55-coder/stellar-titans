export function calculateReadinessScore(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

export function estimateFuelBudget(massTonnes: number, deltaV: number) {
  return Math.round((massTonnes * deltaV) / 12);
}

export function estimateMissionWindow(distanceKm: number) {
  return Math.max(1, Math.round(distanceKm / 240000));
}
