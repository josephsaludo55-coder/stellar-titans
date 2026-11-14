export function simulateMissionProgress(readiness: number, riskFactor: number) {
  const normalizedRisk = Math.min(Math.max(riskFactor, 0), 100);
  const delta = readiness - normalizedRisk * 0.52;

  return {
    projectedStatus: Math.max(0, Math.min(100, Math.round(delta))),
    eventCount: Math.round(normalizedRisk / 12),
    recommendation: delta >= 65 ? 'Mission is ready for a launch review.' : 'Additional engineering review is recommended.',
  };
}
