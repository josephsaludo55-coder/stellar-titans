import { instrumentCatalog } from '../../data/instruments';
import { missionObjectives } from '../../data/missionDesign';
import { spacecraftDesignCatalog } from '../../data/spacecraftDesigner';
import { calculateMissionResources } from '../calculations/missionResources';
import type { GameState, MissionEventCategory, MissionObjectiveId } from '../../state/gameTypes';

export const MISSION_EVENT_ASSUMPTIONS = [
  'Event generation is deterministic: power events appear at 85% or more of nominal available generation; recorder events appear at 80% or more of weekly storage capacity; communication events appear when downlink margin is below 15%.',
  'Long-duration planning events appear when the adjusted mission duration exceeds 365 Earth days. Spacecraft resilience events are based on the selected thermal-control and flight-computer components.',
  'Decision effects apply to the mission operations model. Power scheduling changes simultaneous instrument demand; data management changes stored volume and/or science yield; additional relay time increases modeled contact capacity and mission expense.',
  'Values and consequences are simplified educational estimates. No random outcomes, orbital physics, component failures, or external communications conditions are simulated.',
];

export interface EngineeringDecisionEffect {
  instrumentPowerMultiplier?: number;
  scienceOutputMultiplier?: number;
  dataVolumeMultiplier?: number;
  communicationCapacityMultiplier?: number;
  missionDurationDeltaDays?: number;
  missionExpenseDeltaUsd?: number;
  prioritizedObjectiveId?: MissionObjectiveId | null;
  spacecraftHealthDelta?: number;
  alertDelta?: number;
}

export interface MissionEventDecisionOption {
  id: string;
  title: string;
  description: string;
  engineeringConsequences: string[];
  educationalExplanation: string;
  effect: EngineeringDecisionEffect;
}

export interface MissionEngineeringEvent {
  id: string;
  category: MissionEventCategory;
  title: string;
  situationDescription: string;
  affectedSystem: string;
  educationalExplanation: string;
  availableDecisions: MissionEventDecisionOption[];
  triggeredAt: string;
}

function getEventScope(state: GameState): string {
  const mission = state.missionConfiguration;
  const scope = `${mission?.missionName ?? 'mission'}:${mission?.destination ?? 'none'}:${mission?.updatedAt ?? 'draft'}`;
  return scope.toLowerCase().replace(/[^a-z0-9:.-]/g, '-');
}

