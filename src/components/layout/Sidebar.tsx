import type { ReactNode } from 'react';

interface NavItem { id: string; label: string; description: string; }
interface SidebarProps { navItems: NavItem[]; activeItemId: string; onNavigate: (id: string) => void; stage: string; }

function NavigationIcon({ id }: { id: string }) {
  const iconPaths: Record<string, ReactNode> = {
    welcome: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" />,
    academy: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" /><path d="M4 17a2.5 2.5 0 0 1 2.5-2.5H20M8 7h8m-8 3h7" /></>,
    'mission-stories': <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /><circle cx="12" cy="12" r="1" /></>,
    'spacecraft-explorer': <><path d="M12 2c3.8 3.1 5.5 6.3 5.5 10.5L12 21l-5.5-8.5C6.5 8.3 8.2 5.1 12 2Z" /><circle cx="12" cy="9" r="1.8" /><path d="m7 13-3 1v4l5-2m8-3 3 1v4l-5-2" /></>,
    'player-setup': <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8" /></>,
    achievements: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v4m-4 3h8m-7-3h6" /></>,
    'mission-history': <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2M4 5v4h4" /><path d="M4 9a9 9 0 0 1 15.5-3" /></>,
    instruments: <><path d="m14 4 6 6M6 20l9-9m-5-5 7 7M4 4l5 5m-6 11h8" /><circle cx="16.5" cy="7.5" r="2.5" /></>,
    'mission-control': <><path d="M4 19a8 8 0 1 1 16 0M12 11l4-3m-4 11v-1" /><path d="M4 20h16" /></>,
    'mission-review': <><path d="M7 3h10l3 3v15H4V3h3Z" /><path d="M8 11h8m-8 4h5m-5-8h5" /><path d="m14 17 2 2 4-4" /></>,
    'mission-events': <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
  };
  return <svg className="sidebar-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[id] ?? <><circle cx="12" cy="12" r="8" /><path d="M12 8v8m-4-4h8" /></>}</svg>;
}

const missionSteps = [
  { label: 'Plan', route: 'mission-design', stages: ['mission-design'] },
  { label: 'Build', route: 'spacecraft-designer', stages: ['spacecraft-designer', 'instruments'] },
  { label: 'Launch', route: 'launch-configuration', stages: ['launch-configuration', 'mission-control', 'mission-review'] },
  { label: 'Fly', route: 'mission-simulation', stages: ['mission-simulation', 'mission-events'] },
  { label: 'Results', route: 'mission-evaluation', stages: ['mission-evaluation'] },
];

export function Sidebar({ navItems, activeItemId, onNavigate, stage }: SidebarProps) {
  const stageIndex = missionSteps.findIndex((step) => step.stages.includes(stage));
  const home = navItems.find((item) => item.id === 'welcome');
  const helperItems = navItems.filter((item) => ['instruments', 'mission-control', 'mission-review', 'mission-events'].includes(item.id));
  const utilityItems = navItems.filter((item) => ['academy', 'mission-stories', 'spacecraft-explorer', 'achievements', 'mission-history', 'player-setup'].includes(item.id));

  return <aside className="sidebar">
    <button type="button" className="sidebar-brand" onClick={() => onNavigate('welcome')}>
      <span className="brand-mark brand-mark-image" aria-hidden="true"><img src="/beyond-earth-logo.png" alt="" /></span><span><small>SPACE ADVENTURE</small><strong>BEYOND EARTH</strong></span>
    </button>
    <div className="sidebar-campaign"><span className="sidebar-orbit" aria-hidden="true">◉</span><span><small>YOUR MISSION</small><strong>{stageIndex < 0 ? 'READY TO PLAY' : `STEP ${stageIndex + 1} OF ${missionSteps.length}`}</strong></span><i /></div>
    <nav aria-label="Mission navigation" className="sidebar-nav">
      {home ? <button type="button" className={`nav-item${activeItemId === 'welcome' ? ' active' : ''}`} onClick={() => onNavigate('welcome')}><span className="nav-item-icon" aria-hidden="true"><NavigationIcon id="welcome" /></span><span className="nav-item-label"><strong>Home</strong></span></button> : null}
      <p className="nav-section-label">QUICK LINKS</p>
      <details className="sidebar-extras" open={helperItems.some((item) => item.id === activeItemId)}>
        <summary>FLIGHT TOOLS <span>+</span></summary><div>{helperItems.map((item) => <button key={item.id} type="button" className={`nav-item${item.id === activeItemId ? ' active' : ''}`} onClick={() => onNavigate(item.id)}><span className="nav-item-icon" aria-hidden="true"><NavigationIcon id={item.id} /></span><span className="nav-item-label"><strong>{item.label}</strong></span></button>)}</div>
      </details>
      <details className="sidebar-extras" open={utilityItems.some((item) => item.id === activeItemId)}>
        <summary>EXPLORE &amp; LEARN <span>+</span></summary><div>{utilityItems.map((item) => <button key={item.id} type="button" className={`nav-item${item.id === activeItemId ? ' active' : ''}`} onClick={() => onNavigate(item.id)}><span className="nav-item-icon" aria-hidden="true"><NavigationIcon id={item.id} /></span><span className="nav-item-label"><strong>{item.label}</strong></span></button>)}</div>
      </details>
    </nav>
    <div className="sidebar-footer"><span className="sidebar-online" /><span>GAME SAVED ON THIS DEVICE</span></div>
  </aside>;
}
