import { Card } from '../../components/common/Card';

export function MissionStoriesFeature() {
  return (
    <section className="feature-panel">
      <p className="eyebrow">Historical inspiration</p>
      <h2>Mission stories and aerospace context</h2>
      <p>
        This module anchors the game in human spaceflight history by connecting educational lessons to
        proven mission achievements, engineering constraints, and exploration milestones.
      </p>

      <div className="feature-grid">
        <Card title="Apollo 11" subtitle="Precision and teamwork">
          <ul className="feature-list">
            <li>Landing sequence discipline</li>
            <li>Navigation and communication timing</li>
            <li>Guided decision-making under uncertainty</li>
          </ul>
        </Card>

        <Card title="Juno" subtitle="Orbital science">
          <ul className="feature-list">
            <li>Trajectory planning at extreme environments</li>
            <li>Radiation-aware spacecraft design</li>
            <li>Long-duration scientific observation</li>
          </ul>
        </Card>

        <Card title="Mars rovers" subtitle="Autonomous exploration">
          <ul className="feature-list">
            <li>Surface navigation and mobility planning</li>
            <li>Resource-limited engineering</li>
            <li>Discovery-led mission operations</li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
