import { instrumentCatalog } from '../../data/instruments';
import { launchVehicleCatalog, trajectoryCatalog } from '../../data/launchVehicles';
import { missionArchitectures, missionDestinations, missionObjectives } from '../../data/missionDesign';
import { spacecraftDesignCatalog } from '../../data/spacecraftDesigner';
import { calculateMissionResources } from '../calculations/missionResources';
import { validateSpacecraftSelection } from '../calculations/spacecraftDesign';
import { validateLaunchConfiguration } from '../validation/launchConfiguration';
import { validateMissionConfiguration } from '../validation/missionDesign';
import type { GameState, MissionLandingRecord, MissionScienceReport, MissionSimulationEvent, MissionSimulationPhase, MissionSimulationSnapshot, MissionSimulationState } from '../../state/gameTypes';

export const MISSION_SIMULATION_ASSUMPTIONS = [
  'This is a deterministic educational sequence model. It does not propagate orbits, calculate transfer windows, or model real launch vehicle performance.',
  'Instrument production uses the resource dashboard’s 10% observation duty cycle and configured data-reduction assumption.',
  'The mission data campaign is limited by recorder capacity plus modeled downlink capacity over the configured mission duration. Power shortfall, if a warning-level design is permitted, scales science collection by the available-to-required power ratio.',
  'Communication return capacity is modeled as daily downlink capacity multiplied by the configured mission duration. Actual ground contacts, link budgets, latency, and protocol overhead are not simulated.',
  'Mission performance is an educational index composed of weighted objective coverage (45%), science output (20%), data return (15%), and engineering margin (20%). A selected primary objective receives additional weight.',
];

const requiredComponentCategories = ['structure', 'power', 'propulsion', 'communication', 'flight-computer'] as const;

export function validateSimulationReadiness(state: GameState): string[] {
  const mission = state.missionConfiguration;
  const issues: string[] = [];
  if (!mission || !mission.isConfirmed || !validateMissionConfiguration(mission).isValid) issues.push('Confirm a complete mission configuration in Mission Design.');
  if (mission && mission.objectiveIds.length === 0) issues.push('Select at least one mission objective.');
  const components = spacecraftDesignCatalog.filter((item) => state.selectedSpacecraftComponentIds.includes(item.id));
  const componentCategories = new Set(components.map((item) => item.category));
  const missingCategories = requiredComponentCategories.filter((category) => !componentCategories.has(category));
  if (missingCategories.length) issues.push(`Select required spacecraft systems: ${missingCategories.map((item) => item.replace(/-/g, ' ')).join(', ')}.`);
  if (validateSpacecraftSelection(state.selectedSpacecraftComponentIds, mission).issues.length) issues.push('Resolve spacecraft system compatibility issues in Spacecraft Designer.');
  const instruments = instrumentCatalog.filter((item) => state.selectedInstrumentIds.includes(item.id));
  if (!instruments.length) issues.push('Select at least one scientific instrument.');
  if (mission && instruments.some((item) =>
    !mission.destination || !mission.architecture ||
    !item.compatibleDestinations.includes(mission.destination) ||
    !item.compatibleArchitectures.includes(mission.architecture) ||
    !item.objectiveIds.some((objectiveId) => mission.objectiveIds.includes(objectiveId)),
  )) issues.push('Resolve instrument destination, architecture, or objective compatibility in Instruments.');
  if (instruments.length && !componentCategories.has('data-storage')) issues.push('Select a data-storage system in Spacecraft Designer.');

  const resources = calculateMissionResources(state);
  const vehicle = launchVehicleCatalog.find((item) => item.id === state.selectedLaunchVehicleId);
  if (!vehicle || resources.spacecraftMassKg > vehicle.payloadCapacityKg) issues.push('Select a launch vehicle that can carry the configured spacecraft mass.');
  if (resources.remainingBudgetUsd === null || resources.remainingBudgetUsd < 0) issues.push('Enter mission funding and expenses, then bring the estimate within budget in Mission Control.');
  if (!componentCategories.has('power') || resources.availablePowerW < resources.requiredPowerW) issues.push('Provide sufficient power generation for simultaneous system and payload loads.');
  if (instruments.length && resources.weeklyRecorderLoadGb > resources.storageCapacityGb) issues.push('Increase recorder capacity or reduce the science data volume.');
  if (!componentCategories.has('communication') || resources.requiredDownlinkMbps > resources.downlinkMbps) issues.push('Configure a communication system that supports the mission data-return requirement.');
  if (!mission?.missionDurationDays || mission.missionDurationDays < 1 || mission.missionDurationDays > 3650) issues.push('Set a supported mission duration between 1 and 3,650 days.');
  if (!state.selectedLaunchVehicleId || !state.selectedTrajectoryId || !validateLaunchConfiguration(state).isValid) issues.push('Complete a compatible launch vehicle and trajectory configuration.');
  return [...new Set(issues)];
}

