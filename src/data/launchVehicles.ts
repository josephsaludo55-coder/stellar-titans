import type { MissionArchitectureId, MissionDestinationId } from '../state/gameTypes';

export interface LaunchVehicleProfile {
  id: string;
  name: string;
  payloadCapacityKg: number;
  estimatedCostUsd: number;
  description: string;
  compatibleDestinations: MissionDestinationId[];
  compatibleArchitectures: MissionArchitectureId[];
  limitations: string[];
}

const architectures: MissionArchitectureId[] = ['orbiter', 'lander', 'rover', 'space-probe'];
const destinations: MissionDestinationId[] = ['moon', 'mars'];

// Fictional classroom vehicles. Capacity is the educational payload limit for the selected destination profile.
export const launchVehicleCatalog: LaunchVehicleProfile[] = [
  {
    id: 'pioneer-medium', name: 'Pioneer Medium (classroom vehicle)', payloadCapacityKg: 1800, estimatedCostUsd: 95000000,
    description: 'A representative medium-lift launcher for compact robotic spacecraft, including lighter landers and rovers.',
    compatibleDestinations: destinations, compatibleArchitectures: architectures,
    limitations: ['Surface spacecraft must stay within the 1,800 kg payload limit', 'Deep-space capability depends on a separate upper-stage profile'],
  },
  {
    id: 'horizon-heavy', name: 'Horizon Heavy (fictional)', payloadCapacityKg: 8500, estimatedCostUsd: 210000000,
    description: 'A fictional heavy-lift configuration with additional payload capacity for larger robotic spacecraft.',
    compatibleDestinations: destinations, compatibleArchitectures: architectures,
    limitations: ['Higher estimated launch cost', 'Payload capacity does not guarantee trajectory or interface compatibility'],
  },
  {
    id: 'deep-space-lifter', name: 'Deep Space Lifter (fictional)', payloadCapacityKg: 14500, estimatedCostUsd: 340000000,
    description: 'A fictional high-energy launch configuration intended for heavy planetary spacecraft and surface delivery stacks.',
    compatibleDestinations: destinations, compatibleArchitectures: architectures,
    limitations: ['Highest cost in this educational catalog', 'Large capacity can encourage unnecessary spacecraft mass'],
  },
];

export type TrajectoryId =
  | 'earth-leo' | 'earth-geostationary' | 'earth-escape'
  | 'lunar-transfer' | 'lunar-orbit' | 'lunar-surface-delivery'
  | 'mars-transfer' | 'mars-orbit' | 'mars-surface-delivery';

export type TrajectoryPhase = 'orbit' | 'transfer' | 'delivery';

export interface TrajectoryOption {
  id: TrajectoryId;
  name: string;
  destination: 'earth' | MissionDestinationId;
  phase: TrajectoryPhase;
  description: string;
  compatibleDestinations: MissionDestinationId[];
  compatibleArchitectures: MissionArchitectureId[];
}

export const trajectoryCatalog: TrajectoryOption[] = [
  { id: 'earth-leo', name: 'Low Earth Orbit', destination: 'earth', phase: 'orbit', description: 'A near-Earth orbit used for spacecraft checkout, Earth observation, or as a staging point.', compatibleDestinations: [], compatibleArchitectures: architectures },
  { id: 'earth-geostationary', name: 'Geostationary Orbit', destination: 'earth', phase: 'orbit', description: 'A high circular Earth orbit where a satellite appears fixed over one longitude.', compatibleDestinations: [], compatibleArchitectures: ['orbiter', 'space-probe'] },
  { id: 'earth-escape', name: 'Earth Escape Trajectory', destination: 'earth', phase: 'transfer', description: 'An outbound path that leaves Earth’s gravitational neighborhood toward another destination.', compatibleDestinations: destinations, compatibleArchitectures: architectures },
  { id: 'lunar-transfer', name: 'Lunar Transfer Trajectory', destination: 'moon', phase: 'transfer', description: 'A cruise path from Earth toward the Moon; the spacecraft must still perform lunar arrival or delivery operations.', compatibleDestinations: ['moon'], compatibleArchitectures: architectures },
  { id: 'lunar-orbit', name: 'Lunar Orbit', destination: 'moon', phase: 'orbit', description: 'A path around the Moon for repeated remote observations; it does not place hardware on the surface.', compatibleDestinations: ['moon'], compatibleArchitectures: ['orbiter', 'space-probe'] },
  { id: 'lunar-surface-delivery', name: 'Lunar Surface Delivery', destination: 'moon', phase: 'delivery', description: 'A descent and landing phase that delivers a lander or rover to the lunar surface.', compatibleDestinations: ['moon'], compatibleArchitectures: ['lander', 'rover'] },
  { id: 'mars-transfer', name: 'Mars Transfer Trajectory', destination: 'mars', phase: 'transfer', description: 'An interplanetary cruise from Earth toward Mars; arrival and atmospheric or propulsion capture follow separately.', compatibleDestinations: ['mars'], compatibleArchitectures: architectures },
  { id: 'mars-orbit', name: 'Mars Orbit', destination: 'mars', phase: 'orbit', description: 'A capture and orbital phase around Mars for repeated remote sensing; it does not include surface landing.', compatibleDestinations: ['mars'], compatibleArchitectures: ['orbiter', 'space-probe'] },
  { id: 'mars-surface-delivery', name: 'Mars Surface Delivery', destination: 'mars', phase: 'delivery', description: 'An entry, descent, and landing phase for a Mars lander or rover surface mission.', compatibleDestinations: ['mars'], compatibleArchitectures: ['lander', 'rover'] },
];
