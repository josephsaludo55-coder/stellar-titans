import type { MissionArchitectureId, MissionDestinationId } from '../../state/gameTypes';
import type { SpacecraftDesignCategory } from '../../data/spacecraftDesigner';

export function SpacecraftAssemblyScene({ destination, architecture, installed, mass }: { destination: MissionDestinationId; architecture: MissionArchitectureId; installed: SpacecraftDesignCategory[]; mass: number }) {
  const has = (category: SpacecraftDesignCategory) => installed.includes(category);
  return <div className={`assembly-scene scene-${destination}`}>
    <div className="assembly-scene-stars" /><div className={`assembly-planet assembly-planet-${destination}`}><i /></div><span className="assembly-planet-label">{destination === 'moon' ? 'MOON' : 'MARS'}</span><div className="assembly-orbit-line" />
    <svg className="assembled-spacecraft" viewBox="0 0 560 330" role="img" aria-label={`Live ${architecture.replace('-', ' ')} spacecraft design`}>
      <defs>
        <linearGradient id="bus-metal" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#f4e2bb"/><stop offset=".48" stopColor="#aab7d5"/><stop offset="1" stopColor="#6579ad"/></linearGradient>
        <linearGradient id="array-blue" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#66efff"/><stop offset="1" stopColor="#536fff"/></linearGradient>
        <linearGradient id="flame-blue" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#fff2a3"/><stop offset="1" stopColor="#ff8c61" stopOpacity="0"/></linearGradient>
        <filter id="ship-glow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="265" cy="174" rx="220" ry="104" fill="none" stroke="rgba(137,172,255,.26)" strokeDasharray="4 9" transform="rotate(-13 265 174)" />
      {has('power') ? <g className="assembly-part part-power"><path d="M211 153L139 127M330 153L400 127" stroke="#f7ce91" strokeWidth="5"/><rect x="32" y="93" width="106" height="69" rx="5" fill="url(#array-blue)" stroke="#b5f6ff"/><rect x="402" y="93" width="106" height="69" rx="5" fill="url(#array-blue)" stroke="#b5f6ff"/><path d="M57 93v69m27-69v69m27-69v69m-79-35h106m304-34v69m27-69v69m27-69v69m-80-35h106" stroke="rgba(14,40,104,.65)" strokeWidth="2"/><circle cx="47" cy="86" r="4" fill="#72f1ff"/></g> : null}
      {has('communication') ? <g className="assembly-part part-communication"><path d="M310 120l51-51" stroke="#ffe5b7" strokeWidth="5"/><path d="M349 55q41-8 52 27-25 24-52 15z" fill="#dff7ff" stroke="#fff" strokeWidth="2"/><path d="M356 59l29 33m-12-37l24 28m-40-4h41" stroke="#799bed" strokeWidth="2"/></g> : null}
      {has('structure') ? <g className="assembly-part part-structure" filter="url(#ship-glow)"><path d="M211 126h117l26 27v56l-26 27H211l-26-27v-56z" fill="url(#bus-metal)" stroke="#fff0d2" strokeWidth="2"/><path d="M211 126l34 27v56l-34 27m117-110l-34 27v56l34 27m-58-110v110" fill="none" stroke="#63789f" strokeWidth="3"/><circle cx="270" cy="181" r="24" fill="#23456f" stroke="#aaf1f2" strokeWidth="3"/><circle cx="270" cy="181" r="10" fill="#7ce9e8"/><path d="M236 141h68m-68 80h68" stroke="#e9cd9a" strokeWidth="2"/></g> : <path d="M223 137h94v88h-94z" fill="rgba(161,179,222,.15)" stroke="rgba(161,179,222,.4)" strokeDasharray="4 4"/>}
      {has('propulsion') ? <g className="assembly-part part-propulsion"><path d="M233 234v20l-18 27 20-10 18 10-9-27v-20m60 0v20l-18 27 20-10 18 10-9-27v-20" fill="#c9d6ed" stroke="#fff" strokeWidth="2"/><path d="M226 275l9 37 9-37m43 0l9 37 9-37" fill="url(#flame-blue)" className="assembly-flame"/></g> : null}
      {architecture === 'lander' || architecture === 'rover' ? <g className="assembly-part part-landing"><path d="M214 217l-35 39h33m116-39l35 39h-33" fill="none" stroke="#e8d4b1" strokeWidth="6" strokeLinecap="round"/><path d="M178 256h42m111 0h42" stroke="#ffd27e" strokeWidth="5" strokeLinecap="round"/></g> : null}
      {architecture === 'rover' ? <g className="assembly-part part-rover"><circle cx="207" cy="259" r="12" fill="#18233d" stroke="#bac9e9" strokeWidth="4"/><circle cx="336" cy="259" r="12" fill="#18233d" stroke="#bac9e9" strokeWidth="4"/><circle cx="270" cy="259" r="12" fill="#18233d" stroke="#bac9e9" strokeWidth="4"/></g> : null}
      <text x="270" y="320" textAnchor="middle" fill="#b5c3e9" fontSize="11" letterSpacing="3">{architecture.replace('-', ' ').toUpperCase()} · {mass.toLocaleString()} KG</text>
    </svg>
    <div className="assembly-float-card"><span>SHIP STATUS</span><strong>{has('structure') ? 'FRAME SECURED' : 'FRAME NEEDED'}</strong><i className={has('structure') ? 'is-online' : ''} /></div>
  </div>;
}
