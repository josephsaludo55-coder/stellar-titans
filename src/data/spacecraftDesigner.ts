import type { MissionArchitectureId, MissionDestinationId } from '../state/gameTypes';

export type SpacecraftDesignCategory =
  | 'structure'
  | 'power'
  | 'batteries'
  | 'propulsion'
  | 'communication'
  | 'thermal-control'
  | 'flight-computer'
  | 'data-storage';

export interface SpacecraftDesignComponent {
  id: string;
  name: string;
  category: SpacecraftDesignCategory;
  description: string;
  massKg: number;
  estimatedCostUsd: number;
  powerConsumptionW: number;
  powerGenerationW: number;
  dataStorageGb?: number;
  downlinkMbps?: number;
  compatibleDestinations: MissionDestinationId[];
  compatibleArchitectures: MissionArchitectureId[];
  compatibility: string;
  advantages: string[];
  limitations: string[];
}

const allDestinations: MissionDestinationId[] = ['moon', 'mars'];
const allArchitectures: MissionArchitectureId[] = ['orbiter', 'lander', 'rover', 'space-probe'];

export const spacecraftDesignCategories: Array<{ id: SpacecraftDesignCategory; name: string; description: string }> = [
  { id: 'structure', name: 'Structure', description: 'Bus, frame, and supporting vehicle structure.' },
  { id: 'power', name: 'Power', description: 'Primary electrical power generation.' },
  { id: 'batteries', name: 'Batteries', description: 'Stored energy for eclipses and peak demand.' },
  { id: 'propulsion', name: 'Propulsion', description: 'Maneuver and attitude-control hardware.' },
  { id: 'communication', name: 'Communication', description: 'Radio links to Earth or relay networks.' },
  { id: 'thermal-control', name: 'Thermal Control', description: 'Insulation, heat rejection, and active heating.' },
  { id: 'flight-computer', name: 'Flight Computer', description: 'Command processing and onboard control.' },
  { id: 'data-storage', name: 'Data Storage', description: 'Onboard buffering for science and telemetry data.' },
];

