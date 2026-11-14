import type { GameState, MissionStage } from './gameTypes';

const resumableStages = new Set<MissionStage>([
  'player-setup', 'mission-design', 'spacecraft-designer', 'instruments', 'launch-configuration',
  'mission-control', 'mission-review', 'mission-simulation', 'mission-events', 'mission-evaluation',
]);

export function getMissionResumeStage(state: GameState): MissionStage {
  if (state.missionSimulation?.status === 'active') return 'mission-simulation';
  if (state.missionSimulation?.status === 'completed') return 'mission-evaluation';
  if (resumableStages.has(state.mission.stage)) return state.mission.stage;
  if (state.missionConfiguration) return state.missionConfiguration.isConfirmed ? 'spacecraft-designer' : 'mission-design';
  const hasCustomPlayer = state.player.name !== 'Commander Nova' || Boolean(state.team);
  return hasCustomPlayer ? 'player-setup' : 'mission-design';
}

export function isMissionCheckpoint(stage: MissionStage): boolean {
  return resumableStages.has(stage);
}
