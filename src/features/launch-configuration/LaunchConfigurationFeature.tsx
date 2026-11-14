import { Button } from '../../components/common/Button';
import { MissionBudgetStatus } from '../../components/game/MissionBudgetStatus';
import { WorldSphere } from '../../components/game/WorldSphere';
import { launchVehicleCatalog, trajectoryCatalog } from '../../data/launchVehicles';
import { missionDestinations } from '../../data/missionDesign';
import { spacecraftDesignCatalog } from '../../data/spacecraftDesigner';
import { useGameState } from '../../hooks/useGameState';
import { validateLaunchConfiguration } from '../../services/validation/launchConfiguration';
import type { MissionStage } from '../../state/gameTypes';

function SpacecraftPayloadIcon({ systems, architecture }: { systems: Set<string>; architecture: string }) {
  return <svg className="launcher-spacecraft-art" viewBox="0 0 96 72" role="img" aria-label={`Your ${architecture} spacecraft payload`}>
    <defs><linearGradient id="payload-hull" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff1cf"/><stop offset="1" stopColor="#8296bd"/></linearGradient><linearGradient id="payload-array" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#83efff"/><stop offset="1" stopColor="#456cd1"/></linearGradient></defs>
    {systems.has('power') ? <g><path d="M37 32 22 24m37 8 15-8" stroke="#f5d69c" strokeWidth="2"/><rect x="3" y="13" width="19" height="22" rx="2" fill="url(#payload-array)" stroke="#b5f6ff"/><rect x="74" y="13" width="19" height="22" rx="2" fill="url(#payload-array)" stroke="#b5f6ff"/><path d="M12 13v22m-9-11h19m61-11v22m-9-11h19" stroke="#244a91" strokeWidth="1"/></g> : null}
    {systems.has('structure') ? <g><path d="m37 25 20 0 8 8v13l-8 8H37l-8-8V33z" fill="url(#payload-hull)" stroke="#fff2d4" strokeWidth="1.5"/><circle cx="47" cy="39.5" r="6" fill="#27638f" stroke="#8cecff" strokeWidth="1.5"/><circle cx="47" cy="39.5" r="2" fill="#e6ffff"/></g> : <path d="m37 25 20 0 8 8v13l-8 8H37l-8-8V33z" fill="none" stroke="#91a8ca" strokeDasharray="3 3"/>}
    {systems.has('communication') ? <g><path d="m56 30 12-13" stroke="#ffe6b9" strokeWidth="2"/><path d="M66 11q13-1 15 10-8 8-16 5z" fill="#e4faff" stroke="#fff"/><path d="m68 13 9 11" stroke="#6e9ce0"/></g> : null}
    {systems.has('propulsion') ? <g><path d="m39 54-2 8 6-4 6 4-2-8m8 0-2 8 6-4 6 4-2-8" fill="#f7c78f" stroke="#fff"/></g> : null}
    {architecture === 'lander' || architecture === 'rover' ? <path d="m35 49-7 9h8m24-9 7 9h-8" fill="none" stroke="#e8d8b7" strokeWidth="2" strokeLinecap="round"/> : null}
    {architecture === 'rover' ? <g fill="#172b4a" stroke="#dbeaff" strokeWidth="1.5"><circle cx="36" cy="59" r="3"/><circle cx="47" cy="59" r="3"/><circle cx="58" cy="59" r="3"/></g> : null}
  </svg>;
}

