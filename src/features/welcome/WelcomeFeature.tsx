import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../../components/common/Button';
import { useGameState } from '../../hooks/useGameState';
import type { MissionStage } from '../../state/gameTypes';

interface WelcomeFeatureProps {
  onNavigate: (stage: MissionStage) => void;
  onContinue: () => void;
  onNewFlight: () => void;
  hasSavedProgress: boolean;
  loadWarning: string | null;
}

function WelcomeAstronaut({ hero = false }: { hero?: boolean }) {
  const [isCheering, setIsCheering] = useState(false);

  function trackPointer(event: ReactPointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--astronaut-yaw', `${horizontal * 18}deg`);
    event.currentTarget.style.setProperty('--astronaut-pitch', `${vertical * -12}deg`);
  }

  function resetPointer(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty('--astronaut-yaw', '-8deg');
    event.currentTarget.style.setProperty('--astronaut-pitch', '0deg');
  }

  return <button type="button" className={'welcome-astronaut-stage' + (hero ? ' is-hero' : '') + (isCheering ? ' is-cheering' : '')} aria-label="Make the astronaut wave" title="Make the astronaut wave" onPointerMove={trackPointer} onPointerLeave={resetPointer} onClick={() => setIsCheering(true)}>
    <svg className="welcome-astronaut-art" viewBox="0 0 360 420" role="img" aria-label="A floating astronaut in a detailed white space suit">
      <defs>
        <linearGradient id="astro-suit" x1=".1" y1="0" x2=".9" y2="1"><stop stopColor="#fff"/><stop offset=".42" stopColor="#d9e8f2"/><stop offset="1" stopColor="#7894ae"/></linearGradient>
        <linearGradient id="astro-helmet" x1=".15" y1="0" x2=".9" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#d5e3f0"/><stop offset="1" stopColor="#8ea8c0"/></linearGradient>
        <linearGradient id="astro-visor" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6ce7ff"/><stop offset=".35" stopColor="#286fa6"/><stop offset="1" stopColor="#132a55"/></linearGradient>
        <linearGradient id="astro-metal" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#637e99"/><stop offset=".48" stopColor="#eef8ff"/><stop offset="1" stopColor="#5e7895"/></linearGradient>
        <linearGradient id="astro-boot" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f5fbff"/><stop offset="1" stopColor="#829bb5"/></linearGradient>
        <radialGradient id="astro-glow"><stop stopColor="#72eaff" stopOpacity=".42"/><stop offset="1" stopColor="#72eaff" stopOpacity="0"/></radialGradient>
        <filter id="astro-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#041326" floodOpacity=".55"/></filter>
      </defs>
      <ellipse cx="180" cy="211" rx="164" ry="73" fill="none" stroke="#a8eaf5" strokeOpacity=".24" strokeWidth="2" strokeDasharray="4 10" className="welcome-astronaut-orbit" />
      <ellipse cx="180" cy="355" rx="94" ry="24" fill="url(#astro-glow)" />
      <g className="welcome-astronaut-body" filter="url(#astro-shadow)">
        <path d="M218 145h39v116h-39z" fill="url(#astro-metal)" stroke="#edf9ff" strokeWidth="3"/><path d="M226 157h23v90h-23z" fill="#365773"/><circle cx="237" cy="174" r="7" fill="#69e6fa"/><circle cx="237" cy="196" r="5" fill="#ffc97b"/><path d="M225 224h24" stroke="#d7e8f4" strokeWidth="4"/>
        <path d="M138 271 127 337q0 12 13 13h38l5-73m4-6 6 66q0 13 13 13h32l-8-83" fill="url(#astro-suit)" stroke="#718aa4" strokeWidth="4"/>
        <path d="M128 338h49q12 0 14 13l-3 12h-57q-12 0-12-10zM196 346h43q13 0 17 12l1 7h-61q-11 0-12-9z" fill="url(#astro-boot)" stroke="#526d89" strokeWidth="4"/><path d="M126 355h61m-2 5h-57m70-3h59" stroke="#3f5e7d" strokeWidth="4" strokeLinecap="round"/>
        <path d="M132 143q0-16 18-20h61q20 4 22 21l11 119q-28 20-66 20-37 0-66-20z" fill="url(#astro-suit)" stroke="#718aa4" strokeWidth="4"/><path d="M146 144h70m-73 8h75" stroke="#f9ffff" strokeWidth="4"/><path d="M145 263q34 13 72 0" fill="none" stroke="#94abc0" strokeWidth="3"/>
        <rect x="146" y="183" width="68" height="58" rx="9" fill="#304e6d" stroke="#effaff" strokeWidth="4"/><rect x="154" y="191" width="52" height="43" rx="5" fill="#142c49" stroke="#8eb9d0" strokeWidth="2"/><circle cx="168" cy="205" r="6" fill="#79efce" className="astronaut-status-light"/><circle cx="190" cy="205" r="6" fill="#71dff8"/><path d="M162 222h34" stroke="#d9f2ff" strokeWidth="3" strokeLinecap="round"/><path d="M176 223v9m-7 0h14" stroke="#f7c77b" strokeWidth="2"/>
        <path d="m144 160-19 19 16 17 18-14m57-21 21 15-13 23-20-12" fill="url(#astro-suit)" stroke="#718aa4" strokeWidth="4" strokeLinejoin="round"/><path d="m126 190-13 8 10 17 15-4m99-20 13 7-9 18-16-5" fill="url(#astro-metal)" stroke="#effaff" strokeWidth="3"/>
        <path d="M110 196q-8 0-10 9l-3 11q-1 10 9 12l9-1 8-18-4-8z" fill="url(#astro-suit)" stroke="#7b93ac" strokeWidth="3"/><path d="m242 193 12-5q10-2 14 7l7 12q4 9-5 14l-8 4-14-15z" fill="url(#astro-suit)" stroke="#7b93ac" strokeWidth="3"/>
        <path d="m107 194 7-9 8 3 3 7-5 7-8 1z" fill="#e9f4fb" stroke="#738ca6" strokeWidth="2"/><path d="m263 191 9-6 8 4 2 8-6 7-9-1z" fill="#e9f4fb" stroke="#738ca6" strokeWidth="2"/>
        <path d="M123 144q0-59 57-67 57 8 57 67l-13 30h-88z" fill="url(#astro-helmet)" stroke="#7892ab" strokeWidth="5"/><path d="M132 128q5-38 48-43 43 5 48 43l-9 28h-78z" fill="url(#astro-visor)" stroke="#f7fdff" strokeWidth="5"/><path d="M144 106q17-17 38-17" fill="none" stroke="#dffbff" strokeOpacity=".72" strokeWidth="6" strokeLinecap="round"/><path d="M138 137q39 12 83 0" fill="none" stroke="#7cecff" strokeOpacity=".38" strokeWidth="3" className="astronaut-visor-glint"/><path d="M129 143h102" stroke="#f9fcff" strokeWidth="7"/><path d="M140 169h80" stroke="#67829c" strokeWidth="3"/><rect x="165" y="170" width="30" height="9" rx="4.5" fill="#f3c877" stroke="#fff2d2" strokeWidth="2"/>
        <path d="M133 222h9v22h-9z" fill="#8ee5f2" stroke="#fff" strokeWidth="2"/><path d="m208 248 12 8-8 15-13-7z" fill="#e65766" stroke="#fff" strokeWidth="2"/><path d="M219 148h38m-38 95h38" stroke="#4f6f8d" strokeWidth="3"/>
        <path d="m146 284-6 35m62-34 8 36" stroke="#819ab2" strokeWidth="3"/><circle cx="179" cy="295" r="5" fill="#6de3ef"/>
        <g className="welcome-astronaut-wave-arm" onAnimationEnd={() => setIsCheering(false)}><path d="M243 158q22-19 32-45l12-36q3-11 14-8t8 15l-12 49q-8 32-37 55z" fill="url(#astro-suit)" stroke="#738ca6" strokeWidth="4" strokeLinejoin="round"/><path d="m286 78 4-17q3-10 13-8t8 12l-3 18" fill="url(#astro-suit)" stroke="#738ca6" strokeWidth="3" strokeLinejoin="round"/></g>
      </g>
      <circle cx="70" cy="102" r="3" fill="#b9f8ff" className="astronaut-star"/><circle cx="300" cy="290" r="2.5" fill="#ffdc9b" className="astronaut-star astronaut-star-delay"/><circle cx="270" cy="91" r="4" fill="#72deee" opacity=".82"/>
    </svg>
  </button>;
}

