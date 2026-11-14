import { Button } from '../../components/common/Button';
import { WorldSphere } from '../../components/game/WorldSphere';
import { missionArchitectures, missionDestinations, missionObjectives } from '../../data/missionDesign';
import { useGameState } from '../../hooks/useGameState';
import { validateMissionConfiguration } from '../../services/validation/missionDesign';
import type { MissionArchitectureId, MissionConfiguration, MissionDestinationId, MissionObjectiveId, MissionStage } from '../../state/gameTypes';

const defaults: Record<MissionDestinationId, { name: string; architecture: MissionArchitectureId; objective: MissionObjectiveId; duration: number; data: string }> = {
  moon: { name: 'Lunar Field Study', architecture: 'lander', objective: 'lunar-geology', duration: 14, data: 'science-products' },
  mars: { name: 'Red Planet Survey', architecture: 'rover', objective: 'mars-surface-exploration', duration: 180, data: 'science-products' },
};

export function MissionDesignFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const config = state.missionConfiguration;
  const selectedWorld = config?.destination ?? null;
  const architectures = missionArchitectures.filter((item) => !selectedWorld || item.destinations.includes(selectedWorld));
  const objectives = missionObjectives.filter((item) => item.destination === selectedWorld && (!config?.architecture || item.compatibleArchitectures.includes(config.architecture)));
  const selectedObjective = missionObjectives.find((item) => item.id === config?.objectiveIds[0]);
  const validation = config ? validateMissionConfiguration(config) : null;

  function update(patch: Partial<MissionConfiguration>) {
    if (!config) return;
    dispatch({ type: 'UPDATE_MISSION_CONFIGURATION', configuration: { ...config, ...patch, isConfirmed: false } });
  }

  function chooseWorld(destination: MissionDestinationId) {
    const preset = defaults[destination];
    const objective = missionObjectives.find((item) => item.id === preset.objective)!;
    dispatch({ type: 'UPDATE_MISSION_CONFIGURATION', configuration: {
      missionName: preset.name, destination, architecture: preset.architecture, objectiveIds: [preset.objective],
      missionDurationDays: preset.duration, requiredMeasurements: objective.measurements.slice(0, 2).map((item) => item.name),
      communicationRequirement: 'scheduled', dataRequirement: preset.data, isConfirmed: false, updatedAt: new Date().toISOString(),
    } });
  }

  function chooseArchitecture(architecture: MissionArchitectureId) {
    if (!config) return;
    const compatible = missionObjectives.find((item) => item.id === config.objectiveIds[0] && item.compatibleArchitectures.includes(architecture));
    const nextObjective = compatible ?? missionObjectives.find((item) => item.destination === selectedWorld && item.compatibleArchitectures.includes(architecture));
    update({ architecture, objectiveIds: nextObjective ? [nextObjective.id] : [], requiredMeasurements: nextObjective?.measurements.slice(0, 2).map((item) => item.name) ?? [] });
  }

  function launchToWorkshop() {
    if (!config || !validation?.isValid) return;
    const recommendedTrajectory = config.architecture === 'lander' || config.architecture === 'rover'
      ? config.destination === 'moon' ? 'lunar-surface-delivery' : 'mars-surface-delivery'
      : config.architecture === 'orbiter'
        ? config.destination === 'moon' ? 'lunar-orbit' : 'mars-orbit'
        : config.destination === 'moon' ? 'lunar-transfer' : 'mars-transfer';
    dispatch({ type: 'SET_LAUNCH_CONFIGURATION', launchVehicleId: 'horizon-heavy', trajectoryId: recommendedTrajectory });
    dispatch({ type: 'CONFIRM_MISSION_CONFIGURATION', confirmedAt: new Date().toISOString() });
    onNavigate('spacecraft-designer');
  }

  return <section className="game-mission-maker">
    <header className="game-mission-heading"><div><p className="eyebrow">STEP 1 · MISSION PLAN</p><h2>Where should we go?</h2></div><span className="mission-level">PICK A WORLD</span></header>
    <div className="world-select-grid">{missionDestinations.map((world) => {
      const active = selectedWorld === world.id;
      const preset = defaults[world.id];
      return <button type="button" className={`world-select-card ${active ? 'is-selected' : ''}`} key={world.id} aria-pressed={active} onClick={() => chooseWorld(world.id)}>
        <span className="world-select-art"><WorldSphere destination={world.id} /><span className="world-orbit-ring" /><span className="world-star star-a" /><span className="world-star star-b" /><span className="world-star star-c" /></span>
        <span className="world-card-info"><small>{world.id === 'moon' ? 'NEAR EARTH · 3 DAY CRUISE' : 'DEEP SPACE · LONG CRUISE'}</small><strong>{world.name}</strong><span>{preset.architecture === 'lander' ? 'Lander' : 'Rover'} · {missionObjectives.find((item) => item.id === preset.objective)?.name}</span><i>{active ? 'SELECTED' : 'TAP TO SELECT'} <b>→</b></i></span>
      </button>;
    })}</div>
    {config && selectedWorld ? <div className="expedition-builder">
      <div className="expedition-builder-head"><div><small>FLIGHT PLAN</small><strong>{config.missionName}</strong></div><label>MISSION NAME<input value={config.missionName} maxLength={42} onChange={(event) => update({ missionName: event.target.value })} /></label></div>
      <div className="expedition-picks">
        <section><div className="game-section-title"><span>01</span><h3>Choose your spacecraft</h3></div><div className="game-pick-row">{architectures.map((item) => <button type="button" key={item.id} className={`game-pick-card ${config.architecture === item.id ? 'is-selected' : ''}`} onClick={() => chooseArchitecture(item.id)}><span className="pick-icon" aria-hidden="true">{item.id === 'rover' ? '▰' : item.id === 'lander' ? '⌖' : item.id === 'orbiter' ? '◉' : '✦'}</span><strong>{item.name}</strong><small>{item.id === 'rover' ? 'Drive across the surface' : item.id === 'lander' ? 'Explore one landing site' : item.id === 'orbiter' ? 'Study from above' : 'Fly by and scan'}</small></button>)}</div></section>
        <section><div className="game-section-title"><span>02</span><h3>Choose a science goal</h3></div><div className="game-pick-row game-objective-row">{objectives.map((item) => <button type="button" key={item.id} className={`game-pick-card ${config.objectiveIds.includes(item.id) ? 'is-selected' : ''}`} onClick={() => update({ objectiveIds: [item.id], requiredMeasurements: item.measurements.slice(0, 2).map((measurement) => measurement.name) })}><span className="pick-icon" aria-hidden="true">{item.id.includes('water') || item.id.includes('resource') ? '◈' : item.id.includes('atmosphere') || item.id.includes('environment') ? '☼' : '✧'}</span><strong>{item.name}</strong><small>{item.measurements.slice(0, 2).map((measurement) => measurement.name).join(' · ')}</small></button>)}</div></section>
      </div>
      <div className="expedition-footer"><label>HOW LONG? <input type="range" min="7" max={selectedWorld === 'moon' ? 90 : 800} step="1" value={config.missionDurationDays ?? defaults[selectedWorld].duration} onChange={(event) => update({ missionDurationDays: Number(event.target.value) })} /><strong>{config.missionDurationDays} DAYS</strong></label><div className="expedition-selected-science"><span>YOUR SCIENCE GOAL</span><strong>{selectedObjective?.name ?? 'Pick a science goal'}</strong></div><Button disabled={!validation?.isValid} onClick={launchToWorkshop}>BUILD MY SPACECRAFT <span aria-hidden="true">→</span></Button></div>
    </div> : <div className="world-select-hint"><span>✦</span>Choose a planet to start your expedition</div>}
    <div className="game-tip"><span aria-hidden="true">i</span><p><strong>Mission tip</strong> Moon missions are quicker. Mars missions take longer but offer a new world to explore.</p></div>
  </section>;
}