function createEvent(phase: MissionSimulationPhase, title: string, detail: string, severity: MissionSimulationEvent['severity'], eventIndex: number): MissionSimulationEvent {
  return { id: `${Date.now()}-${eventIndex}-${phase}`, phase, title, detail, severity, occurredAt: new Date().toISOString() };
}

function createSnapshot(state: GameState): MissionSimulationSnapshot | null {
  const mission = state.missionConfiguration;
  const destination = missionDestinations.find((item) => item.id === mission?.destination);
  const architecture = missionArchitectures.find((item) => item.id === mission?.architecture);
  const vehicle = launchVehicleCatalog.find((item) => item.id === state.selectedLaunchVehicleId);
  const trajectory = trajectoryCatalog.find((item) => item.id === state.selectedTrajectoryId);
  if (!mission?.destination || !mission.architecture || !destination || !architecture || !vehicle || !trajectory || !mission.missionDurationDays) return null;
  const resources = calculateMissionResources(state);
  if (resources.remainingBudgetUsd === null) return null;
  const components = spacecraftDesignCatalog.filter((item) => state.selectedSpacecraftComponentIds.includes(item.id));
  const instruments = instrumentCatalog.filter((item) => state.selectedInstrumentIds.includes(item.id));
  return {
    missionName: mission.missionName,
    destination: mission.destination,
    destinationName: destination.name,
    destinationEnvironment: destination.environment,
    architecture: mission.architecture,
    architectureName: architecture.name,
    durationDays: resources.missionDurationDays ?? mission.missionDurationDays,
    configuredDurationDays: mission.missionDurationDays,
    objectives: missionObjectives.filter((item) => mission.objectiveIds.includes(item.id)).map(({ id, name }) => ({ id, name })),
    requiredMeasurements: [...mission.requiredMeasurements],
    dataRequirement: mission.dataRequirement,
    communicationRequirement: mission.communicationRequirement,
    components: components.map((item) => ({ id: item.id, name: item.name, category: item.category, massKg: item.massKg, powerGenerationW: item.powerGenerationW, powerConsumptionW: item.powerConsumptionW, dataStorageGb: item.dataStorageGb ?? 0, downlinkMbps: item.downlinkMbps ?? 0 })),
    instruments: instruments.map((item) => ({ id: item.id, name: item.name, scientificPurpose: item.scientificPurpose, massKg: item.massKg, powerConsumptionW: item.powerConsumptionW, dataGenerationMbps: item.dataGenerationMbps, scientificValue: item.scientificValue, objectiveIds: [...item.objectiveIds] })),
    launchVehicleName: vehicle.name,
    launchVehicleCapacityKg: vehicle.payloadCapacityKg,
    launchCostUsd: vehicle.estimatedCostUsd,
    trajectoryName: trajectory.name,
    trajectoryPhase: trajectory.phase,
    totalMassKg: resources.spacecraftMassKg,
    totalEstimatedCostUsd: resources.totalEstimatedCostUsd,
    totalMissionSpendUsd: resources.totalEstimatedCostUsd + Math.max(0, (state.resourcePlan.missionExpensesUsd ?? 0) + state.missionEngineeringAdjustments.missionExpenseDeltaUsd),
    initialFundingUsd: state.resourcePlan.initialFundingUsd ?? 0,
    remainingBudgetUsd: resources.remainingBudgetUsd,
    powerGenerationW: resources.availablePowerW,
    powerDemandW: resources.requiredPowerW,
    storageCapacityGb: resources.storageCapacityGb,
    downlinkMbps: resources.downlinkMbps,
    dailyDownlinkCapacityGb: resources.dailyDownlinkCapacityGb,
    estimatedMissionDataGb: resources.estimatedMissionDataGb,
    prioritizedObjectiveId: state.missionEngineeringAdjustments.prioritizedObjectiveId,
    scienceOutputMultiplier: state.missionEngineeringAdjustments.scienceOutputMultiplier,
  };
}