export const spacecraftDesignCatalog: SpacecraftDesignComponent[] = [
  {
    id: 'structure-core-bus', name: 'Core Composite Bus', category: 'structure',
    description: 'A general-purpose structural and mounting platform for a compact robotic spacecraft.',
    massKg: 180, estimatedCostUsd: 1800000, powerConsumptionW: 0, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Fits orbiter, lander, rover, and space probe designs as the primary equipment platform.',
    advantages: ['Broad subsystem mounting area', 'Supports multiple mission classes'],
    limitations: ['Higher structural mass than a mission-specific frame', 'Does not include landing legs or mobility hardware'],
  },
  {
    id: 'structure-rover-chassis', name: 'Six-Wheel Rover Chassis', category: 'structure',
    description: 'A reinforced mobile platform concept with suspension, wheel mounts, and instrument attachment points.',
    massKg: 245, estimatedCostUsd: 2650000, powerConsumptionW: 12, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: ['rover'],
    compatibility: 'Rover architecture only; pairs a surface landing system with a mobility system.',
    advantages: ['Supports surface traversal', 'Carries a close-contact science payload'],
    limitations: ['Mass and mechanical complexity increase', 'Requires landing and mobility subsystems'],
  },
  {
    id: 'structure-orbital-frame', name: 'Light Orbital Frame', category: 'structure',
    description: 'A lightweight frame optimized for remotely operated orbital and flyby spacecraft.',
    massKg: 112, estimatedCostUsd: 1260000, powerConsumptionW: 0, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: ['orbiter', 'space-probe'],
    compatibility: 'Compatible with orbiter and space probe architectures; not sized for surface landing loads.',
    advantages: ['Low structural mass', 'Provides clear instrument mounting faces'],
    limitations: ['Not rated in this educational model for landing or rover loads'],
  },
  {
    id: 'power-solar-wings', name: 'Deployable Solar Wings', category: 'power',
    description: 'A pair of deployable photovoltaic arrays for generating electricity in sunlight.',
    massKg: 54, estimatedCostUsd: 520000, powerConsumptionW: 16, powerGenerationW: 1250,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Requires usable sunlight and suitable pointing; generation falls with shadowing and distance from the Sun.',
    advantages: ['No propellant required for generation', 'Scales by array area'],
    limitations: ['Generation varies with illumination', 'Deployment and pointing add operational constraints'],
  },
  {
    id: 'power-high-output-array', name: 'High-Output Solar Array', category: 'power',
    description: 'A larger-area photovoltaic option intended for higher electrical loads in strong sunlight.',
    massKg: 92, estimatedCostUsd: 890000, powerConsumptionW: 24, powerGenerationW: 2050,
    compatibleDestinations: ['moon'], compatibleArchitectures: ['orbiter', 'lander', 'rover', 'space-probe'],
    compatibility: 'Moon mission option in this teaching scenario; output assumes favorable illumination and sun-pointing.',
    advantages: ['Higher nominal generation', 'Supports larger instrument duty cycles'],
    limitations: ['Greater mass and deployment envelope', 'Actual output varies with lighting and temperature'],
  },
  {
    id: 'power-radioisotope-unit', name: 'Radioisotope Power Unit', category: 'power',
    description: 'A fictional classroom representation of a radioisotope electrical source with steady output.',
    massKg: 68, estimatedCostUsd: 2450000, powerConsumptionW: 8, powerGenerationW: 520,
    compatibleDestinations: ['mars'], compatibleArchitectures: ['lander', 'rover', 'space-probe'],
    compatibility: 'Mars mission option in this teaching scenario; availability is a game assumption, not a procurement claim.',
    advantages: ['Steady output independent of sunlight', 'Can support operations through darkness or dust'],
    limitations: ['Lower nominal output than a large illuminated array', 'High fictional cost and thermal-management needs'],
  },
  {
    id: 'battery-standard', name: 'Standard Battery Pack', category: 'batteries',
    description: 'Rechargeable battery storage sized for a moderate eclipse and peak-load reserve.',
    massKg: 32, estimatedCostUsd: 175000, powerConsumptionW: 6, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Pairs with a selected power-generation system; storage capacity is represented by this classroom option.',
    advantages: ['Adds reserve energy', 'Supports short high-load periods'],
    limitations: ['Finite stored energy', 'Charge state and temperature must be managed'],
  },
  {
    id: 'battery-extended', name: 'Extended-Capacity Battery Pack', category: 'batteries',
    description: 'A heavier rechargeable pack for longer eclipse periods or larger operational reserve.',
    massKg: 58, estimatedCostUsd: 295000, powerConsumptionW: 9, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Pairs with any supported power source; reserve duration depends on total spacecraft demand.',
    advantages: ['Larger energy reserve', 'More flexibility for peak demand'],
    limitations: ['Adds mass and cost', 'Still requires recharge and thermal control'],
  },
  {
    id: 'propulsion-chemical', name: 'Chemical Maneuver Package', category: 'propulsion',
    description: 'A fictional bipropellant maneuver package for trajectory changes and attitude-control support.',
    massKg: 126, estimatedCostUsd: 940000, powerConsumptionW: 78, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'General maneuver option in this game model; propellant capacity is represented in the component mass estimate.',
    advantages: ['High thrust for time-sensitive maneuvers', 'Useful across several mission phases'],
    limitations: ['Consumes finite propellant', 'Requires tank, valves, and plume-clearance planning'],
  },
  {
    id: 'propulsion-electric', name: 'Electric Cruise Thruster', category: 'propulsion',
    description: 'A fictional low-thrust electric propulsion option for gradual in-space trajectory changes.',
    massKg: 74, estimatedCostUsd: 1180000, powerConsumptionW: 680, powerGenerationW: 0,
    compatibleDestinations: ['mars'], compatibleArchitectures: ['orbiter', 'space-probe'],
    compatibility: 'Mars orbiter or probe only in this scenario; its large electrical load and long thrusting periods are not modeled for surface vehicles.',
    advantages: ['Efficient propellant use in gradual transfers', 'Supports extended in-space maneuvering'],
    limitations: ['High electrical demand', 'Low thrust is unsuitable for rapid landing maneuvers'],
  },
  {
    id: 'communication-high-gain', name: 'High-Gain Deep-Space Radio', category: 'communication',
    description: 'A steerable high-gain antenna and transceiver package for focused long-distance communication.',
    massKg: 28, estimatedCostUsd: 480000, powerConsumptionW: 118, powerGenerationW: 0, downlinkMbps: 2.0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Requires pointing time and a compatible ground or relay link; detailed link budget is outside this educational estimate.',
    advantages: ['Higher potential data rate', 'Useful for returning prioritized science'],
    limitations: ['Needs accurate pointing', 'Communication windows and ground-station availability constrain contact'],
  },
  {
    id: 'communication-low-gain', name: 'Low-Gain Safe-Link Radio', category: 'communication',
    description: 'A broad-coverage, low-rate radio package for essential commands and health telemetry.',
    massKg: 11, estimatedCostUsd: 205000, powerConsumptionW: 32, powerGenerationW: 0, downlinkMbps: 0.1,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Supports broad angular coverage with lower data throughput than a high-gain link.',
    advantages: ['Less demanding pointing', 'Useful for essential telemetry and recovery'],
    limitations: ['Limited downlink rate', 'Large science data sets may require longer contact time'],
  },
  {
    id: 'thermal-passive-kit', name: 'Passive Thermal Protection Kit', category: 'thermal-control',
    description: 'Multilayer insulation, thermal coatings, and passive heat paths for spacecraft temperature control.',
    massKg: 24, estimatedCostUsd: 165000, powerConsumptionW: 0, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Baseline thermal option for all supported mission types; precise thermal performance is not simulated.',
    advantages: ['No steady electrical demand', 'Reduces unwanted heat exchange'],
    limitations: ['Cannot actively heat or reject heat on demand', 'Requires careful blanket and radiator layout'],
  },
  {
    id: 'thermal-active-loop', name: 'Active Heater and Radiator Loop', category: 'thermal-control',
    description: 'A fictional thermal-control package combining thermostatic heaters with controlled heat rejection.',
    massKg: 39, estimatedCostUsd: 365000, powerConsumptionW: 145, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Adds active temperature control; power demand is a representative planning load, not a thermal model.',
    advantages: ['Can respond to changing thermal conditions', 'Adds flexibility for sensitive instruments'],
    limitations: ['Consumes electrical power', 'Adds control and hardware complexity'],
  },
  {
    id: 'computer-rad-tolerant', name: 'Radiation-Tolerant Flight Computer', category: 'flight-computer',
    description: 'A representative onboard computer for command sequencing, monitoring, and fault response.',
    massKg: 13, estimatedCostUsd: 640000, powerConsumptionW: 72, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'General-purpose control unit for any supported architecture in this learning model.',
    advantages: ['Supports onboard autonomy', 'Moderate mass and power demand'],
    limitations: ['Computing capacity is finite', 'Software verification and radiation effects need careful treatment'],
  },
  {
    id: 'computer-redundant', name: 'Redundant Flight Computer', category: 'flight-computer',
    description: 'A representative dual-channel control computer with a simplified fault-tolerant architecture.',
    massKg: 24, estimatedCostUsd: 1080000, powerConsumptionW: 118, powerGenerationW: 0,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'General-purpose option; redundancy benefits depend on independent interfaces and verified failover logic.',
    advantages: ['Improves fault tolerance in the game model', 'Supports more complex autonomous operations'],
    limitations: ['Higher mass, cost, and power demand', 'Redundancy adds integration and verification work'],
  },
  {
    id: 'storage-solid-state', name: 'Solid-State Data Recorder', category: 'data-storage',
    description: 'A representative non-volatile recorder for science products, telemetry, and command history.',
    massKg: 8, estimatedCostUsd: 132000, powerConsumptionW: 22, powerGenerationW: 0, dataStorageGb: 128,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Compatible with all supported architectures; effective capacity depends on data rates and downlink cadence.',
    advantages: ['Low mass and steady demand', 'Buffers observations between communication windows'],
    limitations: ['Finite capacity', 'Data prioritization and integrity checks are still required'],
  },
  {
    id: 'storage-high-capacity', name: 'High-Capacity Science Recorder', category: 'data-storage',
    description: 'A larger-capacity recorder for missions with high-volume imaging or sensor products.',
    massKg: 17, estimatedCostUsd: 248000, powerConsumptionW: 39, powerGenerationW: 0, dataStorageGb: 2048,
    compatibleDestinations: allDestinations, compatibleArchitectures: allArchitectures,
    compatibility: 'Compatible with all supported architectures; intended for missions whose selected objectives generate larger data volumes.',
    advantages: ['More buffering flexibility', 'Can support longer intervals between downlinks'],
    limitations: ['Higher mass and power demand', 'Storage alone does not increase downlink throughput'],
  },
];

export const SPACECRAFT_DESIGN_ASSUMPTIONS =
  'All masses, costs, and power figures are fictional representative classroom estimates in kilograms, USD, and watts. Power generation is nominal peak; power consumption is an estimated average. Values are not flight specifications or procurement estimates.';
