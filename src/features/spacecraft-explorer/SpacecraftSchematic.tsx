import type { KeyboardEvent, ReactNode } from 'react';
import { spacecraftSystems, type SpacecraftComponent } from '../../data/spacecraft';
import type { SpacecraftRendererProps } from './rendererTypes';

interface ComponentTargetProps {
  component: SpacecraftComponent;
  selectedComponentId: string | null;
  highlightedComponentIds: readonly string[];
  onSelectComponent: (componentId: string) => void;
  children: ReactNode;
  className?: string;
}

function ComponentTarget({
  component,
  selectedComponentId,
  highlightedComponentIds,
  onSelectComponent,
  children,
  className = '',
}: ComponentTargetProps) {
  const isSelected = selectedComponentId === component.id;
  const isHighlighted = highlightedComponentIds.includes(component.id);
  const color = spacecraftSystems.find((system) => system.id === component.category)?.color;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectComponent(component.id);
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Select ${component.name}, ${component.category} system`}
      aria-pressed={isSelected}
      className={`schematic-component-target${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''} ${className}`.trim()}
      style={{ color }}
      onClick={() => onSelectComponent(component.id)}
      onKeyDown={handleKeyDown}
    >
      <title>{component.name}: {component.purpose}</title>
      {children}
    </g>
  );
}

export function SpacecraftSchematic({
  components,
  selectedComponentId,
  highlightedComponentIds,
  zoom,
  onSelectComponent,
}: SpacecraftRendererProps) {
  const componentById = new Map(components.map((component) => [component.id, component]));
  const getComponent = (componentId: string) => componentById.get(componentId);
  const selectedComponent = selectedComponentId ? getComponent(selectedComponentId) : null;

  return (
    <div className="spacecraft-schematic-frame" aria-label="Interactive spacecraft exterior schematic">
      <div className="schematic-corner-label">VEHICLE EXTERIOR / SCHEMATIC</div>
      <svg
        className="spacecraft-schematic"
        viewBox="0 0 980 560"
        role="group"
        aria-label="Click spacecraft components to explore their function"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          <pattern id="schematic-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(145, 190, 210, 0.08)" strokeWidth="1" />
          </pattern>
          <linearGradient id="bus-surface" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#dce8e7" />
            <stop offset="0.5" stopColor="#879da4" />
            <stop offset="1" stopColor="#405762" />
          </linearGradient>
          <linearGradient id="solar-cell" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#30618a" />
            <stop offset="1" stopColor="#142d49" />
          </linearGradient>
          <marker id="schematic-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#75dbe0" />
          </marker>
        </defs>

        <rect width="980" height="560" fill="url(#schematic-grid)" />
        <path className="schematic-orbit" d="M89 374 C190 67 770 47 888 311 C968 488 725 519 477 489 C258 462 26 514 89 374Z" />
        <text className="schematic-coordinate" x="36" y="42">FIG 01 / DEEP SPACE OBSERVATORY</text>
        <text className="schematic-coordinate" x="36" y="524">SYSTEMS VIEW AVAILABLE</text>
        <text className="schematic-coordinate schematic-coordinate-right" x="944" y="524" textAnchor="end">SELECT A COMPONENT</text>

        <g className="spacecraft-art">
          <path className="schematic-axis" d="M117 281 H863 M490 83 V458" />
          <path className="solar-support" d="M363 269 L398 278 M582 278 L616 269" />

          <ComponentTarget {...{ component: getComponent('solar-panels')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part solar-array-left">
            <rect className="part-frame" x="86" y="211" width="274" height="126" rx="4" />
            <rect className="solar-cell-grid" x="96" y="220" width="254" height="108" />
            <path className="solar-grid-lines" d="M146 220V328 M197 220V328 M248 220V328 M299 220V328 M96 256H350 M96 292H350" />
            <circle className="part-anchor" cx="222" cy="274" r="7" />
            <text className="part-label" x="96" y="202">SOLAR ARRAY / PORT</text>
          </ComponentTarget>
          <ComponentTarget {...{ component: getComponent('solar-panels')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part solar-array-right">
            <rect className="part-frame" x="620" y="211" width="274" height="126" rx="4" />
            <rect className="solar-cell-grid" x="630" y="220" width="254" height="108" />
            <path className="solar-grid-lines" d="M680 220V328 M731 220V328 M782 220V328 M833 220V328 M630 256H884 M630 292H884" />
            <circle className="part-anchor" cx="757" cy="274" r="7" />
            <text className="part-label" x="630" y="202">SOLAR ARRAY / STARBOARD</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('thermal-insulation')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part thermal-blanket">
            <path className="insulation-outline" d="M408 186 L560 186 L588 221 L588 337 L558 376 L411 376 L384 337 L384 221Z" />
            <path className="insulation-seams" d="M408 186L418 209 M560 186L550 209 M588 221L565 230 M588 337L564 326 M558 376L546 351 M411 376L421 351 M384 337L407 326 M384 221L407 230" />
            <circle className="part-anchor" cx="405" cy="202" r="6" />
            <text className="part-label" x="395" y="169">THERMAL BLANKET</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('spacecraft-bus')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part bus-shell">
            <path className="bus-polygon" d="M422 213 L546 213 L564 237 L564 321 L544 346 L424 346 L404 321 L404 237Z" />
            <path className="bus-panel-lines" d="M422 213V346 M546 213V346 M404 237H564 M404 321H564" />
            <circle className="bus-port" cx="484" cy="280" r="29" />
            <circle className="bus-port-inner" cx="484" cy="280" r="16" />
            <text className="bus-label" x="484" y="365" textAnchor="middle">SPACECRAFT BUS</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('structural-frame')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part structural-frame">
            <path className="frame-line" d="M394 229L574 330 M574 229L394 330 M484 202V354 M394 280H574" />
            <circle className="part-anchor" cx="394" cy="229" r="5" />
            <text className="part-label" x="352" y="360">LOAD FRAME</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('high-gain-antenna')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part high-gain-antenna">
            <path className="antenna-arm" d="M547 224 L649 153" />
            <path className="dish-outline" d="M631 119 Q682 110 710 145 Q683 176 641 171Z" />
            <path className="dish-ribs" d="M642 123L663 167 M657 119L674 170 M674 119L684 163 M630 145L705 145" />
            <circle className="part-anchor" cx="682" cy="145" r="7" />
            <text className="part-label" x="717" y="145">HIGH-GAIN</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('low-gain-antenna')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part low-gain-antenna">
            <path className="antenna-arm" d="M492 213L515 133" />
            <path className="antenna-whip" d="M515 133L492 99 M515 133L538 99 M515 133V91" />
            <circle className="part-anchor" cx="515" cy="132" r="6" />
            <text className="part-label" x="533" y="105">LOW-GAIN</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('communication-transceiver')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part comm-box">
            <rect className="equipment-box" x="557" y="224" width="39" height="32" rx="3" />
            <path className="equipment-detail" d="M565 234H588 M565 241H584 M565 248H578" />
            <circle className="part-anchor" cx="596" cy="224" r="5" />
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('propellant-tank')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part propellant-tank">
            <ellipse className="tank-shell" cx="498" cy="399" rx="31" ry="20" />
            <path className="tank-band" d="M470 399H526 M480 384V414 M516 384V414" />
            <circle className="part-anchor" cx="523" cy="391" r="6" />
            <text className="part-label" x="529" y="407">PROPELLANT</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('thrusters')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part thrusters">
            <path className="thruster-body" d="M535 339L562 358L554 384L535 380Z M421 339L394 358L402 384L421 380Z" />
            <path className="thruster-flare" d="M548 381L557 403L535 385 M408 381L399 403L421 385" />
            <circle className="part-anchor" cx="557" cy="366" r="6" />
            <text className="part-label" x="577" y="383">THRUSTERS</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('radiators')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part radiators">
            <rect className="radiator-panel" x="380" y="259" width="19" height="57" rx="2" />
            <path className="radiator-lines" d="M385 267H394 M385 277H394 M385 287H394 M385 297H394 M385 307H394" />
            <rect className="radiator-panel" x="569" y="259" width="19" height="57" rx="2" />
            <path className="radiator-lines" d="M574 267H583 M574 277H583 M574 287H583 M574 297H583 M574 307H583" />
            <circle className="part-anchor" cx="579" cy="258" r="6" />
            <text className="part-label" x="592" y="270">RADIATORS</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('camera')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part camera-head">
            <path className="instrument-mount" d="M405 235H378" />
            <rect className="instrument-case" x="350" y="221" width="28" height="27" rx="4" />
            <circle className="instrument-lens" cx="360" cy="234" r="6" />
            <circle className="part-anchor" cx="350" cy="221" r="5" />
            <text className="part-label" x="302" y="214">CAMERA</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('spectrometer')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part spectrometer">
            <path className="instrument-mount" d="M405 270H376" />
            <rect className="instrument-case" x="351" y="258" width="25" height="24" rx="3" />
            <path className="instrument-detail" d="M357 265H370 M357 271H370 M357 277H370" />
            <circle className="part-anchor" cx="350" cy="270" r="5" />
            <text className="part-label" x="290" y="272">SPECTROMETER</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('radar')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part radar">
            <path className="instrument-mount" d="M405 307H376" />
            <path className="radar-dish" d="M350 296Q365 307 350 318 M356 296Q371 307 356 318 M362 307H376" />
            <circle className="part-anchor" cx="350" cy="296" r="5" />
            <text className="part-label" x="304" y="330">RADAR</text>
          </ComponentTarget>

          <ComponentTarget {...{ component: getComponent('environmental-sensors')!, selectedComponentId, highlightedComponentIds, onSelectComponent }} className="schematic-part environmental-sensor">
            <path className="sensor-stem" d="M550 213V194" />
            <circle className="sensor-dome" cx="550" cy="188" r="10" />
            <path className="sensor-wave" d="M535 178Q550 165 565 178 M539 183Q550 174 561 183" />
            <circle className="part-anchor" cx="560" cy="185" r="5" />
            <text className="part-label" x="574" y="186">ENV SENSORS</text>
          </ComponentTarget>
        </g>

        {selectedComponent ? (
          <g className="schematic-selection-readout" aria-hidden="true">
            <rect x="691" y="451" width="242" height="43" rx="2" />
            <text x="705" y="468">SELECTED COMPONENT</text>
            <text className="selection-name" x="705" y="484">{selectedComponent.name.toUpperCase()}</text>
          </g>
        ) : null}
      </svg>
      <div className="schematic-legend">
        <span><i className="legend-dot legend-power" /> POWER</span>
        <span><i className="legend-dot legend-comm" /> COMMUNICATION</span>
        <span><i className="legend-dot legend-science" /> SCIENCE</span>
        <span><i className="legend-dot legend-thermal" /> THERMAL</span>
      </div>
    </div>
  );
}