export function startMissionSimulation(state: GameState): MissionSimulationState | null {
  if (validateSimulationReadiness(state).length) return null;
  const snapshot = createSnapshot(state);
  if (!snapshot) return null;
  const startedAt = new Date().toISOString();
  return {
    status: 'active', phase: 'pre-launch', snapshot,
    events: [createEvent('pre-launch', 'Pre-launch checks passed', `${snapshot.missionName}: ${snapshot.totalMassKg.toLocaleString()} kg spacecraft, ${snapshot.powerGenerationW} W power generation, ${snapshot.instruments.length} selected instruments, ${snapshot.launchVehicleName}, and ${snapshot.trajectoryName} verified against the educational mission checks.`, 'success', 1)],
    scienceDataCollectedGb: 0, dataTransmittedGb: 0, dataRetainedGb: 0,
    objectiveResults: [], performanceScore: null, resultSummary: null, startedAt, completedAt: null,
    landingAttempts: 0, missionOutcome: null, landingRecord: null, scienceReport: null,
  };
}

export function recordLandingFailure(simulation: MissionSimulationState | null): MissionSimulationState | null {
  if (!simulation || simulation.status !== 'active' || simulation.phase !== 'arrival' || simulation.missionOutcome === 'failed') return simulation;
  const landingAttempts = (simulation.landingAttempts ?? 0) + 1;
  const hasFailedMission = landingAttempts >= 5;
  const completedAt = hasFailedMission ? new Date().toISOString() : simulation.completedAt;
  const event = createEvent(
    hasFailedMission ? 'completion' : 'arrival',
    hasFailedMission ? 'Landing limit reached' : `Landing attempt ${landingAttempts} failed`,
    hasFailedMission
      ? `${simulation.snapshot.missionName} could not complete a safe landing after five attempts. The mission has ended with no surface science collected.`
      : `Landing attempt ${landingAttempts} did not reach the safe zone at a safe speed. The spacecraft remains available for another approach.`,
    'warning',
    simulation.events.length + 1,
  );
  return {
    ...simulation,
    landingAttempts,
    missionOutcome: hasFailedMission ? 'failed' : null,
    status: hasFailedMission ? 'completed' : 'active',
    phase: hasFailedMission ? 'completion' : 'arrival',
    completedAt,
    resultSummary: hasFailedMission ? 'Mission failed after five unsuccessful landing attempts.' : simulation.resultSummary,
    events: [...simulation.events, event],
  };
}

function makeLandingRecord(snapshot: MissionSimulationSnapshot, gridX: number, gridY: number): MissionLandingRecord {
  return {
    gridX: Number(Math.max(0, Math.min(100, gridX)).toFixed(1)),
    gridY: Number(Math.max(0, Math.min(100, gridY)).toFixed(1)),
    coordinateReference: 'Virtual surface grid, 0-100 units; educational simulation only',
    landedAt: new Date().toISOString(),
    modeledElapsedDays: snapshot.durationDays,
    missionStatus: 'landed',
  };
}

