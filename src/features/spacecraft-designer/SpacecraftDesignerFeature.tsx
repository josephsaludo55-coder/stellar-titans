import { useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { SpacecraftAssemblyScene } from '../../components/game/SpacecraftAssemblyScene';
import { MissionBudgetStatus } from '../../components/game/MissionBudgetStatus';
import { spacecraftDesignCatalog, spacecraftDesignCategories, type SpacecraftDesignCategory } from '../../data/spacecraftDesigner';
import { instrumentCatalog } from '../../data/instruments';
import { useGameState } from '../../hooks/useGameState';
import { calculateMissionResources } from '../../services/calculations/missionResources';
import { validateSpacecraftSelection } from '../../services/calculations/spacecraftDesign';
import type { MissionStage } from '../../state/gameTypes';

const categoryIcons: Record<SpacecraftDesignCategory, string> = { structure: '⬡', power: '☀', batteries: '▣', propulsion: '✦', communication: '⌁', 'thermal-control': '◌', 'flight-computer': '⌘', 'data-storage': '▤' };
const required: SpacecraftDesignCategory[] = ['structure', 'power', 'propulsion', 'communication', 'flight-computer', 'data-storage'];

export function SpacecraftDesignerFeature({ onNavigate }: { onNavigate: (stage: MissionStage) => void }) {
  const { state, dispatch } = useGameState();
  const [activeCategory, setActiveCategory] = useState<SpacecraftDesignCategory>('structure');
  const mission = state.missionConfiguration;
  const destination = mission?.destination ?? 'moon';
  const architecture = mission?.architecture ?? 'lander';
  const resources = useMemo(() => calculateMissionResources(state), [state]);
  const selected = spacecraftDesignCatalog.filter((part) => state.selectedSpacecraftComponentIds.includes(part.id));
  const activeParts = spacecraftDesignCatalog.filter((part) => part.category === activeCategory && (!mission?.destination || part.compatibleDestinations.includes(destination)) && (!mission?.architecture || part.compatibleArchitectures.includes(architecture)));
  const selectedCategories = new Set(selected.map((part) => part.category));
  const selectionCheck = validateSpacecraftSelection(state.selectedSpacecraftComponentIds, mission);
  const instruments = instrumentCatalog.filter((instrument) => state.selectedInstrumentIds.includes(instrument.id));
  const installedSlots = selectedCategories.size;

  function install(id: string) {
    const item = spacecraftDesignCatalog.find((part) => part.id === id);
    if (!item) return;
    const isInstalled = state.selectedSpacecraftComponentIds.includes(id);
    const next = isInstalled
      ? state.selectedSpacecraftComponentIds.filter((componentId) => componentId !== id)
      : [...state.selectedSpacecraftComponentIds.filter((componentId) => spacecraftDesignCatalog.find((part) => part.id === componentId)?.category !== item.category), id];
    dispatch({ type: 'SET_SPACECRAFT_COMPONENTS', componentIds: next });
  }

  function autoFitShip() {
    const fitsMission = (part: (typeof spacecraftDesignCatalog)[number]) => part.compatibleDestinations.includes(destination) && part.compatibleArchitectures.includes(architecture);
    const fitted = required.map((category) => {
      const options = spacecraftDesignCatalog.filter((part) => part.category === category && fitsMission(part));
      const current = options.find((part) => state.selectedSpacecraftComponentIds.includes(part.id));
      if (category === 'power') return [...options].sort((a, b) => b.powerGenerationW - a.powerGenerationW)[0];
      if (category === 'communication') return [...options].sort((a, b) => (b.downlinkMbps ?? 0) - (a.downlinkMbps ?? 0))[0];
      if (category === 'data-storage') return [...options].sort((a, b) => (b.dataStorageGb ?? 0) - (a.dataStorageGb ?? 0))[0];
      return current ?? options[0];
    }).filter((part): part is (typeof spacecraftDesignCatalog)[number] => Boolean(part));
    dispatch({ type: 'SET_SPACECRAFT_COMPONENTS', componentIds: fitted.map((part) => part.id) });
  }

  return <section className="spacecraft-game feature-panel">
    <header className="spacecraft-game-heading"><div><p className="eyebrow">WORKSHOP · BUILD YOUR SHIP</p><h2>{mission?.destination === 'mars' ? 'Mars' : 'Lunar'} {mission?.architecture ?? 'lander'} build</h2></div><div className="spacecraft-heading-status"><MissionBudgetStatus /><span className="build-count"><strong>{installedSlots}</strong><small>/ 6 SYSTEMS</small></span></div></header>
    <div className="spacecraft-workbench">
      <div className="spacecraft-visual-column"><SpacecraftAssemblyScene destination={destination} architecture={architecture} installed={selected.map((part) => part.category)} mass={resources.spacecraftMassKg} />
        <div className="build-readouts"><div><span>MASS</span><strong>{resources.spacecraftMassKg.toLocaleString()} <small>kg</small></strong></div><div><span>POWER</span><strong>{resources.availablePowerW.toLocaleString()} <small>W</small></strong></div><div><span>COST</span><strong>${Math.round(resources.estimatedHardwareCostUsd / 1000000 * 10) / 10}<small>M</small></strong></div></div>
        <div className="installed-part-chips">{required.map((category) => <span key={category} className={selectedCategories.has(category) ? 'slot-filled' : 'slot-empty'}><i>{categoryIcons[category]}</i>{spacecraftDesignCategories.find((item) => item.id === category)?.name}<b>{selectedCategories.has(category) ? '✓' : '·'}</b></span>)}</div>
      </div>
      <div className="spacecraft-shop"><div className="game-section-title"><span>PARTS BAY</span><small>CHOOSE ONE PER SLOT</small></div>
        <div className="parts-category-tabs" role="tablist" aria-label="Spacecraft part types">{spacecraftDesignCategories.map((category) => <button type="button" role="tab" aria-selected={activeCategory === category.id} className={activeCategory === category.id ? 'is-active' : ''} key={category.id} onClick={() => setActiveCategory(category.id)}><i>{categoryIcons[category.id]}</i><span>{category.name}</span>{selectedCategories.has(category.id) ? <b>✓</b> : null}</button>)}</div>
        <div className="parts-selection-grid">{activeParts.map((part) => {
          const equipped = state.selectedSpacecraftComponentIds.includes(part.id);
          const slotUsed = selected.some((selectedPart) => selectedPart.category === part.category && selectedPart.id !== part.id);
          return <button type="button" className={`part-card ${equipped ? 'is-equipped' : ''}`} key={part.id} aria-pressed={equipped} onClick={() => install(part.id)}><span className="part-card-icon">{categoryIcons[part.category]}</span><span className="part-card-copy"><strong>{part.name}</strong><small>{part.massKg} kg · {part.powerGenerationW ? `+${part.powerGenerationW} W` : `${part.powerConsumptionW} W`} · ${(part.estimatedCostUsd / 1000).toFixed(0)}k</small></span><span className="part-add-mark">{equipped ? '✓' : slotUsed ? '↻' : '+'}</span></button>;
        })}</div>
        <div className="part-slot-hint">{activeParts.length ? 'Tap to install. Tap again to remove; a part replaces the same system slot.' : 'No compatible parts for this build.'}</div>
      </div>
    </div>
    <footer className="workbench-footer"><div className={`build-warning ${selectionCheck.issues.length ? 'has-warning' : ''}`}><span>{selectionCheck.issues.length ? '!' : installedSlots >= required.length ? '✓' : '✦'}</span>{selectionCheck.issues[0] ?? `${Math.max(0, required.length - installedSlots)} ship parts left`}</div><Button variant="secondary" onClick={autoFitShip}>AUTO-FIT SHIP ✦</Button><Button variant="secondary" onClick={() => onNavigate('instruments')}>SCIENCE TOOLS <span aria-hidden="true">→</span>{instruments.length ? ` · ${instruments.length}` : ''}</Button><Button disabled={selectionCheck.issues.length > 0 || required.some((category) => !selectedCategories.has(category))} onClick={() => onNavigate('instruments')}>NEXT: SCIENCE <span aria-hidden="true">→</span></Button></footer>
  </section>;
}
