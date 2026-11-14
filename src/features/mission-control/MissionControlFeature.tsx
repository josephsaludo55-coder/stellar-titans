import { useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { useGameState } from '../../hooks/useGameState';
import { calculateMissionResources, RESOURCE_MODEL_ASSUMPTIONS, type ResourceMetric } from '../../services/calculations/missionResources';
import { Button } from '../../components/common/Button';
import type { MissionStage } from '../../state/gameTypes';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function formatMetric(metric: ResourceMetric): string {
  if (metric.value === null) return 'Not configured';
  if (metric.id === 'budget') return currency.format(metric.value);
  if (metric.id === 'lifetime') return `${metric.value.toLocaleString()} ${metric.unit}`;
  return `${metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${metric.unit}`;
}

function progressPercent(metric: ResourceMetric, funding: number | null, estimatedSpend: number): number | null {
  if (metric.id === 'budget') return funding && funding > 0 ? Math.min(100, estimatedSpend / funding * 100) : null;
  if (metric.id === 'lifetime') return metric.value !== null && metric.capacity ? Math.min(100, metric.value / metric.capacity * 100) : null;
  if (metric.id === 'generation') return null;
  if (metric.id === 'consumption') return metric.capacity ? Math.min(100, metric.value! / metric.capacity * 100) : null;
  if (metric.id === 'mass') return metric.capacity ? Math.min(100, metric.value! / metric.capacity * 100) : null;
  if (metric.id === 'communication') return metric.capacity ? Math.min(100, metric.capacity / Math.max(metric.value ?? 0, 0.0001) * 100) : null;
  if (metric.id === 'storage') return metric.capacity ? Math.min(100, metric.capacity / Math.max(metric.value ?? 0, 0.0001) * 100) : null;
  return null;
}

function ResourceCard({ metric, funding, estimatedSpend }: { metric: ResourceMetric; funding: number | null; estimatedSpend: number }) {
  const percent = progressPercent(metric, funding, estimatedSpend);
  const statusText = metric.status === 'ready' ? 'GOOD' : metric.status === 'caution' ? 'CLOSE' : metric.status === 'critical' ? 'OVER' : 'SET UP';
  const friendlyLabels: Record<string, string> = { budget: 'Money left', mass: 'Ship weight', generation: 'Power made', consumption: 'Power used', communication: 'Radio link', storage: 'Data space', lifetime: 'Mission days' };
  return <article className={`resource-metric-card status-${metric.status}`}>
    <header><span>{friendlyLabels[metric.id] ?? metric.label}</span><b>{statusText}</b></header>
    <strong>{formatMetric(metric)}</strong>
    {percent !== null ? <div className="resource-progress" role="progressbar" aria-label={`${metric.label} utilization`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><span style={{ width: `${percent}%` }} /></div> : <div className="resource-progress is-unavailable"><span /></div>}
    <small>{metric.detail}</small>
  </article>;
}

export function MissionControlFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const resources = useMemo(() => calculateMissionResources(state), [state]);
  const funding = state.resourcePlan.initialFundingUsd;
  const expenses = state.resourcePlan.missionExpensesUsd;
  const adjustedExpenses = Math.max(0, (expenses ?? 0) + state.missionEngineeringAdjustments.missionExpenseDeltaUsd);
  const estimatedSpend = resources.totalEstimatedCostUsd + adjustedExpenses;
  const maxPower = Math.max(resources.availablePowerW, resources.requiredPowerW, 1);
  const maxData = Math.max(resources.plannedScienceDataRateMbps, resources.requiredDownlinkMbps, resources.downlinkMbps, 0.1);
  const canPreflight = resources.remainingBudgetUsd !== null && resources.remainingBudgetUsd >= 0;

  return (
    <section className="feature-panel resource-dashboard">
      <p className="eyebrow">STEP 3 · LAUNCH</p>
      <h2>Check your supplies</h2>
      <p>Make sure your ship has enough money, power, and room for its science data.</p>
      <div className={"resource-flow-cta" + (canPreflight ? "" : " is-over-budget")}><span><strong>{canPreflight ? "SUPPLIES LOOK GOOD" : "MISSION OVER ALLOCATION"}</strong><small>{canPreflight ? "Your design fits the mission funds. Continue to the final check." : "Reduce the shortfall by changing spacecraft, instruments, launch vehicle, or mission costs."}</small></span><Button onClick={() => onNavigate(canPreflight ? "mission-review" : "spacecraft-designer")}>{canPreflight ? "NEXT: FINAL CHECK" : "REDESIGN SPACECRAFT"}</Button></div>

      <div className="resource-metrics-grid">
        {resources.metrics.map((metric) => <ResourceCard key={metric.id} metric={metric} funding={funding} estimatedSpend={estimatedSpend} />)}
      </div>

      <div className="resource-main-grid">
        <Card title="Mission budget" subtitle="The estimate uses your chosen ship, tools, and rocket">
          <div className="resource-budget-inputs">
            <div className="resource-funding-allocation"><small>ALLOCATED MISSION FUNDS</small><strong>{funding === null ? 'Not allocated' : currency.format(funding)}</strong><span>Same allocation for solo pilots and teams</span></div>
            <label>Other mission costs ($)<input type="number" min="0" step="10000" value={expenses ?? 0} onChange={(event) => dispatch({ type: 'UPDATE_RESOURCE_PLAN', payload: { missionExpensesUsd: Math.max(0, Number(event.target.value) || 0) } })} /></label>
          </div>
          <div className="resource-budget-summary"><span>Selected system + instrument cost<strong>{currency.format(resources.estimatedHardwareCostUsd)}</strong></span><span>Launch estimate<strong>{currency.format(resources.totalEstimatedCostUsd - resources.estimatedHardwareCostUsd)}</strong></span><span>Mission + decision expenses<strong>{expenses === null ? 'Not entered' : currency.format(adjustedExpenses)}</strong></span><span>Estimated spend<strong>{currency.format(estimatedSpend)}</strong></span><span>Remaining funding<strong>{resources.remainingBudgetUsd === null ? 'Enter both values' : currency.format(resources.remainingBudgetUsd)}</strong></span></div>
          <div className="resource-chart" aria-label="Mission budget composition">
            <span>Budget composition</span>
            <div className="budget-chart-bar"><i style={{ width: `${funding && funding > 0 ? Math.min(100, resources.estimatedHardwareCostUsd / funding * 100) : 0}%` }} /><i style={{ width: `${funding && funding > 0 ? Math.min(100, Math.max(0, resources.totalEstimatedCostUsd - resources.estimatedHardwareCostUsd) / funding * 100) : 0}%` }} /><i style={{ width: `${funding && funding > 0 ? Math.min(100, (expenses ?? 0) / funding * 100) : 0}%` }} /></div>
            <small><b>Hardware</b><b>Launch</b><b>Expenses</b>{funding ? <b>Funding {currency.format(funding)}</b> : <b>Funding not entered</b>}</small>
          </div>
        </Card>

        <Card title="Power &amp; data" subtitle="Your ship needs power and a way to send science home">
          <div className="resource-chart-pair">
            <div className="resource-chart"><span>Power in / power used</span><div className="resource-chart-lines"><label>Power made<strong>{resources.availablePowerW} W</strong></label><div><i className="chart-available" style={{ width: `${resources.availablePowerW / maxPower * 100}%` }} /></div><label>Power needed<strong>{resources.requiredPowerW} W</strong></label><div><i className="chart-required" style={{ width: `${resources.requiredPowerW / maxPower * 100}%` }} /></div></div></div>
            <div className="resource-chart"><span>Science made / sent home</span><div className="resource-chart-lines"><label>Science data<strong>{resources.rawScienceDataRateMbps.toFixed(1)} Mbps</strong></label><div><i className="chart-required" style={{ width: `${resources.plannedScienceDataRateMbps / maxData * 100}%` }} /></div><label>Radio capacity<strong>{resources.downlinkMbps.toFixed(2)} Mbps</strong></label><div><i className="chart-available" style={{ width: `${resources.downlinkMbps / maxData * 100}%` }} /></div></div></div>
          </div>
          <details className="resource-more-details"><summary>More ship details</summary><p>{resources.spacecraftMassKg.toLocaleString()} kg ship weight · {(resources.availablePowerW - resources.requiredPowerW).toLocaleString()} W spare power · {resources.estimatedMissionDataGb.toFixed(1)} GB estimated science data.</p></details>
        </Card>
      </div>

      <Card title={resources.warnings.length ? `Needs a tweak · ${resources.warnings.length}` : 'All supplies look good'}>
        {resources.warnings.length ? <div className="resource-warning-list">{resources.warnings.map((warning) => <article key={warning.id} className={`resource-warning severity-${warning.severity}`}><div className="resource-warning-title"><strong>{warning.title}</strong><span>{warning.severity === 'critical' ? 'FIX THIS' : 'CHECK THIS'}</span></div><p>{warning.what}</p><details><summary>Why? How do I fix it?</summary><p>{warning.why}</p><p><b>Try this:</b> {warning.recommendation}</p></details></article>)}</div> : <div className="resource-no-warnings"><strong>Ready to go!</strong><p>Your ship passes the supply checks.</p></div>}
      </Card>

      <details className="resource-more-details"><summary>How do these estimates work?</summary><ul className="resource-assumptions">{RESOURCE_MODEL_ASSUMPTIONS.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></details>
    </section>
  );
}
