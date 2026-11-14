import { instrumentCatalog } from '../../data/instruments';
import { launchVehicleCatalog } from '../../data/launchVehicles';
import { spacecraftDesignCatalog } from '../../data/spacecraftDesigner';
import type { GameState } from '../../state/gameTypes';

export type ResourceStatus = 'ready' | 'caution' | 'critical' | 'unconfigured';
export type WarningSeverity = 'warning' | 'critical';

export interface MissionResourceWarning {
  id: string;
  severity: WarningSeverity;
  title: string;
  what: string;
  why: string;
  affectedSystem: string;
  recommendation: string;
}

export interface ResourceMetric {
  id: string;
  label: string;
  value: number | null;
  capacity: number | null;
  unit: string;
  status: ResourceStatus;
  detail: string;
}

export interface MissionResourceDashboard {
  metrics: ResourceMetric[];
  warnings: MissionResourceWarning[];
  spacecraftMassKg: number;
  estimatedHardwareCostUsd: number;
  totalEstimatedCostUsd: number;
  availablePowerW: number;
  requiredPowerW: number;
  rawScienceDataRateMbps: number;
  plannedScienceDataRateMbps: number;
  estimatedMissionDataGb: number;
  weeklyRecorderLoadGb: number;
  storageCapacityGb: number;
  downlinkMbps: number;
  dailyDownlinkCapacityGb: number;
  requiredDownlinkMbps: number;
  remainingBudgetUsd: number | null;
  launchCapacityKg: number | null;
  missionDurationDays: number | null;
}

export const RESOURCE_MODEL_ASSUMPTIONS = [
  'Selected component power draw and generation values are treated as simultaneous nominal steady loads and peak generation; eclipse, pointing, aging, and transient duty cycles are not simulated.',
  'Science instruments operate for 10% of each mission day on average. Data requirement reduces stored science volume to 10% for prioritized summaries, 50% for processed products, or 100% for a full record.',
  'Recorder sizing checks a seven-day science accumulation interval. The model assumes ground contact is available 10% of each day for scheduled contact and 35% for frequent relay access.',
  'Communication rates and storage capacities are simplified catalog estimates. This model does not calculate link budgets, compression algorithms, protocol overhead, or actual station availability.',
  'Mission duration is evaluated against the configured 1–3,650 Earth-day planning range and the presence of selected power, communication, and data-storage systems; component service-life qualification is not modeled.',
  'The budget includes selected spacecraft components, instruments, launch vehicle estimate, and user-entered mission expenses. Funding and expenses must be entered by the mission team.',
];

const SCIENCE_DUTY_CYCLE = 0.1;
const GB_PER_MBPS_HOUR = 0.45; // Decimal GB: 1 Mbps × 3,600 s ÷ 8 ÷ 1,000.
const DATA_REDUCTION_BY_REQUIREMENT: Record<string, number> = {
  summary: 0.1,
  'science-products': 0.5,
  'full-record': 1,
};

function statusFor(ratio: number | null): ResourceStatus {
  if (ratio === null) return 'unconfigured';
  if (ratio > 1) return 'critical';
  if (ratio > 0.85) return 'caution';
  return 'ready';
}

