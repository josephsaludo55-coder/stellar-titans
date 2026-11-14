import { academyHighlights, missionStories } from '../data/welcome';
import type { MissionProgress } from '../types/game';

interface WelcomeScreenProps {
  onBeginMission: () => void;
  onLoadSavedMission: () => void;
  savedProgress: MissionProgress | null;
}

export function WelcomeScreen({
  onBeginMission,
  onLoadSavedMission,
  savedProgress,
}: WelcomeScreenProps) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MISSION CONTROL</p>
          <div className="brand-row">
            <span className="brand-mark">◆</span>
            <span className="brand-name">SPACE MISSION: BEYOND EARTH</span>
          </div>
        </div>
        <div className="status-pill">
          <span className="status-dot" aria-hidden="true" />
          SYSTEM READY
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow accent">MISSION ACADEMY</p>
          <h1>Design a mission. Balance the mission. Launch responsibly.</h1>
          <p className="lead">
            Learn how mission planners balance spacecraft systems, power, budgets, instruments,
            and launch conditions before a mission leaves Earth.
          </p>

          <div className="cta-row">
            <button type="button" className="primary-button" onClick={onBeginMission}>
              Begin Mission Academy
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onLoadSavedMission}
              disabled={!savedProgress}
            >
              {savedProgress ? 'Continue Saved Mission' : 'No Saved Mission'}
            </button>
          </div>

          <div className="meta-row" aria-label="Mission learning goals">
            <span>Spacecraft systems</span>
            <span>Mission planning</span>
            <span>Resource tradeoffs</span>
          </div>
        </div>

        <div className="mission-visual" aria-label="Space mission concept art">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="planet" />
          <div className="spacecraft" aria-hidden="true">
            <div className="spacecraft-body" />
            <div className="solar-panel panel-left" />
            <div className="solar-panel panel-right" />
          </div>
          <div className="status-card">
            <span>Mission Profile</span>
            <strong>EDU-2045</strong>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="info-section">
          <div className="section-header">
            <p className="eyebrow">WHAT YOU LEARN</p>
            <h2>Build real mission thinking.</h2>
          </div>

          <div className="highlights-grid">
            {academyHighlights.map((item) => (
              <article key={item.title} className="info-card">
                <span className="card-tag">{item.accent}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="story-panel">
          <div className="section-header compact">
            <p className="eyebrow">NASA MISSION STORIES</p>
            <h2>Design lessons from spaceflight.</h2>
          </div>

          <div className="story-list">
            {missionStories.map((story) => (
              <article key={story.title} className="story-card">
                <h3>{story.title}</h3>
                <p className="story-mission">{story.mission}</p>
                <p>{story.insight}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="academy-banner">
        <div>
          <p className="eyebrow">MISSION PREVIEW</p>
          <h2>From curiosity to command.</h2>
        </div>
        <p>
          You will plan a mission, choose a spacecraft, balance resources, and evaluate launch
          readiness using educational estimates rather than real engineering simulations.
        </p>
      </section>
    </main>
  );
}
