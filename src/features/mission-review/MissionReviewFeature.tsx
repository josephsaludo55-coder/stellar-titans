import { useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { instrumentCatalog } from '../../data/instruments';
import { launchVehicleCatalog, trajectoryCatalog } from '../../data/launchVehicles';
import { communicationRequirements, dataRequirements, missionArchitectures, missionDestinations, missionObjectives } from '../../data/missionDesign';
import { spacecraftDesignCatalog } from '../../data/spacecraftDesigner';
import { useGameState } from '../../hooks/useGameState';
import { calculateMissionResources } from '../../services/calculations/missionResources';
import { MISSION_FUNDING_ALLOCATION_USD } from '../../services/budgetAllocation';
import { validateSpacecraftSelection } from '../../services/calculations/spacecraftDesign';
import { validateLaunchConfiguration } from '../../services/validation/launchConfiguration';
import { validateMissionConfiguration } from '../../services/validation/missionDesign';
import type { MissionStage } from '../../state/gameTypes';

type CheckStatus = 'pass' | 'warning' | 'fail';
interface ChecklistItem {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  destination: MissionStage;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const requiredSystemCategories = ['structure', 'power', 'propulsion', 'communication', 'flight-computer'] as const;

export function MissionReviewFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const [autoFixNote, setAutoFixNote] = useState('');
  const mission = state.missionConfiguration;
  const resources = useMemo(() => calculateMissionResources(state), [state]);
  const destination = missionDestinations.find((item) => item.id === mission?.destination);
  const architecture = missionArchitectures.find((item) => item.id === mission?.architecture);
  const objectives = missionObjectives.filter((item) => mission?.objectiveIds.includes(item.id));
  const systems = spacecraftDesignCatalog.filter((item) => state.selectedSpacecraftComponentIds.includes(item.id));
  const instruments = instrumentCatalog.filter((item) => state.selectedInstrumentIds.includes(item.id));
  const vehicle = launchVehicleCatalog.find((item) => item.id === state.selectedLaunchVehicleId);
  const trajectory = trajectoryCatalog.find((item) => item.id === state.selectedTrajectoryId);
  const spacecraftValidation = validateSpacecraftSelection(state.selectedSpacecraftComponentIds, mission);
  const launchValidation = validateLaunchConfiguration(state);
  const missionValidation = mission ? validateMissionConfiguration(mission) : null;
  const communicationRequirement = communicationRequirements.find((item) => item.id === mission?.communicationRequirement);
  const dataRequirement = dataRequirements.find((item) => item.id === mission?.dataRequirement);

  const selectedCategories = new Set(systems.map((item) => item.category));
  const missingCategories = requiredSystemCategories.filter((category) => !selectedCategories.has(category));
  const missingStorage = instruments.length > 0 && !selectedCategories.has('data-storage');
  const objectiveConfigured = Boolean(mission?.objectiveIds.length && objectives.length);
  const architectureCompatible = Boolean(
    mission?.destination && mission.architecture &&
    architecture?.destinations.includes(mission.destination) &&
    objectives.length && objectives.every((objective) => objective.destination === mission.destination && objective.compatibleArchitectures.includes(mission.architecture!)),
  );
  const instrumentCompatibilityIssues = instruments.filter((instrument) =>
    !mission?.destination || !mission.architecture ||
    !instrument.compatibleDestinations.includes(mission.destination) ||
    !instrument.compatibleArchitectures.includes(mission.architecture) ||
    !instrument.objectiveIds.some((objectiveId) => mission.objectiveIds.includes(objectiveId)),
  );
  const instrumentSelectionValid = instruments.length > 0 && instrumentCompatibilityIssues.length === 0;
  const massValid = Boolean(vehicle && resources.launchCapacityKg !== null && resources.spacecraftMassKg <= vehicle.payloadCapacityKg);
  const budgetValid = resources.remainingBudgetUsd !== null && resources.remainingBudgetUsd >= 0;
  const powerValid = selectedCategories.has('power') && resources.availablePowerW >= resources.requiredPowerW;
  const storageValid = instruments.length > 0 && selectedCategories.has('data-storage') && resources.weeklyRecorderLoadGb <= resources.storageCapacityGb;
  const communicationValid = selectedCategories.has('communication') && resources.downlinkMbps > 0 && resources.requiredDownlinkMbps <= resources.downlinkMbps;
  const lifetimeValid = !resources.warnings.some((warning) => warning.id === 'unsupported-duration');
  const launchValid = launchValidation.isValid && missionValidation?.isValid === true && mission?.isConfirmed === true;

  const checklist: ChecklistItem[] = [
    { id: 'objective', label: 'Mission objective configured', status: objectiveConfigured ? 'pass' : 'fail', detail: objectiveConfigured ? `${objectives.length} objective${objectives.length === 1 ? '' : 's'} selected.` : 'Select at least one valid mission objective.', destination: 'mission-design' },
    { id: 'destination', label: 'Destination selected', status: destination ? 'pass' : 'fail', detail: destination ? `${destination.name} selected.` : 'Choose a mission destination.', destination: 'mission-design' },
    { id: 'architecture', label: 'Architecture compatible', status: architectureCompatible ? 'pass' : 'fail', detail: architectureCompatible ? `${architecture?.name} supports the selected objectives at ${destination?.name}.` : 'Choose an architecture compatible with the destination and every selected objective.', destination: 'mission-design' },
    { id: 'components', label: 'Required spacecraft components selected', status: missingCategories.length === 0 && !missingStorage && spacecraftValidation.isValid ? 'pass' : 'fail', detail: missingCategories.length || missingStorage ? `Missing systems: ${[...missingCategories.map((item) => item.replace(/-/g, ' ')), ...(missingStorage ? ['data storage'] : [])].join(', ')}.` : spacecraftValidation.issues.length ? spacecraftValidation.issues.join(' ') : 'Required structure, power, propulsion, communications, flight computer, and data storage are selected.', destination: 'spacecraft-designer' },
    { id: 'instruments', label: 'Scientific instruments selected and compatible', status: instrumentSelectionValid ? 'pass' : 'fail', detail: !instruments.length ? 'Select at least one science instrument.' : instrumentCompatibilityIssues.length ? `Review incompatible or objective-mismatched instruments: ${instrumentCompatibilityIssues.map((item) => item.name).join(', ')}.` : `${instruments.length} instrument${instruments.length === 1 ? '' : 's'} match the selected mission.`, destination: 'instruments' },
    { id: 'mass', label: 'Spacecraft mass within payload limit', status: massValid ? (resources.metrics.find((item) => item.id === 'mass')?.status === 'caution' ? 'warning' : 'pass') : 'fail', detail: vehicle ? `${resources.spacecraftMassKg.toLocaleString()} kg of ${vehicle.payloadCapacityKg.toLocaleString()} kg on ${vehicle.name}.` : 'Select a launch vehicle to establish the payload limit.', destination: 'launch-configuration' },
    { id: 'budget', label: 'Budget within entered funding', status: budgetValid ? (resources.metrics.find((item) => item.id === 'budget')?.status === 'caution' ? 'warning' : 'pass') : 'fail', detail: resources.remainingBudgetUsd === null ? 'Enter both initial funding and mission expenses.' : resources.remainingBudgetUsd < 0 ? `Over budget by ${money.format(Math.abs(resources.remainingBudgetUsd))}.` : `${money.format(resources.remainingBudgetUsd)} remaining.`, destination: 'mission-control' },
    { id: 'power', label: 'Power generation sufficient', status: powerValid ? (resources.metrics.find((item) => item.id === 'consumption')?.status === 'caution' ? 'warning' : 'pass') : 'fail', detail: `${resources.availablePowerW} W generated against ${resources.requiredPowerW} W simultaneous demand.`, destination: 'spacecraft-designer' },
    { id: 'storage', label: 'Data storage sufficient', status: storageValid ? (resources.metrics.find((item) => item.id === 'storage')?.status === 'caution' ? 'warning' : 'pass') : 'fail', detail: `${resources.storageCapacityGb.toLocaleString()} GB recorder capacity for ${resources.weeklyRecorderLoadGb.toFixed(1)} GB estimated seven-day science volume.`, destination: 'spacecraft-designer' },
    { id: 'communication', label: 'Communication requirements satisfied', status: communicationValid ? (resources.metrics.find((item) => item.id === 'communication')?.status === 'caution' ? 'warning' : 'pass') : 'fail', detail: `${resources.downlinkMbps.toFixed(2)} Mbps selected against ${resources.requiredDownlinkMbps.toFixed(2)} Mbps modeled requirement.`, destination: 'spacecraft-designer' },
    { id: 'lifetime', label: 'Mission duration supported', status: lifetimeValid ? 'pass' : 'fail', detail: mission?.missionDurationDays ? `${mission.missionDurationDays} days with the required power, communications, and data systems.` : 'Set a mission duration and select the required operating systems.', destination: 'mission-design' },
    { id: 'launch', label: 'Launch configuration valid', status: launchValid ? 'pass' : 'fail', detail: launchValid ? `${vehicle?.name} and ${trajectory?.name} match the confirmed mission.` : [...launchValidation.issues, ...(missionValidation?.issues ?? []), ...(!mission?.isConfirmed ? ['Confirm the mission configuration before launch.'] : [])].join(' ') || 'Complete and confirm the mission configuration.', destination: 'launch-configuration' },
  ];

  const criticalFailures = checklist.filter((item) => item.status === 'fail');
  const checklistWarnings = checklist.filter((item) => item.status === 'warning');
  const readyStatus = criticalFailures.length ? 'NOT READY FOR LAUNCH' : checklistWarnings.length ? 'READY WITH WARNINGS' : 'READY FOR LAUNCH';
  const scientificCapabilities = Array.from(new Set(instruments.flatMap((instrument) => instrument.objectiveIds).filter((id) => mission?.objectiveIds.includes(id))))
    .map((id) => missionObjectives.find((objective) => objective.id === id)?.name).filter((name): name is string => Boolean(name));

  function authorizeLaunch() {
    if (criticalFailures.length) return;
    dispatch({ type: 'START_MISSION_SIMULATION' });
    onNavigate('mission-simulation');
  }

  function autoFixFlightIssues() {
    const destinationId = mission?.destination ?? 'moon';
    const architectureId = missionArchitectures.find((item) => item.id === mission?.architecture && item.destinations.includes(destinationId))?.id ?? (destinationId === 'moon' ? 'lander' : 'rover');
    const objective = missionObjectives.find((item) => mission?.objectiveIds.includes(item.id) && item.destination === destinationId && item.compatibleArchitectures.includes(architectureId))
      ?? missionObjectives.find((item) => item.destination === destinationId && item.compatibleArchitectures.includes(architectureId));
    if (!objective) {
      setAutoFixNote('No compatible objective is available. Choose one in Mission Design.');
      onNavigate('mission-design');
      return;
    }
    const repairedMission = {
      missionName: mission?.missionName.trim() || (destinationId === 'moon' ? 'Lunar Field Study' : 'Red Planet Survey'),
      destination: destinationId,
      architecture: architectureId,
      objectiveIds: [objective.id],
      missionDurationDays: Number.isInteger(mission?.missionDurationDays) && (mission?.missionDurationDays ?? 0) >= 1 && (mission?.missionDurationDays ?? 0) <= 3650 ? mission!.missionDurationDays : destinationId === 'moon' ? 14 : 180,
      requiredMeasurements: mission?.requiredMeasurements.length ? mission.requiredMeasurements : objective.measurements.slice(0, 2).map((item) => item.name),
      communicationRequirement: 'continuous-relay',
      dataRequirement: 'summary',
      isConfirmed: false,
      updatedAt: new Date().toISOString(),
    };
    const isCompatible = (item: { compatibleDestinations: string[]; compatibleArchitectures: string[] }) => item.compatibleDestinations.includes(destinationId) && item.compatibleArchitectures.includes(architectureId);
    const compatibleInstruments = instrumentCatalog.filter((item) => isCompatible(item) && item.objectiveIds.includes(objective.id));
    if (!compatibleInstruments.length) {
      setAutoFixNote('No compatible science instrument is available. Choose one in Instruments.');
      onNavigate('instruments');
      return;
    }
    const retainedInstruments = state.selectedInstrumentIds.map((id) => compatibleInstruments.find((item) => item.id === id)).filter((item): item is (typeof instrumentCatalog)[number] => Boolean(item));
    const repairedInstruments = retainedInstruments.length ? retainedInstruments : [compatibleInstruments[0]];
    const categories = ['structure', 'power', 'batteries', 'propulsion', 'communication', 'thermal-control', 'flight-computer', 'data-storage'] as const;
    const repairedComponents = categories.map((category) => {
      const candidates = spacecraftDesignCatalog.filter((item) => item.category === category && isCompatible(item));
      const current = candidates.find((item) => state.selectedSpacecraftComponentIds.includes(item.id));
      if (category === 'power') return candidates.sort((a, b) => b.powerGenerationW - a.powerGenerationW)[0];
      if (category === 'communication') return candidates.sort((a, b) => (b.downlinkMbps ?? 0) - (a.downlinkMbps ?? 0))[0];
      if (category === 'data-storage') return candidates.sort((a, b) => (b.dataStorageGb ?? 0) - (a.dataStorageGb ?? 0))[0];
      return current ?? candidates[0];
    }).filter((item): item is (typeof spacecraftDesignCatalog)[number] => Boolean(item));
    const generation = repairedComponents.reduce((sum, item) => sum + item.powerGenerationW, 0);
    const demand = repairedComponents.reduce((sum, item) => sum + item.powerConsumptionW, 0) + repairedInstruments.reduce((sum, item) => sum + item.powerConsumptionW, 0);
    if (demand > generation) {
      const lowestLoad = [...compatibleInstruments].sort((a, b) => a.powerConsumptionW - b.powerConsumptionW)[0];
      repairedInstruments.splice(0, repairedInstruments.length, lowestLoad);
    }
    const mass = repairedComponents.reduce((sum, item) => sum + item.massKg, 0) + repairedInstruments.reduce((sum, item) => sum + item.massKg, 0);
    const vehicle = launchVehicleCatalog.filter((item) => isCompatible(item) && item.payloadCapacityKg >= mass).sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd)[0];
    const trajectory = trajectoryCatalog.find((item) => item.destination === destinationId && item.compatibleDestinations.includes(destinationId) && item.compatibleArchitectures.includes(architectureId) && (architectureId === 'lander' || architectureId === 'rover' ? item.phase === 'delivery' : architectureId === 'orbiter' ? item.phase === 'orbit' : item.phase === 'transfer'));
    if (!vehicle || !trajectory) {
      setAutoFixNote('No compatible launch configuration is available. Choose one in Launch Configuration.');
      onNavigate('launch-configuration');
      return;
    }
    const estimatedCost = repairedComponents.reduce((sum, item) => sum + item.estimatedCostUsd, 0) + repairedInstruments.reduce((sum, item) => sum + item.estimatedCostUsd, 0) + vehicle.estimatedCostUsd;
    const expenses = Math.max(0, state.resourcePlan.missionExpensesUsd ?? 0);
    const funding = state.resourcePlan.initialFundingUsd ?? MISSION_FUNDING_ALLOCATION_USD;
    dispatch({ type: 'UPDATE_MISSION_CONFIGURATION', configuration: repairedMission });
    dispatch({ type: 'SET_SPACECRAFT_COMPONENTS', componentIds: repairedComponents.map((item) => item.id) });
    dispatch({ type: 'SET_INSTRUMENTS', instrumentIds: repairedInstruments.map((item) => item.id) });
    dispatch({ type: 'SET_LAUNCH_CONFIGURATION', launchVehicleId: vehicle.id, trajectoryId: trajectory.id });
    dispatch({ type: 'UPDATE_RESOURCE_PLAN', payload: { initialFundingUsd: funding, missionExpensesUsd: expenses } });
    dispatch({ type: 'CONFIRM_MISSION_CONFIGURATION', confirmedAt: new Date().toISOString() });
    const projectedSpend = estimatedCost + Math.max(0, expenses + state.missionEngineeringAdjustments.missionExpenseDeltaUsd);
    setAutoFixNote(projectedSpend > funding
      ? `Flight systems were repaired, but the design still exceeds the ${money.format(funding)} allocation. Reduce the selected system or mission costs.`
      : `Flight plan tuned with compatible catalog systems. ${money.format(funding - projectedSpend)} remains in the mission allocation.`);
  }

  return (
    <section className="feature-panel mission-review-feature">
      <p className="eyebrow">LAST STEP · BEFORE LIFTOFF</p>

      <div className={`review-readiness-banner ${criticalFailures.length ? 'is-not-ready' : checklistWarnings.length ? 'is-warning' : 'is-ready'}`} role="status">
        <div><span>PRE-LAUNCH STATUS</span><strong>{readyStatus}</strong><small>{criticalFailures.length ? `${criticalFailures.length} issue${criticalFailures.length === 1 ? '' : 's'} to fix` : checklistWarnings.length ? `${checklistWarnings.length} margin${checklistWarnings.length === 1 ? '' : 's'} to watch` : 'All 12 checks pass'}</small></div>
        <Button onClick={criticalFailures.length ? autoFixFlightIssues : authorizeLaunch}>{criticalFailures.length ? 'AUTO-FIX FLIGHT ISSUES' : 'LAUNCH MISSION →'}</Button>
      </div>
      {autoFixNote ? <p className="mission-review-footnote" role="status">{autoFixNote}</p> : null}

      <details className="resource-more-details mission-summary-details"><summary>See my mission plan</summary><Card title="Your mission" subtitle="Built from the choices you made">
        <div className="mission-summary-grid">
          <SummaryField label="Mission name" value={mission?.missionName || 'Not configured'} />
          <SummaryField label="Destination" value={destination?.name ?? 'Not selected'} />
          <SummaryField label="Mission architecture" value={architecture?.name ?? 'Not selected'} />
          <SummaryField label="Mission objective" value={objectives.length ? objectives.map((item) => item.name).join('; ') : 'Not configured'} />
          <SummaryField label="Mission duration" value={mission?.missionDurationDays ? `${mission.missionDurationDays} Earth days` : 'Not configured'} />
          <SummaryField label="Spacecraft configuration" value={`${architecture?.name ?? 'Architecture not selected'} · ${systems.length} selected systems`} />
          <SummaryField label="Selected components" value={systems.length ? systems.map((item) => item.name).join(', ') : 'None selected'} />
          <SummaryField label="Scientific instruments" value={instruments.length ? instruments.map((item) => item.name).join(', ') : 'None selected'} />
          <SummaryField label="Launch vehicle" value={vehicle?.name ?? 'Not selected'} />
          <SummaryField label="Trajectory" value={trajectory?.name ?? 'Not selected'} />
          <SummaryField label="Total spacecraft mass" value={`${resources.spacecraftMassKg.toLocaleString()} kg${vehicle ? ` / ${vehicle.payloadCapacityKg.toLocaleString()} kg limit` : ''}`} />
          <SummaryField label="Budget" value={resources.remainingBudgetUsd === null ? `Estimated costs ${money.format(resources.totalEstimatedCostUsd)} · funding not configured` : `${money.format(resources.remainingBudgetUsd)} remaining of ${money.format(state.resourcePlan.initialFundingUsd ?? 0)}`} />
          <SummaryField label="Power balance" value={`${resources.availablePowerW} W generation · ${resources.requiredPowerW} W demand · ${(resources.availablePowerW - resources.requiredPowerW).toLocaleString()} W margin`} />
          <SummaryField label="Communication configuration" value={`${systems.filter((item) => item.category === 'communication').map((item) => `${item.name} (${item.downlinkMbps ?? 0} Mbps)`).join(', ') || 'No radio selected'} · ${communicationRequirement?.name ?? 'mission requirement not set'}`} />
          <SummaryField label="Data storage" value={`${resources.storageCapacityGb.toLocaleString()} GB selected · ${resources.weeklyRecorderLoadGb.toFixed(1)} GB modeled weekly science data · ${dataRequirement?.name ?? 'requirement not set'}`} />
          <SummaryField label="Scientific capabilities" value={scientificCapabilities.length ? scientificCapabilities.join('; ') : 'No selected instrument covers the configured objectives'} />
        </div>
      </Card></details>

      <Card title="Launch checklist" subtitle="Tap a problem to fix it">
        <div className="prelaunch-checklist">{checklist.map((item, index) => {
          const content = <><span className="checklist-index">{String(index + 1).padStart(2, '0')}</span><span className={`checklist-state state-${item.status}`}>{item.status === 'pass' ? 'PASS' : item.status === 'warning' ? 'REVIEW' : 'FAIL'}</span><span className="checklist-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="checklist-action">{item.status === 'pass' ? 'VERIFIED' : 'OPEN MODULE ↗'}</span></>;
          return item.status === 'pass'
            ? <div className="prelaunch-checklist-item" key={item.id}>{content}</div>
            : <button type="button" className="prelaunch-checklist-item is-actionable" key={item.id} onClick={() => onNavigate(item.destination)} aria-label={`${item.label}: ${item.detail}. Open ${item.destination.replace(/-/g, ' ')}.`}>{content}</button>;
        })}</div>
      </Card>

      {checklistWarnings.length > 0 ? <Card title="Engineering warnings" subtitle="The configuration passes critical checks with margins that deserve review"><ul className="review-margin-warnings">{checklistWarnings.map((item) => <li key={item.id}><strong>{item.label}</strong><span>{item.detail}</span><button onClick={() => onNavigate(item.destination)}>Review configuration</button></li>)}</ul></Card> : null}

      <p className="mission-review-footnote">Launch authorization checks the current configuration only. Changes made in Mission Design, Spacecraft Designer, Instruments, Launch, or Mission Control update this review automatically.</p>
    </section>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return <div className="mission-summary-field"><small>{label}</small><strong>{value}</strong></div>;
}
