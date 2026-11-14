import type { MissionDestinationId } from '../../state/gameTypes';

export type PlanetBody = MissionDestinationId | 'earth';

export function WorldSphere({ destination, size = 'large' }: { destination: PlanetBody; size?: 'small' | 'large' }) {
  const names: Record<PlanetBody, string> = { earth: 'Earth', moon: 'Moon', mars: 'Mars' };
  return <span className={`world-sphere world-${destination} world-${size}`} aria-label={names[destination]} role="img"><i /><b /><em /></span>;
}
