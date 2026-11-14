import type { GameState, MissionEvaluationRecord, MissionScoreCategory, MissionSimulationState } from '../../state/gameTypes';

export const MISSION_SCORING_RUBRIC = [
  { id: 'objective-completion', label: 'Mission objective completion', maximum: 25, calculation: '25 × supported objectives ÷ configured objectives.' },
  { id: 'engineering-design', label: 'Engineering design', maximum: 15, calculation: '15 × installed design criteria ÷ 9 criteria (six core system categories, thermal control, battery reserve, and a redundant flight computer).' },
  { id: 'budget-management', label: 'Budget management', maximum: 10, calculation: '10 points within approved funding; above budget, score decreases by funding ÷ total spend.' },
  { id: 'mass-management', label: 'Mass management', maximum: 10, calculation: '10 × remaining launch payload margin ÷ vehicle payload limit; zero when at or above the limit.' },
  { id: 'power-management', label: 'Power management', maximum: 10, calculation: '10 × min(1, available generation ÷ simultaneous demand).' },
  { id: 'communication-planning', label: 'Communication planning', maximum: 10, calculation: '10 × science data transmitted ÷ science data collected.' },
  { id: 'data-management', label: 'Data management', maximum: 5, calculation: '5 × science data collected ÷ planned mission science volume.' },
  { id: 'scientific-value', label: 'Scientific value', maximum: 10, calculation: '10 × mean instrument value ÷ 5 × objective coverage × planned data captured.' },
  { id: 'mission-lifetime', label: 'Mission lifetime', maximum: 5, calculation: '5 × completed operating duration ÷ configured duration.' },
] as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const roundScore = (value: number) => Math.round(value * 100) / 100;

function makeCategory(
  id: string,
  evidence: string,
  ratio: number,
): MissionScoreCategory {
  const rubric = MISSION_SCORING_RUBRIC.find((item) => item.id === id)!;
  const score = roundScore(rubric.maximum * clamp01(ratio));
  return { id, label: rubric.label, score, maximum: rubric.maximum, calculation: rubric.calculation, evidence };
}

function scoreRating(score: number): MissionEvaluationRecord['rating'] {
  if (score >= 90) return 'OUTSTANDING MISSION';
  if (score >= 75) return 'SUCCESSFUL MISSION';
  if (score >= 50) return 'PARTIAL SUCCESS';
  return 'MISSION NEEDS IMPROVEMENT';
}

