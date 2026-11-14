import type { AcademyHighlight, MissionStory } from '../types/game';

export const academyHighlights: AcademyHighlight[] = [
  {
    title: 'Mission Foundations',
    description: 'Learn how goal, destination, spacecraft, and resources work together before launch.',
    accent: 'Mission design',
  },
  {
    title: 'Engineering Tradeoffs',
    description: 'Every choice affects budget, mass, power, and data limits in a simplified educational model.',
    accent: 'Systems thinking',
  },
  {
    title: 'Launch Readiness',
    description: 'Understand why mission control reviews launch systems, communication, and scientific payloads.',
    accent: 'Mission control',
  },
];

export const missionStories: MissionStory[] = [
  {
    title: 'Apollo 11',
    mission: 'Moon landing mission',
    insight: 'A clear mission objective helped engineers design a focused lunar landing system.',
  },
  {
    title: 'Mars Perseverance',
    mission: 'Mars rover mission',
    insight: 'Scientific payloads and communication planning are essential for long-distance exploration.',
  },
  {
    title: 'Voyager',
    mission: 'Deep-space exploration',
    insight: 'Mission lifetime and data planning become especially important when spacecraft travel far from Earth.',
  },
];
