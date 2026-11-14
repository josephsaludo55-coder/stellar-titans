import { useGameState } from '../../hooks/useGameState';
import { missionArchitectures, missionDestinations, missionObjectives } from '../../data/missionDesign';

interface MissionContextSummaryProps {
  moduleName: string;
}

export function MissionContextSummary({ moduleName }: MissionContextSummaryProps) {
  const { state } = useGameState();
  const configuration = state.missionConfiguration;

  if (!configuration) {
    return (
      <aside className="mission-context-summary is-unconfigured" aria-label={`${moduleName} mission context`}>
        <div><span>MISSION CONTEXT / {moduleName.toUpperCase()}</span><strong>No mission configured</strong></div>
        <p>Configure a destination, architecture, and objectives in Mission Design Studio to tailor this module.</p>
      </aside>
    );
  }

  const destination = missionDestinations.find((option) => option.id === configuration.destination);
  const architecture = missionArchitectures.find((option) => option.id === configuration.architecture);
  const objectives = missionObjectives.filter((objective) => configuration.objectiveIds.includes(objective.id));

  return (
    <aside className={`mission-context-summary${configuration.isConfirmed ? ' is-confirmed' : ' is-draft'}`} aria-label={`${moduleName} mission context`}>
      <div className="mission-context-header">
        <div><span>MISSION CONTEXT / {moduleName.toUpperCase()}</span><strong>{configuration.missionName || 'Unnamed mission'}</strong></div>
        <span className="mission-context-status">{configuration.isConfirmed ? 'CONFIRMED' : 'DRAFT'}</span>
      </div>
      <div className="mission-context-meta">
        <span><small>DESTINATION</small>{destination?.name ?? 'Not selected'}</span>
        <span><small>ARCHITECTURE</small>{architecture?.name ?? 'Not selected'}</span>
        <span><small>DURATION</small>{configuration.missionDurationDays ? `${configuration.missionDurationDays} days` : 'Not set'}</span>
      </div>
      <div className="mission-context-objectives">
        <small>SELECTED OBJECTIVES</small>
        <div>{objectives.length ? objectives.map((objective) => <span key={objective.id}>{objective.name}</span>) : <span>Objectives not selected</span>}</div>
      </div>
    </aside>
  );
}