function createScienceCollection(snapshot: MissionSimulationSnapshot, landing: MissionLandingRecord): { report: MissionScienceReport; scienceDataCollectedGb: number; objectiveResults: MissionSimulationState['objectiveResults'] } {
  const linkCapacityGb = snapshot.dailyDownlinkCapacityGb * snapshot.durationDays;
  const capacityGb = snapshot.storageCapacityGb + linkCapacityGb;
  const powerFactor = snapshot.powerDemandW > 0 ? Math.min(1, snapshot.powerGenerationW / snapshot.powerDemandW) : 0;
  const scienceDataCollectedGb = Math.max(0, Math.min(snapshot.estimatedMissionDataGb, capacityGb) * powerFactor);
  const deployed = powerFactor > 0 ? snapshot.instruments : [];
  const moon = snapshot.destination === 'moon';
  const readings: MissionScienceReport['readings'] = [];
  const surfaceImages: MissionScienceReport['surfaceImages'] = [];
  const push = (instrumentId: string, category: string, metric: string, value: number, unit: string, interpretation: string) => {
    const instrument = deployed.find((item) => item.id === instrumentId);
    if (!instrument) return;
    readings.push({ id: `${instrumentId}-${metric.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, instrumentId, instrumentName: instrument.name, category, metric, value: Number(value.toFixed(2)), unit, interpretation });
  };
  const addImage = (instrumentId: string, title: string, caption: string) => {
    const instrument = deployed.find((item) => item.id === instrumentId);
    if (instrument) surfaceImages.push({ id: `${instrumentId}-surface-view`, instrumentId, instrumentName: instrument.name, title, caption });
  };

  if (deployed.some((item) => item.id === 'scientific-camera')) {
    addImage('scientific-camera', 'Landing site panorama', `A generated ${moon ? 'lunar' : 'martian'} surface view centered near virtual grid X ${landing.gridX}, Y ${landing.gridY}.`);
    addImage('scientific-camera', 'Terrain context frame', 'A second simulated frame records nearby terrain and landing conditions.');
  }
  if (deployed.some((item) => item.id === 'spectrometer' || item.id === 'spectral-imaging-system')) {
    const mineral = moon ? 'plagioclase-rich basaltic signature' : 'basaltic and iron-oxide spectral signature';
    if (deployed.some((item) => item.id === 'spectrometer')) push('spectrometer', 'Composition', 'Dominant spectral class', moon ? 1 : 1, 'class index', `The measured bands are consistent with a ${mineral}; this is a simplified simulated classification, not a laboratory-confirmed sample.`);
    if (deployed.some((item) => item.id === 'spectral-imaging-system')) push('spectral-imaging-system', 'Composition map', 'Mineral signature coverage', moon ? 68 : 74, '% of sampled scene', `The simulated map highlights areas with a ${mineral} signature for follow-up.`);
  }
  if (deployed.some((item) => item.id === 'thermal-sensor')) push('thermal-sensor', 'Temperature', 'Surface brightness temperature', moon ? -34 : -58, '°C', 'A single simulated surface observation; real values vary with local time, terrain, and viewing geometry.');
  if (deployed.some((item) => item.id === 'environmental-sensors')) {
    push('environmental-sensors', 'Temperature', moon ? 'Near-surface temperature' : 'Air temperature', moon ? -41 : -63, '°C', 'A simulated local sensor reading at the landing site.');
    push('environmental-sensors', 'Radiation', 'Dose rate', moon ? 0.34 : 0.22, 'mSv/day', 'Illustrative modeled surface dose rate; it is not a forecast or safety assessment.');
    if (!moon) {
      push('environmental-sensors', 'Atmosphere', 'Surface pressure', 610, 'Pa', 'A representative simulated pressure for a thin Mars-like atmosphere.');
      push('environmental-sensors', 'Atmosphere', 'Carbon dioxide fraction', 95.0, '%', 'A simplified modeled composition reading; no real atmosphere was sampled.');
    }
  }
  if (deployed.some((item) => item.id === 'radar')) {
    push('radar', 'Subsurface', 'Layered echo depth', 2.4, 'm', 'A modeled shallow reflector suggests a change in subsurface material; radar echoes alone do not confirm water or ice.');
    push('radar', 'Subsurface', 'Possible ice-like reflector index', 0.38, 'relative index', 'This ambiguous simulated echo can have several causes and is not evidence that water ice is present.');
  }
  if (deployed.some((item) => item.id === 'magnetometer')) push('magnetometer', 'Magnetism', 'Local magnetic field', moon ? 8.6 : 14.2, 'nT', 'A deterministic educational field value; spacecraft interference and local geology are not modeled.');
  if (deployed.some((item) => item.id === 'seismometer')) push('seismometer', 'Seismology', 'Ground motion RMS', moon ? 0.8 : 1.3, 'µm/s', 'A quiet-site simulated background measurement; no real quake or impact is asserted.');

  const objectiveResults = snapshot.objectives.map((objective) => {
    const supportingInstruments = deployed.filter((instrument) => instrument.objectiveIds.includes(objective.id)).map((instrument) => instrument.name);
    const supported = supportingInstruments.length > 0 && scienceDataCollectedGb > 0;
    return { objectiveId: objective.id, objectiveName: objective.name, supportingInstruments, status: supported ? 'supported' as const : 'unsupported' as const, finding: supported ? `Simulated measurements from ${supportingInstruments.join(', ')} provide evidence relevant to this objective.` : 'No selected instrument produced usable data for this objective.' };
  });
  const hasRadar = deployed.some((item) => item.id === 'radar');
  const hasComposition = deployed.some((item) => item.id === 'spectrometer' || item.id === 'spectral-imaging-system');
  const discoveries: MissionScienceReport['discoveries'] = [];
  if (hasComposition) discoveries.push({ id: 'composition-signature', title: 'Composition patterns mapped', evidence: readings.filter((reading) => reading.category.includes('Composition')).map((reading) => reading.metric).join(', '), interpretation: 'The simulated spectrum supports a broad material class for this site. A spectrum is an interpretation aid; it is not a returned sample or definitive mineral assay.', confidence: 'moderate' });
  if (hasRadar) discoveries.push({ id: 'subsurface-reflector', title: 'Subsurface reflector detected', evidence: 'Radar echo depth and relative reflector index', interpretation: 'The echo is consistent with a boundary between materials. It does not confirm water, ice, or any specific substance.', confidence: 'low' });
  if (deployed.some((item) => item.id === 'scientific-camera')) discoveries.push({ id: 'terrain-context', title: 'Landing terrain documented', evidence: 'Two generated camera frames from the virtual landing grid', interpretation: 'Images provide context for the simulated landing site and help relate instrument readings to visible terrain.', confidence: 'moderate' });
  const environmentalAnalysis = [
    `Destination model: ${snapshot.destinationName}. All values are deterministic educational simulation measurements.`,
    moon ? 'No atmospheric readings are generated for the Moon; its modeled environment is treated as airless.' : deployed.some((item) => item.id === 'environmental-sensors') ? 'Atmospheric pressure and composition are reported because the selected Environmental Sensor Suite supports them at Mars.' : 'Mars atmospheric values are unavailable because no Environmental Sensor Suite was selected.',
    hasRadar ? 'Radar returns are reported as ambiguous subsurface structure; no water or ice detection is confirmed.' : 'No subsurface or water-ice indicator is reported because Ground-Penetrating Radar was not selected.',
  ];
  const instrumentPowerWh = deployed.reduce((total, instrument) => total + instrument.powerConsumptionW, 0) * 24 * snapshot.durationDays * 0.1;
  return {
    report: { collectedAt: new Date().toISOString(), dataVolumeGb: scienceDataCollectedGb, instrumentPowerWh: Number(instrumentPowerWh.toFixed(1)), deployedInstrumentIds: deployed.map((instrument) => instrument.id), readings, surfaceImages, environmentalAnalysis, discoveries, simulationLabel: 'EDUCATIONAL MISSION SIMULATION DATA · NOT ACTUAL PLANETARY OR NASA RESULTS' },
    scienceDataCollectedGb,
    objectiveResults,
  };
}

export function confirmMissionLanding(simulation: MissionSimulationState | null, gridX: number, gridY: number): MissionSimulationState | null {
  if (!simulation || simulation.status !== 'active' || simulation.phase !== 'arrival' || simulation.missionOutcome === 'failed') return simulation;
  if (simulation.landingRecord && simulation.scienceReport) return simulation;
  const landingRecord = makeLandingRecord(simulation.snapshot, gridX, gridY);
  const { report, scienceDataCollectedGb, objectiveResults } = createScienceCollection(simulation.snapshot, landingRecord);
  const event = createEvent('arrival', 'Safe touchdown and science collection', `${simulation.snapshot.architectureName} landed safely at ${simulation.snapshot.destinationName}. ${report.deployedInstrumentIds.length} selected instrument(s) began collecting ${scienceDataCollectedGb.toFixed(2)} GB of simulated science data automatically.`, 'success', simulation.events.length + 1);
  return { ...simulation, missionOutcome: 'success', landingRecord, scienceReport: report, scienceDataCollectedGb, objectiveResults, events: [...simulation.events, event] };
}

const sequentialPhases: MissionSimulationPhase[] = ['pre-launch', 'countdown', 'launch', 'deployment', 'cruise', 'arrival', 'scientific-operations', 'communication', 'completion'];

export function advanceMissionSimulation(simulation: MissionSimulationState | null): MissionSimulationState | null {
  if (!simulation || simulation.status !== 'active') return simulation;
  const currentIndex = sequentialPhases.indexOf(simulation.phase);
  if (currentIndex < 0 || currentIndex >= sequentialPhases.length - 1 || simulation.phase === 'communication') return simulation;
  if (simulation.phase === 'arrival' && simulation.missionOutcome !== 'success') return simulation;
  if (simulation.phase === 'scientific-operations' && !simulation.scienceReport) return simulation;
  const nextPhase = sequentialPhases[currentIndex + 1];
  const snapshot = simulation.snapshot;
  const eventDetails: Record<MissionSimulationPhase, { title: string; detail: string; severity: MissionSimulationEvent['severity'] }> = {
    'pre-launch': { title: 'Pre-launch complete', detail: 'Mission configuration and selected systems passed the launch readiness gate.', severity: 'success' },
    countdown: { title: 'Countdown initiated', detail: `Final launch sequence started for ${snapshot.launchVehicleName}.`, severity: 'info' },
    launch: { title: 'Launch sequence complete', detail: `${snapshot.launchVehicleName} launch segment complete. This is a staged educational event and does not model vehicle flight dynamics.`, severity: 'success' },
    deployment: { title: 'Spacecraft separation confirmed', detail: `${snapshot.missionName} separated from its launch vehicle. ${snapshot.powerGenerationW} W nominal power and ${snapshot.downlinkMbps.toFixed(2)} Mbps downlink are available in the selected system model.`, severity: 'success' },
    cruise: { title: 'Cruise segment complete', detail: `The configured ${snapshot.durationDays}-day mission cruise is represented as a compressed sequence step; no orbital or trajectory physics are propagated.`, severity: 'info' },
    arrival: { title: `${snapshot.destinationName} arrival`, detail: `${snapshot.destinationEnvironment} Operations proceed according to the selected ${snapshot.architectureName.toLowerCase()} architecture.`, severity: 'success' },
    'scientific-operations': { title: 'Landing science dashboard ready', detail: `${simulation.scienceReport?.deployedInstrumentIds.length ?? 0} deployed instrument(s) automatically collected ${simulation.scienceDataCollectedGb.toFixed(2)} GB at touchdown.`, severity: 'success' },
    communication: { title: 'Communication pass ready', detail: `${snapshot.downlinkMbps.toFixed(2)} Mbps selected downlink supports up to ${snapshot.dailyDownlinkCapacityGb.toFixed(2)} GB/day in the simplified contact model.`, severity: 'info' },
    completion: { title: 'Mission evaluation ready', detail: 'Science collection and communication results are available for evaluation.', severity: 'success' },
  };
  const detail = eventDetails[nextPhase];
  return { ...simulation, phase: nextPhase, events: [...simulation.events, createEvent(nextPhase, detail.title, detail.detail, detail.severity, simulation.events.length + 1)] };
}

export function runMissionScience(simulation: MissionSimulationState | null): MissionSimulationState | null {
  if (!simulation || simulation.status !== 'active' || simulation.phase !== 'scientific-operations') return simulation;
  if (simulation.scienceReport) return { ...simulation, phase: 'communication' };
  const snapshot = simulation.snapshot;
  const missionLinkVolumeGb = snapshot.dailyDownlinkCapacityGb * snapshot.durationDays;
  const totalHandlingCapacityGb = snapshot.storageCapacityGb + missionLinkVolumeGb;
  const powerFactor = snapshot.powerDemandW > 0 ? Math.min(1, snapshot.powerGenerationW / snapshot.powerDemandW) : 0;
  const scienceDataCollectedGb = Math.min(snapshot.estimatedMissionDataGb, totalHandlingCapacityGb) * powerFactor;
  const objectiveResults = snapshot.objectives.map((objective) => {
    const supportingInstruments = snapshot.instruments.filter((instrument) => instrument.objectiveIds.includes(objective.id)).map((instrument) => instrument.name);
    const supported = supportingInstruments.length > 0 && scienceDataCollectedGb > 0;
    return {
      objectiveId: objective.id,
      objectiveName: objective.name,
      supportingInstruments,
      status: supported ? 'supported' as const : 'unsupported' as const,
      finding: supported ? `Data collected by ${supportingInstruments.join(', ')} addresses this objective.` : 'No selected instrument is mapped to this objective; the objective remains unaddressed.',
    };
  });
  const unsupportedCount = objectiveResults.filter((item) => item.status === 'unsupported').length;
  const event = createEvent('scientific-operations', 'Instrument campaign complete', `${snapshot.instruments.map((item) => item.name).join(', ')} collected ${scienceDataCollectedGb.toFixed(2)} GB of science data under the configured mission duration, storage, downlink, and power assumptions. ${unsupportedCount} of ${objectiveResults.length} objectives lack a mapped instrument.`, unsupportedCount ? 'warning' : 'success', simulation.events.length + 1);
  return { ...simulation, phase: 'communication', scienceDataCollectedGb, objectiveResults, events: [...simulation.events, event] };
}

export function transmitMissionData(simulation: MissionSimulationState | null): MissionSimulationState | null {
  if (!simulation || simulation.status !== 'active' || simulation.phase !== 'communication') return simulation;
  const capacity = simulation.snapshot.dailyDownlinkCapacityGb * simulation.snapshot.durationDays;
  const dataTransmittedGb = Math.min(simulation.scienceDataCollectedGb, capacity);
  const dataRetainedGb = Math.max(0, simulation.scienceDataCollectedGb - dataTransmittedGb);
  const event = createEvent('communication', 'Data return complete', `Earth received ${dataTransmittedGb.toFixed(2)} GB of ${simulation.scienceDataCollectedGb.toFixed(2)} GB collected. ${dataRetainedGb.toFixed(2)} GB remains in the onboard recorder in this simplified model.`, dataRetainedGb > 0 ? 'warning' : 'success', simulation.events.length + 1);
  return { ...simulation, phase: 'completion', dataTransmittedGb, dataRetainedGb, events: [...simulation.events, event] };
}

export function completeMissionSimulation(simulation: MissionSimulationState | null): MissionSimulationState | null {
  if (!simulation || simulation.status !== 'active' || simulation.phase !== 'completion') return simulation;
  const completedAt = new Date().toISOString();
  const event = createEvent('completion', 'Mission run complete', 'Operational results are finalized. The dedicated Mission Evaluation scoring service calculates the weighted performance report.', 'success', simulation.events.length + 1);
  return { ...simulation, status: 'completed', performanceScore: null, resultSummary: null, completedAt, events: [...simulation.events, event] };
}
