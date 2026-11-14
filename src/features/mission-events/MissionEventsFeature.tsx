import { useMemo } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { missionObjectives } from '../../data/missionDesign';
import { useGameState } from '../../hooks/useGameState';
import { calculateMissionResources } from '../../services/calculations/missionResources';
import { getMissionEvents, MISSION_EVENT_ASSUMPTIONS } from '../../services/missionEvents';
import type { MissionEventCategory } from '../../state/gameTypes';

const categoryLabels: Record<MissionEventCategory, string> = {
  'power-management': 'Power Management',
  communication: 'Communication',
  'data-storage': 'Data Storage',
  'scientific-operations': 'Scientific Operations',
  'mission-lifetime': 'Mission Lifetime',
  'spacecraft-system-status': 'Spacecraft System Status',
};

export function MissionEventsFeature() {
  const { state, dispatch } = useGameState();
  const events = useMemo(() => getMissionEvents(state), [state]);
  const resources = useMemo(() => calculateMissionResources(state), [state]);
  const history = state.missionEventDecisionHistory;
  const missionName = state.missionConfiguration?.missionName || 'Unconfigured mission';
  const adjustments = state.missionEngineeringAdjustments;

  return (
    <section className="feature-panel engineering-events-feature">
      <p className="eyebrow">Mission operations · deterministic response model</p>
      <h2>Mission Events &amp; Engineering Decisions</h2>
      <p>Challenges are generated from {missionName}’s selected systems, mission requirements, and calculated resource margins. Every response updates shared mission state and records its engineering trade.</p>
      {state.missionSimulation?.status === 'active' ? <p className="mission-review-footnote">The active simulation uses its locked pre-launch configuration. Decisions made now update the shared engineering plan and apply to the next simulation run.</p> : null}

      <div className="event-resource-overview">
        <span>POWER MARGIN<strong>{(resources.availablePowerW - resources.requiredPowerW).toFixed(0)} W</strong></span>
        <span>WEEKLY DATA / STORAGE<strong>{resources.weeklyRecorderLoadGb.toFixed(1)} / {resources.storageCapacityGb.toFixed(1)} GB</strong></span>
        <span>REQUIRED / AVAILABLE LINK<strong>{resources.requiredDownlinkMbps.toFixed(2)} / {resources.downlinkMbps.toFixed(2)} Mbps</strong></span>
        <span>MISSION DURATION<strong>{resources.missionDurationDays ?? '—'} days</strong></span>
        <span>MISSION HEALTH<strong>{state.mission.health}%</strong></span>
      </div>

      <div className="event-category-grid">{Object.entries(categoryLabels).map(([category, label]) => {
        const activeCount = events.filter((event) => event.category === category).length;
        const decidedCount = history.filter((decision) => decision.category === category).length;
        return <div key={category} className={activeCount ? 'has-active-event' : ''}><span>{label}</span><strong>{activeCount ? `${activeCount} active challenge${activeCount === 1 ? '' : 's'}` : decidedCount ? 'Resolved for this configuration' : 'No current trigger'}</strong></div>;
      })}</div>

      <Card title={`Active engineering events · ${events.length}`} subtitle="A response becomes unavailable after it is recorded">
        {events.length ? <div className="engineering-event-list">{events.map((event) => <article className="engineering-event-card" key={event.id}>
          <div className="engineering-event-header"><span>{categoryLabels[event.category]} · EVENT {event.id}</span><strong>{event.title}</strong></div>
          <div className="engineering-event-context"><div><small>SITUATION</small><p>{event.situationDescription}</p></div><div><small>AFFECTED SYSTEM</small><p>{event.affectedSystem}</p></div><div><small>ENGINEERING PRINCIPLE</small><p>{event.educationalExplanation}</p></div></div>
          <div className="engineering-decision-options"><h3>Available decisions</h3>{event.availableDecisions.map((decision) => <article key={decision.id}>
            <div><strong>{decision.title}</strong><p>{decision.description}</p><ul>{decision.engineeringConsequences.map((consequence) => <li key={consequence}>{consequence}</li>)}</ul><small>{decision.educationalExplanation}</small></div>
            <Button onClick={() => dispatch({ type: 'RESOLVE_MISSION_EVENT', eventId: event.id, decisionId: decision.id })}>Select this response</Button>
          </article>)}</div>
        </article>)}</div> : <div className="events-clear-state"><strong>NO UNRESOLVED EVENTS</strong><p>Current resource margins do not trigger an event, or the active mission challenges have already been resolved. Adjust the mission design or review decision history below.</p></div>}
      </Card>

      <Card title="Current engineering plan" subtitle="Cumulative effects of decisions selected for this mission">
        <div className="event-adjustment-grid">
          <span>Instrument power load<strong>{Math.round(adjustments.instrumentPowerMultiplier * 100)}% of nominal</strong></span>
          <span>Science output factor<strong>{Math.round(adjustments.scienceOutputMultiplier * 100)}%</strong></span>
          <span>Data volume factor<strong>{Math.round(adjustments.dataVolumeMultiplier * 100)}%</strong></span>
          <span>Communication capacity factor<strong>{Math.round(adjustments.communicationCapacityMultiplier * 100)}%</strong></span>
          <span>Duration adjustment<strong>{adjustments.missionDurationDeltaDays > 0 ? '+' : ''}{adjustments.missionDurationDeltaDays} days</strong></span>
          <span>Operations cost adjustment<strong>{adjustments.missionExpenseDeltaUsd >= 0 ? '+' : '−'}${Math.abs(adjustments.missionExpenseDeltaUsd).toLocaleString()}</strong></span>
          <span>Primary science priority<strong>{adjustments.prioritizedObjectiveId ? missionObjectives.find((objective) => objective.id === adjustments.prioritizedObjectiveId)?.name ?? 'Mission objective changed' : 'No priority selected'}</strong></span>
        </div>
      </Card>

      <Card title={`Engineering decision history · ${history.length}`} subtitle="Selected response, consequences, and educational reasoning are saved in shared game state">
        {history.length ? <ol className="engineering-decision-history">{history.map((record) => <li key={record.id}><div className="engineering-decision-history-header"><span>{categoryLabels[record.category]}</span><time>{new Date(record.selectedAt).toLocaleString()}</time></div><strong>{record.eventTitle}</strong><h3>{record.decisionTitle}</h3><ul>{record.consequences.map((consequence) => <li key={consequence}>{consequence}</li>)}</ul><p>{record.educationalExplanation}</p></li>)}</ol> : <div className="events-clear-state"><p>No engineering decisions have been recorded for this mission yet.</p></div>}
      </Card>

      <Card title="Event model assumptions" subtitle="Deterministic triggers and trade-offs"><ul className="simulation-assumptions">{MISSION_EVENT_ASSUMPTIONS.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></Card>
    </section>
  );
}
