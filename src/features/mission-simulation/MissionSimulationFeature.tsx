import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useGameState } from '../../hooks/useGameState';
import { calculateMissionResources } from '../../services/calculations/missionResources';
import { MISSION_SIMULATION_ASSUMPTIONS, validateSimulationReadiness } from '../../services/simulation/missionSimulation';
import type { MissionSimulationPhase, MissionSimulationState, MissionStage } from '../../state/gameTypes';
import { FlightScene } from '../../components/game/FlightScene';
import { WorldSphere } from '../../components/game/WorldSphere';
import { RocketVehicleArtwork } from '../../components/game/RocketVehicleArtwork';
import { OrbitPlayground } from './OrbitPlayground';
import { LandingChallenge } from './LandingChallenge';

const phaseSequence: Array<{ id: MissionSimulationPhase; label: string }> = [
  { id: 'pre-launch', label: 'Pre-launch' }, { id: 'countdown', label: 'Countdown' },
  { id: 'launch', label: 'Launch' }, { id: 'deployment', label: 'Deployment' },
  { id: 'cruise', label: 'Cruise' }, { id: 'arrival', label: 'Arrival' },
  { id: 'scientific-operations', label: 'Science' }, { id: 'communication', label: 'Communication' },
  { id: 'completion', label: 'Completion' },
];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function MissionSimulationFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const simulation = state.missionSimulation;
  const [cruiseApproachActive, setCruiseApproachActive] = useState(false);
  const [destinationTravelActive, setDestinationTravelActive] = useState(false);
  const [destinationReached, setDestinationReached] = useState(false);
  const [orbitPanelActive, setOrbitPanelActive] = useState(false);
  const readinessIssues = useMemo(() => validateSimulationReadiness(state), [state]);
  const resources = useMemo(() => calculateMissionResources(state), [state]);
  const phaseIndex = simulation ? phaseSequence.findIndex((item) => item.id === simulation.phase) : 0;

  useEffect(() => {
    if (simulation?.phase !== 'pre-launch') return;
    setCruiseApproachActive(false);
    setDestinationTravelActive(false);
    setDestinationReached(false);
    setOrbitPanelActive(false);
  }, [simulation?.startedAt, simulation?.phase]);

  useEffect(() => {
    if (!cruiseApproachActive || simulation?.phase !== 'cruise') return;
    const timer = window.setTimeout(() => {
      setCruiseApproachActive(false);
      dispatch({ type: 'ADVANCE_MISSION_SIMULATION' });
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [cruiseApproachActive, simulation?.phase, dispatch]);

  useEffect(() => {
    if (!destinationTravelActive || simulation?.phase !== 'deployment') return;
    const timer = window.setTimeout(() => {
      setDestinationTravelActive(false);
      setDestinationReached(true);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [destinationTravelActive, simulation?.phase]);

  const activeFlightScene = simulation && simulation.phase !== 'pre-launch' && simulation.phase !== 'countdown' && simulation.phase !== 'launch' && !(simulation.phase === 'deployment' && orbitPanelActive)
    ? <FlightScene destination={simulation.snapshot.destination} phase={simulation.phase} missionName={simulation.snapshot.missionName} isApproaching={(cruiseApproachActive && simulation.phase === 'cruise') || (simulation.phase === 'deployment' && (destinationTravelActive || destinationReached))} onStartDestinationTravel={simulation.phase === 'deployment' && !destinationTravelActive && !destinationReached ? () => setDestinationTravelActive(true) : undefined} onGoToOrbit={simulation.phase === 'deployment' && destinationReached ? () => setOrbitPanelActive(true) : undefined} />
    : null;
  const activeSimulationStage = simulation ? <SimulationStage simulation={simulation} phaseIndex={phaseIndex} dispatch={dispatch} onNavigate={onNavigate} cruiseApproachActive={cruiseApproachActive} onBeginCruiseApproach={() => setCruiseApproachActive(true)} destinationTravelActive={destinationTravelActive} destinationReached={destinationReached} orbitPanelActive={orbitPanelActive} onOrbitReady={() => { dispatch({ type: 'ADVANCE_MISSION_SIMULATION' }); dispatch({ type: 'ADVANCE_MISSION_SIMULATION' }); }} onBackToFlight={() => setOrbitPanelActive(false)} /> : null;

  return (
    <section className="feature-panel mission-simulation-feature">
      <div className="simulation-model-chip"><span>🚀</span><span>Your design is driving this mission</span><small>GAME FLIGHT · NOT REAL ORBITAL PHYSICS</small></div>
      <SimulationPhaseProgress current={Math.max(0, phaseIndex)} />

      {!simulation ? <Card title="Ready for launch?" subtitle="A quick check of your ship and supplies">
        <div className="simulation-preflight-overview"><div><small>MISSION</small><strong>{state.missionConfiguration?.missionName || 'Mission not configured'}</strong></div><div><small>SHIP WEIGHT</small><strong>{resources.spacecraftMassKg.toLocaleString()} kg</strong></div><div><small>POWER MADE / USED</small><strong>{resources.availablePowerW} W / {resources.requiredPowerW} W</strong></div><div><small>DATA SPACE</small><strong>{resources.storageCapacityGb.toLocaleString()} GB</strong></div></div>
        {readinessIssues.length ? <div className="simulation-blocker-list" role="alert"><strong>SIMULATION HELD AT PRE-LAUNCH</strong><p>Resolve these engineering checks before beginning countdown:</p>{readinessIssues.map((issue) => <button key={issue} onClick={() => onNavigate(issue.toLowerCase().includes('launch vehicle') || issue.toLowerCase().includes('trajectory') || issue.toLowerCase().includes('payload') ? 'launch-configuration' : issue.toLowerCase().includes('instrument') ? 'instruments' : issue.toLowerCase().includes('funding') || issue.toLowerCase().includes('budget') || issue.toLowerCase().includes('communication system') ? 'mission-control' : issue.toLowerCase().includes('mission configuration') || issue.toLowerCase().includes('duration') || issue.toLowerCase().includes('objective') ? 'mission-design' : 'spacecraft-designer')}>{issue} <span>OPEN MODULE ↗</span></button>)}</div> : <div className="simulation-ready-note"><strong>ALL PRE-LAUNCH CHECKS PASSED</strong><p>Mission configuration is confirmed and the selected vehicle, trajectory, spacecraft, instruments, budget, power, storage, communications, and duration passed the simulation gate.</p></div>}
        <Button disabled={readinessIssues.length > 0} onClick={() => dispatch({ type: 'START_MISSION_SIMULATION' })}>START MISSION <span aria-hidden="true">→</span></Button>
      </Card> : <>
        {simulation.status === 'completed' && <div className="simulation-run-banner"><strong>{simulation.missionOutcome === 'failed' ? 'MISSION FAILED' : 'MISSION RUN COMPLETE'}</strong><span>Results are stored with the launch-time mission configuration.</span></div>}
        {simulation.status === 'active' && !(simulation.phase === 'deployment' && orbitPanelActive) && <div className="simulation-run-banner is-active"><strong>ACTIVE RUN · {simulation.snapshot.missionName}</strong><span>Simulation uses the configuration snapshot captured at pre-launch.</span></div>}
        {simulation.phase === 'pre-launch' || simulation.phase === 'countdown' || simulation.phase === 'launch' ? <LaunchJourneyScene simulation={simulation} dispatch={dispatch} /> : null}
        {simulation.phase === 'arrival' ? <>{activeSimulationStage}{activeFlightScene}</> : <>{activeFlightScene}{activeSimulationStage}</>}
        {simulation.status === 'completed' ? <details className="simulation-history-details"><summary>How this game flight is modeled</summary><ul className="simulation-assumptions">{MISSION_SIMULATION_ASSUMPTIONS.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></details> : null}
      </>}
    </section>
  );
}

function SimulationPhaseProgress({ current }: { current: number }) {
  const active = phaseSequence[current] ?? phaseSequence[0];
  const percentage = Math.round((current / (phaseSequence.length - 1)) * 100);
  return <section className="simulation-phase-progress" aria-label={`Flight step ${current + 1} of ${phaseSequence.length}: ${active.label}`}>
    <div className="simulation-phase-heading"><span>FLIGHT STEP {current + 1} / {phaseSequence.length}</span><strong>{active.label}</strong></div>
    <div className="simulation-phase-bar" role="progressbar" aria-label="Mission progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><i style={{ width: `${percentage}%` }} /></div>
    <details><summary>See all flight steps</summary><ol>{phaseSequence.map((phase, index) => <li key={phase.id} className={index === current ? 'is-current' : index < current ? 'is-done' : ''}><span>{index < current ? '✓' : index + 1}</span>{phase.label}</li>)}</ol></details>
  </section>;
}

function SimulationStage({ simulation, phaseIndex, dispatch, onNavigate, cruiseApproachActive, onBeginCruiseApproach, destinationTravelActive, destinationReached, orbitPanelActive, onOrbitReady, onBackToFlight }: { simulation: MissionSimulationState; phaseIndex: number; dispatch: ReturnType<typeof useGameState>['dispatch']; onNavigate: (stage: MissionStage) => void; cruiseApproachActive: boolean; onBeginCruiseApproach: () => void; destinationTravelActive: boolean; destinationReached: boolean; orbitPanelActive: boolean; onOrbitReady: () => void; onBackToFlight: () => void }) {
  switch (simulation.phase) {
    case 'pre-launch': return <PreLaunchStage simulation={simulation} />;
    case 'countdown':
    case 'launch': return null;
    case 'deployment': return <DeploymentStage simulation={simulation} destinationTravelActive={destinationTravelActive} destinationReached={destinationReached} orbitPanelActive={orbitPanelActive} onOrbitReady={onOrbitReady} onBackToFlight={onBackToFlight} />;
    case 'cruise': return <CruiseStage simulation={simulation} phaseIndex={phaseIndex} cruiseApproachActive={cruiseApproachActive} onBeginApproach={onBeginCruiseApproach} />;
    case 'arrival': return <ArrivalStage simulation={simulation} dispatch={dispatch} />;
    case 'scientific-operations': return <ScientificOperationsStage simulation={simulation} dispatch={dispatch} />;
    case 'communication': return <CommunicationStage simulation={simulation} dispatch={dispatch} />;
    case 'completion': return <CompletionStage simulation={simulation} dispatch={dispatch} onNavigate={onNavigate} />;
  }
}

function PreLaunchStage({ simulation }: { simulation: MissionSimulationState }) {
  const snapshot = simulation.snapshot;
  return <Card title="1 · Ready to launch" subtitle="Everything in this checklist matches your plan">
    <div className="simulation-check-grid">{[
      ['Mission', `${snapshot.missionName} · ${snapshot.destinationName} ${snapshot.architectureName}`],
      ['Launch plan', `${snapshot.launchVehicleName} · ${snapshot.trajectoryName}`],
      ['Spacecraft mass', `${snapshot.totalMassKg.toLocaleString()} / ${snapshot.launchVehicleCapacityKg.toLocaleString()} kg`],
      ['Budget balance', `${money.format(snapshot.remainingBudgetUsd)} remaining`],
      ['Power', `${snapshot.powerGenerationW} W generated · ${snapshot.powerDemandW} W demand`],
      ['Science payload', snapshot.instruments.map((item) => item.name).join(', ')],
      ['Data systems', `${snapshot.storageCapacityGb.toLocaleString()} GB storage · ${snapshot.downlinkMbps.toFixed(2)} Mbps downlink`],
      ['Objectives', snapshot.objectives.map((item) => item.name).join('; ')],
    ].map(([label, value]) => <div key={label}><span>✓</span><p><small>{label}</small><strong>{value}</strong></p></div>)}</div>
    <p className="simulation-stage-note">Your ship and rocket are ready.</p>
  </Card>;
}

function LaunchJourneyScene({ simulation, dispatch }: { simulation: MissionSimulationState; dispatch: ReturnType<typeof useGameState>['dispatch'] }) {
  const snapshot = simulation.snapshot;
  const [launchPhase, setLaunchPhase] = useState<'pad' | 'countdown' | 'ignition' | 'ascent' | 'space' | 'transfer'>(() =>
    simulation.phase === 'pre-launch' ? 'pad' : simulation.phase === 'countdown' ? 'countdown' : 'ignition',
  );
  const [countdownValue, setCountdownValue] = useState(5);

  useEffect(() => {
    if (launchPhase === 'countdown') {
      const timer = window.setTimeout(() => {
        if (countdownValue <= 1) {
          setLaunchPhase('ignition');
          dispatch({ type: 'ADVANCE_MISSION_SIMULATION' });
        } else setCountdownValue((value) => value - 1);
      }, 1000);
      return () => window.clearTimeout(timer);
    }
    if (launchPhase === 'ignition') {
      const timer = window.setTimeout(() => setLaunchPhase('ascent'), 900);
      return () => window.clearTimeout(timer);
    }
    if (launchPhase === 'ascent') {
      const timer = window.setTimeout(() => setLaunchPhase('space'), 4400);
      return () => window.clearTimeout(timer);
    }
    if (launchPhase === 'transfer') {
      const timer = window.setTimeout(() => dispatch({ type: 'ADVANCE_MISSION_SIMULATION' }), 2600);
      return () => window.clearTimeout(timer);
    }
  }, [launchPhase, countdownValue, dispatch]);

  const launchSteps = [
    { label: 'Pad', complete: launchPhase !== 'pad', current: launchPhase === 'pad' },
    { label: 'Countdown', complete: ['ignition', 'ascent', 'space', 'transfer'].includes(launchPhase), current: launchPhase === 'countdown' },
    { label: 'Ascent', complete: launchPhase === 'space' || launchPhase === 'transfer', current: launchPhase === 'ignition' || launchPhase === 'ascent' },
    { label: 'Destination', complete: launchPhase === 'transfer', current: launchPhase === 'space' || launchPhase === 'transfer' },
  ];

  return <section className="launch-journey" aria-label="Interactive rocket launch sequence">
    <div className={`launch-mission-scene launch-phase-${launchPhase}`} aria-label={`${snapshot.launchVehicleName} carrying ${snapshot.missionName}`}>
      <div className="launch-scene-stars" />
      <div className="launch-scene-earth"><span /></div>
      <div className="launch-scene-clouds" />
      <div className="launch-scene-ground"><span>LAUNCH COMPLEX · EARTH</span></div>
      <div className="launch-tower"><i /><i /><i /><b /></div>
      <div className="launch-vehicle-rig" aria-hidden="true"><RocketVehicleArtwork /></div>
      <div className="launch-scene-caption"><span>{snapshot.launchVehicleName.toUpperCase()}</span><strong>{launchPhase === 'pad' ? 'ROCKET READY' : launchPhase === 'countdown' ? 'FINAL COUNTDOWN' : launchPhase === 'ignition' ? 'ENGINE START' : launchPhase === 'ascent' ? 'POWERED ASCENT' : launchPhase === 'transfer' ? `APPROACHING ${snapshot.destinationName.toUpperCase()}` : 'SPACE · DESTINATION APPROACH'}</strong></div>
      {launchPhase === 'space' || launchPhase === 'transfer' ? <div className="launch-target-world"><WorldSphere destination={snapshot.destination} /><strong>{snapshot.destinationName.toUpperCase()}</strong></div> : null}
      {launchPhase === 'pad' ? <div className="launch-scene-action"><button type="button" onClick={() => { setCountdownValue(5); setLaunchPhase('countdown'); dispatch({ type: 'ADVANCE_MISSION_SIMULATION' }); }}>START COUNTDOWN <span aria-hidden="true">▶</span></button></div> : null}
      {launchPhase === 'countdown' ? <div className="launch-countdown-readout" role="status" aria-live="polite"><span>T − MINUS</span><strong key={countdownValue}>{countdownValue}</strong><small>LAUNCH SEQUENCE</small></div> : null}
      {launchPhase === 'ignition' || launchPhase === 'ascent' ? <div className="launch-flight-status" role="status"><strong>{launchPhase === 'ignition' ? 'ENGINE IGNITION' : 'ASCENDING'}</strong><span>{snapshot.totalMassKg.toLocaleString()} kg · {snapshot.trajectoryName}</span></div> : null}
      {launchPhase === 'space' ? <div className="launch-space-confirmation" role="status"><span>✓</span><strong>SPACE REACHED</strong><small>{snapshot.trajectoryName} · ready for the {snapshot.destinationName} approach</small><button type="button" onClick={() => setLaunchPhase('transfer')}>HEAD TO {snapshot.destinationName.toUpperCase()} <span aria-hidden="true">→</span></button></div> : null}
      {launchPhase === 'transfer' ? <div className="launch-flight-status is-transfer" role="status"><strong>ON THE WAY TO {snapshot.destinationName.toUpperCase()}</strong><span>Following the selected mission route…</span></div> : null}
    </div>
    <div className="launch-progress-steps" aria-label="Launch sequence">
      {launchSteps.map((step) => <span key={step.label} className={step.complete ? 'is-complete' : step.current ? 'is-current' : ''}><i>{step.complete ? '✓' : '•'}</i>{step.label}</span>)}
    </div>
    <div className="simulation-launch-facts"><div><small>SPACECRAFT PAYLOAD</small><strong>{snapshot.totalMassKg.toLocaleString()} kg</strong><span>{snapshot.architectureName} · {snapshot.destinationName}</span></div><div><small>ONBOARD SCIENCE</small><strong>{snapshot.instruments.length} instruments</strong><span>{snapshot.instruments.map((item) => item.name).join(', ') || 'No instruments selected'}</span></div><div><small>LAUNCH VEHICLE</small><strong>{snapshot.launchVehicleName}</strong><span>{snapshot.launchVehicleCapacityKg.toLocaleString()} kg educational payload limit</span></div></div>
    <p className="launch-stage-hint">{launchPhase === 'pad' ? 'Start the countdown to prepare for liftoff.' : launchPhase === 'countdown' ? 'Hold sequence · the rocket launches automatically at zero.' : launchPhase === 'ignition' ? 'Countdown complete · engines starting.' : launchPhase === 'ascent' ? 'Rocket is climbing through the atmosphere…' : launchPhase === 'transfer' ? `The rocket is following the route to ${snapshot.destinationName}.` : 'The selected destination is ahead.'}</p>
  </section>;
}
function DeploymentStage({ simulation, destinationTravelActive, destinationReached, orbitPanelActive, onOrbitReady, onBackToFlight }: { simulation: MissionSimulationState; destinationTravelActive: boolean; destinationReached: boolean; orbitPanelActive: boolean; onOrbitReady: () => void; onBackToFlight: () => void }) {
  const snapshot = simulation.snapshot;
  return <Card title={orbitPanelActive ? undefined : `4 · Orbit ${snapshot.destinationName}`} subtitle={orbitPanelActive ? undefined : destinationReached ? `Destination reached · continue to ${snapshot.destinationName} orbit` : `Fly your spacecraft to ${snapshot.destinationName} to begin orbit insertion`}>
    {!orbitPanelActive ? <div className="simulation-system-grid">{[
      ['Power', `${snapshot.powerGenerationW} W generation / ${snapshot.powerDemandW} W load`, snapshot.powerGenerationW >= snapshot.powerDemandW ? 'success' : 'warning'],
      ['Communications', `${snapshot.downlinkMbps.toFixed(2)} Mbps selected downlink`, snapshot.downlinkMbps > 0 ? 'success' : 'warning'],
      ['Science payload', `${snapshot.instruments.length} instruments ready`, 'success'],
    ].map(([label, value, status]) => <div key={label} className={`simulation-system-status status-${status}`}><span>{status === 'success' ? '●' : '▲'}</span><small>{label}</small><strong>{value}</strong></div>)}</div> : null}
    {destinationReached ? <section className={`orbit-mission-module${orbitPanelActive ? ' is-active' : ''}`} hidden={!orbitPanelActive}>
      <header><div><span>DESTINATION ORBIT</span><strong>{snapshot.destinationName}</strong></div><button type="button" onClick={onBackToFlight}>← BACK TO FLIGHT</button></header>
      <OrbitPlayground initialBody={snapshot.destination} spacecraftName={snapshot.missionName} launchVehicleName={snapshot.launchVehicleName} onOrbitReady={onOrbitReady} />
    </section> : <div className={`destination-travel-prompt${destinationTravelActive ? ' is-traveling' : ''}`}>
      <span className="destination-travel-icon" aria-hidden="true">{destinationTravelActive ? '✦' : '◎'}</span>
      <div><strong>{destinationTravelActive ? `Traveling to ${snapshot.destinationName}…` : `Mission target: ${snapshot.destinationName}`}</strong><small>{destinationTravelActive ? `${snapshot.trajectoryName} · arrival sequence underway` : 'Use the destination button on the flight scene above.'}</small></div>
      {destinationTravelActive ? <span className="destination-travel-progress"><i /></span> : null}
    </div>}
  </Card>;
}
function CruiseStage({ simulation, phaseIndex, cruiseApproachActive, onBeginApproach }: { simulation: MissionSimulationState; phaseIndex: number; cruiseApproachActive: boolean; onBeginApproach: () => void }) {
  const snapshot = simulation.snapshot;
  return <Card title="5 · Cruise" subtitle="Your spacecraft is on its way">
    <div className={`cruise-progress${cruiseApproachActive ? ' is-approaching' : ''}`}><div><span>{cruiseApproachActive ? `APPROACHING ${snapshot.destinationName.toUpperCase()}` : 'SEQUENCE PROGRESS'}</span><strong>{cruiseApproachActive ? 'INBOUND' : `${Math.round(phaseIndex / (phaseSequence.length - 1) * 100)}%`}</strong></div><div className="cruise-progress-track"><i style={{ width: cruiseApproachActive ? '100%' : `${phaseIndex / (phaseSequence.length - 1) * 100}%` }} /></div></div>
    <div className="simulation-resource-strip"><span>POWER BALANCE<strong>{(snapshot.powerGenerationW - snapshot.powerDemandW).toLocaleString()} W</strong></span><span>DATA GENERATION<strong>{snapshot.estimatedMissionDataGb.toFixed(1)} GB projected</strong></span><span>STORAGE<strong>{snapshot.storageCapacityGb.toLocaleString()} GB</strong></span><span>LINK<strong>{snapshot.downlinkMbps.toFixed(2)} Mbps</strong></span><span>MISSION CLOCK<strong>{snapshot.durationDays} days</strong></span></div>
    <Button disabled={cruiseApproachActive} onClick={onBeginApproach}>{cruiseApproachActive ? `Approaching ${snapshot.destinationName}…` : `Begin approach to ${snapshot.destinationName} →`}</Button>
  </Card>;
}

function ArrivalStage({ simulation, dispatch }: { simulation: MissionSimulationState; dispatch: ReturnType<typeof useGameState>['dispatch'] }) {
  const snapshot = simulation.snapshot;
  return <Card title={`6 · Land on ${snapshot.destinationName}`} subtitle="Steer around the rocks and set your spacecraft down gently">
    <LandingChallenge
      snapshot={snapshot}
      failedAttempts={simulation.landingAttempts ?? 0}
      onAttemptFailed={() => dispatch({ type: 'RECORD_LANDING_FAILURE' })}
      onLanded={() => {
        dispatch({ type: 'CONFIRM_MISSION_LANDING' });
        dispatch({ type: 'ADVANCE_MISSION_SIMULATION' });
      }}
    />
  </Card>;
}
function ScientificOperationsStage({ simulation, dispatch }: { simulation: MissionSimulationState; dispatch: ReturnType<typeof useGameState>['dispatch'] }) {
  const snapshot = simulation.snapshot;
  const prioritizedObjectives = [...snapshot.objectives].sort((a, b) => Number(b.id === snapshot.prioritizedObjectiveId) - Number(a.id === snapshot.prioritizedObjectiveId));
  return <Card title="7 · Science time" subtitle="Choose your top science goal and collect data">
    <div className="science-operations-layout"><div><h3>Priority objectives</h3><ol className="science-objective-list">{prioritizedObjectives.map((objective, index) => {
      const matched = snapshot.instruments.filter((instrument) => instrument.objectiveIds.includes(objective.id));
      const isPriority = objective.id === snapshot.prioritizedObjectiveId;
      return <li key={objective.id} className={isPriority ? 'is-primary-objective' : ''}><span>{isPriority ? '★' : String(index + 1).padStart(2, '0')}</span><div><strong>{objective.name}{isPriority ? ' · PRIMARY' : ''}</strong><small>{matched.length ? `Evidence from ${matched.map((instrument) => instrument.name).join(', ')}` : 'No selected instrument directly addresses this objective.'}</small></div></li>;
    })}</ol></div><div><h3>Selected payload</h3><div className="science-instrument-list">{snapshot.instruments.map((instrument) => <article key={instrument.id}><span>STANDBY</span><strong>{instrument.name}</strong><small>{instrument.scientificPurpose}</small><em>{instrument.dataGenerationMbps} Mbps · {instrument.powerConsumptionW} W</em></article>)}</div></div></div>
    <Button onClick={() => dispatch({ type: 'RUN_MISSION_SCIENCE' })}>Collect science data →</Button>
  </Card>;
}

function CommunicationStage({ simulation, dispatch }: { simulation: MissionSimulationState; dispatch: ReturnType<typeof useGameState>['dispatch'] }) {
  const snapshot = simulation.snapshot;
  const transmissionCapacity = snapshot.dailyDownlinkCapacityGb * snapshot.durationDays;
  const expectedTransmission = Math.min(simulation.scienceDataCollectedGb, transmissionCapacity);
  return <Card title="8 · Send data home" subtitle="See how much of your science reaches Earth">
    <div className="communication-link-panel"><div className="link-node spacecraft-node"><span>SPACECRAFT</span><strong>{simulation.scienceDataCollectedGb.toFixed(2)} GB</strong><small>Collected science data</small></div><div className="link-beam"><i /><span>{snapshot.downlinkMbps.toFixed(2)} Mbps · {snapshot.communicationRequirement}</span></div><div className="link-node earth-node"><span>EARTH RECEIVER</span><strong>{expectedTransmission.toFixed(2)} GB</strong><small>Modeled capacity over {snapshot.durationDays} days</small></div></div>
    <div className="transmission-summary"><span>Recorder capacity<strong>{snapshot.storageCapacityGb.toLocaleString()} GB</strong></span><span>Data queued<strong>{simulation.scienceDataCollectedGb.toFixed(2)} GB</strong></span><span>Projected return<strong>{expectedTransmission.toFixed(2)} GB</strong></span></div>
    <Button onClick={() => dispatch({ type: 'TRANSMIT_MISSION_DATA' })}>Send data to Earth →</Button>
  </Card>;
}

function CompletionStage({ simulation, dispatch, onNavigate }: { simulation: MissionSimulationState; dispatch: ReturnType<typeof useGameState>['dispatch']; onNavigate: (stage: MissionStage) => void }) {
  const snapshot = simulation.snapshot;
  const evaluated = simulation.status === 'completed';
  const missionFailed = simulation.missionOutcome === 'failed';
  return <Card title={missionFailed ? 'Mission failed' : '9 · Mission complete'} subtitle={missionFailed ? 'Five landing attempts were used' : evaluated ? 'Here is how your mission went' : 'Ready to see your mission score?'}>
    {evaluated ? <>
      <div className={`mission-result-score${missionFailed ? ' mission-result-failed' : ''}`}><span>{missionFailed ? 'MISSION FAILED · LANDING ATTEMPTS USED' : 'MISSION PERFORMANCE INDEX'}</span><strong>{simulation.performanceScore}<small>/100</small></strong><p>{simulation.resultSummary}</p></div>
      <div className="mission-result-metrics"><span>Science data collected<strong>{simulation.scienceDataCollectedGb.toFixed(2)} GB</strong></span><span>Transmitted to Earth<strong>{simulation.dataTransmittedGb.toFixed(2)} GB</strong></span><span>Retained onboard<strong>{simulation.dataRetainedGb.toFixed(2)} GB</strong></span><span>Selected spacecraft<strong>{snapshot.totalMassKg.toLocaleString()} kg · {snapshot.launchVehicleName}</strong></span></div>
      {missionFailed ? <Button variant="secondary" onClick={() => onNavigate('mission-evaluation')}>View mission report</Button> : <><h3>Objective findings</h3><div className="mission-objective-results">{simulation.objectiveResults.map((result) => <article key={result.objectiveId} className={`result-${result.status}`}><span>{result.status === 'supported' ? 'SUPPORTED' : 'UNADDRESSED'}</span><strong>{result.objectiveName}</strong><small>{result.finding}</small></article>)}</div><Button variant="secondary" onClick={() => onNavigate('mission-review')}>Review mission configuration</Button></>}
      <Button variant="secondary" onClick={() => onNavigate('mission-history')}>View finished missions</Button>
      <Button variant="ghost" onClick={() => dispatch({ type: 'START_MISSION_SIMULATION' })}>{missionFailed ? 'Retry this mission' : 'Run the current configuration again'}</Button>
    </> : <>
      <div className="completion-pending"><strong>Science collection and data return complete</strong><p>{simulation.objectiveResults.filter((item) => item.status === 'supported').length} of {simulation.objectiveResults.length} objectives have instrument support. {simulation.dataTransmittedGb.toFixed(2)} GB is ready for final performance evaluation.</p></div>
      <Button onClick={() => dispatch({ type: 'COMPLETE_MISSION_SIMULATION' })}>See my mission results →</Button>
    </>}
  </Card>;
}
