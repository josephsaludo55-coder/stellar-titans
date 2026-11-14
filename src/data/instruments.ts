import type { MissionArchitectureId, MissionDestinationId, MissionObjectiveId } from '../state/gameTypes';

export interface InstrumentProfile {
  id: string;
  name: string;
  scientificPurpose: string;
  description: string;
  massKg: number;
  powerConsumptionW: number;
  dataGenerationMbps: number;
  estimatedCostUsd: number;
  scientificValue: number;
  compatibleDestinations: MissionDestinationId[];
  compatibleArchitectures: MissionArchitectureId[];
  objectiveIds: MissionObjectiveId[];
  advantages: string[];
  limitations: string[];
}

const destinations: MissionDestinationId[] = ['moon', 'mars'];
const remoteArchitectures: MissionArchitectureId[] = ['orbiter', 'rover', 'space-probe'];
const surfaceArchitectures: MissionArchitectureId[] = ['lander', 'rover'];

export const instrumentCatalog: InstrumentProfile[] = [
  {
    id: 'scientific-camera', name: 'Scientific Camera', scientificPurpose: 'Document terrain, geology, and mission operations with visible-light images.',
    description: 'A calibrated visible-light camera for context imaging, site assessment, and surface change observations.',
    massKg: 8, powerConsumptionW: 18, dataGenerationMbps: 12, estimatedCostUsd: 420000, scientificValue: 4,
    compatibleDestinations: destinations, compatibleArchitectures: remoteArchitectures,
    objectiveIds: ['lunar-surface-exploration', 'mars-surface-exploration', 'lunar-geology'],
    advantages: ['Provides intuitive geological context', 'Useful for navigation and documentation'], limitations: ['Needs suitable illumination for many observations', 'Produces data that compete for storage and downlink'],
  },
  {
    id: 'spectrometer', name: 'Composition Spectrometer', scientificPurpose: 'Identify surface minerals and chemical composition from measured spectra.',
    description: 'A point or spot spectrometer that analyzes reflected light from selected surface targets.',
    massKg: 14, powerConsumptionW: 32, dataGenerationMbps: 2, estimatedCostUsd: 760000, scientificValue: 5,
    compatibleDestinations: destinations, compatibleArchitectures: surfaceArchitectures,
    objectiveIds: ['lunar-geology', 'lunar-resource-mapping', 'mars-geology', 'mars-past-water'],
    advantages: ['Directly supports mineral identification', 'Low data rate relative to image payloads'], limitations: ['Requires accurate pointing at a target', 'Surface dust and lighting can affect measurements'],
  },
  {
    id: 'radar', name: 'Ground-Penetrating Radar', scientificPurpose: 'Map subsurface layers, buried structures, and shallow ice.',
    description: 'A radar sounder that transmits pulses and measures echoes from below the surface.',
    massKg: 22, powerConsumptionW: 95, dataGenerationMbps: 8, estimatedCostUsd: 1350000, scientificValue: 5,
    compatibleDestinations: destinations, compatibleArchitectures: ['orbiter', 'rover'],
    objectiveIds: ['lunar-geology', 'lunar-resource-mapping', 'mars-geology', 'mars-past-water'],
    advantages: ['Reveals structure not visible in images', 'Can search for buried ice or layering'], limitations: ['High peak power demand', 'Interpretation depends on surface properties and geometry'],
  },
  {
    id: 'magnetometer', name: 'Vector Magnetometer', scientificPurpose: 'Measure magnetic fields and investigate planetary crust and space environments.',
    description: 'A triaxial sensor package for measuring local magnetic field strength and direction.',
    massKg: 3, powerConsumptionW: 6, dataGenerationMbps: 0.2, estimatedCostUsd: 310000, scientificValue: 4,
    compatibleDestinations: destinations, compatibleArchitectures: remoteArchitectures,
    objectiveIds: ['lunar-environment', 'mars-atmosphere', 'mars-geology'],
    advantages: ['Very low mass and data volume', 'Can characterize both local and ambient fields'], limitations: ['Spacecraft electronics can contaminate readings', 'Some targets have weak or spatially variable fields'],
  },
  {
    id: 'seismometer', name: 'Planetary Seismometer', scientificPurpose: 'Measure ground motion to study quakes, impacts, and planetary interior structure.',
    description: 'A precision ground-coupled sensor intended for stable, long-duration surface observations.',
    massKg: 11, powerConsumptionW: 7, dataGenerationMbps: 0.5, estimatedCostUsd: 980000, scientificValue: 5,
    compatibleDestinations: destinations, compatibleArchitectures: ['lander'],
    objectiveIds: ['lunar-geology', 'mars-geology'],
    advantages: ['Provides unique evidence about planetary interiors', 'Low average power and data rates'], limitations: ['Requires a stationary lander and good surface coupling', 'Sensitive to lander motion, wind, and thermal noise'],
  },
  {
    id: 'environmental-sensors', name: 'Environmental Sensor Suite', scientificPurpose: 'Characterize local pressure, temperature, radiation, and atmospheric conditions.',
    description: 'A compact sensor suite for recording environmental conditions throughout mission operations.',
    massKg: 5, powerConsumptionW: 10, dataGenerationMbps: 0.3, estimatedCostUsd: 285000, scientificValue: 3,
    compatibleDestinations: destinations, compatibleArchitectures: surfaceArchitectures,
    objectiveIds: ['lunar-environment', 'mars-atmosphere', 'mars-surface-exploration'],
    advantages: ['Supports both science and spacecraft operations', 'Collects continuous local context'], limitations: ['Limited spatial coverage at a fixed site', 'Sensor calibration and placement affect accuracy'],
  },
  {
    id: 'thermal-sensor', name: 'Thermal Infrared Sensor', scientificPurpose: 'Measure surface temperature and identify thermal properties or anomalies.',
    description: 'A radiometric sensor for mapping emitted infrared energy from terrain and targets.',
    massKg: 7, powerConsumptionW: 16, dataGenerationMbps: 1.5, estimatedCostUsd: 540000, scientificValue: 4,
    compatibleDestinations: destinations, compatibleArchitectures: remoteArchitectures,
    objectiveIds: ['lunar-surface-exploration', 'lunar-resource-mapping', 'mars-surface-exploration', 'mars-past-water'],
    advantages: ['Adds temperature information unavailable from visible images', 'Can reveal material and subsurface contrasts'], limitations: ['Needs careful calibration and viewing geometry', 'Thermal observations vary with local time'],
  },
  {
    id: 'spectral-imaging-system', name: 'Spectral Imaging System', scientificPurpose: 'Map mineral and material signatures over broad areas using many wavelength bands.',
    description: 'A multispectral imaging instrument that combines spatial maps with spectral signatures.',
    massKg: 19, powerConsumptionW: 54, dataGenerationMbps: 24, estimatedCostUsd: 1680000, scientificValue: 5,
    compatibleDestinations: destinations, compatibleArchitectures: ['orbiter', 'rover'],
    objectiveIds: ['lunar-geology', 'lunar-resource-mapping', 'mars-geology', 'mars-past-water'],
    advantages: ['Combines regional mapping with material identification', 'Supports discovery and follow-up targeting'], limitations: ['High data volume and power demand', 'Requires calibration and careful illumination management'],
  },
];

export function getInstrumentRecommendations(
  destination: MissionDestinationId | null,
  architecture: MissionArchitectureId | null,
  objectiveIds: MissionObjectiveId[],
) {
  return instrumentCatalog.map((instrument) => {
    const reasons: string[] = [];
    if (destination && instrument.compatibleDestinations.includes(destination)) reasons.push(`${destination === 'moon' ? 'Moon' : 'Mars'} compatible`);
    if (architecture && instrument.compatibleArchitectures.includes(architecture)) reasons.push(`${architecture.replace('-', ' ')} compatible`);
    const matched = objectiveIds.filter((id) => instrument.objectiveIds.includes(id));
    if (matched.length) reasons.push('matches mission objective');
    return { instrument, score: (matched.length ? 4 : 0) + (architecture && instrument.compatibleArchitectures.includes(architecture) ? 2 : 0) + (destination && instrument.compatibleDestinations.includes(destination) ? 1 : 0), reasons };
  }).sort((a, b) => b.score - a.score);
}
