import type { MissionArchitectureId, MissionDestinationId, MissionObjectiveId } from '../state/gameTypes';

export interface MissionDestinationOption {
  id: MissionDestinationId;
  name: string;
  description: string;
  environment: string;
  designPrompt: string;
}

export interface MissionArchitectureOption {
  id: MissionArchitectureId;
  name: string;
  description: string;
  operation: string;
  includesSurfaceLanding: boolean;
  includesMobility: boolean;
  destinations: MissionDestinationId[];
}

export interface MissionObjectiveOption {
  id: MissionObjectiveId;
  destination: MissionDestinationId;
  name: string;
  explanation: string;
  measurements: Array<{ name: string; explanation: string }>;
  compatibleArchitectures: MissionArchitectureId[];
}

export interface MissionRequirementOption {
  id: string;
  name: string;
  description: string;
}

export const missionDestinations: MissionDestinationOption[] = [
  {
    id: 'moon',
    name: 'Moon',
    description: 'A nearby airless world with accessible terrain and varied local environments.',
    environment: 'No atmosphere to provide aerodynamic braking; surface operations depend on a designed landing system.',
    designPrompt: 'Will your mission observe from orbit, land at a site, or travel across the surface?',
  },
  {
    id: 'mars',
    name: 'Mars',
    description: 'A rocky planet with a thin atmosphere, diverse geology, and a long history of exploration.',
    environment: 'Interplanetary communication delay, dust, cold, and terrain shape spacecraft and operations choices.',
    designPrompt: 'Which orbital or surface evidence can best answer your scientific question?',
  },
];

export const missionArchitectures: MissionArchitectureOption[] = [
  {
    id: 'orbiter',
    name: 'Orbiter',
    description: 'A spacecraft that enters orbit around its destination and conducts remote observations.',
    operation: 'Observes over repeated passes and can map broad regions without landing.',
    includesSurfaceLanding: false,
    includesMobility: false,
    destinations: ['moon', 'mars'],
  },
  {
    id: 'lander',
    name: 'Lander',
    description: 'A spacecraft designed to descend and operate from a selected surface location.',
    operation: 'Provides a stationary surface platform for instruments and local measurements.',
    includesSurfaceLanding: true,
    includesMobility: false,
    destinations: ['moon', 'mars'],
  },
  {
    id: 'rover',
    name: 'Rover',
    description: 'A mobile surface laboratory carried by a landing and deployment system.',
    operation: 'Combines entry, descent, and landing hardware with a mobility system to investigate multiple nearby sites.',
    includesSurfaceLanding: true,
    includesMobility: true,
    destinations: ['moon', 'mars'],
  },
  {
    id: 'space-probe',
    name: 'Space Probe',
    description: 'An uncrewed spacecraft for close approach, flyby, or other focused remote investigation.',
    operation: 'Carries instruments through or near the target environment; a probe architecture does not imply a surface landing.',
    includesSurfaceLanding: false,
    includesMobility: false,
    destinations: ['moon', 'mars'],
  },
];

