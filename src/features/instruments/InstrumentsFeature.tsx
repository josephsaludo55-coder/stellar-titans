import { useMemo, useState } from 'react';
import { Card } from '../../components/common/Card';
import { getInstrumentRecommendations, instrumentCatalog } from '../../data/instruments';
import { missionObjectives } from '../../data/missionDesign';
import { useGameState } from '../../hooks/useGameState';
import type { MissionStage } from '../../state/gameTypes';
import { Button } from '../../components/common/Button';
import { MissionBudgetStatus } from '../../components/game/MissionBudgetStatus';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function InstrumentGlyph({ id }: { id: string }) {
  return (
    <span className="instrument-glyph" data-kind={id} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {id === 'scientific-camera' ? <>
          <path d="M8 13h6l2-3h8l2 3h6v17H8V13Z" />
          <circle cx="20" cy="21.5" r="5.5" /><path d="M11.5 16h1" />
        </> : null}
        {id === 'spectrometer' ? <>
          <path d="m10 13 10-5 10 5-10 17-10-17Z" />
          <path d="m20 8 0 22M10 13h20M23 16l9-4M24 20l10-2M25 24l9 1" />
        </> : null}
        {id === 'radar' ? <>
          <path d="M8 28a17 17 0 0 1 24 0M12 24a11 11 0 0 1 16 0M16 20a5 5 0 0 1 8 0" />
          <path d="m20 21 9-11M8 32h24" /><circle cx="20" cy="21" r="1.5" />
        </> : null}
        {id === 'magnetometer' ? <>
          <path d="M12 10v10a8 8 0 0 0 16 0V10h-6v10a2 2 0 0 1-4 0V10h-6Z" />
          <path d="M12 14H8m24 0h-4M12 10h6m4 0h6" />
        </> : null}
        {id === 'seismometer' ? <>
          <path d="M9 10h22v19H9zM6 32h28" />
          <path d="m11 21 4 0 2-5 4 10 3-7 2 2h3" />
        </> : null}
        {id === 'environmental-sensors' ? <>
          <path d="M12 25h17a5 5 0 0 0 .2-10 8 8 0 0 0-15.3 2A4 4 0 0 0 12 25Z" />
          <path d="M14 30h12M17 34h6M20 8V5m-9 5-2-2m20 2 2-2" />
        </> : null}
        {id === 'thermal-sensor' ? <>
          <path d="M17 23V11a4 4 0 1 1 8 0v12a7 7 0 1 1-8 0Z" />
          <path d="M21 15v13" /><circle cx="21" cy="29" r="2.5" />
        </> : null}
        {id === 'spectral-imaging-system' ? <>
          <rect x="8" y="9" width="24" height="22" rx="2" />
          <path d="M14 9v22m6-22v22m6-22v22M8 16h24m-24 8h24" />
          <path d="M10 34h20" />
        </> : null}
      </svg>
    </span>
  );
}

