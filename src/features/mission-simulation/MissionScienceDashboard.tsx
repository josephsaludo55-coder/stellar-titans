import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { MissionScienceReport, MissionSimulationState } from '../../state/gameTypes';

function DataCapacityChart({ simulation, report }: { simulation: MissionSimulationState; report: MissionScienceReport }) {
  const snapshot = simulation.snapshot;
  const maximum = Math.max(report.dataVolumeGb, snapshot.storageCapacityGb, snapshot.dailyDownlinkCapacityGb * snapshot.durationDays, 0.1);
  const bars = [
    { label: 'Collected at landing', value: report.dataVolumeGb, color: 'coral' },
    { label: 'Onboard recorder', value: snapshot.storageCapacityGb, color: 'mint' },
    { label: 'Mission downlink capacity', value: snapshot.dailyDownlinkCapacityGb * snapshot.durationDays, color: 'violet' },
  ];
  return <div className="science-capacity-chart" role="img" aria-label="Collected science data compared with recorder and modeled downlink capacity">
    {bars.map((bar) => <div className="science-capacity-row" key={bar.label}><span>{bar.label}</span><div><i className={`capacity-${bar.color}`} style={{ width: `${Math.max(2, (bar.value / maximum) * 100)}%` }} /></div><strong>{bar.value.toFixed(2)} GB</strong></div>)}
    <small>Bars use the same GB scale. Communication capacity is a simplified model for this mission duration.</small>
  </div>;
}

function SurfaceScene({ destination, title, caption, index }: { destination: 'moon' | 'mars'; title: string; caption: string; index: number }) {
  return <article className={`science-surface-scene scene-${destination}`}>
    <div className="science-scene-sky"><i /><i /><i /><span className="science-scene-planet" /><span className="science-scene-hill hill-back" /><span className="science-scene-hill hill-front" /><span className="science-scene-rover">✦</span><b>SIMULATED CAMERA FRAME {String(index + 1).padStart(2, '0')}</b></div>
    <strong>{title}</strong><p>{caption}</p>
  </article>;
}