export function evaluateMissionPerformance(state: GameState, simulation: MissionSimulationState): MissionEvaluationRecord {
  const snapshot = simulation.snapshot;
  const objectivesTotal = simulation.objectiveResults.length;
  const objectivesComplete = simulation.objectiveResults.filter((item) => item.status === 'supported').length;
  const objectiveRatio = objectivesTotal > 0 ? objectivesComplete / objectivesTotal : 0;
  const requiredCategories = ['structure', 'power', 'propulsion', 'communication', 'flight-computer', 'data-storage'];
  const selectedCategories = new Set(snapshot.components.map((component) => component.category));
  const baseSystems = requiredCategories.filter((category) => selectedCategories.has(category)).length;
  const thermalControl = selectedCategories.has('thermal-control') ? 1 : 0;
  const batteryReserve = selectedCategories.has('batteries') ? 1 : 0;
  const redundantComputer = snapshot.components.some((component) => component.id === 'computer-redundant') ? 1 : 0;
  const designCriteria = baseSystems + thermalControl + batteryReserve + redundantComputer;
  const designRatio = designCriteria / 9;
  const budgetRatio = snapshot.initialFundingUsd > 0
    ? snapshot.totalMissionSpendUsd <= snapshot.initialFundingUsd ? 1 : snapshot.initialFundingUsd / snapshot.totalMissionSpendUsd
    : 0;
  const massMarginRatio = snapshot.launchVehicleCapacityKg > 0
    ? clamp01((snapshot.launchVehicleCapacityKg - snapshot.totalMassKg) / snapshot.launchVehicleCapacityKg)
    : 0;
  const powerRatio = snapshot.powerDemandW > 0 ? clamp01(snapshot.powerGenerationW / snapshot.powerDemandW) : 0;
  const communicationRatio = simulation.scienceDataCollectedGb > 0
    ? clamp01(simulation.dataTransmittedGb / simulation.scienceDataCollectedGb)
    : 0;
  const dataRatio = snapshot.estimatedMissionDataGb > 0
    ? clamp01(simulation.scienceDataCollectedGb / snapshot.estimatedMissionDataGb)
    : 0;
  const meanInstrumentValue = snapshot.instruments.length
    ? snapshot.instruments.reduce((sum, item) => sum + item.scientificValue, 0) / snapshot.instruments.length
    : 0;
  const scientificRatio = clamp01(meanInstrumentValue / 5) * objectiveRatio * dataRatio;
  const lifetimeRatio = snapshot.configuredDurationDays > 0
    ? clamp01(snapshot.durationDays / snapshot.configuredDurationDays)
    : 0;

  const categories = [
    makeCategory('objective-completion', `${objectivesComplete} of ${objectivesTotal} configured objectives have mapped instrument support.`, objectiveRatio),
    makeCategory('engineering-design', `${baseSystems}/6 core systems, thermal control ${thermalControl ? 'installed' : 'not installed'}, battery reserve ${batteryReserve ? 'installed' : 'not installed'}, redundant flight computer ${redundantComputer ? 'installed' : 'not installed'}.`, designRatio),
    makeCategory('budget-management', `$${snapshot.totalMissionSpendUsd.toLocaleString()} estimated total spend against $${snapshot.initialFundingUsd.toLocaleString()} entered funding.`, budgetRatio),
    makeCategory('mass-management', `${snapshot.totalMassKg.toLocaleString()} kg spacecraft against ${snapshot.launchVehicleCapacityKg.toLocaleString()} kg payload limit.`, massMarginRatio),
    makeCategory('power-management', `${snapshot.powerGenerationW.toLocaleString()} W generation against ${snapshot.powerDemandW.toLocaleString()} W simultaneous load.`, powerRatio),
    makeCategory('communication-planning', `${simulation.dataTransmittedGb.toFixed(2)} GB returned of ${simulation.scienceDataCollectedGb.toFixed(2)} GB collected.`, communicationRatio),
    makeCategory('data-management', `${simulation.scienceDataCollectedGb.toFixed(2)} GB collected of ${snapshot.estimatedMissionDataGb.toFixed(2)} GB planned science volume.`, dataRatio),
    makeCategory('scientific-value', `Mean instrument science value ${meanInstrumentValue.toFixed(1)} / 5; objective coverage ${(objectiveRatio * 100).toFixed(0)}%; planned data captured ${(dataRatio * 100).toFixed(0)}%.`, scientificRatio),
    makeCategory('mission-lifetime', `${snapshot.durationDays} operating days completed against ${snapshot.configuredDurationDays} configured days.`, lifetimeRatio),
  ];
  const overallScore = Math.round(categories.reduce((sum, item) => sum + item.score, 0));
  const rating = scoreRating(overallScore);
  const achievements = simulation.objectiveResults.filter((item) => item.status === 'supported').map((item) => item.objectiveName);
  const scientificAchievements = achievements.length
    ? [...achievements.map((objective) => `Objective supported: ${objective}`), `${simulation.dataTransmittedGb.toFixed(2)} GB of science data returned to Earth.`]
    : ['No configured objective received direct instrument support.', `${simulation.dataTransmittedGb.toFixed(2)} GB of science data returned to Earth.`];
  const engineeringSubtotalIds = new Set(['engineering-design', 'mass-management', 'power-management', 'mission-lifetime']);
  const engineeringSubtotal = categories.filter((item) => engineeringSubtotalIds.has(item.id)).reduce((sum, item) => sum + item.score, 0);
  const engineeringMax = categories.filter((item) => engineeringSubtotalIds.has(item.id)).reduce((sum, item) => sum + item.maximum, 0);
  const engineeringPerformance = {
    score: roundScore(engineeringSubtotal), maximum: engineeringMax,
    summary: `${roundScore(engineeringSubtotal)} of ${engineeringMax} points across subsystem completeness, payload margin, power adequacy, and mission lifetime.`,
  };
  const resourceEfficiency = categories.filter((item) => ['budget-management', 'mass-management', 'power-management', 'communication-planning', 'data-management'].includes(item.id)).map((item) => `${item.label}: ${item.score}/${item.maximum} — ${item.evidence}`);
  const resultsByObjective = new Map(simulation.objectiveResults.map((item) => [item.objectiveId, item]));
  const decisionRecords = state.missionEventDecisionHistory.filter((item) => item.selectedAt <= simulation.startedAt);
  const successfulDecisions: string[] = [];
  for (const record of decisionRecords) {
    const effect = record.engineeringEffects;
    let helped = false;
    if (effect.prioritizedObjectiveId) helped = resultsByObjective.get(effect.prioritizedObjectiveId)?.status === 'supported';
    if ((effect.instrumentPowerMultiplier ?? 1) < 1) helped ||= powerRatio >= 0.95 && simulation.scienceDataCollectedGb > 0;
    if ((effect.communicationCapacityMultiplier ?? 1) > 1) helped ||= simulation.dataTransmittedGb > 0;
    if ((effect.dataVolumeMultiplier ?? 1) < 1) helped ||= dataRatio > 0 && simulation.scienceDataCollectedGb <= snapshot.storageCapacityGb + snapshot.dailyDownlinkCapacityGb * snapshot.durationDays;
    if ((effect.missionDurationDeltaDays ?? 0) < 0) helped ||= lifetimeRatio > 0;
    if ((effect.missionExpenseDeltaUsd ?? 0) > 0) helped ||= budgetRatio >= 0.9;
    if ((effect.scienceOutputMultiplier ?? 1) > 1) helped ||= scientificRatio > 0;
    if (helped) successfulDecisions.push(`${record.decisionTitle}: ${record.consequences.join(' ')}`);
  }

  const engineeringProblems: string[] = [];
  const recommendations: string[] = [];
  const landingFailed = simulation.missionOutcome === 'failed';
  const problemAdvice: Record<string, string> = {
    'objective-completion': 'Select instruments that directly measure every priority objective and revise the observation plan.',
    'engineering-design': 'Complete the spacecraft system stack with compatible structure, power, propulsion, communications, flight computer, and data storage.',
    'budget-management': 'Reduce selected hardware or operations expense, or establish funding that covers the mission estimate.',
    'mass-management': 'Increase payload margin by removing or replacing heavy systems and instruments.',
    'power-management': 'Reduce simultaneous loads, schedule instruments, or choose a higher-output power source.',
    'communication-planning': 'Increase contact availability or prioritize science data so a larger share reaches Earth.',
    'data-management': 'Increase recorder/downlink capacity or revise the science data plan to capture more of the planned volume.',
    'scientific-value': 'Match higher-value instruments to mission objectives and ensure the planned science data is collected.',
    'mission-lifetime': 'Protect the configured mission duration by addressing resource constraints before operations.',
  };
  for (const category of categories) {
    if (category.score + 0.001 < category.maximum) {
      engineeringProblems.push(`${category.label}: ${category.score}/${category.maximum}. ${category.evidence}`);
      recommendations.push(problemAdvice[category.id]);
    }
  }
  if (landingFailed) {
    engineeringProblems.unshift('Mission failure: no safe landing was achieved after five attempts. No surface science was collected.');
    recommendations.unshift('Retry the descent with short engine bursts, avoid the marked rocks, and slow down before entering the landing zone.');
  }

  const teamPerformance = state.playerMode === 'team'
    ? state.team?.isConfirmed
      ? [`${state.team.name}: confirmed team of ${state.team.participants.length} participants.`, `${new Set(state.team.participants.map((item) => item.role)).size} distinct team roles assigned.`, `${state.decisionHistory.filter((item) => item.status === 'approved').length} team proposal(s) approved; ${decisionRecords.length} engineering response(s) recorded.`]
      : ['Team mode was selected, but the team roster was not confirmed for this mission.']
    : [`Individual mission command by ${state.player.name}.`, `${decisionRecords.length} engineering event response(s) recorded.`];

  const debrief = landingFailed
    ? `Mission failed after ${simulation.landingAttempts ?? 5} unsuccessful landing attempts. The spacecraft did not reach the surface, so no science objectives were completed. The design can be retried with a safer descent and a controlled touchdown.`
    : overallScore >= 90
    ? `The mission earned ${overallScore}/100 because its objective coverage and resource performance remained strong across the scored categories. ${successfulDecisions.length ? `Effective engineering decisions included ${successfulDecisions.map((item) => item.split(':')[0]).join(', ')}.` : 'No event response was recorded as a measurable contributor.'}`
    : overallScore >= 75
      ? `The mission earned ${overallScore}/100 and met most of its planned objectives. The largest deductions came from ${categories.filter((item) => item.score < item.maximum).sort((a, b) => a.score / a.maximum - b.score / b.maximum).slice(0, 2).map((item) => item.label.toLowerCase()).join(' and ') || 'limited engineering margin'}.`
      : `The mission earned ${overallScore}/100 because the completed run captured limited objective evidence or had substantial resource and design constraints. Review the lowest-scoring categories and their evidence before redesigning.`;

  return {
    id: simulation.startedAt,
    completedAt: simulation.completedAt ?? new Date().toISOString(),
    missionName: snapshot.missionName,
    destinationName: snapshot.destinationName,
    architectureName: snapshot.architectureName,
    overallScore,
    rating,
    categories,
    objectiveCompletion: { completed: objectivesComplete, total: objectivesTotal, achievements },
    engineeringPerformance,
    resourceEfficiency,
    scientificAchievements,
    teamPerformance,
    successfulDecisions,
    engineeringProblems,
    recommendations: [...new Set(recommendations)],
    engineeringDecisions: decisionRecords.map((record) => `${record.eventTitle} — ${record.decisionTitle}`),
    spacecraftSummary: {
      components: snapshot.components.map((item) => item.name),
      instruments: snapshot.instruments.map((item) => item.name),
      launchVehicleName: snapshot.launchVehicleName,
      trajectoryName: snapshot.trajectoryName,
      totalMassKg: snapshot.totalMassKg,
    },
    debrief,
    missionOutcome: landingFailed ? 'failed' : 'success',
  };
}
