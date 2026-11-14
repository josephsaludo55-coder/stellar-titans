import { useGameState } from '../../hooks/useGameState';

export function AchievementsFeature() {
  const { state } = useGameState();
  const records = state.achievementRecords;
  return (
    <section className="achievement-board feature-panel">
      <header className="achievement-board-heading"><div><p className="eyebrow">Career progress</p><h2>Mission awards</h2></div><div className="award-count"><strong>{records.length}</strong><span>UNLOCKED</span></div></header>
      {records.length ? <div className="award-grid">{records.map((record) => <article className="award-card" key={record.id}><span className="award-emblem" aria-hidden="true">✦</span><div><small>AWARD UNLOCKED</small><h3>{record.title}</h3><p>{record.description}</p><strong>{record.evidence}</strong><time>{new Date(record.earnedAt).toLocaleDateString()}</time></div></article>)}</div> : <div className="award-empty"><span aria-hidden="true">✧</span><h3>Your first award awaits.</h3><p>Complete academy chapters and missions to earn milestones. Each award is based on your recorded progress.</p></div>}
    </section>
  );
}
