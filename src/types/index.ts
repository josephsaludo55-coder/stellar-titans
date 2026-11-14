export type MissionStage =
  | 'welcome'
  | 'academy'
  | 'mission-stories'
  | 'player-setup'
  | 'spacecraft-explorer'
  | 'mission-design'
  | 'spacecraft-designer'
  | 'instruments'
  | 'launch-configuration'
  | 'mission-control'
  | 'mission-review'
  | 'mission-simulation'
  | 'mission-events'
  | 'mission-evaluation'
  | 'achievements'
  | 'mission-history';

export interface MissionCard {
  id: string;
  title: string;
  summary: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface TargetSystem {
  id: string;
  label: string;
  description: string;
}