export function LaunchConfigurationFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const mission = state.missionConfiguration;
  const destination = missionDestinations.find((world) => world.id === mission?.destination);
  const validation = validateLaunchConfiguration(state);
  const installedSystems = new Set(spacecraftDesignCatalog
    .filter((part) => state.selectedSpacecraftComponentIds.includes(part.id))
    .map((part) => part.category));
  const eligibleVehicles = launchVehicleCatalog.filter((vehicle) => (!mission?.destination || vehicle.compatibleDestinations.includes(mission.destination)) && (!mission?.architecture || vehicle.compatibleArchitectures.includes(mission.architecture)));
  const eligibleTrajectories = trajectoryCatalog.filter((trajectory) => trajectory.destination === mission?.destination && (!mission?.architecture || trajectory.compatibleArchitectures.includes(mission.architecture)));
  const selectedVehicle = launchVehicleCatalog.find((vehicle) => vehicle.id === state.selectedLaunchVehicleId);
  const selectedTrajectory = trajectoryCatalog.find((trajectory) => trajectory.id === state.selectedTrajectoryId);
  const recommendedVehicle = eligibleVehicles.find((vehicle) => vehicle.id === 'pioneer-medium' && validation.spacecraftMassKg <= vehicle.payloadCapacityKg)
    ?? eligibleVehicles.find((vehicle) => vehicle.id === 'horizon-heavy' && validation.spacecraftMassKg <= vehicle.payloadCapacityKg)
    ?? eligibleVehicles.find((vehicle) => validation.spacecraftMassKg <= vehicle.payloadCapacityKg)
    ?? eligibleVehicles[0];
  const recommendedTrajectoryId = mission?.destination === 'moon'
    ? mission.architecture === 'lander' || mission.architecture === 'rover' ? 'lunar-surface-delivery' : mission.architecture === 'orbiter' ? 'lunar-orbit' : 'lunar-transfer'
    : mission?.architecture === 'lander' || mission?.architecture === 'rover' ? 'mars-surface-delivery' : mission?.architecture === 'orbiter' ? 'mars-orbit' : 'mars-transfer';
  const selectLaunch = (vehicleId: string | null, trajectoryId: string | null) => dispatch({ type: 'SET_LAUNCH_CONFIGURATION', launchVehicleId: vehicleId, trajectoryId });
  const massFits = Boolean(selectedVehicle && validation.spacecraftMassKg <= selectedVehicle.payloadCapacityKg);

  return <section className="launch-game feature-panel">
    <header className="game-mission-heading"><div><p className="eyebrow">STEP 3 · LAUNCH</p><h2>Choose your rocket</h2></div><div className="launch-target"><WorldSphere destination={mission?.destination ?? 'moon'} size="small" /><span>{destination?.name ?? 'Your world'}</span></div></header>
    <MissionBudgetStatus />
    <div className="launch-vehicle-game-grid">{eligibleVehicles.map((vehicle, index) => {
      const active = state.selectedLaunchVehicleId === vehicle.id;
      const fits = validation.spacecraftMassKg <= vehicle.payloadCapacityKg;
      return <button type="button" key={vehicle.id} className={`launch-vehicle-game-card ${active ? 'is-selected' : ''}`} aria-pressed={active} onClick={() => selectLaunch(vehicle.id, state.selectedTrajectoryId)}>
        <SpacecraftPayloadIcon systems={installedSystems} architecture={mission?.architecture ?? 'lander'} />
        <span className={`launcher-art launcher-size-${index}`}><i className="launcher-body"/><i className="launcher-nose"/><i className="launcher-fin launcher-fin-a"/><i className="launcher-fin launcher-fin-b"/><i className="launcher-flame"/><b>✦</b></span>
        <span className="launch-vehicle-game-name"><strong>{vehicle.name}</strong><small>{vehicle.payloadCapacityKg.toLocaleString()} kg payload · ${(vehicle.estimatedCostUsd / 1000000).toFixed(0)}M</small></span>
        <span className={`vehicle-fit-tag ${fits ? 'fits' : 'over'}`}>{vehicle.id === recommendedVehicle?.id ? '★ RECOMMENDED' : fits ? 'PAYLOAD FITS' : 'TOO HEAVY'}</span>
      </button>;
    })}</div>
    <div className="launch-mass-meter"><div><span>SHIP WEIGHT</span><strong>{validation.spacecraftMassKg.toLocaleString()} kg</strong></div><div className="launch-mass-track"><i style={{ width: `${selectedVehicle ? Math.min(100, validation.spacecraftMassKg / selectedVehicle.payloadCapacityKg * 100) : 0}%` }} /></div><div><span>ROOM ON ROCKET</span><strong>{selectedVehicle ? `${(selectedVehicle.payloadCapacityKg - validation.spacecraftMassKg).toLocaleString()} kg` : 'PICK A ROCKET'}</strong></div></div>
    <div className="game-section-title launch-route-heading"><span>HOW WILL YOU GET THERE?</span><small>Choose a flyby, orbit, or landing</small></div>
    <div className="trajectory-game-grid">{eligibleTrajectories.map((trajectory) => <button type="button" key={trajectory.id} className={`trajectory-game-card ${state.selectedTrajectoryId === trajectory.id ? 'is-selected' : ''}`} aria-pressed={state.selectedTrajectoryId === trajectory.id} onClick={() => selectLaunch(state.selectedLaunchVehicleId, trajectory.id)}><span className={`trajectory-glyph glyph-${trajectory.phase}`} aria-hidden="true">{trajectory.phase === 'orbit' ? '◎' : trajectory.phase === 'transfer' ? '⌁' : '⌖'}</span><span><small>{trajectory.id === recommendedTrajectoryId ? '★ RECOMMENDED' : trajectory.phase === 'delivery' ? 'LAND ON THE SURFACE' : trajectory.phase === 'orbit' ? 'CIRCLE THE WORLD' : 'CRUISE THROUGH SPACE'}</small><strong>{trajectory.name}</strong></span><i>{state.selectedTrajectoryId === trajectory.id ? '✓' : '+'}</i></button>)}</div>
    <footer className="launch-game-footer"><div className={`launch-fit-summary ${validation.isValid ? 'is-valid' : ''}`}><i>{validation.isValid ? '✓' : '!'}</i><span><strong>{validation.isValid ? 'ROCKET AND ROUTE READY' : 'PICK A ROCKET AND ROUTE'}</strong><small>{validation.issues[0] ?? `${selectedVehicle?.name} · ${validation.spacecraftMassKg.toLocaleString()} kg`}</small></span></div><Button disabled={!validation.isValid || !massFits} onClick={() => onNavigate('mission-control')}>NEXT: CHECK SUPPLIES <span aria-hidden="true">→</span></Button></footer>
  </section>;
}
