import { useEffect, useRef, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { AppProviders } from './AppProviders';
import { useGameState } from '../hooks/useGameState';
import { WelcomeFeature } from '../features/welcome/WelcomeFeature';
import { AcademyFeature } from '../features/academy/AcademyFeature';
import { MissionStoriesFeature } from '../features/mission-stories/MissionStoriesFeature';
import { PlayerSetupFeature } from '../features/player-setup/PlayerSetupFeature';
import { SpacecraftExplorerFeature } from '../features/spacecraft-explorer/SpacecraftExplorerFeature';
import { MissionDesignFeature } from '../features/mission-design/MissionDesignFeature';
import { SpacecraftDesignerFeature } from '../features/spacecraft-designer/SpacecraftDesignerFeature';
import { InstrumentsFeature } from '../features/instruments/InstrumentsFeature';
import { LaunchConfigurationFeature } from '../features/launch-configuration/LaunchConfigurationFeature';
import { MissionControlFeature } from '../features/mission-control/MissionControlFeature';
import { MissionReviewFeature } from '../features/mission-review/MissionReviewFeature';
import { MissionSimulationFeature } from '../features/mission-simulation/MissionSimulationFeature';
import { MissionEventsFeature } from '../features/mission-events/MissionEventsFeature';
import { MissionEvaluationFeature } from '../features/mission-evaluation/MissionEvaluationFeature';
import { AchievementsFeature } from '../features/achievements/AchievementsFeature';
import { MissionHistoryFeature } from '../features/mission-history/MissionHistoryFeature';
import type { MissionStage as GameStage } from '../state/gameTypes';
import { getMissionResumeStage, isMissionCheckpoint } from '../state/missionProgress';

export const navigation = [
  { id: 'welcome', label: 'Flight deck', description: 'Command center' },
  { id: 'academy', label: 'Academy', description: 'Mission training' },
  { id: 'mission-stories', label: 'Discover', description: 'Explore missions' },
  { id: 'player-setup', label: 'Crew', description: 'Crew briefing' },
  { id: 'spacecraft-explorer', label: 'Hangar', description: 'Spacecraft guide' },
  { id: 'mission-design', label: 'Choose a world', description: 'Pick your mission' },
  { id: 'spacecraft-designer', label: 'Build your ship', description: 'Choose ship parts' },
  { id: 'instruments', label: 'Science tools', description: 'Pick what to study' },
  { id: 'launch-configuration', label: 'Launch pad', description: 'Choose rocket and route' },
  { id: 'mission-control', label: 'Supplies', description: 'Check mission resources' },
  { id: 'mission-review', label: 'Final check', description: 'Ready for launch?' },
  { id: 'mission-simulation', label: 'Fly mission', description: 'Launch and explore' },
  { id: 'mission-events', label: 'Mission choices', description: 'Solve flight challenges' },
  { id: 'mission-evaluation', label: 'Mission results', description: 'See what you learned' },
  { id: 'achievements', label: 'Awards', description: 'Earned milestones' },
  { id: 'mission-history', label: 'Mission log', description: 'Previous flights' },
];

function renderFeature(stage: GameStage, onNavigate: (stage: GameStage) => void, onContinueFlight?: () => void) {
  switch (stage) {
    case 'welcome': return null;
    case 'academy': return <AcademyFeature onNavigate={onNavigate} />;
    case 'mission-stories': return <MissionStoriesFeature />;
    case 'player-setup': return <PlayerSetupFeature onNavigate={onNavigate} onContinueFlight={onContinueFlight} />;
    case 'spacecraft-explorer': return <SpacecraftExplorerFeature />;
    case 'mission-design': return <MissionDesignFeature onNavigate={onNavigate} />;
    case 'spacecraft-designer': return <SpacecraftDesignerFeature onNavigate={onNavigate} />;
    case 'instruments': return <InstrumentsFeature onNavigate={onNavigate} />;
    case 'launch-configuration': return <LaunchConfigurationFeature onNavigate={onNavigate} />;
    case 'mission-control': return <MissionControlFeature onNavigate={onNavigate} />;
    case 'mission-review': return <MissionReviewFeature onNavigate={onNavigate} />;
    case 'mission-simulation': return <MissionSimulationFeature onNavigate={onNavigate} />;
    case 'mission-events': return <MissionEventsFeature />;
    case 'mission-evaluation': return <MissionEvaluationFeature onNavigate={onNavigate} />;
    case 'achievements': return <AchievementsFeature />;
    case 'mission-history': return <MissionHistoryFeature onNavigate={onNavigate} />;
    default: return null;
  }
}

function GameShell() {
  const { state, dispatch, hasSavedProgress, loadWarning } = useGameState();
  const [activeStage, setActiveStage] = useState<GameStage>('welcome');
  const [crewContinueMode, setCrewContinueMode] = useState(false);
  const [continueTarget, setContinueTarget] = useState<GameStage>('mission-design');
  const initialized = useRef(false);

  useEffect(() => {
    if (state.isLoaded && !initialized.current) {
      setActiveStage('welcome');
      initialized.current = true;
    }
  }, [state.isLoaded, state.mission.stage]);

  const navigate = (stage: GameStage, saveCheckpoint = true) => {
    if (!state.isLoaded && stage !== 'welcome') return;
    if (stage !== 'player-setup') setCrewContinueMode(false);
    setActiveStage(stage);
    if (saveCheckpoint && isMissionCheckpoint(stage)) dispatch({ type: 'SET_STAGE', stage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const continueMission = () => navigate(continueTarget);
  const openCrewForContinue = () => {
    const savedStage = getMissionResumeStage(state);
    setContinueTarget(savedStage === 'player-setup' ? state.missionConfiguration?.isConfirmed ? 'spacecraft-designer' : 'mission-design' : savedStage);
    setCrewContinueMode(true);
    navigate('player-setup', false);
  };
  const startNewFlight = () => { setCrewContinueMode(false); dispatch({ type: 'START_NEW_MISSION' }); navigate('player-setup'); };
  const missionSteps = [
    { label: 'Plan', stages: ['mission-design'], route: 'mission-design' as GameStage },
    { label: 'Build', stages: ['spacecraft-designer', 'instruments'], route: 'spacecraft-designer' as GameStage },
    { label: 'Launch', stages: ['launch-configuration', 'mission-control', 'mission-review'], route: 'launch-configuration' as GameStage },
    { label: 'Fly', stages: ['mission-simulation', 'mission-events'], route: 'mission-simulation' as GameStage },
    { label: 'Results', stages: ['mission-evaluation'], route: 'mission-evaluation' as GameStage },
  ];
  const activeStepIndex = missionSteps.findIndex((step) => step.stages.includes(activeStage));

  if (activeStage === 'welcome') {
    return <WelcomeFeature onNavigate={navigate} onContinue={openCrewForContinue} onNewFlight={startNewFlight} hasSavedProgress={hasSavedProgress} loadWarning={loadWarning} />;
  }

  return (
    <MainLayout
      navItems={navigation}
      activeItemId={activeStage}
      onNavigate={(stage) => navigate(stage as GameStage)}
      stage={activeStage}
    >
      {activeStepIndex >= 0 ? <nav className="mission-stepper" aria-label="Mission steps">
        {missionSteps.map((step, index) => <button key={step.label} type="button" disabled={index > activeStepIndex} className={`${index === activeStepIndex ? 'is-current' : ''} ${index < activeStepIndex ? 'is-complete' : ''}`} aria-current={index === activeStepIndex ? 'step' : undefined} onClick={() => navigate(step.route)}><span>{index < activeStepIndex ? '✓' : index + 1}</span>{step.label}</button>)}
      </nav> : null}
      <div key={activeStage} className={`stage-transition stage-${activeStage}`}>{renderFeature(activeStage, navigate, activeStage === 'player-setup' && crewContinueMode ? continueMission : undefined)}</div>
    </MainLayout>
  );
}

export default function App() {
  return <AppProviders><GameShell /></AppProviders>;
}
