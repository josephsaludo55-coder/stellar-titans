export interface MissionDefinition {
  id: string;
  name: string;
  destination: string;
  objective: string;
  durationDays: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export const missionCatalog: MissionDefinition[] = [
  {
    id: 'lunar-south-pole',
    name: 'Lunar South Pole Survey',
    destination: 'Moon',
    objective: 'Map ice deposits and test lunar habitat readiness.',
    durationDays: 120,
    riskLevel: 'Medium',
  },
  {
    id: 'mars-transfer',
    name: 'Mars Transfer Corridor',
    destination: 'Mars',
    objective: 'Validate entry, descent, and communications for future crewed landing.',
    durationDays: 210,
    riskLevel: 'High',
  },
  {
    id: 'asteroid-rendezvous',
    name: 'Asteroid Reconnaissance',
    destination: 'Near-Earth Asteroid',
    objective: 'Survey resource potential and evaluate mining viability.',
    durationDays: 180,
    riskLevel: 'Medium',
  },
];
