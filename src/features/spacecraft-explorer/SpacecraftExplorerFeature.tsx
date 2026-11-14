import { useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { spacecraftChallenges, spacecraftComponents, spacecraftSystems } from '../../data/spacecraft';
import type { SpacecraftSystem } from '../../data/spacecraft';
import { SpacecraftSchematic } from './SpacecraftSchematic';
import { SpacecraftSystemMap } from './SpacecraftSystemMap';
import type { SpacecraftExplorerView } from './rendererTypes';

const DEFAULT_COMPONENT_ID = 'solar-panels';

export function SpacecraftExplorerFeature() {
  const [view, setView] = useState<SpacecraftExplorerView>('exterior');
  const [selectedComponentId, setSelectedComponentId] = useState<string>(DEFAULT_COMPONENT_ID);
  const [zoom, setZoom] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<SpacecraftSystem | 'all'>('all');
  const [search, setSearch] = useState('');
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [challengeScore, setChallengeScore] = useState(0);

  const selectedComponent = spacecraftComponents.find((component) => component.id === selectedComponentId) ?? spacecraftComponents[0];
  const selectedSystem = spacecraftSystems.find((system) => system.id === selectedComponent.category);
  const connectedComponents = useMemo(() => {
    const connectedIds = new Set([
      ...selectedComponent.relationships,
      ...spacecraftComponents.filter((component) => component.relationships.includes(selectedComponent.id)).map((component) => component.id),
    ]);
    return spacecraftComponents.filter((component) => connectedIds.has(component.id));
  }, [selectedComponent]);
  const highlightedComponentIds = connectedComponents.map((component) => component.id);
  const activeChallenge = spacecraftChallenges[challengeIndex];
  const isCorrectAnswer = selectedAnswer === activeChallenge.correctIndex;
  const visibleComponents = spacecraftComponents.filter((component) => {
    const matchesCategory = categoryFilter === 'all' || component.category === categoryFilter;
    const searchValue = `${component.name} ${component.description} ${component.category}`.toLowerCase();
    return matchesCategory && searchValue.includes(search.trim().toLowerCase());
  });
  const selectedComponentIndex = spacecraftComponents.findIndex((component) => component.id === selectedComponentId);

  function navigateComponent(direction: -1 | 1) {
    const nextIndex = (selectedComponentIndex + direction + spacecraftComponents.length) % spacecraftComponents.length;
    setSelectedComponentId(spacecraftComponents[nextIndex].id);
  }

  function chooseView(nextView: SpacecraftExplorerView) {
    setView(nextView);
    setZoom(1);
  }

  function chooseChallengeAnswer(answerIndex: number) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    if (answerIndex === activeChallenge.correctIndex) {
      setChallengeScore((score) => score + 1);
    }
  }

  function nextChallenge() {
    setChallengeIndex((index) => (index + 1) % spacecraftChallenges.length);
    setSelectedAnswer(null);
  }

  return (
    <section className="feature-panel spacecraft-explorer-feature">
      <header className="explorer-intro">
        <div>
          <p className="eyebrow">Spacecraft lab / Systems explorer</p>
          <h2>One vehicle. Many connected systems.</h2>
          <p>Inspect spacecraft hardware, follow system relationships, and learn how engineering choices affect mission operations.</p>
        </div>
        <div className="explorer-component-count"><strong>{spacecraftComponents.length}</strong><span>COMPONENTS<br />IN THE SCHEMATIC</span></div>
      </header>

      <div className="explorer-toolbar">
        <div className="explorer-view-switch" role="group" aria-label="Spacecraft view">
          <button type="button" className={view === 'exterior' ? 'explorer-view-button is-active' : 'explorer-view-button'} aria-pressed={view === 'exterior'} onClick={() => chooseView('exterior')}>
            <span className="view-symbol" aria-hidden="true">◉</span> EXTERIOR
          </button>
          <button type="button" className={view === 'systems' ? 'explorer-view-button is-active' : 'explorer-view-button'} aria-pressed={view === 'systems'} onClick={() => chooseView('systems')}>
            <span className="view-symbol" aria-hidden="true">⌘</span> SYSTEM VIEW
          </button>
        </div>
        <div className="explorer-zoom-controls" aria-label="Schematic zoom controls">
          <span>ZOOM</span>
          <Button variant="secondary" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 0.75} onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))}>−</Button>
          <output>{Math.round(zoom * 100)}%</output>
          <Button variant="secondary" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 1.4} onClick={() => setZoom((value) => Math.min(1.4, Number((value + 0.1).toFixed(2))))}>+</Button>
          <Button variant="ghost" onClick={() => setZoom(1)}>RESET</Button>
        </div>
      </div>

      <div className="spacecraft-explorer-grid">
        <div className="explorer-visual-column">
          <div className="explorer-viewer-shell">
            {view === 'exterior' ? (
              <SpacecraftSchematic
                components={spacecraftComponents}
                selectedComponentId={selectedComponentId}
                highlightedComponentIds={highlightedComponentIds}
                zoom={zoom}
                onSelectComponent={setSelectedComponentId}
              />
            ) : (
              <SpacecraftSystemMap
                components={spacecraftComponents}
                selectedComponentId={selectedComponentId}
                highlightedComponentIds={highlightedComponentIds}
                zoom={zoom}
                onSelectComponent={setSelectedComponentId}
              />
            )}
          </div>

          <section className="component-index" aria-labelledby="component-index-title">
            <div className="component-index-header">
              <div><p className="eyebrow">Component directory</p><h3 id="component-index-title">Select any subsystem</h3></div>
              <span>{visibleComponents.length} / {spacecraftComponents.length}</span>
            </div>
            <div className="component-index-controls">
              <label className="component-search-label">
                <span className="visually-hidden">Search components</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search components" />
              </label>
              <label className="component-filter-label">
                <span className="visually-hidden">Filter by system</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as SpacecraftSystem | 'all')}>
                  <option value="all">All systems</option>
                  {spacecraftSystems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
                </select>
              </label>
            </div>
            <div className="component-index-list">
              {visibleComponents.map((component) => {
                const system = spacecraftSystems.find((item) => item.id === component.category);
                return (
                  <button
                    type="button"
                    key={component.id}
                    className={selectedComponentId === component.id ? 'component-index-item is-active' : 'component-index-item'}
                    aria-current={selectedComponentId === component.id ? 'true' : undefined}
                    onClick={() => setSelectedComponentId(component.id)}
                  >
                    <span style={{ color: system?.color }} aria-hidden="true">●</span>
                    <span>{component.name}</span>
                    <small>{system?.name}</small>
                  </button>
                );
              })}
              {visibleComponents.length === 0 ? <p className="component-empty-state">No components match that search.</p> : null}
            </div>
          </section>
        </div>

        <aside className="component-information-panel" aria-labelledby="selected-component-name">
          <div className="component-panel-topline">
            <span className="component-panel-index">COMPONENT {String(selectedComponentIndex + 1).padStart(2, '0')} / {String(spacecraftComponents.length).padStart(2, '0')}</span>
            <span className="component-category-tag" style={{ color: selectedSystem?.color, borderColor: `${selectedSystem?.color}55` }}>{selectedSystem?.name.toUpperCase()}</span>
          </div>
          <h3 id="selected-component-name">{selectedComponent.name}</h3>
          <p className="component-description">{selectedComponent.description}</p>

          <div className="component-navigation" aria-label="Component navigation">
            <Button variant="secondary" aria-label="Previous component" onClick={() => navigateComponent(-1)}>← PREVIOUS</Button>
            <span>{selectedComponentIndex + 1} of {spacecraftComponents.length}</span>
            <Button variant="secondary" aria-label="Next component" onClick={() => navigateComponent(1)}>NEXT →</Button>
          </div>

          <div className="component-learning-fields" key={selectedComponent.id}>
            <details open><summary>PURPOSE</summary><p>{selectedComponent.purpose}</p></details>
            <details><summary>HOW IT WORKS</summary><p>{selectedComponent.howItWorks}</p></details>
            <details><summary>WHY IT MATTERS</summary><p>{selectedComponent.importance}</p></details>
            <details><summary>ENGINEERING CONSIDERATIONS</summary><p>{selectedComponent.engineeringConsiderations}</p></details>
            <section className="component-relationships">
              <span>RELATIONSHIP WITH OTHER SYSTEMS</span>
              <p>{selectedSystem?.name} system connects with:</p>
              <div>{connectedComponents.map((component) => <button type="button" key={component.id} onClick={() => setSelectedComponentId(component.id)}>{component.name}<span aria-hidden="true"> ↗</span></button>)}</div>
            </section>
          </div>
        </aside>
      </div>

      <details className="spacecraft-challenge-drawer">
        <summary>
          <strong>Optional quick quiz</strong>
          <span>{challengeScore} / {spacecraftChallenges.length} correct</span>
          <i aria-hidden="true">+</i>
        </summary>
      <section className="spacecraft-challenge" aria-labelledby="spacecraft-challenge-title">
        <div className="spacecraft-challenge-heading">
          <div><p className="eyebrow">Mission systems / Knowledge check</p><h3 id="spacecraft-challenge-title">Trace the system</h3></div>
          <div className="challenge-progress"><strong>{challengeScore}</strong><span> / {spacecraftChallenges.length} CORRECT</span></div>
        </div>
        <p className="spacecraft-challenge-question">{activeChallenge.question}</p>
        <div className="spacecraft-challenge-options">
          {activeChallenge.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isRight = index === activeChallenge.correctIndex;
            const stateClass = isSelected ? (isRight ? ' is-correct' : ' is-incorrect') : '';
            return (
              <button type="button" key={option} className={`spacecraft-challenge-option${stateClass}`} aria-pressed={isSelected} disabled={selectedAnswer !== null} onClick={() => chooseChallengeAnswer(index)}>
                <span>{String.fromCharCode(65 + index)}</span>{option}
              </button>
            );
          })}
        </div>
        {selectedAnswer !== null ? (
          <div className={isCorrectAnswer ? 'spacecraft-challenge-feedback is-correct' : 'spacecraft-challenge-feedback is-incorrect'} role="status" aria-live="polite">
            <strong>{isCorrectAnswer ? 'CORRECT' : 'NOT QUITE'}</strong><span>{activeChallenge.explanation}</span>
          </div>
        ) : null}
        <div className="spacecraft-challenge-footer">
          <span>CHALLENGE {String(challengeIndex + 1).padStart(2, '0')} / {String(spacecraftChallenges.length).padStart(2, '0')}</span>
          <Button variant="secondary" onClick={nextChallenge}>NEXT CHALLENGE →</Button>
        </div>
      </section>
      </details>
    </section>
  );
}
