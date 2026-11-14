import { WorldSphere } from './WorldSphere';
import { RocketVehicleArtwork } from './RocketVehicleArtwork';
import { SatelliteArtwork } from './SatelliteArtwork';
import type { MissionSimulationPhase, MissionDestinationId } from '../../state/gameTypes';

export function FlightScene({ destination, phase, missionName, isApproaching = false, onStartDestinationTravel, onGoToOrbit }: { destination: MissionDestinationId; phase: MissionSimulationPhase; missionName: string; isApproaching?: boolean; onStartDestinationTravel?: () => void; onGoToOrbit?: () => void }) {
  return <section className={`flight-scene flight-${phase}${isApproaching ? ' is-approaching' : ''}`} aria-label={`${missionName} mission scene`}>
    <div className="flight-scene-stars" />
    <div className="flight-earth"><span>EARTH</span></div>
    <div className="flight-path"><i /></div>
    <div className="flight-destination"><WorldSphere destination={destination} /><span>{destination.toUpperCase()}</span></div>
    {phase === 'deployment' ? <div className="flight-launch-rocket"><RocketVehicleArtwork /></div> : phase === 'cruise' || phase === 'arrival' || phase === 'scientific-operations' || phase === 'communication' || phase === 'completion' ? <SatelliteArtwork className="flight-craft flight-satellite-craft" /> : <svg className="flight-craft" viewBox="0 0 100 60" role="img" aria-label="Spacecraft">
      <defs><linearGradient id="flight-ship-hull" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#c4d8ef"/><stop offset="1" stopColor="#718cac"/></linearGradient></defs>
      <path d="M8 30h35l19-13 7 13-7 13-19-13M33 30L20 12l20 10m-7 8L20 48l20-10" fill="url(#flight-ship-hull)" stroke="#e3f9ff" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M37 27h15v6H37z" fill="#6487ad" opacity=".72"/><circle cx="44" cy="30" r="4" fill="#78efff" stroke="#fff" strokeWidth="1"/>
      <path className="craft-plume" d="M8 26L-4 30l12 4" fill="#ffb36d"/>
    </svg>}
    <div className="flight-hud"><small>MISSION</small><strong>{missionName}</strong><span><i />{phase.replace(/-/g, ' ').toUpperCase()}</span></div>
    {onStartDestinationTravel ? <div className="flight-scene-travel-action"><button type="button" onClick={onStartDestinationTravel}>GO TO {destination.toUpperCase()} <span aria-hidden="true">→</span></button></div> : null}
    {onGoToOrbit ? <div className="flight-scene-travel-action"><button type="button" onClick={onGoToOrbit}>GO TO ORBIT <span aria-hidden="true">→</span></button></div> : null}
  </section>;
}
