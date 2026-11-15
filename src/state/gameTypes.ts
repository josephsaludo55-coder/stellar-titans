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

export interface PlayerProfile {
  name: string;
  role: string;
  experience: 'novice' | 'cadet' | 'mission specialist' | 'flight director';
  focus: string;
}

export type PlayerMode = 'individual' | 'team';

export type TeamRole =
  | 'mission-commander'
  | 'mission-engineer'
  | 'science-officer'
  | 'resource-manager';

export interface TeamParticipant {
  id: string;
  name: string;
  role: TeamRole;
}

export interface TeamConfiguration {
  name: string;
  participants: TeamParticipant[];
  isConfirmed: boolean;
  confirmedAt: string | null;
}

export interface DecisionVote {
  playerId: string;
  choice: 'approve' | 'reject';
  castAt: string;
}

export interface MissionDecision {
  id: string;
  proposal: string;
  proposedByPlayerId: string;
  explanation: string;
  proposedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  votes: DecisionVote[];
  resolvedAt: string | null;
}

export type MissionDestinationId = 'moon' | 'mars';

export type MissionArchitectureId = 'orbiter' | 'lander' | 'rover' | 'space-probe';

export type MissionObjectiveId =
  | 'lunar-surface-exploration'
  | 'lunar-geology'
  | 'lunar-resource-mapping'
  | 'lunar-environment'
  | 'mars-geology'
  | 'mars-past-water'
  | 'mars-atmosphere'
  | 'mars-surface-exploration';

export interface MissionConfiguration {
  missionName: string;
  destination: MissionDestinationId | null;
  architecture: MissionArchitectureId | null;
  objectiveIds: MissionObjectiveId[];
  missionDurationDays: number | null;
  requiredMeasurements: string[];
  communicationRequirement: string;
  dataRequirement: string;
  isConfirmed: boolean;
  updatedAt: string | null;
}

export interface MissionStatus {
  stage: MissionStage;
  readiness: number;
  health: number;
  alerts: number;
}

export interface GameState {
  playerMode: PlayerMode;
  player: PlayerProfile;
  team: TeamConfiguration | null;
  decisionHistory: MissionDecision[];
  missionConfiguration: MissionConfiguration | null;
  selectedSpacecraftComponentIds: string[];
  selectedInstrumentIds: string[];
  selectedLaunchVehicleId: string | null;
  selectedTrajectoryId: string | null;
  resourcePlan: MissionResourcePlan;
  missionEngineeringAdjustments: MissionEngineeringAdjustments;
  missionEventDecisionHistory: MissionEventDecisionRecord[];
  missionEvaluationHistory: MissionEvaluationRecord[];
  completedChapterIds: string[];
  achievementRecords: AchievementRecord[];
  missionSimulation: MissionSimulationState | null;
  mission: MissionStatus;
  selectedMissionId: string | null;
  isLoaded: boolean;
}

export interface AchievementRecord {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  evidence: string;
}

export interface MissionResourcePlan {
  initialFundingUsd: number | null;
  missionExpensesUsd: number | null;
}

export type MissionEventCategory = 'power-management' | 'communication' | 'data-storage' | 'scientific-operations' | 'mission-lifetime' | 'spacecraft-system-status';
export interface MissionEngineeringAdjustments {
  instrumentPowerMultiplier: number;
  scienceOutputMultiplier: number;
  dataVolumeMultiplier: number;
  communicationCapacityMultiplier: number;
  missionDurationDeltaDays: number;
  missionExpenseDeltaUsd: number;
  prioritizedObjectiveId: MissionObjectiveId | null;
}
export interface MissionEventDecisionRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  category: MissionEventCategory;
  decisionId: string;
  decisionTitle: string;
  selectedAt: string;
  consequences: string[];
  educationalExplanation: string;
  engineeringEffects: Partial<MissionEngineeringAdjustments> & { spacecraftHealthDelta?: number; alertDelta?: number };
}

export interface MissionScoreCategory {
  id: string;
  label: string;
  score: number;
  maximum: number;
  calculation: string;
  evidence: string;
}

export interface MissionEvaluationRecord {
  id: string;
  completedAt: string;
  missionName: string;
  destinationName: string;
  architectureName: string;
  overallScore: number;
  rating: 'OUTSTANDING MISSION' | 'SUCCESSFUL MISSION' | 'PARTIAL SUCCESS' | 'MISSION NEEDS IMPROVEMENT';
  categories: MissionScoreCategory[];
  objectiveCompletion: { completed: number; total: number; achievements: string[] };
  engineeringPerformance: { score: number; maximum: number; summary: string };
  resourceEfficiency: string[];
  scientificAchievements: string[];
  teamPerformance: string[];
  successfulDecisions: string[];
  engineeringProblems: string[];
  recommendations: string[];
  engineeringDecisions: string[];
  spacecraftSummary: { components: string[]; instruments: string[]; launchVehicleName: string; trajectoryName: string; totalMassKg: number };
  debrief: string;
  missionOutcome?: 'success' | 'failed';
}

