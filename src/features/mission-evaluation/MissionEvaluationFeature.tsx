import { useMemo, useState, type CSSProperties } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useGameState } from '../../hooks/useGameState';
import { MISSION_SCORING_RUBRIC, evaluateMissionPerformance } from '../../services/scoring/missionScoring';
import { validateSimulationReadiness } from '../../services/simulation/missionSimulation';
import type { MissionEvaluationRecord, MissionStage } from '../../state/gameTypes';

export function MissionEvaluationFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const liveEvaluation = useMemo(() => state.missionSimulation?.status === 'completed'
    ? evaluateMissionPerformance(state, state.missionSimulation)
    : null, [state.missionSimulation, state.missionEventDecisionHistory, state.team, state.decisionHistory, state.player]);
  const history = state.missionEvaluationHistory;
  const displayedRecord = (selectedId ? history.find((item) => item.id === selectedId) : null) ?? history[0] ?? liveEvaluation ?? null;
  const readinessIssues = useMemo(() => validateSimulationReadiness(state), [state]);

  function retryMission() {
    if (readinessIssues.length) return;
    dispatch({ type: 'START_MISSION_SIMULATION' });
    onNavigate('mission-simulation');
  }

  return (
    <section className="feature-panel mission-evaluation-feature">
      <p className="eyebrow">Mission performance · transparent scoring</p>
      <h2>Mission Evaluation &amp; Scoring</h2>
      <p>Scores are calculated from the completed simulation snapshot and recorded engineering outcomes using the published 100-point rubric below.</p>

      {!displayedRecord ? <Card title="No completed mission results" subtitle="Evaluation requires an actual simulation run">
        <div className="evaluation-empty"><strong>COMPLETE A MISSION TO GENERATE A REPORT</strong><p>Mission results are not estimated from the design alone. Configure and run the mission sequence to calculate objective completion, resource performance, science return, and engineering decisions.</p><Button onClick={() => onNavigate('mission-simulation')}>Open mission simulation</Button></div>
      </Card> : <>
        {history.length > 0 ? <Card title="Previous mission results" subtitle="Select a saved report to review"><div className="evaluation-history-list">{history.map((item) => <button type="button" key={item.id} className={displayedRecord.id === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}><span>{item.missionName} · {item.destinationName}</span><strong>{item.overallScore}/100</strong><small>{item.rating} · {new Date(item.completedAt).toLocaleDateString()}</small></button>)}</div></Card> : null}

        <section className="evaluation-report" aria-label={`Mission evaluation report for ${displayedRecord.missionName}`}>
            <div className={`evaluation-score-banner ${ratingClass(displayedRecord.rating)}`}>
            <div className="evaluation-score-ring" style={{ '--score-angle': `${displayedRecord.overallScore * 3.6}deg` } as CSSProperties}><div><strong>{displayedRecord.overallScore}</strong><small>/ 100</small></div></div>
            <div className="evaluation-score-copy"><span>FINAL MISSION REPORT</span><h3>{displayedRecord.missionOutcome === 'failed' ? 'MISSION FAILED' : displayedRecord.rating}</h3><strong>{displayedRecord.missionName} · {displayedRecord.destinationName} · {displayedRecord.architectureName}</strong><p>{displayedRecord.debrief}</p></div>
          </div>

          <div className="evaluation-report-actions"><Button variant="secondary" onClick={() => onNavigate('spacecraft-designer')}>Review spacecraft</Button><Button variant="secondary" onClick={() => onNavigate('mission-events')}>Review mission decisions</Button><Button variant="secondary" onClick={() => onNavigate('spacecraft-designer')}>Redesign spacecraft</Button><Button disabled={readinessIssues.length > 0} onClick={retryMission}>Retry current mission</Button></div>
          {readinessIssues.length ? <p className="evaluation-retry-note">Current design cannot start a retry yet: {readinessIssues[0]}</p> : null}

          <div className="evaluation-summary-grid">
            <SummaryBlock label="Objective completion" value={`${displayedRecord.objectiveCompletion.completed} / ${displayedRecord.objectiveCompletion.total}`} detail={displayedRecord.objectiveCompletion.achievements.length ? displayedRecord.objectiveCompletion.achievements.join(' · ') : 'No supported objectives'} />
            <SummaryBlock label="Engineering performance" value={`${displayedRecord.engineeringPerformance.score} / ${displayedRecord.engineeringPerformance.maximum}`} detail={displayedRecord.engineeringPerformance.summary} />
            <SummaryBlock label="Spacecraft mass" value={`${displayedRecord.spacecraftSummary.totalMassKg.toLocaleString()} kg`} detail={`${displayedRecord.spacecraftSummary.launchVehicleName} · ${displayedRecord.spacecraftSummary.trajectoryName}`} />
            <SummaryBlock label="Payload and systems" value={`${displayedRecord.spacecraftSummary.components.length} components · ${displayedRecord.spacecraftSummary.instruments.length} instruments`} detail={[...displayedRecord.spacecraftSummary.components, ...displayedRecord.spacecraftSummary.instruments].join(' · ') || 'No selected hardware recorded'} />
          </div>

          <Card title="Scoring breakdown" subtitle="Each earned score is calculated from the evidence shown">
            <div className="evaluation-category-list">{displayedRecord.categories.map((category) => <article key={category.id}>
              <div className="evaluation-category-heading"><strong>{category.label}</strong><span>{category.score.toLocaleString()} / {category.maximum}</span></div>
              <div className="evaluation-score-bar" role="progressbar" aria-label={category.label} aria-valuemin={0} aria-valuemax={category.maximum} aria-valuenow={category.score}><i style={{ width: `${category.maximum ? category.score / category.maximum * 100 : 0}%` }} /></div>
              <p><b>Calculation:</b> {category.calculation}</p><small>{category.evidence}</small>
            </article>)}</div>
            <div className="evaluation-total-row"><strong>TOTAL</strong><strong>{displayedRecord.overallScore} / 100</strong></div>
          </Card>

          <div className="evaluation-detail-grid">
            <Card title="Scientific achievements" subtitle="Instrument-supported results from this run"><ul className="evaluation-report-list">{displayedRecord.scientificAchievements.map((item) => <li key={item}>{item}</li>)}</ul></Card>
            <Card title="Resource efficiency" subtitle="Budget, mass, power, communications, and data"><ul className="evaluation-report-list">{displayedRecord.resourceEfficiency.map((item) => <li key={item}>{item}</li>)}</ul></Card>
            <Card title="Team performance" subtitle="Collaboration evidence; not a separate scoring category"><ul className="evaluation-report-list">{displayedRecord.teamPerformance.map((item) => <li key={item}>{item}</li>)}</ul></Card>
            <Card title="Successful decisions" subtitle="Responses whose targeted result is visible in the completed mission"><ul className="evaluation-report-list">{displayedRecord.successfulDecisions.length ? displayedRecord.successfulDecisions.map((item) => <li key={item}>{item}</li>) : <li>No selected event response met its measurable success condition in this run.</li>}</ul></Card>
          </div>

          <div className="evaluation-problems-recommendations">
            <Card title="Engineering problems" subtitle="Score deductions with mission evidence"><ul className="evaluation-report-list is-problem">{displayedRecord.engineeringProblems.length ? displayedRecord.engineeringProblems.map((item) => <li key={item}>{item}</li>) : <li>No scoring category lost points in this run.</li>}</ul></Card>
            <Card title="Recommended improvements" subtitle="Actions connected to the lowest-scoring criteria"><ol className="evaluation-report-list">{displayedRecord.recommendations.length ? displayedRecord.recommendations.map((item) => <li key={item}>{item}</li>) : <li>Preserve this design and compare it with a new mission objective or payload configuration.</li>}</ol></Card>
          </div>
        </section>
      </>}

      <Card title="Published scoring rules" subtitle="Category maxima sum to exactly 100 points"><div className="scoring-rubric-grid">{MISSION_SCORING_RUBRIC.map((item) => <div key={item.id}><strong>{item.label}</strong><span>{item.maximum} points</span><small>{item.calculation}</small></div>)}</div></Card>
    </section>
  );
}

function SummaryBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>;
}

function ratingClass(rating: MissionEvaluationRecord['rating']): string {
  if (rating === 'OUTSTANDING MISSION') return 'rating-outstanding';
  if (rating === 'SUCCESSFUL MISSION') return 'rating-successful';
  if (rating === 'PARTIAL SUCCESS') return 'rating-partial';
  return 'rating-improvement';
}
