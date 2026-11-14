export function validateMissionConfiguration(payload: {
  crewSize: number;
  payloadMass: number;
  launchWindow: number;
}) {
  const issues: string[] = [];

  if (payload.crewSize < 1 || payload.crewSize > 12) {
    issues.push('Crew size must stay within the supported mission envelope.');
  }

  if (payload.payloadMass <= 0) {
    issues.push('Payload mass must be greater than zero.');
  }

  if (payload.launchWindow <= 0) {
    issues.push('Launch window must be positive.');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
