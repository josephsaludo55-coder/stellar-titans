import { instrumentCatalog } from '../data/instruments';
import { launchVehicleCatalog, trajectoryCatalog } from '../data/launchVehicles';
import { missionObjectives } from '../data/missionDesign';
import { spacecraftDesignCatalog } from '../data/spacecraftDesigner';
import { academyChapters } from '../data/academy';
import type {
  AchievementRecord, GameState, MissionArchitectureId, MissionConfiguration, MissionDecision,
  MissionDestinationId, MissionEvaluationRecord, MissionEventCategory, MissionEventDecisionRecord,
  MissionObjectiveId, MissionScienceReport, MissionSimulationEvent, MissionSimulationPhase, MissionSimulationState, MissionStage,
  TeamConfiguration,
} from '../state/gameTypes';
import { initialGameState } from '../state/gameState';
import { calculateMissionResources } from './calculations/missionResources';
import type { MissionProgress } from '../types/game';

export const GAME_STATE_SAVE_VERSION = 1;
const STORAGE_KEY = 'space-mission-beyond-earth-progress';
const ACADEMY_PROGRESS_KEY = 'space-mission-beyond-earth-academy';
const GAME_STATE_KEY = 'space-mission-beyond-earth-state';

interface VersionedGameSave {
  saveVersion: number;
  savedAt: string;
  gameState: GameState;
  completedChapters: string[];
  achievementRecords: AchievementRecord[];
  derivedResources: ReturnType<typeof calculateMissionResources>;
}

export interface GameStateLoadResult {
  state: GameState | null;
  hasSavedProgress: boolean;
  warning: string | null;
  savedAt: string | null;
}

const missionStages: MissionStage[] = [
  'welcome', 'academy', 'mission-stories', 'player-setup', 'spacecraft-explorer', 'mission-design',
  'spacecraft-designer', 'instruments', 'launch-configuration', 'mission-control', 'mission-review',
  'mission-simulation', 'mission-events', 'mission-evaluation', 'achievements', 'mission-history',
];
const destinations: MissionDestinationId[] = ['moon', 'mars'];
const architectures: MissionArchitectureId[] = ['orbiter', 'lander', 'rover', 'space-probe'];
const objectiveIds = missionObjectives.map((item) => item.id);
const academyChapterIds = academyChapters.map((item) => item.id);
const eventCategories: MissionEventCategory[] = ['power-management', 'communication', 'data-storage', 'scientific-operations', 'mission-lifetime', 'spacecraft-system-status'];
const simulationPhases: MissionSimulationPhase[] = ['pre-launch', 'countdown', 'launch', 'deployment', 'cruise', 'arrival', 'scientific-operations', 'communication', 'completion'];

type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const isString = (value: unknown): value is string => typeof value === 'string';
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNullableNumber = (value: unknown): value is number | null => value === null || isFiniteNumber(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T => typeof value === 'string' && options.includes(value as T);

function isMissionConfiguration(value: unknown): value is MissionConfiguration {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return isString(value.missionName) &&
    (value.destination === null || isOneOf(value.destination, destinations)) &&
    (value.architecture === null || isOneOf(value.architecture, architectures)) &&
    Array.isArray(value.objectiveIds) && value.objectiveIds.every((id) => isOneOf(id, objectiveIds)) &&
    isNullableNumber(value.missionDurationDays) && isStringArray(value.requiredMeasurements) &&
    isString(value.communicationRequirement) && isString(value.dataRequirement) &&
    typeof value.isConfirmed === 'boolean' && (value.updatedAt === null || isString(value.updatedAt));
}

function isMissionDecision(value: unknown): value is MissionDecision {
  return isRecord(value) && isString(value.id) && isString(value.proposal) && isString(value.proposedByPlayerId) &&
    isString(value.explanation) && isString(value.proposedAt) && ['pending', 'approved', 'rejected'].includes(String(value.status)) &&
    Array.isArray(value.votes) && value.votes.every((vote) => isRecord(vote) && isString(vote.playerId) && ['approve', 'reject'].includes(String(vote.choice)) && isString(vote.castAt)) &&
    (value.resolvedAt === null || isString(value.resolvedAt));
}

function sanitizeTeam(value: unknown): TeamConfiguration | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !isString(value.name) || typeof value.isConfirmed !== 'boolean' || !(value.confirmedAt === null || isString(value.confirmedAt)) || !Array.isArray(value.participants)) return null;
  const participants = value.participants.filter((item) => isRecord(item) && isString(item.id) && isString(item.name) && ['mission-commander', 'mission-engineer', 'science-officer', 'resource-manager'].includes(String(item.role)));
  if (participants.length !== value.participants.length) return null;
  return { name: value.name, isConfirmed: value.isConfirmed, confirmedAt: value.confirmedAt, participants: participants as TeamConfiguration['participants'] };
}