export type MissionSimulationPhase = 'pre-launch' | 'countdown' | 'launch' | 'deployment' | 'cruise' | 'arrival' | 'scientific-operations' | 'communication' | 'completion';
export interface MissionSimulationSnapshot {
  missionName: string;
  destination: MissionDestinationId;
  destinationName: string;
  destinationEnvironment: string;
  architecture: MissionArchitectureId;
  architectureName: string;
  durationDays: number;
  configuredDurationDays: number;
  objectives: Array<{ id: MissionObjectiveId; name: string }>;
  requiredMeasurements: string[];
  dataRequirement: string;
  communicationRequirement: string;
  components: Array<{ id: string; name: string; category: string; massKg: number; powerGenerationW: number; powerConsumptionW: number; dataStorageGb: number; downlinkMbps: number }>;
  instruments: Array<{ id: string; name: string; scientificPurpose: string; massKg: number; powerConsumptionW: number; dataGenerationMbps: number; scientificValue: number; objectiveIds: MissionObjectiveId[] }>;
  launchVehicleName: string;
  launchVehicleCapacityKg: number;
  launchCostUsd: number;
  trajectoryName: string;
  trajectoryPhase: string;
  totalMassKg: number;
  totalEstimatedCostUsd: number;
  totalMissionSpendUsd: number;
  initialFundingUsd: number;
  remainingBudgetUsd: number;
  powerGenerationW: number;
  powerDemandW: number;
  storageCapacityGb: number;
  downlinkMbps: number;
  dailyDownlinkCapacityGb: number;
  estimatedMissionDataGb: number;
  prioritizedObjectiveId: MissionObjectiveId | null;
  scienceOutputMultiplier: number;
}
export interface MissionObjectiveResult {
  objectiveId: MissionObjectiveId;
  objectiveName: string;
  supportingInstruments: string[];
  status: 'supported' | 'unsupported';
  finding: string;
}
export interface MissionSimulationEvent {
  id: string;
  phase: MissionSimulationPhase;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'success';
  occurredAt: string;
}
export interface MissionLandingRecord {
  gridX: number;
  gridY: number;
  coordinateReference: string;
  landedAt: string;
  modeledElapsedDays: number;
  missionStatus: 'landed';
}
export interface MissionScientificReading {
  id: string;
  instrumentId: string;
  instrumentName: string;
  category: string;
  metric: string;
  value: number;
  unit: string;
  interpretation: string;
}
export interface MissionSurfaceImage {
  id: string;
  instrumentId: string;
  instrumentName: string;
  title: string;
  caption: string;
}
export interface MissionScientificDiscovery {
  id: string;
  title: string;
  evidence: string;
  interpretation: string;
  confidence: 'low' | 'moderate' | 'high';
}
export interface MissionScienceReport {
  collectedAt: string;
  dataVolumeGb: number;
  instrumentPowerWh: number;
  deployedInstrumentIds: string[];
  readings: MissionScientificReading[];
  surfaceImages: MissionSurfaceImage[];
  environmentalAnalysis: string[];
  discoveries: MissionScientificDiscovery[];
  simulationLabel: string;
}
export interface MissionSimulationState {
  status: 'active' | 'completed';
  phase: MissionSimulationPhase;
  snapshot: MissionSimulationSnapshot;
  events: MissionSimulationEvent[];
  scienceDataCollectedGb: number;
  dataTransmittedGb: number;
  dataRetainedGb: number;
  objectiveResults: MissionObjectiveResult[];
  performanceScore: number | null;
  resultSummary: string | null;
  startedAt: string;
  completedAt: string | null;
  landingAttempts?: number;
  missionOutcome?: 'success' | 'failed' | null;
  landingRecord?: MissionLandingRecord | null;
  scienceReport?: MissionScienceReport | null;
}

export type GameAction =
  | { type: 'SET_STAGE'; stage: MissionStage }
  | { type: 'SET_PLAYER_MODE'; mode: PlayerMode }
  | { type: 'UPDATE_PLAYER'; payload: Partial<PlayerProfile> }
  | { type: 'SET_TEAM'; team: TeamConfiguration }
  | { type: 'CLEAR_TEAM' }
  | { type: 'CONFIRM_TEAM'; confirmedAt: string }
  | { type: 'ADD_DECISION'; decision: MissionDecision }
  | { type: 'CAST_DECISION_VOTE'; decisionId: string; playerId: string; choice: 'approve' | 'reject'; castAt: string }
  | { type: 'UPDATE_MISSION_CONFIGURATION'; configuration: MissionConfiguration }
  | { type: 'CONFIRM_MISSION_CONFIGURATION'; confirmedAt: string }
  | { type: 'SET_SPACECRAFT_COMPONENTS'; componentIds: string[] }
  | { type: 'SET_INSTRUMENTS'; instrumentIds: string[] }
  | { type: 'SET_LAUNCH_CONFIGURATION'; launchVehicleId: string | null; trajectoryId: string | null }
  | { type: 'UPDATE_RESOURCE_PLAN'; payload: Partial<MissionResourcePlan> }
  | { type: 'RESOLVE_MISSION_EVENT'; eventId: string; decisionId: string }
  | { type: 'RECORD_MISSION_EVALUATION'; evaluation: MissionEvaluationRecord }
  | { type: 'COMPLETE_ACADEMY_CHAPTER'; chapterId: string }
  | { type: 'START_NEW_MISSION' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'START_MISSION_SIMULATION' }
  | { type: 'RECORD_LANDING_FAILURE' }
  | { type: 'CONFIRM_MISSION_LANDING'; gridX: number; gridY: number }
  | { type: 'ADVANCE_MISSION_SIMULATION' }
  | { type: 'RUN_MISSION_SCIENCE' }
  | { type: 'TRANSMIT_MISSION_DATA' }
  | { type: 'COMPLETE_MISSION_SIMULATION' }
  | { type: 'SET_MISSION'; payload: Partial<MissionStatus> }
  | { type: 'SELECT_MISSION'; missionId: string | null }
  | { type: 'LOAD_STATE'; payload: Partial<GameState> };
