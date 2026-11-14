import type { KeyboardEvent } from 'react';
import { spacecraftSystems, type SpacecraftComponent } from '../../data/spacecraft';
import type { SpacecraftRendererProps } from './rendererTypes';

const NODE_WIDTH = 230;
const NODE_HEIGHT = 54;

export function SpacecraftSystemMap({
  components,
  selectedComponentId,
  highlightedComponentIds,
  zoom,
  onSelectComponent,
}: SpacecraftRendererProps) {
  const componentById = new Map(components.map((component) => [component.id, component]));
  const relationships = components.flatMap((component) =>
    component.relationships
      .filter((targetId) => componentById.has(targetId))
      .map((targetId) => ({ source: component, target: componentById.get(targetId)! })),
  );

  function handleKeyDown(event: KeyboardEvent<SVGGElement>, componentId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectComponent(componentId);
    }
  }

  return (
    <div className="spacecraft-system-map-frame" aria-label="Interactive spacecraft system relationship map">
      <div className="system-map-caption">
        <span>SPACECRAFT SYSTEMS / FUNCTIONAL RELATIONSHIPS</span>
        <span>SELECT A NODE TO INSPECT</span>
      </div>
      <svg className="spacecraft-system-map" viewBox="0 0 980 800" role="group" aria-label="Spacecraft component relationship diagram" style={{ transform: `scale(${zoom})` }}>
        <defs>
          <pattern id="system-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(145, 190, 210, 0.06)" strokeWidth="1" />
          </pattern>
          <marker id="system-map-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#75dbe0" />
          </marker>
        </defs>
        <rect width="980" height="800" fill="url(#system-map-grid)" />
        <path className="system-map-column-rule" d="M327 53V770 M653 53V770" />
        <text className="system-map-column-label" x="35" y="39">POWER / STRUCTURE / DATA</text>
        <text className="system-map-column-label" x="370" y="39">COMMS / PROPULSION / COMPUTING</text>
        <text className="system-map-column-label" x="705" y="39">SCIENCE / THERMAL</text>

        <g className="system-map-connections" aria-hidden="true">
          {relationships.map(({ source, target }) => (
            <line
              key={`${source.id}-${target.id}`}
              x1={source.systemPoint.x}
              y1={source.systemPoint.y}
              x2={target.systemPoint.x}
              y2={target.systemPoint.y}
              markerEnd="url(#system-map-arrow)"
              className={selectedComponentId === source.id || selectedComponentId === target.id ? 'is-related' : ''}
            />
          ))}
        </g>

        {components.map((component) => {
          const system = spacecraftSystems.find((item) => item.id === component.category);
          const isSelected = selectedComponentId === component.id;
          const isHighlighted = highlightedComponentIds.includes(component.id);
          const x = component.systemPoint.x - NODE_WIDTH / 2;
          const y = component.systemPoint.y - NODE_HEIGHT / 2;

          return (
            <g
              key={component.id}
              role="button"
              tabIndex={0}
              aria-label={`Select ${component.name}, ${system?.name} system`}
              aria-pressed={isSelected}
              className={`system-map-node${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''}`}
              style={{ color: system?.color }}
              onClick={() => onSelectComponent(component.id)}
              onKeyDown={(event) => handleKeyDown(event, component.id)}
            >
              <title>{component.name}: {component.purpose}</title>
              <rect x={x} y={y} width={NODE_WIDTH} height={NODE_HEIGHT} rx="3" />
              <circle cx={x + 17} cy={component.systemPoint.y} r="4" />
              <text className="system-node-category" x={x + 30} y={y + 19}>{system?.name.toUpperCase()}</text>
              <text className="system-node-name" x={x + 30} y={y + 39}>{component.name}</text>
            </g>
          );
        })}
      </svg>
      <p className="system-map-footnote">Arrows show functional dependencies and data or resource flow. Links are instructional, not a wiring-level engineering drawing.</p>
    </div>
  );
}
