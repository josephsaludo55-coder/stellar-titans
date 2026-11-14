import { useMemo } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { calculateMissionResources } from '../../services/calculations/missionResources';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Live shared-state budget readout for the spacecraft preparation steps. */
export function MissionBudgetStatus() {
  const { state } = useGameState();
  const resources = useMemo(() => calculateMissionResources(state), [state]);
  const funding = state.resourcePlan.initialFundingUsd;
  const remaining = resources.remainingBudgetUsd;

  return <aside className={`mission-budget-status${remaining !== null && remaining < 0 ? ' is-over-budget' : ''}`} aria-live="polite" aria-label="Mission budget">
    <span className="mission-budget-icon" aria-hidden="true">$</span>
    <span className="mission-budget-copy"><small>MISSION FUNDS LEFT</small><strong>{remaining === null ? 'Not allocated' : currency.format(remaining)}</strong></span>
    <span className="mission-budget-allocation">of {funding === null ? '—' : currency.format(funding)}</span>
  </aside>;
}