function isAchievement(value: unknown): value is AchievementRecord {
  return isRecord(value) && isString(value.id) && isString(value.title) && isString(value.description) && isString(value.earnedAt) && isString(value.evidence);
}

function isEventDecision(value: unknown): value is MissionEventDecisionRecord {
  return isRecord(value) && isString(value.id) && isString(value.eventId) && isString(value.eventTitle) &&
    isOneOf(value.category, eventCategories) && isString(value.decisionId) && isString(value.decisionTitle) &&
    isString(value.selectedAt) && isStringArray(value.consequences) && isString(value.educationalExplanation) && isRecord(value.engineeringEffects);
}

function isEvaluation(value: unknown): value is MissionEvaluationRecord {
  if (!isRecord(value) || !isString(value.id) || !isString(value.completedAt) || !isString(value.missionName) || !isString(value.destinationName) || !isString(value.architectureName) || !isFiniteNumber(value.overallScore)) return false;
  if (value.missionOutcome !== undefined && !['success', 'failed'].includes(String(value.missionOutcome))) return false;
  if (!['OUTSTANDING MISSION', 'SUCCESSFUL MISSION', 'PARTIAL SUCCESS', 'MISSION NEEDS IMPROVEMENT'].includes(String(value.rating))) return false;
  if (!Array.isArray(value.categories) || !value.categories.every((item) => isRecord(item) && isString(item.id) && isString(item.label) && isFiniteNumber(item.score) && isFiniteNumber(item.maximum) && isString(item.calculation) && isString(item.evidence))) return false;
  if (!isRecord(value.objectiveCompletion) || !isFiniteNumber(value.objectiveCompletion.completed) || !isFiniteNumber(value.objectiveCompletion.total) || !isStringArray(value.objectiveCompletion.achievements)) return false;
  if (!isRecord(value.engineeringPerformance) || !isFiniteNumber(value.engineeringPerformance.score) || !isFiniteNumber(value.engineeringPerformance.maximum) || !isString(value.engineeringPerformance.summary)) return false;
  if (!isStringArray(value.resourceEfficiency) || !isStringArray(value.scientificAchievements) || !isStringArray(value.teamPerformance) || !isStringArray(value.successfulDecisions) || !isStringArray(value.engineeringProblems) || !isStringArray(value.recommendations) || !isStringArray(value.engineeringDecisions) || !isString(value.debrief)) return false;
  return isRecord(value.spacecraftSummary) && isStringArray(value.spacecraftSummary.components) && isStringArray(value.spacecraftSummary.instruments) && isString(value.spacecraftSummary.launchVehicleName) && isString(value.spacecraftSummary.trajectoryName) && isFiniteNumber(value.spacecraftSummary.totalMassKg);
}

function isSimulationEvent(value: unknown): value is MissionSimulationEvent {
  return isRecord(value) && isString(value.id) && isOneOf(value.phase, simulationPhases) && isString(value.title) && isString(value.detail) && ['info', 'warning', 'success'].includes(String(value.severity)) && isString(value.occurredAt);
}

