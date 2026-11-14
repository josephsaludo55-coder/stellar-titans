import { useEffect, useRef, useState } from 'react';
import { WorldSphere, type PlanetBody } from '../../components/game/WorldSphere';
import { RocketVehicleArtwork } from '../../components/game/RocketVehicleArtwork';
import { SatelliteArtwork } from '../../components/game/SatelliteArtwork';

export function OrbitPlayground({ initialBody, spacecraftName, launchVehicleName, onOrbitReady }: { initialBody: PlanetBody; spacecraftName: string; launchVehicleName: string; onOrbitReady: () => void }) {
  const [radius, setRadius] = useState(34);
  const [angle, setAngle] = useState(-Math.PI / 2);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<'stable' | 'missed' | null>(null);
  const radiusRef = useRef(radius);
  const angleRef = useRef(angle);
  const bodyName = initialBody === 'moon' ? 'Moon' : initialBody === 'mars' ? 'Mars' : 'Earth';

  useEffect(() => { radiusRef.current = radius; }, [radius]);
  useEffect(() => { angleRef.current = angle; }, [angle]);
  useEffect(() => {
    if (!isRunning) return;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    const startingAngle = angleRef.current;
    const runOrbit = (now: number) => {
      if (!lastTime) lastTime = now;
      elapsed += Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const traveled = elapsed * 0.95;
      const nextAngle = startingAngle + traveled;
      angleRef.current = nextAngle;
      setAngle(nextAngle);
      setProgress(Math.min(100, Math.round(traveled / (Math.PI * 2) * 100)));
      if (traveled >= Math.PI * 2) {
        setIsRunning(false);
        setProgress(100);
        const nextResult = radiusRef.current >= 32 && radiusRef.current <= 36 ? 'stable' : 'missed';
        setResult(nextResult);
        return;
      }
      frame = requestAnimationFrame(runOrbit);
    };
    frame = requestAnimationFrame(runOrbit);
    return () => cancelAnimationFrame(frame);
  }, [isRunning]);

  useEffect(() => {
    if (result !== 'stable') return;
    let frame = 0;
    let lastTime = 0;
    const orbitSatellite = (now: number) => {
      if (!lastTime) lastTime = now;
      const elapsed = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      angleRef.current += elapsed * 0.42;
      setAngle(angleRef.current);
      frame = requestAnimationFrame(orbitSatellite);
    };
    frame = requestAnimationFrame(orbitSatellite);
    return () => cancelAnimationFrame(frame);
  }, [result]);

  function adjustOrbit(change: number) {
    if (isRunning || result === 'stable') return;
    setRadius((current) => Math.max(29, Math.min(43, current + change)));
    setResult(null);
  }

  function startOrbit() {
    if (isRunning || result === 'stable') return;
    setResult(null);
    setProgress(0);
    setIsRunning(true);
  }

  const shipX = 50 + Math.cos(angle) * radius;
  const shipY = 50 + Math.sin(angle) * radius * 0.58;
  const shipHeading = Math.atan2(Math.cos(angle) * 0.58, -Math.sin(angle)) * 180 / Math.PI;
  const isDeployed = result === 'stable';

  return <section className="orbit-playground" aria-label={`${spacecraftName} orbit challenge at ${bodyName}`}>
    <header className="orbit-game-header"><div><span>DESTINATION ORBIT</span><h3>{bodyName} insertion</h3></div><span className="orbit-score-chip">{progress}% <small>{isDeployed ? 'SATELLITE DEPLOYED' : 'ORBIT'}</small></span></header>
    <div className="orbit-game-layout">
      <div className={`orbit-arena${isDeployed ? ' is-satellite-deployed' : ''}`} aria-label={`${spacecraftName} orbiting ${bodyName}. Adjust orbit height and complete one lap.`} tabIndex={0} onKeyDown={(event) => { if (event.key === 'ArrowUp') { event.preventDefault(); adjustOrbit(1); } else if (event.key === 'ArrowDown') { event.preventDefault(); adjustOrbit(-1); } }}>
        <div className="orbit-arena-stars" />
        <div className="orbit-target-ring orbit-band-outer" /><div className="orbit-target-ring orbit-band-inner" />
        <div className="orbit-track" style={{ width: `${radius * 2}%`, height: `${radius * 1.16}%` }} />
        <div className="orbit-body"><WorldSphere destination={initialBody} size="large" /></div>
        <div className={`orbit-rocket-marker${isDeployed ? ' is-separated' : ''}`} style={{ left: `${shipX}%`, top: `${shipY}%`, transform: `translate(-50%, -50%) rotate(${shipHeading}deg)` }} aria-label={`${launchVehicleName}, carrying ${spacecraftName}`}>
          <RocketVehicleArtwork />
        </div>
        {isDeployed ? <SatelliteArtwork className="orbit-deployed-satellite" style={{ left: `${shipX}%`, top: `${shipY}%`, transform: `translate(-50%, -50%) rotate(${shipHeading}deg)` }} /> : null}
        {isDeployed ? <div className="orbit-separation-flash" aria-hidden="true" /> : null}
        <div className="orbit-body-tag">{bodyName.toUpperCase()} · TARGET ORBIT</div><span className="orbit-safe-zone-label">SAFE ORBIT ZONE</span>
        {isDeployed ? <span className="orbit-deployed-label">SATELLITE DEPLOYED</span> : null}
      </div>
      <aside className="orbit-controls">
        <div className="orbit-destination-lock"><span>MISSION TARGET</span><strong><WorldSphere destination={initialBody} size="small" />{bodyName}</strong><small>{launchVehicleName} · {spacecraftName}</small></div>
        <div className="orbit-setting"><span>ORBIT HEIGHT</span><strong>{radius}</strong></div>
        <div className="orbit-thrust-controls"><button type="button" aria-label="Lower orbit" disabled={isRunning || isDeployed} onClick={() => adjustOrbit(-1)}>↓<small>LOWER</small></button><div className="orbit-ring-meter"><i style={{ left: `${((radius - 29) / 14) * 100}%` }} /></div><button type="button" aria-label="Raise orbit" disabled={isRunning || isDeployed} onClick={() => adjustOrbit(1)}>↑<small>RAISE</small></button></div>
        <p className="orbit-instruction">Set height to the green band <b>32–36</b>, then complete one lap.</p>
        {result === 'stable' ? <p className="orbit-result is-stable" role="status">✦ STABLE ORBIT · SATELLITE DEPLOYED</p> : result === 'missed' ? <p className="orbit-result is-missed" role="status">ORBIT MISSED · adjust height and try again</p> : isRunning ? <p className="orbit-result" role="status">Orbiting {bodyName} · {progress}% complete</p> : <p className="orbit-result">Set the green-band height, then start your orbit run.</p>}
        {result === 'stable' ? <button type="button" className="orbit-start-button orbit-next-button" onClick={onOrbitReady}>BEGIN LANDING SEQUENCE →</button> : <button type="button" className="orbit-start-button" disabled={isRunning} onClick={startOrbit}>{isRunning ? 'ORBIT IN PROGRESS…' : result === 'missed' ? 'RETRY ORBIT' : 'START ORBIT RUN →'}</button>}
      </aside>
    </div>
    <p className="orbit-mode-note">One selected destination · simplified orbital game</p>
  </section>;
}
