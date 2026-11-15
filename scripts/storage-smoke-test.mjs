import { build } from 'esbuild';

const testSource = String.raw`
import { GAME_STATE_SAVE_VERSION, clearSavedProgress, loadGameStateDetailed, saveGameState } from './src/services/storage';
import { initialGameState } from './src/state/gameState';
import { gameReducer } from './src/state/gameReducer';
import { spacecraftDesignCatalog } from './src/data/spacecraftDesigner';
import { instrumentCatalog } from './src/data/instruments';
import { getInstrumentRecommendations } from './src/data/instruments';
import { calculateMissionResources } from './src/services/calculations/missionResources';
import { validateSimulationReadiness } from './src/services/simulation/missionSimulation';

const data = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => data.has(key) ? data.get(key) : null,
  setItem: (key, value) => data.set(key, String(value)),
  removeItem: (key) => data.delete(key),
} };
function check(condition, label) { if (!condition) throw new Error('FAILED: ' + label); console.log('PASS ' + label); }

const report = {
  id: 'run-1', completedAt: '2026-11-14T10:00:00.000Z', missionName: 'Lunar Echo', destinationName: 'Moon', architectureName: 'Lander',
  overallScore: 82, rating: 'SUCCESSFUL MISSION',
  categories: [{ id: 'science', label: 'Science', score: 8, maximum: 10, calculation: 'Supported objectives', evidence: '1 supported' }],
  objectiveCompletion: { completed: 1, total: 1, achievements: ['Lunar geology'] },
  engineeringPerformance: { score: 12, maximum: 15, summary: 'Systems balanced' },
  resourceEfficiency: ['Power margin maintained'], scientificAchievements: ['Surface geology measured'], teamPerformance: ['Crew coordinated'],
  successfulDecisions: ['Reduced instrument duty cycle'], engineeringProblems: [], recommendations: ['Keep the power margin'], engineeringDecisions: ['Power event: reduce duty cycle'],
  spacecraftSummary: { components: ['Core bus'], instruments: ['Camera'], launchVehicleName: 'Education Lift', trajectoryName: 'Lunar transfer', totalMassKg: 700 }, debrief: 'The mission returned useful data.'
};
const state = {
  ...initialGameState,
  isLoaded: true,
  player: { ...initialGameState.player, name: 'Test Commander' },
  team: { name: 'Orbit Crew', isConfirmed: true, confirmedAt: '2026-11-14T09:00:00.000Z', participants: [{ id: 'crew-1', name: 'Test Commander', role: 'mission-commander' }] },
  mission: { ...initialGameState.mission, stage: 'mission-simulation' },
  missionConfiguration: { missionName: 'Lunar Echo', destination: 'moon', architecture: 'lander', objectiveIds: ['lunar-geology'], missionDurationDays: 30, requiredMeasurements: ['surface composition'], communicationRequirement: 'standard', dataRequirement: 'science-products', isConfirmed: true, updatedAt: '2026-11-14T09:00:00.000Z' },
  selectedSpacecraftComponentIds: [spacecraftDesignCatalog[0].id],
  selectedInstrumentIds: [instrumentCatalog[0].id],
  selectedLaunchVehicleId: 'education-lift', selectedTrajectoryId: 'moon-transfer',
  resourcePlan: { initialFundingUsd: 50000000, missionExpensesUsd: 1000000 },
  completedChapterIds: ['apollo-11-descent'],
  achievementRecords: [{ id: 'first-flight', title: 'First Flight', description: 'Completed the first mission.', earnedAt: '2026-11-14T10:00:00.000Z', evidence: 'Lunar Echo' }],
  missionEvaluationHistory: [report],
};

check(saveGameState(state), 'save progress to LocalStorage');
const saved = JSON.parse(data.get('space-mission-beyond-earth-state'));
check(saved.saveVersion === GAME_STATE_SAVE_VERSION && typeof saved.savedAt === 'string' && saved.derivedResources, 'write versioned structured JSON and resource snapshot');
const restored = loadGameStateDetailed();
check(restored.state?.player.name === 'Test Commander' && restored.state.team?.name === 'Orbit Crew', 'restore player and team information');
check(restored.state?.missionConfiguration?.missionName === 'Lunar Echo' && restored.state.selectedInstrumentIds.length === 1 && restored.state.selectedSpacecraftComponentIds.length === 1, 'restore mission, spacecraft, and instruments');
check(restored.state?.mission.stage === 'mission-simulation' && restored.state.missionEvaluationHistory[0]?.overallScore === 82, 'refresh and restore mission checkpoint and previous result');
check(restored.state?.completedChapterIds.includes('apollo-11-descent') && restored.state.achievementRecords[0]?.id === 'first-flight', 'restore chapters and achievements');

const advanced = gameReducer(restored.state, { type: 'SET_STAGE', stage: 'mission-events' });
saveGameState(advanced);
check(loadGameStateDetailed().state?.mission.stage === 'mission-events', 'continue mission from saved checkpoint');
const nextFlight = gameReducer(advanced, { type: 'START_NEW_MISSION' });
check(nextFlight.missionConfiguration === null && nextFlight.missionEvaluationHistory.length === 1 && nextFlight.completedChapterIds.length === 1, 'start a new mission while retaining history and training');

data.set('space-mission-beyond-earth-state', '{damaged json');
const corrupt = loadGameStateDetailed();
check(corrupt.state === null && Boolean(corrupt.warning), 'recover safely from corrupted saved data');
data.set('space-mission-beyond-earth-state', JSON.stringify({ saveVersion: 999 }));
check(Boolean(loadGameStateDetailed().warning), 'reject unsupported save versions with a recovery message');
check(clearSavedProgress() && data.size === 0, 'reset saved progress and legacy keys');
const reset = gameReducer(nextFlight, { type: 'RESET_PROGRESS' });
check(reset.mission.stage === 'welcome' && reset.missionEvaluationHistory.length === 0 && reset.completedChapterIds.length === 0, 'reset in-memory progress');

let flight = { ...initialGameState };
const objective = 'lunar-geology';
flight = gameReducer(flight, { type: 'UPDATE_MISSION_CONFIGURATION', configuration: {
  missionName: 'First Lunar Flight', destination: 'moon', architecture: 'lander', objectiveIds: [objective], missionDurationDays: 14,
  requiredMeasurements: ['Mineral spectra', 'Crater and terrain imagery'], communicationRequirement: 'scheduled', dataRequirement: 'science-products', isConfirmed: false, updatedAt: null,
} });
flight = gameReducer(flight, { type: 'CONFIRM_MISSION_CONFIGURATION', confirmedAt: new Date().toISOString() });
flight = gameReducer(flight, { type: 'SET_SPACECRAFT_COMPONENTS', componentIds: ['structure-core-bus', 'power-solar-wings', 'propulsion-chemical', 'communication-high-gain', 'computer-rad-tolerant', 'storage-solid-state'] });
const recommendedInstrument = getInstrumentRecommendations('moon', 'lander', [objective]).find(({ instrument }) => instrument.compatibleDestinations.includes('moon') && instrument.compatibleArchitectures.includes('lander') && instrument.objectiveIds.includes(objective))?.instrument;
if (!recommendedInstrument) throw new Error('No compatible science instrument is available for the lunar geology objective.');
flight = gameReducer(flight, { type: 'SET_INSTRUMENTS', instrumentIds: [recommendedInstrument.id] });
flight = gameReducer(flight, { type: 'SET_LAUNCH_CONFIGURATION', launchVehicleId: 'horizon-heavy', trajectoryId: 'lunar-surface-delivery' });
const estimatedCost = calculateMissionResources(flight).totalEstimatedCostUsd;
flight = gameReducer(flight, { type: 'UPDATE_RESOURCE_PLAN', payload: { initialFundingUsd: estimatedCost, missionExpensesUsd: 0 } });
check(validateSimulationReadiness(flight).length === 0, 'configured mission passes all pre-launch checks');
flight = gameReducer(flight, { type: 'START_MISSION_SIMULATION' });
check(flight.missionSimulation?.phase === 'pre-launch', 'preflight starts the real configured mission');
while (flight.missionSimulation?.phase !== 'scientific-operations' && flight.missionSimulation?.phase !== 'completion') {
  if (flight.missionSimulation?.phase === 'arrival') {
    flight = gameReducer(flight, { type: 'CONFIRM_MISSION_LANDING', gridX: 84.5, gridY: 88 });
    flight = gameReducer(flight, { type: 'ADVANCE_MISSION_SIMULATION' });
  } else {
    flight = gameReducer(flight, { type: 'ADVANCE_MISSION_SIMULATION' });
  }
}
flight = gameReducer(flight, { type: 'RUN_MISSION_SCIENCE' });
check(flight.missionSimulation?.phase === 'communication' && flight.missionSimulation.scienceDataCollectedGb > 0 && flight.missionSimulation.scienceReport?.readings.length, 'successful touchdown automatically records landing coordinates and collects data from selected instruments');
flight = gameReducer(flight, { type: 'TRANSMIT_MISSION_DATA' });
flight = gameReducer(flight, { type: 'COMPLETE_MISSION_SIMULATION' });
check(flight.missionSimulation?.status === 'completed' && flight.missionEvaluationHistory.length === 1, 'data return produces saved mission evaluation');
`;

const result = await build({
  stdin: { contents: testSource, resolveDir: process.cwd(), sourcefile: 'storage-smoke-test.ts', loader: 'ts' },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
});
const code = result.outputFiles[0].text;
try {
  await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