function isScienceReport(value: unknown): value is MissionScienceReport | null | undefined {
  if (value === undefined || value === null) return true;
  if (!isRecord(value) || !isString(value.collectedAt) || !isFiniteNumber(value.dataVolumeGb) || !isFiniteNumber(value.instrumentPowerWh) || !isStringArray(value.deployedInstrumentIds) || !isStringArray(value.environmentalAnalysis) || !isString(value.simulationLabel)) return false;
  if (!Array.isArray(value.readings) || !value.readings.every((item) => isRecord(item) && isString(item.id) && isString(item.instrumentId) && isString(item.instrumentName) && isString(item.category) && isString(item.metric) && isFiniteNumber(item.value) && isString(item.unit) && isString(item.interpretation))) return false;
  if (!Array.isArray(value.surfaceImages) || !value.surfaceImages.every((item) => isRecord(item) && isString(item.id) && isString(item.instrumentId) && isString(item.instrumentName) && isString(item.title) && isString(item.caption))) return false;
  return Array.isArray(value.discoveries) && value.discoveries.every((item) => isRecord(item) && isString(item.id) && isString(item.title) && isString(item.evidence) && isString(item.interpretation) && ['low', 'moderate', 'high'].includes(String(item.confidence)));
}

function isSimulation(value: unknown): value is MissionSimulationState | null {
  if (value === null || value === undefined) return true;
  if (!isRecord(value) || !['active', 'completed'].includes(String(value.status)) || !isOneOf(value.phase, simulationPhases) || !isRecord(value.snapshot)) return false;
  const snapshot = value.snapshot;
  if (!isString(snapshot.missionName) || !isOneOf(snapshot.destination, destinations) || !isString(snapshot.destinationName) || !isString(snapshot.destinationEnvironment) || !isOneOf(snapshot.architecture, architectures) || !isString(snapshot.architectureName)) return false;
  if (![snapshot.durationDays, snapshot.configuredDurationDays, snapshot.launchVehicleCapacityKg, snapshot.launchCostUsd, snapshot.totalMassKg, snapshot.totalEstimatedCostUsd, snapshot.totalMissionSpendUsd, snapshot.initialFundingUsd, snapshot.remainingBudgetUsd, snapshot.powerGenerationW, snapshot.powerDemandW, snapshot.storageCapacityGb, snapshot.downlinkMbps, snapshot.dailyDownlinkCapacityGb, snapshot.estimatedMissionDataGb, snapshot.scienceOutputMultiplier].every(isFiniteNumber)) return false;
  if (!Array.isArray(snapshot.objectives) || !snapshot.objectives.every((item) => isRecord(item) && isOneOf(item.id, objectiveIds) && isString(item.name)) || !isStringArray(snapshot.requiredMeasurements)) return false;
  if (!Array.isArray(snapshot.components) || !snapshot.components.every((item) => isRecord(item) && isString(item.id) && isString(item.name) && isString(item.category) && [item.massKg, item.powerGenerationW, item.powerConsumptionW, item.dataStorageGb, item.downlinkMbps].every(isFiniteNumber))) return false;
  if (!Array.isArray(snapshot.instruments) || !snapshot.instruments.every((item) => isRecord(item) && isString(item.id) && isString(item.name) && isString(item.scientificPurpose) && [item.massKg, item.powerConsumptionW, item.dataGenerationMbps, item.scientificValue].every(isFiniteNumber) && Array.isArray(item.objectiveIds) && item.objectiveIds.every((id) => isOneOf(id, objectiveIds)))) return false;
  if (!isString(snapshot.dataRequirement) || !isString(snapshot.communicationRequirement) || !isString(snapshot.launchVehicleName) || !isString(snapshot.trajectoryName) || !isString(snapshot.trajectoryPhase) || !(snapshot.prioritizedObjectiveId === null || isOneOf(snapshot.prioritizedObjectiveId, objectiveIds))) return false;
  if (!Array.isArray(value.events) || !value.events.every(isSimulationEvent) || !Array.isArray(value.objectiveResults) || !value.objectiveResults.every((item) => isRecord(item) && isOneOf(item.objectiveId, objectiveIds) && isString(item.objectiveName) && isStringArray(item.supportingInstruments) && ['supported', 'unsupported'].includes(String(item.status)) && isString(item.finding))) return false;
  const landing = value.landingRecord;
  if (landing !== undefined && landing !== null && (!isRecord(landing) || !isFiniteNumber(landing.gridX) || landing.gridX < 0 || landing.gridX > 100 || !isFiniteNumber(landing.gridY) || landing.gridY < 0 || landing.gridY > 100 || !isString(landing.coordinateReference) || !isString(landing.landedAt) || !isFiniteNumber(landing.modeledElapsedDays) || landing.missionStatus !== 'landed')) return false;
  if (!isScienceReport(value.scienceReport)) return false;
  return isFiniteNumber(value.scienceDataCollectedGb) && isFiniteNumber(value.dataTransmittedGb) && isFiniteNumber(value.dataRetainedGb) && (value.performanceScore === null || isFiniteNumber(value.performanceScore)) && (value.resultSummary === null || isString(value.resultSummary)) && isString(value.startedAt) && (value.completedAt === null || isString(value.completedAt)) && (value.landingAttempts === undefined || isFiniteNumber(value.landingAttempts) && Number.isInteger(value.landingAttempts) && value.landingAttempts >= 0 && value.landingAttempts <= 5) && (value.missionOutcome === undefined || value.missionOutcome === null || ['success', 'failed'].includes(String(value.missionOutcome)));
}