export function getMissionEvents(state: GameState): MissionEngineeringEvent[] {
  const mission = state.missionConfiguration;
  const resources = calculateMissionResources(state);
  const components = spacecraftDesignCatalog.filter((item) => state.selectedSpacecraftComponentIds.includes(item.id));
  const instruments = instrumentCatalog.filter((item) => state.selectedInstrumentIds.includes(item.id));
  const unresolved = (id: string) => !state.missionEventDecisionHistory.some((decision) => decision.eventId === id);
  const scope = getEventScope(state);
  const events: MissionEngineeringEvent[] = [];
  const add = (event: Omit<MissionEngineeringEvent, 'triggeredAt'>) => {
    if (unresolved(event.id)) events.push({ ...event, triggeredAt: new Date().toISOString() });
  };
  const objectives = missionObjectives.filter((item) => mission?.objectiveIds.includes(item.id));

  const instrumentPowerDraw = instruments.reduce((sum, item) => sum + item.powerConsumptionW, 0);
  if (instruments.length && resources.availablePowerW > 0 && resources.requiredPowerW / resources.availablePowerW >= 0.85) {
    add({
      id: `power-management:${scope}`, category: 'power-management', title: 'Power margin is tight during science operations',
      situationDescription: `The selected spacecraft draws ${resources.requiredPowerW.toFixed(0)} W against ${resources.availablePowerW.toFixed(0)} W nominal generation. Instrument loads contribute ${instrumentPowerDraw.toFixed(0)} W and may compete for the available margin.`,
      affectedSystem: 'Power generation, instrument scheduling, and spacecraft bus loads',
      educationalExplanation: 'Instruments can have different operating modes. Scheduling high-load measurements at different times can reduce peak demand while preserving some total science time.',
      availableDecisions: [
        { id: 'sequence-instruments', title: 'Sequence instrument operations', description: 'Schedule high-draw instruments in separate operating windows.', engineeringConsequences: ['Reduces simultaneous instrument load by 28%.', 'Science collection throughput is reduced by 12% to account for shorter operating windows.'], educationalExplanation: 'Peak electrical load is set by simultaneous activity. Sequencing avoids adding generation hardware but requires a more constrained observation schedule.', effect: { instrumentPowerMultiplier: 0.72, scienceOutputMultiplier: 0.88, spacecraftHealthDelta: 2 } },
        { id: 'safe-mode-power', title: 'Use conservative low-power mode', description: 'Suspend selected non-priority payload activity and preserve power margin.', engineeringConsequences: ['Reduces instrument load by 45%.', 'Science collection throughput is reduced by 30%.', 'Adds 3 points to modeled spacecraft health.'], educationalExplanation: 'A safe operating mode protects essential spacecraft systems during a power constraint, at the cost of science opportunity.', effect: { instrumentPowerMultiplier: 0.55, scienceOutputMultiplier: 0.7, spacecraftHealthDelta: 3 } },
      ],
    });
  }

  if (instruments.length && resources.requiredDownlinkMbps > 0 && resources.downlinkMbps / resources.requiredDownlinkMbps < 1.15) {
    add({
      id: `communication:${scope}`, category: 'communication', title: 'Communication opportunities constrain data return',
      situationDescription: `The mission produces science at an estimated ${resources.requiredDownlinkMbps.toFixed(2)} Mbps required downlink rate; the selected radio provides ${resources.downlinkMbps.toFixed(2)} Mbps under the planned contact schedule.`,
      affectedSystem: 'Deep-space radio, contact schedule, and science data return',
      educationalExplanation: 'Communication capacity depends on both radio throughput and the time available to contact Earth or a relay. Mission teams can reduce returned data or arrange additional contact time.',
      availableDecisions: [
        { id: 'prioritize-downlink', title: 'Prioritize processed science products', description: 'Send compact, high-priority products first and defer full-resolution data.', engineeringConsequences: ['Reduces planned science data volume by 45%.', 'Science product completeness is reduced by 8%.'], educationalExplanation: 'Data prioritization improves the fraction of mission-critical information returned when bandwidth or contact time is limited.', effect: { dataVolumeMultiplier: 0.55, scienceOutputMultiplier: 0.92 } },
        { id: 'request-relay-window', title: 'Request an additional relay window', description: 'Allocate an extra modeled contact opportunity for this mission.', engineeringConsequences: ['Increases modeled communication capacity by 50%.', 'Adds $125,000 in estimated mission operations expense.'], educationalExplanation: 'More contact time increases total data return without changing the radio itself, but relay scheduling has a program cost.', effect: { communicationCapacityMultiplier: 1.5, missionExpenseDeltaUsd: 125000 } },
      ],
    });
  }

  if (instruments.length && resources.weeklyRecorderLoadGb / Math.max(resources.storageCapacityGb, 0.001) >= 0.8) {
    add({
      id: `data-storage:${scope}`, category: 'data-storage', title: 'Science data is approaching recorder capacity',
      situationDescription: `The estimated seven-day science volume is ${resources.weeklyRecorderLoadGb.toFixed(1)} GB; selected recorders provide ${resources.storageCapacityGb.toFixed(1)} GB.`,
      affectedSystem: 'Onboard data recorder and instrument observation plan',
      educationalExplanation: 'A recorder buffers data between communication opportunities. Compression and selective retention can protect capacity, but may remove detail or calibration products.',
      availableDecisions: [
        { id: 'compress-products', title: 'Compress and retain calibrated products', description: 'Keep reduced science products and discard redundant intermediate products.', engineeringConsequences: ['Reduces stored data volume by 50%.', 'Science output quality is reduced by 6%.'], educationalExplanation: 'Processing data onboard can reduce storage and downlink demand. The trade-off is less ability to reprocess discarded raw measurements.', effect: { dataVolumeMultiplier: 0.5, scienceOutputMultiplier: 0.94 } },
        { id: 'retain-priority-data', title: 'Retain only priority observations', description: 'Protect high-priority measurements and reduce secondary observation volume.', engineeringConsequences: ['Reduces stored data volume by 35%.', 'Science collection throughput is reduced by 18%.'], educationalExplanation: 'Data triage preserves the observations most likely to answer the mission question while sacrificing lower-priority coverage.', effect: { dataVolumeMultiplier: 0.65, scienceOutputMultiplier: 0.82 } },
      ],
    });
  }

  const uncoveredObjectives = objectives.filter((objective) => !instruments.some((instrument) => instrument.objectiveIds.includes(objective.id)));
  if (objectives.length && instruments.length && (uncoveredObjectives.length > 0 || instruments.some((item) => item.scientificValue >= 5))) {
    const supportedObjectives = objectives.filter((objective) => instruments.some((instrument) => instrument.objectiveIds.includes(objective.id)));
    const priorityOptions: MissionEventDecisionOption[] = supportedObjectives.slice(0, 3).map((objective) => ({
      id: `prioritize-${objective.id}`,
      title: `Prioritize: ${objective.name}`,
      description: `Concentrate science operations on ${objective.name.toLowerCase()}.`,
      engineeringConsequences: ['Sets this objective as the primary science priority.', 'Increases modeled science yield for the priority campaign by 8%.'],
      educationalExplanation: 'Explicit prioritization aligns operating time with a mission objective, but competing objectives may receive less attention.',
      effect: { prioritizedObjectiveId: objective.id, scienceOutputMultiplier: 1.08 },
    }));
    priorityOptions.push({ id: 'extend-integration-time', title: 'Extend instrument integration time', description: 'Collect longer observations with the current selected payload.', engineeringConsequences: ['Increases science yield by 15%.', 'Increases instrument power load by 12% and data volume by 15%.'], educationalExplanation: 'Longer integration can improve observation yield, but consumes more energy and generates additional data that must be stored and returned.', effect: { scienceOutputMultiplier: 1.15, instrumentPowerMultiplier: 1.12, dataVolumeMultiplier: 1.15 } });
    add({
      id: `scientific-operations:${scope}`, category: 'scientific-operations', title: uncoveredObjectives.length ? 'Some objectives lack direct instrument coverage' : 'High-value instruments need an observation priority',
      situationDescription: uncoveredObjectives.length ? `No selected instrument directly supports ${uncoveredObjectives.map((item) => item.name).join(', ')}.` : 'The selected payload can address the mission objectives, but high-value observations compete for operating time and resources.',
      affectedSystem: 'Instrument operations, observation schedule, and scientific return',
      educationalExplanation: 'Mission objectives should map to instrument measurements. Where time and resources are limited, a declared priority makes the science trade explicit.',
      availableDecisions: priorityOptions,
    });
  }

  const effectiveDuration = resources.missionDurationDays;
  if (mission && effectiveDuration !== null && effectiveDuration > 365) {
    add({
      id: `mission-lifetime:${scope}`, category: 'mission-lifetime', title: 'Long mission duration increases resource management demands',
      situationDescription: `The selected operating plan spans ${effectiveDuration} days. Power, data return, and system availability must be managed across the full mission lifetime.`,
      affectedSystem: 'Mission duration, operations funding, power and data budgets',
      educationalExplanation: 'Longer missions extend opportunities for observations but also increase exposure to resource limits and operations cost.',
      availableDecisions: [
        { id: 'shorten-campaign', title: 'Shorten the active science campaign by 30 days', description: 'Reduce the modeled operations period while retaining the current mission objectives.', engineeringConsequences: ['Reduces modeled mission duration by 30 days.', 'Reduces total science volume and duration-linked resource demand.'], educationalExplanation: 'A shorter campaign reduces lifetime exposure and operations demand, but provides fewer opportunities to collect observations.', effect: { missionDurationDeltaDays: -30, scienceOutputMultiplier: 0.95 } },
        { id: 'fund-extended-operations', title: 'Retain duration with extended operations support', description: 'Keep the planned lifetime and fund additional operations coverage.', engineeringConsequences: ['Adds $250,000 in estimated mission operations expense.', 'Preserves the configured science duration and adds 5% modeled science operations coverage.'], educationalExplanation: 'Operations support can preserve mission duration and maintain science coverage, but it consumes budget that could otherwise support hardware or other mission activities.', effect: { missionExpenseDeltaUsd: 250000, scienceOutputMultiplier: 1.05, spacecraftHealthDelta: 1 } },
      ],
    });
  }

  const hasThermalControl = components.some((item) => item.category === 'thermal-control');
  const computer = components.find((item) => item.category === 'flight-computer');
  const hasRedundantComputer = computer?.id === 'computer-redundant';
  if (mission && components.length && (!hasThermalControl || !hasRedundantComputer)) {
    const missing = [!hasThermalControl ? 'thermal control' : '', !hasRedundantComputer ? 'redundant flight-computer channel' : ''].filter(Boolean).join(' and ');
    add({
      id: `spacecraft-system-status:${scope}`, category: 'spacecraft-system-status', title: 'Spacecraft system resilience is limited',
      situationDescription: `The selected spacecraft lacks ${missing}. Continue operations with a conservative plan or accept lower fault tolerance.`,
      affectedSystem: 'Thermal control and flight-computer fault tolerance',
      educationalExplanation: 'Redundant control and thermal management can protect mission continuity. A safe mode lowers system demand but may limit payload activity.',
      availableDecisions: [
        { id: 'conservative-safe-mode', title: 'Adopt conservative system operations', description: 'Reduce non-essential instrument activity and protect spacecraft health.', engineeringConsequences: ['Reduces instrument power demand by 20%.', 'Reduces science output by 15%.', 'Adds 5 points to modeled spacecraft health.'], educationalExplanation: 'Conservative operations reduce strain on systems when the selected design has limited resilience, at the cost of science opportunity.', effect: { instrumentPowerMultiplier: 0.8, scienceOutputMultiplier: 0.85, spacecraftHealthDelta: 5, alertDelta: -1 } },
        { id: 'continue-nominal-ops', title: 'Continue nominal payload operations', description: 'Preserve the planned observation campaign and monitor system status closely.', engineeringConsequences: ['Increases modeled science yield by 5%.', 'Reduces modeled spacecraft health by 5 points due to accepted system risk.'], educationalExplanation: 'Maintaining payload activity can increase near-term science return while accepting greater operational risk from limited redundancy.', effect: { scienceOutputMultiplier: 1.05, spacecraftHealthDelta: -5, alertDelta: 1 } },
      ],
    });
  }

  return events;
}