export function WelcomeFeature({ onNavigate, onContinue, onNewFlight, hasSavedProgress, loadWarning }: WelcomeFeatureProps) {
  const { state } = useGameState();

  return (
    <main className="welcome-screen">
      <div className="welcome-stars welcome-stars-back" aria-hidden="true" />
      <div className="welcome-stars welcome-stars-front" aria-hidden="true" />
      <div className="welcome-earth" aria-hidden="true">
        <img src="https://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~orig.jpg" alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        <span className="earth-atmosphere" />
      </div>
      <div className="welcome-satellite" aria-hidden="true">
        <svg viewBox="0 0 360 220" role="presentation">
          <defs><linearGradient id="satellite-panel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#82edff"/><stop offset="1" stopColor="#355ca9"/></linearGradient><linearGradient id="satellite-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff5db"/><stop offset="1" stopColor="#8298b5"/></linearGradient><filter id="satellite-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          <g filter="url(#satellite-glow)"><ellipse className="welcome-satellite-orbit" cx="180" cy="112" rx="160" ry="53" fill="none" stroke="#a9e8ff" strokeOpacity=".35" strokeWidth="2" strokeDasharray="5 9"/>
            <path d="M130 99 96 81m134 18 34-18" stroke="#ffe6bc" strokeWidth="5"/><path d="M11 58h83v50H11zm255 0h83v50h-83z" fill="url(#satellite-panel)" stroke="#d5f8ff" strokeWidth="2"/><path d="M38 58v50m27-50v50M11 83h83m282-25v50m-27-50v50m49-25h-83" stroke="#183e76" strokeOpacity=".72" strokeWidth="2"/>
            <path d="m151 83 58 0 20 19v39l-20 19h-58l-20-19v-39z" fill="url(#satellite-body)" stroke="#f5fbff" strokeWidth="3"/><circle cx="180" cy="120" r="13" fill="#25618c" stroke="#9df2ff" strokeWidth="3"/><circle cx="180" cy="120" r="5" fill="#fff"/><path d="m208 91 34-36m-1-7 16 7-4 17" fill="none" stroke="#fff0d2" strokeWidth="4" strokeLinecap="round"/><path d="m160 159-10 24 30-12 30 12-10-24" fill="#ffb979" stroke="#fff0d3" strokeWidth="2"/></g>
        </svg>
      </div>
      <header className="welcome-header">
        <button type="button" className="welcome-brand" aria-label="Space Mission: Beyond Earth home" onClick={() => onNavigate('welcome')}>
          <span className="brand-mark" aria-hidden="true">✦</span><span>BEYOND EARTH</span>
        </button>
        <span className="welcome-status"><i aria-hidden="true" /> FLIGHT SYSTEMS ONLINE</span>
      </header>
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-hero-copy">
        <h1 id="welcome-title">SPACE MISSION:<br /><span>BEYOND EARTH</span></h1>
        <p className="welcome-tagline">Your next mission is waiting<span className="welcome-loading-dots" aria-hidden="true"><i>•</i><i>•</i><i>•</i></span></p>
        <p className="welcome-intro">Pick a destination. Build your spacecraft. Make the calls that bring the science home.</p>
        {loadWarning ? <p className="save-recovery-note" role="status">{loadWarning}</p> : null}
        <div className="welcome-actions">
          <div className="welcome-flight-actions">
          {hasSavedProgress ? (
            <Button className="welcome-primary" onClick={onContinue}><span>CONTINUE FLIGHT</span><span className="action-arrow" aria-hidden="true">↗</span></Button>
          ) : (
            <Button className="welcome-primary" onClick={onNewFlight}><span>CHOOSE YOUR PILOT</span><span className="action-arrow" aria-hidden="true">↗</span></Button>
          )}
          {hasSavedProgress ? <Button variant="secondary" className="welcome-secondary welcome-new-flight" onClick={onNewFlight}>NEW FLIGHT <span aria-hidden="true">+</span></Button> : null}
          </div>
          <div className="welcome-explore-actions" role="group" aria-label="Explore more">
            <button type="button" className="welcome-quick-link" onClick={() => onNavigate('academy')}>
              <span className="welcome-quick-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8m-8 3h7"/></svg></span>
              <span>Training Bay</span><span className="welcome-quick-arrow" aria-hidden="true">→</span>
            </button>
            <button type="button" className="welcome-quick-link" onClick={() => onNavigate('spacecraft-explorer')}>
              <span className="welcome-quick-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c3.8 3.1 5.5 6.3 5.5 10.5L12 21l-5.5-8.5C6.5 8.3 8.2 5.1 12 2Z"/><circle cx="12" cy="9" r="1.8"/><path d="m7 13-3 1v4l5-2m8-3 3 1v4l-5-2"/></svg></span>
              <span>Spacecraft Hangar</span><span className="welcome-quick-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        </div>
        <WelcomeAstronaut hero />
      </section>
      <footer className="welcome-footer">
        <div className="welcome-coordinate"><span>FLIGHT SYSTEMS</span><strong>ONLINE · AUTO-SAVE ACTIVE</strong></div>
        <div className="welcome-scroll"><span /> CHOOSE YOUR NEXT MOVE</div>
        <div className="welcome-coordinate welcome-coordinate-right"><span>FLIGHT HISTORY</span><strong>{state.missionEvaluationHistory.length} COMPLETED MISSIONS</strong></div>
      </footer>
    </main>
  );
}