function normalizeGameState(value: unknown, legacyChapters: string[] = []): GameState | null {
  if (!isRecord(value) || !isRecord(value.player) || !isRecord(value.mission)) return null;
  const player = value.player;
  if (!isString(player.name) || !isString(player.role) || !['novice', 'cadet', 'mission specialist', 'flight director'].includes(String(player.experience)) || !isString(player.focus)) return null;
  const mission = value.mission;
  if (!isOneOf(mission.stage, missionStages) || ![mission.readiness, mission.health, mission.alerts].every(isFiniteNumber)) return null;
  if (value.missionConfiguration !== undefined && !isMissionConfiguration(value.missionConfiguration)) return null;
  if (value.missionSimulation !== undefined && !isSimulation(value.missionSimulation)) return null;

  const ids = (raw: unknown, allowed: string[]) => Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => isString(id) && allowed.includes(id)))] : [];
  const selectedMission = value.missionConfiguration as MissionConfiguration | null | undefined;
  const adjustments = isRecord(value.missionEngineeringAdjustments) ? value.missionEngineeringAdjustments : {};
  const finiteOr = (raw: unknown, fallback: number) => isFiniteNumber(raw) ? raw : fallback;
  const resourcePlan = isRecord(value.resourcePlan) ? value.resourcePlan : {};
  const validNullableAmount = (raw: unknown) => raw === null || (isFiniteNumber(raw) && raw >= 0) ? raw as number | null : null;
  const team = sanitizeTeam(value.team);
  const savedChapters = ids(value.completedChapterIds ?? legacyChapters, academyChapterIds);
  const missionDecisionHistory = Array.isArray(value.decisionHistory) ? value.decisionHistory.filter(isMissionDecision) : [];
  const eventDecisionHistory = Array.isArray(value.missionEventDecisionHistory) ? value.missionEventDecisionHistory.filter(isEventDecision) : [];
  const evaluationHistory = Array.isArray(value.missionEvaluationHistory) ? value.missionEvaluationHistory.filter(isEvaluation) : [];
  const achievementRecords = Array.isArray(value.achievementRecords) ? value.achievementRecords.filter(isAchievement) : [];
  const simulation = value.missionSimulation as MissionSimulationState | null | undefined;

  return {
    ...initialGameState,
    playerMode: value.playerMode === 'team' ? 'team' : 'individual',
    player: { name: player.name, role: player.role, experience: player.experience as GameState['player']['experience'], focus: player.focus },
    team,
    decisionHistory: missionDecisionHistory,
    missionConfiguration: selectedMission ?? null,
    selectedSpacecraftComponentIds: ids(value.selectedSpacecraftComponentIds, spacecraftDesignCatalog.map((item) => item.id)),
    selectedInstrumentIds: ids(value.selectedInstrumentIds, instrumentCatalog.map((item) => item.id)),
    selectedLaunchVehicleId: isString(value.selectedLaunchVehicleId) && launchVehicleCatalog.some((item) => item.id === value.selectedLaunchVehicleId) ? value.selectedLaunchVehicleId : null,
    selectedTrajectoryId: isString(value.selectedTrajectoryId) && trajectoryCatalog.some((item) => item.id === value.selectedTrajectoryId) ? value.selectedTrajectoryId : null,
    resourcePlan: { initialFundingUsd: validNullableAmount(resourcePlan.initialFundingUsd), missionExpensesUsd: validNullableAmount(resourcePlan.missionExpensesUsd) },
    missionEngineeringAdjustments: {
      instrumentPowerMultiplier: finiteOr(adjustments.instrumentPowerMultiplier, 1),
      scienceOutputMultiplier: finiteOr(adjustments.scienceOutputMultiplier, 1),
      dataVolumeMultiplier: finiteOr(adjustments.dataVolumeMultiplier, 1),
      communicationCapacityMultiplier: finiteOr(adjustments.communicationCapacityMultiplier, 1),
      missionDurationDeltaDays: finiteOr(adjustments.missionDurationDeltaDays, 0),
      missionExpenseDeltaUsd: finiteOr(adjustments.missionExpenseDeltaUsd, 0),
      prioritizedObjectiveId: isOneOf(adjustments.prioritizedObjectiveId, objectiveIds) ? adjustments.prioritizedObjectiveId : null,
    },
    missionEventDecisionHistory: eventDecisionHistory,
    missionEvaluationHistory: evaluationHistory,
    completedChapterIds: savedChapters,
    achievementRecords,
    missionSimulation: simulation ? { ...simulation, landingAttempts: simulation.landingAttempts ?? 0, missionOutcome: simulation.missionOutcome ?? null, landingRecord: simulation.landingRecord ?? null, scienceReport: simulation.scienceReport ?? null } : null,
    mission: { stage: mission.stage, readiness: finiteOr(mission.readiness, initialGameState.mission.readiness), health: finiteOr(mission.health, initialGameState.mission.health), alerts: finiteOr(mission.alerts, initialGameState.mission.alerts) },
    selectedMissionId: isOneOf(value.selectedMissionId, destinations) ? value.selectedMissionId : null,
    isLoaded: true,
  };
}

