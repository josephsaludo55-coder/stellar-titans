export interface StoryCard {
  id: string;
  mission: string;
  title: string;
  summary: string;
  focus: string;
}

export const missionStories: StoryCard[] = [
  {
    id: 'apollo-11',
    mission: 'Apollo 11',
    title: 'Landing on the sea of tranquility',
    summary: 'A lesson in navigation, landing precision, and mission discipline under pressure.',
    focus: 'Crewed descent',
  },
  {
    id: 'juno',
    mission: 'Juno',
    title: 'Reading the dynamics of Jupiter',
    summary: 'A mission of advanced orbital planning, radiation shielding, and scientific instrumentation.',
    focus: 'Orbital science',
  },
  {
    id: 'mars-rover',
    mission: 'Mars Rover',
    title: 'Designing mobility for an alien world',
    summary: 'A case study in autonomous exploration, engineering resilience, and mission continuity.',
    focus: 'Surface exploration',
  },
];