export function InstrumentsFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const mission = state.missionConfiguration;
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(instrumentCatalog[0].id);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const recommendations = useMemo(() => getInstrumentRecommendations(mission?.destination ?? null, mission?.architecture ?? null, mission?.objectiveIds ?? []), [mission]);
  const recommendedOrder = recommendations.map(({ instrument }) => instrument.id);
  const filtered = instrumentCatalog
    .filter((instrument) => `${instrument.name} ${instrument.scientificPurpose}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => recommendedOrder.indexOf(a.id) - recommendedOrder.indexOf(b.id));
  const selected = instrumentCatalog.filter((instrument) => state.selectedInstrumentIds.includes(instrument.id));
  const allToolsSelected = instrumentCatalog.every((instrument) => state.selectedInstrumentIds.includes(instrument.id));
  const missionFitPick = recommendations.find(({ instrument }) => mission?.destination && mission.architecture && instrument.compatibleDestinations.includes(mission.destination) && instrument.compatibleArchitectures.includes(mission.architecture) && instrument.objectiveIds.some((objectiveId) => mission.objectiveIds.includes(objectiveId)))?.instrument;
  const compatibleSelected = selected.filter((instrument) => mission?.destination && mission.architecture && instrument.compatibleDestinations.includes(mission.destination) && instrument.compatibleArchitectures.includes(mission.architecture) && instrument.objectiveIds.some((objectiveId) => mission.objectiveIds.includes(objectiveId)));
  const payloadReady = selected.length > 0 && compatibleSelected.length === selected.length;
  const active = instrumentCatalog.find((instrument) => instrument.id === activeId) ?? instrumentCatalog[0];
  const compared = instrumentCatalog.filter((instrument) => compareIds.includes(instrument.id));
  const total = selected.reduce((sum, instrument) => ({ mass: sum.mass + instrument.massKg, power: sum.power + instrument.powerConsumptionW, data: sum.data + instrument.dataGenerationMbps, cost: sum.cost + instrument.estimatedCostUsd, value: sum.value + instrument.scientificValue }), { mass: 0, power: 0, data: 0, cost: 0, value: 0 });
  const toggleInstrument = (id: string) => {
    const ids = state.selectedInstrumentIds.includes(id)
      ? state.selectedInstrumentIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedInstrumentIds, id];
    dispatch({ type: 'SET_INSTRUMENTS', instrumentIds: ids });
  };
  const toggleCompare = (id: string) => setCompareIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : ids.length < 3 ? [...ids, id] : ids);

  function continueToLaunchPad() {
    const nextIds = compatibleSelected.length ? compatibleSelected.map((instrument) => instrument.id) : missionFitPick ? [missionFitPick.id] : [];
    if (!nextIds.length) return;
    if (nextIds.length !== selected.length || nextIds.some((id, index) => id !== selected[index]?.id)) {
      dispatch({ type: 'SET_INSTRUMENTS', instrumentIds: nextIds });
    }
    onNavigate('launch-configuration');
  }

  return (
    <section className="feature-panel instrument-lab">
      <p className="eyebrow">STEP 2 · BUILD YOUR SHIP</p>
      <h2>Pick your science tools</h2>
      <p>Choose a tool for {missionObjectives.find((item) => item.id === mission?.objectiveIds[0])?.name ?? 'your science goal'}. Look for the ★ match.</p>

      <MissionBudgetStatus />
      <div className="instrument-budget" aria-label="Selected payload totals">
        <div><small>TOOLS</small><strong>{selected.length}</strong></div>
        <div><small>SHIP WEIGHT</small><strong>{total.mass} kg</strong></div>
        <div><small>POWER USED</small><strong>{total.power} W</strong></div>
        <details className="instrument-extra-stats"><summary>More ship stats</summary><span>Data: {total.data.toFixed(1)} Mbps · Cost: {usd.format(total.cost)} · Science: {total.value} points</span></details>
      </div>

      <div className="instrument-workspace">
        <Card title="Science tools" subtitle="Tap a tool to see what it can do">
          <div className="instrument-browse-controls">
            <label className="instrument-search">Find a tool<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try camera or radar" /></label>
            <button type="button" className="instrument-select-all-button" aria-pressed={allToolsSelected} onClick={() => dispatch({ type: 'SET_INSTRUMENTS', instrumentIds: allToolsSelected ? [] : instrumentCatalog.map((instrument) => instrument.id) })}>
              {allToolsSelected ? '✓ CLEAR ALL' : '+ SELECT ALL TOOLS'}
            </button>
          </div>
          <div className="instrument-catalog-list">
            {filtered.map((instrument) => {
              const isSelected = state.selectedInstrumentIds.includes(instrument.id);
              const isRecommended = recommendations.find((item) => item.instrument.id === instrument.id)?.score;
              return <article key={instrument.id} className={`instrument-catalog-item ${active.id === instrument.id ? 'is-active' : ''}`}>
                <button className="instrument-name-button" onClick={() => setActiveId(instrument.id)} aria-pressed={active.id === instrument.id}>
                  <InstrumentGlyph id={instrument.id} />
                  <span className="instrument-copy"><strong>{instrument.name}</strong><small>{instrument.scientificPurpose}</small></span>
                  {isRecommended ? <em>★ MATCH</em> : null}
                </button>
                <div className="instrument-item-meta"><span>{instrument.massKg} kg</span><span>{instrument.powerConsumptionW} W</span><span>{usd.format(instrument.estimatedCostUsd)}</span></div>
                <div className="instrument-item-actions">
                  <button className={isSelected ? 'instrument-remove' : 'instrument-add'} onClick={() => toggleInstrument(instrument.id)}>{isSelected ? '✓ On ship' : '+ Add tool'}</button>
                  <label><input type="checkbox" checked={compareIds.includes(instrument.id)} onChange={() => toggleCompare(instrument.id)} aria-label={`Compare ${instrument.name}`} /> Compare</label>
                </div>
              </article>;
            })}
            {!filtered.length && <p className="instrument-empty">No instruments match that search.</p>}
          </div>
        </Card>

        <Card title={active.name} subtitle="Your selected science tool">
          <div className="instrument-detail">
            <p>{active.scientificPurpose}</p>
            <div className="instrument-spec-grid"><span>Mass<strong>{active.massKg} kg</strong></span><span>Power<strong>{active.powerConsumptionW} W</strong></span><span>Data<strong>{active.dataGenerationMbps} Mbps</strong></span><span>Estimated cost<strong>{usd.format(active.estimatedCostUsd)}</strong></span><span>Scientific value<strong>{active.scientificValue} / 5</strong></span></div>
            <p className="instrument-fit-note">{active.compatibleDestinations.map((d) => d === 'moon' ? 'Moon' : 'Mars').join(' · ')} · {active.compatibleArchitectures.join(' · ').replace(/-/g, ' ')}</p>
            <details className="instrument-learn-more"><summary>How does it help? Learn more</summary><p>{active.description}</p><strong>Good at</strong><ul>{active.advantages.map((item) => <li key={item}>{item}</li>)}</ul><strong>Keep in mind</strong><ul>{active.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
            <div className="instrument-detail-actions">
              <button className={state.selectedInstrumentIds.includes(active.id) ? 'instrument-remove' : 'instrument-add'} onClick={() => toggleInstrument(active.id)}>{state.selectedInstrumentIds.includes(active.id) ? '✓ On your spacecraft' : '+ Add to spacecraft'}</button>
              <Button className="instrument-continue-launch" disabled={!payloadReady && !missionFitPick} onClick={continueToLaunchPad}>CONTINUE TO LAUNCH PAD <span aria-hidden="true">→</span></Button>
            </div>
          </div>
        </Card>
      </div>

      {compared.length > 0 && <Card title="Payload comparison" subtitle={`Compare up to 3 instruments · ${compared.length} selected`}>
        <div className="instrument-compare" style={{ gridTemplateColumns: `repeat(${compared.length}, minmax(0, 1fr))` }}>{compared.map((instrument) => <article key={instrument.id}><h4>{instrument.name}</h4><p>{instrument.scientificPurpose}</p><dl><dt>Mass</dt><dd>{instrument.massKg} kg</dd><dt>Power</dt><dd>{instrument.powerConsumptionW} W</dd><dt>Data</dt><dd>{instrument.dataGenerationMbps} Mbps</dd><dt>Cost</dt><dd>{usd.format(instrument.estimatedCostUsd)}</dd><dt>Scientific value</dt><dd>{instrument.scientificValue} / 5</dd></dl><button className="instrument-compare-remove" onClick={() => toggleCompare(instrument.id)}>Remove comparison</button></article>)}</div>
      </Card>}

      <footer className="game-flow-footer">
        <div><span className={compatibleSelected.length ? 'flow-ready-dot' : 'flow-pending-dot'} />
          <strong>{payloadReady ? `${compatibleSelected.length} SCIENCE TOOL${compatibleSelected.length === 1 ? '' : 'S'} EQUIPPED` : selected.length ? 'CHECK PAYLOAD COMPATIBILITY' : 'ADD A SCIENCE TOOL TO CONTINUE'}</strong>
            {!payloadReady && missionFitPick ? <button type="button" onClick={() => dispatch({ type: 'SET_INSTRUMENTS', instrumentIds: [missionFitPick.id] })}>EQUIP {missionFitPick.name.toUpperCase()} +</button> : null}
        </div>
      </footer>
    </section>
  );
}