function readLegacyChapters(): string[] {
  try {
    const raw = window.localStorage.getItem(ACADEMY_PROGRESS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter(isString) : [];
  } catch {
    return [];
  }
}

function hasMeaningfulProgress(state: GameState): boolean {
  return state.mission.stage !== 'welcome' || state.player.name !== initialGameState.player.name || state.player.role !== initialGameState.player.role ||
    state.player.experience !== initialGameState.player.experience || state.player.focus !== initialGameState.player.focus || Boolean(state.team) ||
    Boolean(state.missionConfiguration) || state.selectedSpacecraftComponentIds.length > 0 || state.selectedInstrumentIds.length > 0 ||
    Boolean(state.selectedLaunchVehicleId || state.selectedTrajectoryId) || state.completedChapterIds.length > 0 || state.decisionHistory.length > 0 ||
    state.missionEventDecisionHistory.length > 0 || state.missionEvaluationHistory.length > 0 || state.achievementRecords.length > 0 ||
    Boolean(state.missionSimulation) || state.resourcePlan.initialFundingUsd !== null || state.resourcePlan.missionExpensesUsd !== null;
}

export function loadGameStateDetailed(): GameStateLoadResult {
  if (typeof window === 'undefined') return { state: null, hasSavedProgress: false, warning: null, savedAt: null };
  try {
    const raw = window.localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return { state: null, hasSavedProgress: false, warning: null, savedAt: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { state: null, hasSavedProgress: false, warning: 'Saved progress is damaged. Start a new mission or reset progress to create a fresh save.', savedAt: null };

    const legacyChapters = readLegacyChapters();
    if (parsed.saveVersion === GAME_STATE_SAVE_VERSION) {
      const state = normalizeGameState(parsed.gameState, legacyChapters);
      if (!state || !isString(parsed.savedAt) || !Array.isArray(parsed.completedChapters) || !parsed.completedChapters.every(isString) || !Array.isArray(parsed.achievementRecords) || !parsed.achievementRecords.every(isAchievement)) {
        return { state: null, hasSavedProgress: false, warning: 'Saved progress failed validation. Start a new mission or reset progress to create a fresh save.', savedAt: null };
      }
      state.completedChapterIds = idsFromSaved(state.completedChapterIds, parsed.completedChapters.filter((id) => academyChapterIds.includes(id)));
      state.achievementRecords = parsed.achievementRecords;
      return { state, hasSavedProgress: hasMeaningfulProgress(state), warning: null, savedAt: parsed.savedAt };
    }

    if (parsed.saveVersion !== undefined) {
      return { state: null, hasSavedProgress: false, warning: 'This save was created by a different game version and could not be restored safely. Start a new mission or reset progress.', savedAt: null };
    }

    // Migrate the prior unversioned GameState layout when its core fields are valid.
    const legacyState = normalizeGameState(parsed, legacyChapters);
    if (!legacyState) return { state: null, hasSavedProgress: false, warning: 'Saved progress is damaged and could not be restored. Start a new mission or reset progress.', savedAt: null };
    return { state: legacyState, hasSavedProgress: hasMeaningfulProgress(legacyState), warning: 'Previous save format restored. It will be upgraded to the current version automatically.', savedAt: null };
  } catch {
    return { state: null, hasSavedProgress: false, warning: 'Saved progress could not be read. Start a new mission or reset progress to continue.', savedAt: null };
  }
}

function idsFromSaved(current: string[], saved: string[]): string[] {
  return [...new Set([...current, ...saved])];
}

export function loadGameState(): GameState | null {
  return loadGameStateDetailed().state;
}

export function saveGameState(state: GameState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const envelope: VersionedGameSave = {
      saveVersion: GAME_STATE_SAVE_VERSION,
      savedAt: new Date().toISOString(),
      gameState: { ...state, isLoaded: false },
      completedChapters: [...state.completedChapterIds],
      achievementRecords: [...state.achievementRecords],
      derivedResources: calculateMissionResources(state),
    };
    window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearSavedProgress(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.removeItem(GAME_STATE_KEY);
    window.localStorage.removeItem(ACADEMY_PROGRESS_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadCompletedAcademyChapters(): string[] {
  return loadGameStateDetailed().state?.completedChapterIds ?? (typeof window !== 'undefined' ? readLegacyChapters().filter((id) => academyChapterIds.includes(id)) : []);
}

export function saveCompletedAcademyChapters(chapterIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify(chapterIds.filter(isString)));
  } catch {
    // The versioned game save remains the source of truth for academy progress.
  }
}

export function loadSavedProgress(): MissionProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = rawValue ? JSON.parse(rawValue) : null;
    return isRecord(parsed) ? parsed as unknown as MissionProgress : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: MissionProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Keep the current game session usable when storage is unavailable.
  }
}

export function hasMeaningfulSavedProgress(state: GameState): boolean {
  return hasMeaningfulProgress(state);
}
