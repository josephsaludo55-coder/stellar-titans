import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useGameState } from '../../hooks/useGameState';
import { deleteCrewAccount, loadCrewAccounts, saveCrewAccount, type CrewAccount } from '../../services/crewAccounts';
import type { MissionStage, TeamParticipant, TeamRole } from '../../state/gameTypes';

const MAX_TEAM_SIZE = 4;
const teamRoles: Array<{ id: TeamRole; name: string }> = [
  { id: 'mission-commander', name: 'Commander' },
  { id: 'mission-engineer', name: 'Engineer' },
  { id: 'science-officer', name: 'Science lead' },
  { id: 'resource-manager', name: 'Resource lead' },
];

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type CrewIconName = 'pilot' | 'team' | 'rocket' | 'continue' | 'trash' | 'edit' | 'team-add' | 'person-add' | 'save' | 'remove';

function CrewIcon({ name }: { name: CrewIconName }) {
  const paths: Record<CrewIconName, ReactNode> = {
    pilot: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    team: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8" /></>,
    rocket: <><path d="M12 15.5 8 19l1-5.5a12 12 0 0 1 7.5-9.8A12 12 0 0 1 18 11.2L12 15.5Z" /><circle cx="14.2" cy="9.5" r="1.4" /><path d="m8.7 14.2-3.2.4-1.8 2.6 4.8.3m5-2.1.1 4.8 2.7-1.8.4-3.2" /></>,
    continue: <><path d="M4 12h15" /><path d="m13 6 6 6-6 6" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5" /></>,
    edit: <><path d="m4 16.5-.8 4.3 4.3-.8L19.8 7.7a2.1 2.1 0 0 0-3-3L4 16.5Z" /><path d="m14.8 6.8 3 3" /></>,
    'team-add': <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M18 8v6m-3-3h6" /></>,
    'person-add': <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M18 8v6m-3-3h6" /></>,
    save: <><path d="M5 4h12l3 3v13H4V4h1Z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></>,
    remove: <path d="M5 12h14" />,
  };

  return <svg className="crew-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function PlayerSetupFeature({ onNavigate, onContinueFlight }: { onNavigate: (stage: MissionStage) => void; onContinueFlight?: () => void }) {
  const { state, dispatch } = useGameState();
  const [teamName, setTeamName] = useState(state.team?.name ?? 'Flight Team Alpha');
  const [draftParticipants, setDraftParticipants] = useState<TeamParticipant[]>(state.team?.participants ?? []);
  const [isEditingTeam, setIsEditingTeam] = useState(!state.team?.isConfirmed);
  const [isNewTeamDraft, setIsNewTeamDraft] = useState(!state.team);
  const [teamError, setTeamError] = useState('');
  const [crewAccounts, setCrewAccounts] = useState<CrewAccount[]>(() => loadCrewAccounts());
  const [crewNotice, setCrewNotice] = useState('');

  const confirmedTeam = state.team?.isConfirmed ? state.team : null;
  const availableRoles = useMemo(() => teamRoles.filter((role) => !draftParticipants.some((person) => person.role === role.id)), [draftParticipants]);
  const canConfirmTeam = teamName.trim().length > 0 && draftParticipants.length > 0 && draftParticipants.length <= MAX_TEAM_SIZE &&
    draftParticipants.every((person) => person.name.trim().length > 0) && new Set(draftParticipants.map((person) => person.role)).size === draftParticipants.length;

  useEffect(() => {
    if (!state.isLoaded || !state.team) return;
    setTeamName(state.team.name);
    setDraftParticipants(state.team.participants);
    setIsEditingTeam(!state.team.isConfirmed);
    setIsNewTeamDraft(false);
  }, [state.isLoaded]);

  function updateParticipant(id: string, updates: Partial<TeamParticipant>) {
    setDraftParticipants((people) => people.map((person) => person.id === id ? { ...person, ...updates } : person));
    setTeamError('');
  }

  function addParticipant() {
    if (draftParticipants.length >= MAX_TEAM_SIZE || !availableRoles.length) return;
    setDraftParticipants((people) => [...people, { id: createId(), name: '', role: availableRoles[0].id }]);
  }

  function confirmTeam() {
    if (!canConfirmTeam) { setTeamError('Add a team name and at least one crew member. Give each person a different role.'); return; }
    if (isNewTeamDraft && crewAccounts.some((account) => account.mode === 'team' && account.name.trim().toLocaleLowerCase() === teamName.trim().toLocaleLowerCase())) {
      setTeamError('That team name is already saved. Choose a different name to keep both crews separate.');
      return;
    }
    const confirmedAt = new Date().toISOString();
    const team = { name: teamName.trim(), participants: draftParticipants.map((person) => ({ ...person, name: person.name.trim() })), isConfirmed: true, confirmedAt };
    dispatch({ type: 'SET_TEAM', team });
    dispatch({ type: 'CONFIRM_TEAM', confirmedAt });
    setDraftParticipants(team.participants);
    setIsEditingTeam(false);
    setTeamError('');
  }

  function editTeam() {
    if (!state.team) return;
    setTeamName(state.team.name);
    setDraftParticipants(state.team.participants.map((person) => ({ ...person })));
    setIsEditingTeam(true);
  }

  function createNewTeam() {
    dispatch({ type: 'SET_PLAYER_MODE', mode: 'team' });
    dispatch({ type: 'CLEAR_TEAM' });
    setTeamName('');
    setDraftParticipants([]);
    setIsEditingTeam(true);
    setIsNewTeamDraft(true);
    setTeamError('');
  }

  function startFlightWithCurrentCrew() {
    if (state.playerMode === 'individual') {
      const player = { ...state.player, name: state.player.name.trim() };
      if (!player.name) { setTeamError('Add your name to continue.'); return; }
      dispatch({ type: 'CLEAR_TEAM' });
      setCrewAccounts(saveCrewAccount({ mode: 'individual', name: player.name, player, team: null }));
      setCrewNotice(`${player.name} saved. Let’s choose a destination.`);
    } else {
      if (!canConfirmTeam) { setTeamError('Add a team name and at least one named crew member.'); return; }
      if (isNewTeamDraft && crewAccounts.some((account) => account.mode === 'team' && account.name.trim().toLocaleLowerCase() === teamName.trim().toLocaleLowerCase())) {
        setTeamError('That team name is already saved. Choose a different name to keep both crews separate.');
        return;
      }
      const confirmedAt = new Date().toISOString();
      const team = { name: teamName.trim(), participants: draftParticipants.map((person) => ({ ...person, name: person.name.trim() })), isConfirmed: true, confirmedAt };
      dispatch({ type: 'SET_TEAM', team });
      dispatch({ type: 'CONFIRM_TEAM', confirmedAt });
      const player = { ...state.player, name: team.participants[0].name };
      dispatch({ type: 'UPDATE_PLAYER', payload: player });
      setCrewAccounts(saveCrewAccount({ mode: 'team', name: team.name, player, team }));
      setCrewNotice(`${team.name} saved. Let’s choose a destination.`);
    }
    dispatch({ type: 'START_NEW_MISSION' });
    onNavigate('mission-design');
  }

  function useCrewAccount(account: CrewAccount, intent: 'continue' | 'new' = 'new') {
    if (intent === 'new') dispatch({ type: 'START_NEW_MISSION' });
    dispatch({ type: 'SET_PLAYER_MODE', mode: account.mode });
    dispatch({ type: 'UPDATE_PLAYER', payload: account.player });
    if (account.team) {
      dispatch({ type: 'SET_TEAM', team: account.team });
      dispatch({ type: 'CONFIRM_TEAM', confirmedAt: new Date().toISOString() });
    } else dispatch({ type: 'CLEAR_TEAM' });
    setCrewNotice(intent === 'continue' ? `${account.name} is ready to continue this mission.` : `${account.name} is ready for a new flight.`);
    if (intent === 'continue' && onContinueFlight) onContinueFlight();
    else onNavigate('mission-design');
  }

  function removeCrewAccount(id: string) {
    setCrewAccounts(deleteCrewAccount(id));
  }

  return <section className={`feature-panel player-setup-feature${onContinueFlight ? ' is-continue-mode' : ' is-create-mode'}`}>
    <header className="player-setup-heading">
      <div>
        <p className="eyebrow">{onContinueFlight ? 'CONTINUE FLIGHT · CHOOSE A CREW' : 'NEW FLIGHT · CREW SETUP'}</p>
        <h2>{onContinueFlight ? 'Who’s taking the controls?' : 'Who is flying today?'}</h2>
        {!onContinueFlight ? <p>Play solo or create a team. Your saved crews stay on this device.</p> : null}
      </div>
      <span className="player-local-badge"><span aria-hidden="true">●</span> SAVED ON THIS DEVICE</span>
    </header>

    {!onContinueFlight ? <div className="player-mode-switch" role="group" aria-label="Player mode">
      <button type="button" className={state.playerMode === 'individual' ? 'player-mode-option is-active' : 'player-mode-option'} aria-pressed={state.playerMode === 'individual'} onClick={() => dispatch({ type: 'SET_PLAYER_MODE', mode: 'individual' })}>
        <span className="player-mode-number"><CrewIcon name="pilot" /></span><span><strong>Solo pilot</strong><small>Fly your own mission</small></span>
      </button>
      <button type="button" className={state.playerMode === 'team' ? 'player-mode-option is-active' : 'player-mode-option'} aria-pressed={state.playerMode === 'team'} onClick={createNewTeam}>
        <span className="player-mode-number"><CrewIcon name="team" /></span><span><strong>Team</strong><small>Create a crew of up to four</small></span>
      </button>
    </div> : null}

    {onContinueFlight ? <section className="continue-crew-picker" aria-label="Saved pilots and teams">
      {crewAccounts.length ? <div className="continue-crew-grid">{crewAccounts.map((account) => <button type="button" key={account.id} className="continue-crew-card" onClick={() => useCrewAccount(account, 'continue')}>
        <span className="continue-crew-type"><CrewIcon name={account.mode === 'team' ? 'team' : 'pilot'} />{account.mode === 'team' ? 'TEAM' : 'SOLO PILOT'}</span>
        <strong>{account.name}</strong>
        <span className="continue-crew-arrow" aria-hidden="true"><CrewIcon name="continue" /></span>
      </button>)}</div> : <p className="crew-account-empty">No saved pilots or teams yet.</p>}
    </section> : <Card className="saved-crews-card" title="Saved crews" subtitle="Continue with a crew you created, or start a new flight">
      {crewAccounts.length ? <div className="crew-account-grid">{crewAccounts.map((account) => <article key={account.id} className="crew-account-card">
        <div><span className="crew-account-type-icon"><CrewIcon name={account.mode === 'team' ? 'team' : 'pilot'} /></span><strong>{account.name}</strong><small>{account.mode === 'team' ? `Team · ${account.team?.participants.length ?? 0} crew` : `Pilot · ${account.player.role}`}</small></div>
        {onContinueFlight ? <button type="button" onClick={() => useCrewAccount(account, 'continue')}>CONTINUE AS →</button> : null}
        <button type="button" className="crew-account-new-flight" onClick={() => useCrewAccount(account, 'new')}><CrewIcon name="rocket" /> NEW FLIGHT</button>
        <button type="button" className="crew-account-delete" aria-label={`Delete ${account.name}`} onClick={() => removeCrewAccount(account.id)}><CrewIcon name="trash" /></button>
      </article>)}</div> : <p className="crew-account-empty">No saved crews yet. Create a pilot or team below.</p>}
    </Card>}

    {!onContinueFlight && state.playerMode === 'individual' ? <Card className="crew-creation-card" title="Pilot profile" subtitle="A name is all you need to start">
      <div className="setup-fields">
        <label className="setup-field"><span>PILOT NAME</span><input value={state.player.name} maxLength={40} onChange={(event) => dispatch({ type: 'UPDATE_PLAYER', payload: { name: event.target.value } })} placeholder="Enter your name" /></label>
        <label className="setup-field"><span>MISSION ROLE</span><input value={state.player.role} maxLength={48} onChange={(event) => dispatch({ type: 'UPDATE_PLAYER', payload: { role: event.target.value } })} placeholder="Explorer, commander…" /></label>
      </div>
    </Card> : !onContinueFlight ? <Card className="crew-creation-card" title={confirmedTeam && !isEditingTeam ? confirmedTeam.name : 'Create your team'} subtitle="Add crew members and give each person a role">
      {confirmedTeam && !isEditingTeam ? <div className="confirmed-team-view">
        <div className="confirmed-participant-list">{confirmedTeam.participants.map((person) => <div className="confirmed-participant" key={person.id}><span className="participant-initial">{person.name.charAt(0).toUpperCase()}</span><div><strong>{person.name}</strong><span>{teamRoles.find((role) => role.id === person.role)?.name ?? person.role}</span></div></div>)}</div>
        <div className="confirmed-team-actions"><Button variant="secondary" onClick={editTeam}><CrewIcon name="edit" /> EDIT TEAM</Button><Button variant="secondary" onClick={createNewTeam}><CrewIcon name="team-add" /> CREATE NEW TEAM</Button></div>
      </div> : <div className="team-editor">
        <label className="setup-field team-name-field"><span>TEAM NAME</span><input value={teamName} maxLength={48} onChange={(event) => setTeamName(event.target.value)} placeholder="Name your team" /></label>
        <div className="roster-heading"><span>CREW</span><span>{draftParticipants.length} / {MAX_TEAM_SIZE}</span></div>
        {draftParticipants.length ? <div className="roster-list">{draftParticipants.map((person, index) => <div className="roster-row" key={person.id}>
          <span className="roster-index">{String(index + 1).padStart(2, '0')}</span>
          <label className="setup-field"><span>NAME</span><input value={person.name} maxLength={40} onChange={(event) => updateParticipant(person.id, { name: event.target.value })} placeholder={`Crew member ${index + 1}`} /></label>
          <label className="setup-field"><span>ROLE</span><select value={person.role} onChange={(event) => updateParticipant(person.id, { role: event.target.value as TeamRole })}>{teamRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <button type="button" className="remove-participant" aria-label={`Remove ${person.name || `crew member ${index + 1}`}`} onClick={() => setDraftParticipants((people) => people.filter((item) => item.id !== person.id))}><CrewIcon name="remove" /></button>
        </div>)}</div> : <p className="crew-account-empty">Add your first crew member to begin.</p>}
        <div className="team-editor-actions"><Button variant="secondary" disabled={draftParticipants.length >= MAX_TEAM_SIZE || !availableRoles.length} onClick={() => { if (draftParticipants.length < MAX_TEAM_SIZE && availableRoles.length) setDraftParticipants((people) => [...people, { id: createId(), name: '', role: availableRoles[0].id }]); }}><CrewIcon name="person-add" /> ADD CREW MEMBER</Button><Button disabled={!canConfirmTeam} onClick={confirmTeam}><CrewIcon name="save" /> SAVE TEAM</Button></div>
        {teamError ? <p className="team-validation-error" role="alert">{teamError}</p> : null}
      </div>}
    </Card> : null}

    {teamError && state.playerMode === 'individual' ? <p className="team-validation-error" role="alert">{teamError}</p> : null}
    <div className="crew-setup-footer"><span role="status">{crewNotice || (onContinueFlight ? 'Choose a saved crew or continue as the current pilot.' : 'Your crew is saved with this flight.')}</span>
      {onContinueFlight ? <Button disabled={state.playerMode === 'team' && (!state.team?.isConfirmed || isEditingTeam)} onClick={onContinueFlight}><CrewIcon name="continue" /> CONTINUE CURRENT CREW</Button> : <Button disabled={state.playerMode === 'team' ? !canConfirmTeam : !state.player.name.trim()} onClick={startFlightWithCurrentCrew}><CrewIcon name={state.playerMode === 'team' ? 'team' : 'rocket'} /> {state.playerMode === 'team' ? 'SAVE TEAM & START FLIGHT' : 'SAVE PILOT & START FLIGHT'}</Button>}
    </div>
  </section>;
}
