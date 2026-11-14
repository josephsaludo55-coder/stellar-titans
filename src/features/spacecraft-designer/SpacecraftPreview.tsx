import type { SpacecraftDesignCategory, SpacecraftDesignComponent } from '../../data/spacecraftDesigner';

interface SpacecraftPreviewProps {
  components: SpacecraftDesignComponent[];
  activeCategory: SpacecraftDesignCategory | null;
}

const categoryColors: Record<SpacecraftDesignCategory, string> = {
  structure: '#d2dde0',
  power: '#f0be65',
  batteries: '#dfc179',
  propulsion: '#ff967b',
  communication: '#71dce5',
  'thermal-control': '#ffb478',
  'flight-computer': '#a5b5ff',
  'data-storage': '#d3a7f2',
};

export function SpacecraftPreview({ components, activeCategory }: SpacecraftPreviewProps) {
  const selectedCategories = new Set(components.map((component) => component.category));
  const isActive = (category: SpacecraftDesignCategory) => activeCategory === category;
  const isInstalled = (category: SpacecraftDesignCategory) => selectedCategories.has(category);

  function systemClass(category: SpacecraftDesignCategory) {
    return `preview-system${isInstalled(category) ? ' is-installed' : ''}${isActive(category) ? ' is-active' : ''}`;
  }

  return (
    <div className="designer-preview-frame">
      <div className="designer-preview-label"><span>LIVE VEHICLE PREVIEW</span><span>CONCEPT / NOT TO SCALE</span></div>
      <svg className="designer-spacecraft-preview" viewBox="0 0 640 360" role="img" aria-label="Spacecraft preview highlighting installed system categories">
        <defs>
          <pattern id="preview-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(145, 190, 210, 0.06)" strokeWidth="1" />
          </pattern>
          <linearGradient id="preview-bus" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#bdcfd1" />
            <stop offset="0.5" stopColor="#637a83" />
            <stop offset="1" stopColor="#253c49" />
          </linearGradient>
        </defs>
        <rect width="640" height="360" fill="url(#preview-grid)" />
        <ellipse className="preview-orbit" cx="320" cy="187" rx="268" ry="130" transform="rotate(-8 320 187)" />
        <path className="preview-axis" d="M48 181H592 M320 45V322" />

        <g className={systemClass('power')} style={{ color: categoryColors.power }}>
          <path className="preview-support" d="M252 163L203 149 M388 163L437 149" />
          <rect className="preview-solar-panel" x="66" y="114" width="138" height="72" rx="3" />
          <rect className="preview-solar-panel" x="436" y="114" width="138" height="72" rx="3" />
          <path className="preview-solar-lines" d="M100 114V186 M135 114V186 M169 114V186 M66 150H204 M470 114V186 M505 114V186 M539 114V186 M436 150H574" />
          <circle className="preview-indicator" cx="80" cy="101" r="5" />
          <text x="88" y="104">POWER</text>
        </g>

        <g className={systemClass('structure')} style={{ color: categoryColors.structure }}>
          <path className="preview-bus" d="M260 132L370 132L398 160L398 219L370 248L260 248L232 219L232 160Z" />
          <path className="preview-frame" d="M232 160L398 219 M398 160L232 219 M315 132V248 M232 189H398" />
          <circle className="preview-core" cx="315" cy="190" r="22" />
          <circle className="preview-core-inner" cx="315" cy="190" r="10" />
          <text className="preview-bus-label" x="315" y="270" textAnchor="middle">SPACECRAFT BUS</text>
          <circle className="preview-indicator" cx="251" cy="128" r="5" />
          <text x="260" y="131">STRUCTURE</text>
        </g>

        <g className={systemClass('communication')} style={{ color: categoryColors.communication }}>
          <path className="preview-antenna-arm" d="M355 139L419 83" />
          <path className="preview-dish" d="M404 62Q438 63 449 88Q428 111 401 101Z" />
          <path className="preview-dish-lines" d="M409 65L431 104 M423 64L440 94 M402 82H446" />
          <circle className="preview-indicator" cx="460" cy="69" r="5" />
          <text x="469" y="72">COMM</text>
        </g>

        <g className={systemClass('propulsion')} style={{ color: categoryColors.propulsion }}>
          <ellipse className="preview-tank" cx="315" cy="278" rx="24" ry="14" />
          <path className="preview-thruster" d="M267 242L246 260L254 280L270 274Z M363 242L384 260L376 280L360 274Z" />
          <path className="preview-flame" d="M251 279L245 297L264 280 M379 279L385 297L366 280" />
          <circle className="preview-indicator" cx="391" cy="278" r="5" />
          <text x="400" y="281">PROPULSION</text>
        </g>

        <g className={systemClass('thermal-control')} style={{ color: categoryColors['thermal-control'] }}>
          <rect className="preview-radiator" x="218" y="165" width="12" height="48" />
          <rect className="preview-radiator" x="400" y="165" width="12" height="48" />
          <path className="preview-radiator-lines" d="M220 174H228 M220 184H228 M220 194H228 M220 204H228 M402 174H410 M402 184H410 M402 194H410 M402 204H410" />
          <circle className="preview-indicator" cx="432" cy="210" r="5" />
          <text x="441" y="213">THERMAL</text>
        </g>

        <g className={`${systemClass('batteries')} ${systemClass('flight-computer')} ${systemClass('data-storage')}`}>
          <rect className="preview-equipment" x="279" y="157" width="20" height="18" rx="2" />
          <rect className="preview-equipment" x="305" y="157" width="20" height="18" rx="2" />
          <rect className="preview-equipment" x="331" y="157" width="20" height="18" rx="2" />
          <path className="preview-equipment-lines" d="M283 163H295 M309 163H321 M335 163H347" />
        </g>
        <text className="preview-standby-note" x="320" y="333" textAnchor="middle">Unselected systems appear subdued</text>
      </svg>
      <div className="designer-preview-legend">
        <span><i style={{ backgroundColor: categoryColors.structure }} /> Installed</span>
        <span><i className="preview-legend-idle" /> Available</span>
        <span><i className="preview-legend-focus" /> Selected system</span>
      </div>
    </div>
  );
}
