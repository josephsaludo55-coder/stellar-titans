interface TopbarProps {
  title: string;
  subtitle: string;
  playerName: string;
  saveStatus: string;
}

export function Topbar({ title, subtitle, playerName, saveStatus }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Flight operations / {playerName}</p>
        <h2>{title}</h2>
      </div>

      <div className="topbar-meta">
        <span>{subtitle}</span>
        <span className="autosave-indicator" title="Mission configuration is stored in this browser"><i aria-hidden="true" />{saveStatus}</span>
      </div>
    </header>
  );
}
