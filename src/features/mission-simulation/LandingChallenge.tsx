import { useEffect, useRef, useState } from 'react';
import type { MissionLandingRecord, MissionSimulationSnapshot } from '../../state/gameTypes';

type FlightStatus = 'ready' | 'flying' | 'landed' | 'crashed';
interface FlightState { x: number; y: number; vx: number; vy: number; fuel: number; status: FlightStatus; }
type FlightControl = 'left' | 'right' | 'thrust';

const startState: FlightState = { x: 48, y: 10, vx: 0, vy: 0, fuel: 100, status: 'ready' };
const obstacles = [{ x: 53, y: 51, size: 'large' }, { x: 69, y: 69, size: 'small' }, { x: 39, y: 77, size: 'small' }] as const;

export function LandingChallenge({ snapshot, failedAttempts, onAttemptFailed, onLanded, onContinueToScience, landingRecord }: { snapshot: MissionSimulationSnapshot; failedAttempts: number; onAttemptFailed: () => void; onLanded: (gridX: number, gridY: number) => void; onContinueToScience: () => void; landingRecord?: MissionLandingRecord | null }) {
  const [flight, setFlight] = useState<FlightState>(() => landingRecord ? { ...startState, x: landingRecord.gridX, y: landingRecord.gridY, status: 'landed' } : startState);
  const flightRef = useRef(flight);
  const failureRecorded = useRef(false);
  const landingRecorded = useRef(Boolean(landingRecord));
  const held = useRef(new Set<FlightControl>());
  const arenaRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<HTMLElement>(null);
  const fullscreenTarget = useRef<HTMLElement | null>(null);
  const savedPageScroll = useRef<number | null>(null);
  const zoomWasActive = useRef(false);
  const [fullscreenFallback, setFullscreenFallback] = useState(false);
  const landed = flight.status === 'landed';
  const crashed = flight.status === 'crashed';
  const fuelCapacity = Math.max(72, Math.min(100, 112 - snapshot.totalMassKg / 950));
  const hasLandingGear = snapshot.components.some((component) => component.category === 'structure');
  const hasEngine = snapshot.components.some((component) => component.category === 'propulsion');

  useEffect(() => { flightRef.current = flight; }, [flight]);

  useEffect(() => {
    if (flight.status !== 'flying') return;
    let frame = 0;
    let previous = 0;
    const step = (now: number) => {
      if (!previous) previous = now;
      const dt = Math.min((now - previous) / 1000, 0.035);
      previous = now;
      const current = flightRef.current;
      if (current.status !== 'flying') return;

      const next = { ...current };
      const thrusting = held.current.has('thrust') && next.fuel > 0;
      const gravity = snapshot.destination === 'moon' ? 5.2 : 6.1;
      const enginePower = hasEngine ? 1 : 0.78;
      if (held.current.has('left')) next.vx -= 10 * dt;
      if (held.current.has('right')) next.vx += 10 * dt;
      if (thrusting) {
        next.vy -= (gravity + 4.2) * enginePower * dt;
        next.fuel = Math.max(0, next.fuel - 11 * dt);
      }
      next.vy = Math.min(13, next.vy + gravity * dt);
      next.vx *= Math.max(0, 1 - 0.32 * dt);
      next.x += next.vx * dt;
      next.y += next.vy * dt;

      const hitRock = obstacles.some((rock) => Math.hypot((next.x - rock.x) * 0.78, next.y - rock.y) < (rock.size === 'large' ? 6.7 : 5.2));
      if (hitRock || next.x < 2 || next.x > 98 || next.fuel <= 0 && next.y > 85) {
        next.status = 'crashed';
      } else if (next.y >= 88) {
        const inLandingZone = next.x >= 77 && next.x <= 94;
        const gentleTouchdown = next.vy <= 3.1 && Math.abs(next.vx) <= 2.6;
        next.y = 88;
        next.status = inLandingZone && gentleTouchdown && hasLandingGear ? 'landed' : 'crashed';
      }

      flightRef.current = next;
      setFlight(next);
      if (next.status === 'flying') frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [flight.status, hasEngine, hasLandingGear, snapshot.destination]);

  useEffect(() => {
    if (!landed) return;
    held.current.clear();
  }, [landed]);

  useEffect(() => {
    if (!landed || landingRecorded.current) return;
    landingRecorded.current = true;
    onLanded(flight.x, flight.y);
  }, [landed, flight.x, flight.y, onLanded]);

  useEffect(() => {
    if (!crashed || failureRecorded.current) return;
    failureRecorded.current = true;
    onAttemptFailed();
  }, [crashed, onAttemptFailed]);

  useEffect(() => {
    if (!landed && !crashed) return;
    held.current.clear();
    if (landed && document.fullscreenElement === gameRef.current) {
      void document.exitFullscreen().catch(() => undefined);
    }
    if (landed) {
      setFullscreenFallback(false);
      restorePagePosition();
    }
  }, [landed, crashed]);

  useEffect(() => {
    const syncFullscreen = () => {
      const isGameFullscreen = document.fullscreenElement === fullscreenTarget.current;
      if (isGameFullscreen) zoomWasActive.current = true;
      if (!document.fullscreenElement) {
        setFullscreenFallback(false);
        if (zoomWasActive.current) restorePagePosition();
      }
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      const top = savedPageScroll.current;
      if (document.fullscreenElement === fullscreenTarget.current) {
        void document.exitFullscreen().catch(() => undefined).finally(() => {
          if (top !== null) requestAnimationFrame(() => window.scrollTo(0, top));
        });
      } else if (zoomWasActive.current && top !== null) {
        requestAnimationFrame(() => window.scrollTo(0, top));
      }
    };
  }, []);

  useEffect(() => {
    if (flight.status !== 'flying') return;
    const controls: Record<string, FlightControl> = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'thrust', w: 'thrust', ' ': 'thrust' };
    const down = (event: KeyboardEvent) => {
      const control = controls[event.key];
      if (!control) return;
      event.preventDefault();
      held.current.add(control);
    };
    const up = (event: KeyboardEvent) => { const control = controls[event.key]; if (control) held.current.delete(control); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clearControls);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clearControls); };
  }, [flight.status]);

  function clearControls() { held.current.clear(); }
  function restorePagePosition() {
    const top = savedPageScroll.current;
    if (top !== null) requestAnimationFrame(() => window.scrollTo(0, top));
  }
  function begin() {
    const next = { ...startState, fuel: fuelCapacity, status: 'flying' as const };
    failureRecorded.current = false;
    flightRef.current = next;
    setFlight(next);
    if (savedPageScroll.current === null) savedPageScroll.current = window.scrollY;
    arenaRef.current?.focus({ preventScroll: true });
    const game = gameRef.current;
    fullscreenTarget.current = game;
    if (document.fullscreenElement === game || fullscreenFallback) {
      zoomWasActive.current = true;
    } else if (game?.requestFullscreen) {
      void game.requestFullscreen().then(() => {
        zoomWasActive.current = true;
        setFullscreenFallback(false);
      }).catch(() => {
        zoomWasActive.current = true;
        setFullscreenFallback(true);
      });
    } else {
      zoomWasActive.current = true;
      setFullscreenFallback(true);
    }
  }
  function hold(control: FlightControl) { held.current.add(control); }
  function release(control: FlightControl) { held.current.delete(control); }

  return <section className={`landing-game${fullscreenFallback ? ' is-fullscreen-fallback' : ''}`} ref={gameRef} aria-label={`Playable landing challenge at ${snapshot.destinationName}`}>
    <div className={`landing-arena landing-${snapshot.destination}${landed ? ' landing-success' : ''}${crashed ? ' landing-failure' : ''}`} ref={arenaRef} tabIndex={0} aria-label="Landing area. Use left and right to steer, and up or space to fire the engine.">
      <div className="landing-stars" />
      <div className="landing-horizon" />
      <div className="landing-pad"><span /></div>
      {obstacles.map((rock, index) => <div key={index} className={`landing-rock rock-${rock.size}`} style={{ left: `${rock.x}%`, top: `${rock.y}%` }} />)}
      <svg className={`landing-ship ${flight.status === 'flying' ? 'is-active' : ''}`} style={{ left: `${flight.x}%`, top: `${flight.y}%`, transform: `translate(-50%, -50%) rotate(${Math.max(-28, Math.min(28, flight.vx * 3))}deg)` }} viewBox="0 0 72 82" role="img" aria-label={`Your ${snapshot.architectureName} spacecraft`}>
        <defs><linearGradient id="lander-hull" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff4d7"/><stop offset=".5" stopColor="#b8cce1"/><stop offset="1" stopColor="#657da4"/></linearGradient><linearGradient id="lander-flame" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff0a7"/><stop offset="1" stopColor="#ff784e" stopOpacity="0"/></linearGradient></defs>
        {snapshot.components.some((component) => component.category === 'power') ? <g fill="#3182c8" stroke="#9feaff" strokeWidth="1.5"><path d="M21 35H3v18h18zm48 0H51v18h18z"/><path d="M9 35v18m7-18v18M57 35v18m7-18v18" stroke="#b1edff" strokeWidth=".8"/></g> : null}
        {snapshot.components.some((component) => component.category === 'communication') ? <g fill="none" stroke="#fff0ca" strokeWidth="2"><path d="m44 27 10-11"/><path d="M51 9q11-1 13 9-7 7-14 4z" fill="#eaf9ff"/></g> : null}
        <path d="M26 29 36 12l10 17v29H26z" fill="url(#lander-hull)" stroke="#fff0d1" strokeWidth="2"/><circle cx="36" cy="38" r="5" fill="#2c6b98" stroke="#a8f1ff" strokeWidth="2"/><path d="M21 56 14 70h13m24-14 7 14H45" fill="none" stroke="#fff0d1" strokeWidth="3" strokeLinecap="round"/><path className="landing-engine-flame" d="M31 59h10l-5 19z" fill="url(#lander-flame)" />
      </svg>
      <div className="landing-hud"><span>{snapshot.destination === 'moon' ? 'LUNAR' : 'MARTIAN'} DESCENT · ATTEMPT {Math.min(failedAttempts + 1, 5)}/5</span><span>{Math.max(0, Math.round(flight.fuel))}% FUEL</span></div>
      <div className="landing-speed">↓ {Math.max(0, flight.vy).toFixed(1)} <small>m/s</small></div>
      {flight.status === 'ready' ? <div className="landing-overlay"><div className="landing-briefing"><span className="landing-caution-mark" aria-hidden="true">!</span><strong>DESCENT CAUTION</strong><p>Rocks ahead. Use short engine bursts to slow down and save fuel. Land gently inside the green zone.</p><small>← → STEER <i>·</i> ↑ / SPACE THRUST</small><button type="button" className="landing-start" onClick={begin}>BEGIN DESCENT <span aria-hidden="true">▶</span></button></div></div> : null}
      {crashed ? <div className="landing-overlay"><div className="landing-result-card"><span>FLIGHT RESET</span><strong>{flight.fuel <= 0 ? 'OUT OF FUEL' : obstacles.some((rock) => Math.hypot((flight.x - rock.x) * .78, flight.y - rock.y) < 7) ? 'ROCKY TERRAIN' : !hasLandingGear ? 'LANDING GEAR NEEDED' : 'TOUCHDOWN TOO FAST'}</strong><button type="button" className="landing-start" onClick={begin}>TRY AGAIN <span aria-hidden="true">↻</span></button></div></div> : null}
      {landed ? <div className="landing-overlay landing-touchdown-overlay"><div className="landing-result-card landing-result-success landing-touchdown-card"><span>🛬 TOUCHDOWN · SCIENCE AUTO-STARTED</span><strong>SAFE ON {snapshot.destinationName.toUpperCase()}</strong><div className="touchdown-telemetry"><span>GRID POSITION<strong>X {flight.x.toFixed(1)} · Y {flight.y.toFixed(1)}</strong></span><span>MISSION CLOCK<strong>T+{snapshot.durationDays} modeled days</strong></span><span>ONBOARD SCIENCE<strong>{snapshot.instruments.length} selected instruments</strong></span></div><p>Instruments are recording data at the landing site. Your simulated readings are ready.</p><button type="button" className="landing-start" onClick={onContinueToScience}>OPEN SCIENCE DASHBOARD <span aria-hidden="true">→</span></button></div></div> : null}
    </div>
    <div className="landing-game-controls">
      <div className="landing-pad-legend"><i /> Landing zone <span>·</span> <b>Keep your speed low</b></div>
      <div className="landing-control-pad" aria-label="Spacecraft flight controls">
        <button type="button" aria-label="Steer left" onPointerDown={() => hold('left')} onPointerUp={() => release('left')} onPointerLeave={() => release('left')} onPointerCancel={() => release('left')}>←</button>
        <button type="button" aria-label="Fire engine" className="landing-thrust-button" onPointerDown={() => hold('thrust')} onPointerUp={() => release('thrust')} onPointerLeave={() => release('thrust')} onPointerCancel={() => release('thrust')}>↑</button>
        <button type="button" aria-label="Steer right" onPointerDown={() => hold('right')} onPointerUp={() => release('right')} onPointerLeave={() => release('right')} onPointerCancel={() => release('right')}>→</button>
      </div>
      <span className="landing-key-hint">← → steer <b>·</b> ↑ / SPACE thrust</span>
    </div>
  </section>;
}