export function MissionScienceDashboard({ simulation, onContinue, continueLabel = 'CONTINUE TO COMMUNICATION →' }: { simulation: MissionSimulationState; onContinue: () => void; continueLabel?: string }) {
  const { snapshot, scienceReport: report, landingRecord } = simulation;
  if (!report || !landingRecord) return <Card title="Science dashboard" subtitle="Landing data will appear here after a safe touchdown."><p>Complete the landing challenge to activate the selected instruments.</p></Card>;
  const supported = simulation.objectiveResults.filter((item) => item.status === 'supported').length;

  return <Card title={`7 · ${snapshot.destinationName} science lab`} subtitle="Your selected instruments started recording automatically at touchdown.">
    <div className={`mission-science-dashboard destination-${snapshot.destination}`}>
      <div className="science-sim-banner"><span aria-hidden="true">✦</span><div><strong>EDUCATIONAL MISSION SIMULATION</strong><small>Generated data for this game · not actual NASA findings</small></div><b>TOUCHDOWN DATA READY</b></div>

      <section className="science-overview-grid" aria-label="Mission overview and landing details">
        <article className="science-overview-card overview-mission"><span>🚀 MISSION OVERVIEW</span><strong>{snapshot.missionName}</strong><small>{snapshot.destinationName} · {snapshot.architectureName} · {snapshot.durationDays} modeled days</small><div className="science-objective-chips">{snapshot.objectives.map((item) => <i key={item.id}>{item.name}</i>)}</div></article>
        <article className="science-overview-card overview-landing"><span>📍 LANDING INFORMATION</span><strong>Grid X {landingRecord.gridX.toFixed(1)} · Y {landingRecord.gridY.toFixed(1)}</strong><small>{landingRecord.coordinateReference}</small><small>T+{landingRecord.modeledElapsedDays} modeled mission days · {landingRecord.missionStatus.toUpperCase()}</small></article>
        <article className="science-overview-card overview-payload"><span>🛰️ DEPLOYED SCIENCE</span><strong>{report.deployedInstrumentIds.length} / {snapshot.instruments.length} instruments online</strong><small>{snapshot.instruments.filter((instrument) => report.deployedInstrumentIds.includes(instrument.id)).map((instrument) => instrument.name).join(' · ') || 'No instrument could be powered'}</small></article>
      </section>

      <section className="science-dashboard-section science-data-section">
        <div className="science-section-heading"><span>📡</span><div><h3>Scientific data</h3><p>Measurements created from working instruments in your spacecraft.</p></div><b>{report.dataVolumeGb.toFixed(2)} GB</b></div>
        {report.readings.length ? <div className="science-reading-grid">{report.readings.map((reading) => <article className="science-reading-card" key={reading.id}><small>{reading.category} · {reading.instrumentName}</small><strong>{reading.metric}</strong><b>{reading.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} <i>{reading.unit}</i></b><p>{reading.interpretation}</p></article>)}</div> : <div className="science-empty-state">No powered instrument readings were produced. Review the spacecraft power system before the next mission.</div>}
      </section>

      <section className="science-dashboard-section science-chart-section"><div className="science-section-heading"><span>📊</span><div><h3>Data collection summary</h3><p>Collected science compared with onboard storage and the configured return link.</p></div></div><DataCapacityChart simulation={simulation} report={report} /></section>

      <section className="science-dashboard-section"><div className="science-section-heading"><span>📷</span><div><h3>Surface images</h3><p>Illustrative frames generated by the simulation when a camera is onboard.</p></div></div>
        {report.surfaceImages.length ? <div className="science-image-grid">{report.surfaceImages.map((image, index) => <SurfaceScene key={image.id} destination={snapshot.destination} title={image.title} caption={image.caption} index={index} />)}</div> : <div className="science-empty-state">No surface images: this spacecraft did not carry a Scientific Camera.</div>}
      </section>

      <section className="science-lower-grid">
        <article className="science-dashboard-section"><div className="science-section-heading"><span>🌡️</span><div><h3>Environmental analysis</h3><p>What the selected sensors can report.</p></div></div><ul className="science-analysis-list">{report.environmentalAnalysis.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="science-dashboard-section"><div className="science-section-heading"><span>💡</span><div><h3>Scientific discoveries</h3><p>Interpretations are separate from measurements.</p></div></div>{report.discoveries.length ? <div className="science-discoveries">{report.discoveries.map((item) => <article key={item.id}><span className={`confidence-${item.confidence}`}>{item.confidence} confidence</span><strong>{item.title}</strong><small>Evidence: {item.evidence}</small><p>{item.interpretation}</p></article>)}</div> : <div className="science-empty-state">No discoveries can be interpreted from the selected instrument set.</div>}</article>
      </section>

      <section className="science-lower-grid">
        <article className="science-dashboard-section"><div className="science-section-heading"><span>🎯</span><div><h3>Objective findings</h3><p>{supported} of {simulation.objectiveResults.length} configured objectives have instrument evidence.</p></div></div><div className="science-objective-findings">{simulation.objectiveResults.map((result) => <article key={result.objectiveId} className={`result-${result.status}`}><b>{result.status === 'supported' ? 'SUPPORTED' : 'NO DATA'}</b><strong>{result.objectiveName}</strong><small>{result.finding}</small></article>)}</div></article>
        <article className="science-dashboard-section"><div className="science-section-heading"><span>⚡</span><div><h3>Mission performance</h3><p>Operational checks based on your saved flight configuration.</p></div></div><div className="science-performance-list"><span>Landing<strong>Successful · {simulation.landingAttempts ?? 0} failed attempts</strong></span><span>Instrument function<strong>{report.deployedInstrumentIds.length}/{snapshot.instruments.length} deployed</strong></span><span>Science power use<strong>{report.instrumentPowerWh.toLocaleString()} Wh modeled</strong></span><span>Communications<strong>{snapshot.downlinkMbps.toFixed(2)} Mbps configured</strong></span><span>Mission duration<strong>{snapshot.durationDays} days · within launch plan</strong></span><span>Final score<strong>{simulation.performanceScore === null ? 'Calculated after data return' : `${simulation.performanceScore}/100`}</strong></span></div></article>
      </section>

      <div className="science-disclaimer">{report.simulationLabel}. Values are deterministic educational examples, not live sensor data. Radar echoes and spectral signatures are clues only; they do not confirm water, ice, or life.</div>
      <div className="science-dashboard-footer"><span>{continueLabel.startsWith('BACK') ? 'Return to your mission results.' : 'Next up: transmit your stored data to Earth.'}</span><Button onClick={onContinue}>{continueLabel}</Button></div>
    </div>
  </Card>;
}