export function calculateMissionResources(state: GameState): MissionResourceDashboard {
  const components = spacecraftDesignCatalog.filter((item) => state.selectedSpacecraftComponentIds.includes(item.id));
  const instruments = instrumentCatalog.filter((item) => state.selectedInstrumentIds.includes(item.id));
  const vehicle = launchVehicleCatalog.find((item) => item.id === state.selectedLaunchVehicleId);
  const mission = state.missionConfiguration;
  const systemsMass = components.reduce((sum, item) => sum + item.massKg, 0);
  const instrumentMass = instruments.reduce((sum, item) => sum + item.massKg, 0);
  const spacecraftMassKg = systemsMass + instrumentMass;
  const hardwareCost = components.reduce((sum, item) => sum + item.estimatedCostUsd, 0) + instruments.reduce((sum, item) => sum + item.estimatedCostUsd, 0);
  const totalEstimatedCostUsd = hardwareCost + (vehicle?.estimatedCostUsd ?? 0);
  const availablePowerW = components.reduce((sum, item) => sum + item.powerGenerationW, 0);
  const adjustments = state.missionEngineeringAdjustments;
  const requiredPowerW = components.reduce((sum, item) => sum + item.powerConsumptionW, 0) + instruments.reduce((sum, item) => sum + item.powerConsumptionW, 0) * adjustments.instrumentPowerMultiplier;
  const rawScienceDataRateMbps = instruments.reduce((sum, item) => sum + item.dataGenerationMbps, 0);
  const dataReduction = DATA_REDUCTION_BY_REQUIREMENT[mission?.dataRequirement ?? ''] ?? 1;
  const plannedScienceDataRateMbps = rawScienceDataRateMbps * dataReduction * adjustments.dataVolumeMultiplier;
  const durationDays = mission?.missionDurationDays === null || mission?.missionDurationDays === undefined
    ? null
    : Math.max(1, Math.min(3650, mission.missionDurationDays + adjustments.missionDurationDeltaDays));
  const estimatedMissionDataGb = durationDays === null ? 0 : plannedScienceDataRateMbps * SCIENCE_DUTY_CYCLE * 24 * GB_PER_MBPS_HOUR * durationDays * adjustments.scienceOutputMultiplier;
  const weeklyRecorderLoadGb = plannedScienceDataRateMbps * SCIENCE_DUTY_CYCLE * 24 * GB_PER_MBPS_HOUR * 7 * adjustments.scienceOutputMultiplier;
  const storageCapacityGb = components.reduce((sum, item) => sum + (item.dataStorageGb ?? 0), 0);
  const downlinkMbps = components.reduce((sum, item) => sum + (item.downlinkMbps ?? 0), 0);
  const contactFraction = Math.min(0.8, (mission?.communicationRequirement === 'continuous-relay' ? 0.35 : 0.1) * adjustments.communicationCapacityMultiplier);
  const dailyDownlinkCapacityGb = downlinkMbps * 24 * contactFraction * GB_PER_MBPS_HOUR;
  const requiredDownlinkMbps = plannedScienceDataRateMbps * SCIENCE_DUTY_CYCLE / contactFraction;
  const missionDataPerDayGb = plannedScienceDataRateMbps * SCIENCE_DUTY_CYCLE * 24 * GB_PER_MBPS_HOUR;
  const funding = state.resourcePlan.initialFundingUsd;
  const expenses = state.resourcePlan.missionExpensesUsd;
  const totalEstimatedCostWithExpenses = totalEstimatedCostUsd + Math.max(0, (expenses ?? 0) + adjustments.missionExpenseDeltaUsd);
  const remainingBudgetUsd = funding !== null && expenses !== null ? funding - totalEstimatedCostWithExpenses : null;
  const launchCapacityKg = vehicle?.payloadCapacityKg ?? null;
  const massRatio = launchCapacityKg === null ? null : spacecraftMassKg / launchCapacityKg;
  const powerRatio = availablePowerW > 0 ? requiredPowerW / availablePowerW : requiredPowerW > 0 ? Infinity : null;
  const storageRatio = storageCapacityGb > 0 ? weeklyRecorderLoadGb / storageCapacityGb : weeklyRecorderLoadGb > 0 ? Infinity : null;
  const communicationRatio = dailyDownlinkCapacityGb > 0 ? missionDataPerDayGb / dailyDownlinkCapacityGb : missionDataPerDayGb > 0 ? Infinity : null;
  const budgetRatio = remainingBudgetUsd === null ? null : totalEstimatedCostWithExpenses / Math.max(funding ?? 0, 1);
  const durationValid = durationDays !== null && Number.isInteger(durationDays) && durationDays >= 1 && durationDays <= 3650;
  const hasPowerSource = components.some((item) => item.category === 'power');
  const hasCommunication = components.some((item) => item.category === 'communication');
  const hasStorage = components.some((item) => item.category === 'data-storage');
  const lifetimeSupported = durationValid && hasPowerSource && hasCommunication && (rawScienceDataRateMbps === 0 || hasStorage);

  const warnings: MissionResourceWarning[] = [];
  if (launchCapacityKg !== null && spacecraftMassKg > launchCapacityKg) warnings.push({
    id: 'excessive-mass', severity: 'critical', title: 'Launch payload limit exceeded',
    what: `Selected spacecraft mass is ${spacecraftMassKg.toLocaleString()} kg, above the ${launchCapacityKg.toLocaleString()} kg vehicle limit.`,
    why: `${vehicle?.name} cannot carry the current combination of spacecraft systems and science instruments within this educational payload limit.`,
    affectedSystem: 'Structure, payload integration, and launch vehicle',
    recommendation: 'Remove or replace heavy components and instruments, or select a compatible vehicle with more payload capacity.',
  });
  if (requiredPowerW > availablePowerW) warnings.push({
    id: 'insufficient-power', severity: 'critical', title: 'Power demand exceeds generation',
    what: `Selected systems require ${requiredPowerW.toLocaleString()} W while selected sources provide ${availablePowerW.toLocaleString()} W.`,
    why: 'The simultaneous nominal load of spacecraft systems and instruments is greater than the selected power generation.',
    affectedSystem: 'Power generation and payload operations',
    recommendation: 'Select a higher-output power source or reduce simultaneous instrument and subsystem loads.',
  });
  if (remainingBudgetUsd !== null && remainingBudgetUsd < 0) warnings.push({
    id: 'budget-exceeded', severity: 'critical', title: 'Mission budget exceeded',
    what: `Estimated spending exceeds entered funding by ${Math.abs(remainingBudgetUsd).toLocaleString()} USD.`,
    why: 'Selected hardware, launch vehicle estimate, and mission expenses are greater than the entered mission funding.',
    affectedSystem: 'Program budget and mission scope',
    recommendation: 'Reduce hardware or mission expenses, or revise the funding input to match the approved mission budget.',
  });
  if (rawScienceDataRateMbps > 0 && weeklyRecorderLoadGb > storageCapacityGb) warnings.push({
    id: 'insufficient-storage', severity: 'warning', title: 'Recorder capacity is below weekly science volume',
    what: `Estimated seven-day science data is ${weeklyRecorderLoadGb.toFixed(1)} GB versus ${storageCapacityGb.toFixed(1)} GB of selected storage.`,
    why: 'Under the stated observation and data-reduction assumptions, the recorder could fill before the next planned data return.',
    affectedSystem: 'Data storage and science observation scheduling',
    recommendation: 'Add the high-capacity recorder, choose a lower-volume data requirement, or reduce instrument observation time.',
  });
  if (missionDataPerDayGb > dailyDownlinkCapacityGb) warnings.push({
    id: 'communication-limitations', severity: 'warning', title: 'Communication capacity may limit science return',
    what: `Estimated science production is ${missionDataPerDayGb.toFixed(2)} GB/day versus ${dailyDownlinkCapacityGb.toFixed(2)} GB/day of modeled downlink.`,
    why: 'Selected radio throughput and contact cadence cannot return the planned daily science data volume in this simplified model.',
    affectedSystem: 'Communications and data return',
    recommendation: 'Select a higher-rate communication system, plan frequent relay access, or prioritize and reduce returned science data.',
  });
  if (!lifetimeSupported) {
    const reasons = [
      !durationValid ? 'the mission duration is missing or outside 1–3,650 days' : '',
      !hasPowerSource ? 'no power-generation system is selected' : '',
      !hasCommunication ? 'no communication system is selected' : '',
      rawScienceDataRateMbps > 0 && !hasStorage ? 'science instruments are selected without a data recorder' : '',
    ].filter(Boolean).join('; ');
    warnings.push({
      id: 'unsupported-duration', severity: 'warning', title: 'Mission duration is not supported by the selected systems',
      what: durationDays === null ? 'No mission duration is configured.' : `The ${durationDays}-day mission does not meet the dashboard’s support checks.`,
      why: `The planning model requires a valid duration and basic power, communication, and science-storage systems; ${reasons}.`,
      affectedSystem: 'Mission lifetime and end-to-end operations',
      recommendation: 'Set a valid mission duration, then select compatible power, communication, and data-storage systems for the planned mission.',
    });
  }

  const budgetConfigured = remainingBudgetUsd !== null;
  const massStatus = massRatio === null ? 'unconfigured' : statusFor(massRatio);
  const powerStatus = !hasPowerSource ? 'unconfigured' : statusFor(powerRatio);
  const budgetStatus: ResourceStatus = !budgetConfigured ? 'unconfigured' : remainingBudgetUsd! < 0 ? 'critical' : remainingBudgetUsd! < (funding ?? 0) * 0.15 ? 'caution' : 'ready';
  const dataStatus = rawScienceDataRateMbps === 0 ? 'unconfigured' : statusFor(storageRatio);
  const commStatus = rawScienceDataRateMbps === 0 ? (hasCommunication ? 'ready' : 'unconfigured') : statusFor(communicationRatio);
  const lifetimeStatus: ResourceStatus = lifetimeSupported ? 'ready' : durationDays === null ? 'unconfigured' : 'critical';

  const metrics: ResourceMetric[] = [
    { id: 'budget', label: 'Budget', value: remainingBudgetUsd, capacity: funding, unit: 'USD remaining', status: budgetStatus, detail: budgetConfigured ? `${totalEstimatedCostWithExpenses.toLocaleString()} USD estimated spend including user-entered expenses` : 'Enter funding and mission expenses to calculate the balance.' },
    { id: 'mass', label: 'Spacecraft Mass', value: spacecraftMassKg, capacity: launchCapacityKg, unit: 'kg', status: massStatus, detail: launchCapacityKg === null ? 'Select a launch vehicle to evaluate payload margin.' : `${Math.max(launchCapacityKg - spacecraftMassKg, 0).toLocaleString()} kg payload margin` },
    { id: 'generation', label: 'Power Generation', value: availablePowerW, capacity: null, unit: 'W nominal', status: hasPowerSource ? 'ready' : 'unconfigured', detail: hasPowerSource ? 'Sum of selected nominal power sources.' : 'No power source selected.' },
    { id: 'consumption', label: 'Power Consumption', value: requiredPowerW, capacity: availablePowerW || null, unit: 'W simultaneous', status: powerStatus, detail: `${Math.round((availablePowerW - requiredPowerW) * 10) / 10} W nominal power margin` },
    { id: 'communication', label: 'Communication', value: downlinkMbps, capacity: requiredDownlinkMbps || null, unit: 'Mbps downlink', status: commStatus, detail: `${dailyDownlinkCapacityGb.toFixed(2)} GB/day modeled capacity` },
    { id: 'storage', label: 'Data Storage', value: storageCapacityGb, capacity: weeklyRecorderLoadGb || null, unit: 'GB recorder', status: dataStatus, detail: `${weeklyRecorderLoadGb.toFixed(1)} GB estimated seven-day data volume` },
    { id: 'lifetime', label: 'Mission Lifetime', value: durationDays, capacity: 3650, unit: 'Earth days', status: lifetimeStatus, detail: lifetimeSupported ? 'Duration is within the planning range and basic systems are selected.' : 'Duration or required system support is incomplete.' },
  ];

  return {
    metrics, warnings, spacecraftMassKg, estimatedHardwareCostUsd: hardwareCost, totalEstimatedCostUsd,
    availablePowerW, requiredPowerW, rawScienceDataRateMbps, plannedScienceDataRateMbps,
    estimatedMissionDataGb, weeklyRecorderLoadGb, storageCapacityGb, downlinkMbps,
    dailyDownlinkCapacityGb, requiredDownlinkMbps, remainingBudgetUsd, launchCapacityKg, missionDurationDays: durationDays,
  };
}