export const missionObjectives: MissionObjectiveOption[] = [
  {
    id: 'lunar-surface-exploration',
    destination: 'moon',
    name: 'Lunar surface exploration',
    explanation: 'Investigate the lunar surface directly, comparing terrain and local conditions across more than one site.',
    measurements: [
      { name: 'Surface images', explanation: 'Document terrain, rocks, and nearby features.' },
      { name: 'Local temperature', explanation: 'Measure thermal conditions at the surface.' },
      { name: 'Surface composition', explanation: 'Characterize selected rocks or soil at the landing area.' },
    ],
    compatibleArchitectures: ['rover'],
  },
  {
    id: 'lunar-geology',
    destination: 'moon',
    name: 'Lunar geological investigation',
    explanation: 'Study lunar materials and landforms to understand how the Moon’s surface formed and changed.',
    measurements: [
      { name: 'Mineral spectra', explanation: 'Compare reflected light signatures to identify candidate minerals.' },
      { name: 'Crater and terrain imagery', explanation: 'Map landforms and geological context.' },
      { name: 'Surface chemistry', explanation: 'Measure elemental or chemical properties at a selected site.' },
    ],
    compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
  },
  {
    id: 'lunar-resource-mapping',
    destination: 'moon',
    name: 'Lunar resource mapping',
    explanation: 'Map candidate resources such as water-related signatures to inform future exploration planning.',
    measurements: [
      { name: 'Hydrogen abundance', explanation: 'Map hydrogen-related signals as a proxy for potential volatile-bearing regions.' },
      { name: 'Neutron count rate', explanation: 'Use neutron measurements to investigate near-surface hydrogen distribution.' },
      { name: 'Illumination and terrain map', explanation: 'Assess access, slope, and lighting context for candidate sites.' },
    ],
    compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
  },
  {
    id: 'lunar-environment',
    destination: 'moon',
    name: 'Lunar environment observation',
    explanation: 'Characterize selected environmental conditions that affect spacecraft and surface operations.',
    measurements: [
      { name: 'Radiation environment', explanation: 'Record radiation conditions relevant to spacecraft systems and future operations.' },
      { name: 'Temperature cycle', explanation: 'Observe how local temperature changes with illumination.' },
      { name: 'Dust environment', explanation: 'Observe or characterize dust-related conditions at the mission site.' },
    ],
    compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
  },
  {
    id: 'mars-geology',
    destination: 'mars',
    name: 'Geological investigation',
    explanation: 'Examine Martian rocks, minerals, and landforms to reconstruct the planet’s geological history.',
    measurements: [
      { name: 'Rock and terrain images', explanation: 'Provide context for surface features and geological relationships.' },
      { name: 'Mineral spectra', explanation: 'Measure wavelength signatures that help characterize surface materials.' },
      { name: 'Elemental composition', explanation: 'Measure selected chemical elements in rocks or soil.' },
    ],
    compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
  },
  {
    id: 'mars-past-water',
    destination: 'mars',
    name: 'Search for evidence of past water',
    explanation: 'Look for geological or mineral evidence that water once altered the Martian surface.',
    measurements: [
      { name: 'Hydrated mineral signatures', explanation: 'Search spectral data for minerals associated with water-rock interaction.' },
      { name: 'Sedimentary textures', explanation: 'Image layering and textures that can preserve environmental clues.' },
      { name: 'Elemental composition', explanation: 'Measure chemistry that helps interpret how rocks formed or changed.' },
    ],
    compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
  },
  {
    id: 'mars-atmosphere',
    destination: 'mars',
    name: 'Atmospheric investigation',
    explanation: 'Measure selected atmospheric conditions and processes over time or across the planet.',
    measurements: [
      { name: 'Atmospheric temperature and pressure', explanation: 'Track local or regional atmospheric conditions.' },
      { name: 'Wind speed and direction', explanation: 'Measure atmospheric motion at the observation site.' },
      { name: 'Atmospheric composition', explanation: 'Measure selected gases or atmospheric constituents.' },
    ],
    compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
  },
  {
    id: 'mars-surface-exploration',
    destination: 'mars',
    name: 'Surface exploration',
    explanation: 'Travel over the surface to compare multiple sites and investigate local materials directly.',
    measurements: [
      { name: 'Traverse images', explanation: 'Document the route, terrain, and selected sites.' },
      { name: 'Surface composition', explanation: 'Measure the properties of rocks or soil at stops along the traverse.' },
      { name: 'Terrain and mobility data', explanation: 'Record slope, obstacles, and vehicle motion to support safe routing.' },
    ],
    compatibleArchitectures: ['rover'],
  },
];

export const communicationRequirements: MissionRequirementOption[] = [
  { id: 'scheduled', name: 'Scheduled contact windows', description: 'Plan regular check-ins and data-return sessions around ground-station availability.' },
  { id: 'priority-alerts', name: 'Priority alerts plus scheduled science', description: 'Send critical health or safety alerts promptly, with science data in planned sessions.' },
  { id: 'continuous-relay', name: 'Frequent relay access', description: 'Design for frequent contact through a relay or other available communications network.' },
];

export const dataRequirements: MissionRequirementOption[] = [
  { id: 'summary', name: 'Prioritized summaries', description: 'Return key findings and health data first; retain detailed observations for later.' },
  { id: 'science-products', name: 'Processed science products', description: 'Return calibrated or reduced products that support the selected measurements.' },
  { id: 'full-record', name: 'Full instrument record', description: 'Plan storage and downlink capacity for comprehensive instrument data where feasible.' },
];