export function resolveMissionEventDecision(state: GameState, eventId: string, decisionId: string): GameState {
  const event = getMissionEvents(state).find((item) => item.id === eventId);
  const decision = event?.availableDecisions.find((item) => item.id === decisionId);
  if (!event || !decision) return state;
  const effect = decision.effect;
  const adjustments = state.missionEngineeringAdjustments;
  const multiply = (current: number, delta: number | undefined) => Math.max(0.1, Math.min(3, current * (delta ?? 1)));
  const record = {
    id: `${event.id}:${decision.id}`,
    eventId: event.id,
    eventTitle: event.title,
    category: event.category,
    decisionId: decision.id,
    decisionTitle: decision.title,
    selectedAt: new Date().toISOString(),
    consequences: [...decision.engineeringConsequences],
    educationalExplanation: decision.educationalExplanation,
    engineeringEffects: { ...effect },
  };
  return {
    ...state,
    missionEngineeringAdjustments: {
      instrumentPowerMultiplier: multiply(adjustments.instrumentPowerMultiplier, effect.instrumentPowerMultiplier),
      scienceOutputMultiplier: multiply(adjustments.scienceOutputMultiplier, effect.scienceOutputMultiplier),
      dataVolumeMultiplier: multiply(adjustments.dataVolumeMultiplier, effect.dataVolumeMultiplier),
      communicationCapacityMultiplier: multiply(adjustments.communicationCapacityMultiplier, effect.communicationCapacityMultiplier),
      missionDurationDeltaDays: adjustments.missionDurationDeltaDays + (effect.missionDurationDeltaDays ?? 0),
      missionExpenseDeltaUsd: adjustments.missionExpenseDeltaUsd + (effect.missionExpenseDeltaUsd ?? 0),
      prioritizedObjectiveId: effect.prioritizedObjectiveId === undefined ? adjustments.prioritizedObjectiveId : effect.prioritizedObjectiveId,
    },
    missionEventDecisionHistory: [record, ...state.missionEventDecisionHistory],
    mission: {
      ...state.mission,
      health: Math.max(0, Math.min(100, state.mission.health + (effect.spacecraftHealthDelta ?? 0))),
      readiness: Math.max(0, Math.min(100, state.mission.readiness + (effect.spacecraftHealthDelta ?? 0))),
      alerts: Math.max(0, state.mission.alerts + (effect.alertDelta ?? 0)),
    },
  };
}
