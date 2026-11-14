import { Button } from '../../components/common/Button';
import { useGameState } from '../../hooks/useGameState';
import type { MissionStage } from '../../state/gameTypes';
import { getMissionResumeStage } from '../../state/missionProgress';
import { clearCrewAccounts } from '../../services/crewAccounts';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function MissionHistoryFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const reports = state.missionEvaluationHistory;
  const decisions = [...state.missionEventDecisionHistory].reverse();
  const flightEvents = [...(state.missionSimulation?.events ?? [])].reverse();
  const continueFlight = () => {
    const stage = getMissionResumeStage(state);
    dispatch({ type: 'SET_STAGE', stage });
    onNavigate(stage);
  };
  const startNewFlight = () => {
    dispatch({ type: 'START_NEW_MISSION' });
    onNavigate('player-setup');
  };
  const resetProgress = () => {
    if (!window.confirm('Reset this browser’s mission progress, saved crews, chapters, achievements, and history? This cannot be undone.')) return;
    clearCrewAccounts();
    dispatch({ type: 'RESET_PROGRESS' });
    onNavigate('welcome');
  };

  return (
    <section className="mission-log feature-panel">
      <div className="mission-log-heading">
        <div><p className="eyebrow">Flight recorder · local archive</p><h2>Mission log</h2><p className="mission-log-subtitle">Your designs, decisions, and flight results.</p></div>
        <div className="mission-log-actions">
          <Button variant="secondary" onClick={continueFlight}>CONTINUE FLIGHT</Button>
          <Button onClick={startNewFlight}>+ NEW FLIGHT</Button>
        </div>
      </div>
      <div className="mission-log-stats" aria-label="Mission record totals">
        <div><strong>{reports.length}</strong><span>FLIGHTS COMPLETED</span></div>
        <div><strong>{state.completedChapterIds.length}</strong><span>TRAINING CHAPTERS</span></div>
        <div><strong>{state.achievementRecords.length}</strong><span>AWARDS EARNED</span></div>
        <div><strong>{state.mission.stage.replace(/-/g, ' ')}</strong><span>CURRENT CHECKPOINT</span></div>
      </div>
      {flightEvents.length ? <section className="flight-log-section" aria-labelledby="mission-events-title">
        <div className="flight-log-section-heading"><h3 id="mission-events-title">Current flight events</h3><span>{flightEvents.length} RECORDED</span></div>
        <ol className="mission-event-log">{flightEvents.map((event) => <li key={event.id} className={`event-${event.severity}`}><span>{event.phase.replace(/-/g, ' ').toUpperCase()}</span><div><strong>{event.title}</strong><small>{event.detail}</small><time>{dateFormat.format(new Date(event.occurredAt))}</time></div></li>)}</ol>
      </section> : null}
      <section className="flight-log-section" aria-labelledby="flight-results-title">
        <div className="flight-log-section-heading"><h3 id="flight-results-title">Flight results</h3><span>{reports.length ? 'SELECT A REPORT TO EXPAND' : 'NO COMPLETED FLIGHTS YET'}</span></div>
        {reports.length ? <div className="flight-report-list">{reports.map((report, index) => (
          <details className="flight-report" key={report.id} open={index === 0}>
            <summary><span className="flight-report-index">{String(index + 1).padStart(2, '0')}</span><span className="flight-report-title"><strong>{report.missionName}</strong><small>{report.destinationName} · {report.architectureName} · {dateFormat.format(new Date(report.completedAt))}</small></span><span className="flight-report-score"><strong>{report.overallScore}</strong><small>/100</small></span><span className="flight-report-rating">{report.rating}</span><span className="flight-report-toggle" aria-hidden="true">+</span></summary>
            <div className="flight-report-details">
              <p>{report.debrief}</p>
              <div className="flight-report-metrics"><span>{report.objectiveCompletion.completed}/{report.objectiveCompletion.total} objectives</span><span>{report.spacecraftSummary.totalMassKg.toLocaleString()} kg</span><span>{report.spacecraftSummary.instruments.length} instruments</span></div>
              <details className="flight-report-subdetails"><summary>SCORING BREAKDOWN <span>{report.overallScore} / 100</span></summary><div className="history-score-list">{report.categories.map((category) => <div key={category.id}><span><strong>{category.label}</strong><small>{category.evidence}</small></span><b>{category.score}/{category.maximum}</b></div>)}</div></details>
              <details className="flight-report-subdetails"><summary>SPACECRAFT &amp; SCIENCE</summary><p>{[...report.spacecraftSummary.components, ...report.spacecraftSummary.instruments].join(' · ') || 'No hardware recorded'}</p><ul>{report.scientificAchievements.map((item) => <li key={item}>{item}</li>)}</ul></details>
              <h4>Engineering decisions</h4><ul>{(report.engineeringDecisions.length ? report.engineeringDecisions : report.successfulDecisions).map((decision) => <li key={decision}>{decision}</li>)}</ul>
              {report.engineeringProblems.length ? <><h4>Engineering problems</h4><ul>{report.engineeringProblems.map((problem) => <li key={problem}>{problem}</li>)}</ul></> : null}
              <h4>Recommendations</h4><ul>{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
              {index === 0 ? <button type="button" className="inline-game-link" onClick={() => onNavigate('mission-evaluation')}>OPEN LATEST DEBRIEF <span aria-hidden="true">↗</span></button> : null}
            </div>
          </details>
        ))}</div> : <div className="mission-log-empty"><div className="empty-orbit" aria-hidden="true">✦</div><h3>Your first flight is ahead.</h3><p>Complete a mission simulation to add its score and engineering debrief here.</p><Button onClick={startNewFlight}>START A NEW FLIGHT <span aria-hidden="true">→</span></Button></div>}
      </section>
      <section className="flight-log-section" aria-labelledby="decision-timeline-title">
        <div className="flight-log-section-heading"><h3 id="decision-timeline-title">Decision timeline</h3><span>{decisions.length} RECORDED</span></div>
        {decisions.length ? <ol className="decision-timeline">{decisions.map((decision) => <li key={decision.id}><span className="decision-timeline-dot" /><div><strong>{decision.eventTitle}: {decision.decisionTitle}</strong><small>{decision.consequences.join(' · ')}</small><time>{dateFormat.format(new Date(decision.selectedAt))}</time></div></li>)}</ol> : <p className="empty-timeline">Decisions from mission challenges will show here.</p>}
      </section>
      <details className="reset-progress-control"><summary>Reset local progress</summary><p>Clears this browser’s save, saved crews, training, awards, and mission history.</p><button type="button" onClick={resetProgress}>RESET ALL PROGRESS…</button></details>
      <p className="mission-log-privacy">Saved in this browser only. No passwords or contact details are stored.</p>
    </section>
  );
}
