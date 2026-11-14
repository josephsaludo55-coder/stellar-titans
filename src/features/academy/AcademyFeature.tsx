import { useEffect, useRef, useState } from 'react';
import type { MissionStage } from '../../state/gameTypes';
import { academyChapters } from '../../data/academy';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { useGameState } from '../../hooks/useGameState';

interface AcademyFeatureProps {
  onNavigate: (stage: MissionStage) => void;
}

export function AcademyFeature({ onNavigate }: AcademyFeatureProps) {
  const { state, dispatch } = useGameState();
  const [activeChapterId, setActiveChapterId] = useState(academyChapters[0].id);
  const completedChapterIds = state.completedChapterIds;
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const chapterPanelRef = useRef<HTMLElement | null>(null);

  const activeChapterIndex = academyChapters.findIndex((chapter) => chapter.id === activeChapterId);
  const activeChapter = academyChapters[activeChapterIndex] ?? academyChapters[0];
  const activeImage = activeChapter.images[activeImageIndex] ?? activeChapter.images[0];
  const challengePassed = selectedAnswer === activeChapter.challenge.correctIndex;
  const completionPercent = Math.round((completedChapterIds.length / academyChapters.length) * 100);

  useEffect(() => {
    const panel = chapterPanelRef.current;
    const imageCount = activeChapter.images.length;
    if (!panel || !imageCount) return;
    const lessonPanels = Array.from(panel.querySelectorAll<HTMLElement>(
      '.academy-opening, .academy-objective, .academy-section:not(.academy-opening), .academy-outcome, .academy-challenge',
    ));
    lessonPanels.forEach((lessonPanel, index) => {
      lessonPanel.dataset.lessonImageIndex = String(index % imageCount);
    });
    const observer = new IntersectionObserver((entries) => {
      const currentPanel = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
      if (currentPanel) {
        const nextImage = Number((currentPanel.target as HTMLElement).dataset.lessonImageIndex);
        if (Number.isInteger(nextImage)) setActiveImageIndex(nextImage);
      }
    }, {
      root: window.matchMedia('(max-width: 760px)').matches ? null : panel,
      rootMargin: window.matchMedia('(max-width: 760px)').matches ? '-30% 0px -45% 0px' : '-48% 0px -25% 0px',
      threshold: [0.15, 0.35, 0.6],
    });
    lessonPanels.forEach((lessonPanel) => observer.observe(lessonPanel));
    return () => observer.disconnect();
  }, [activeChapter.id, activeChapter.images.length]);

  function selectChapter(chapterId: string) {
    setActiveChapterId(chapterId);
    setSelectedAnswer(null);
    setExpandedComponent(null);
    setActiveImageIndex(0);
  }

  function submitAnswer(answerIndex: number) {
    setSelectedAnswer(answerIndex);
    if (answerIndex === activeChapter.challenge.correctIndex) {
      dispatch({ type: 'COMPLETE_ACADEMY_CHAPTER', chapterId: activeChapter.id });
    }
  }

  function moveChapter(direction: -1 | 1) {
    const nextIndex = Math.min(Math.max(activeChapterIndex + direction, 0), academyChapters.length - 1);
    selectChapter(academyChapters[nextIndex].id);
  }

  return (
    <section className="academy-experience" aria-label="Mission Academy chapters">
      <header className="academy-overview">
        <div>
          <p className="eyebrow">Mission Academy / Field curriculum</p>
          <h2>Five missions. One design challenge.</h2>
          <p className="academy-deck">
            Study the systems and decisions behind historic missions, then use those lessons to shape a mission of your own.
          </p>
        </div>
        <div className="academy-progress-summary">
          <span className="academy-progress-count">{completedChapterIds.length}<small> / {academyChapters.length}</small></span>
          <span className="academy-progress-caption">CHAPTERS COMPLETE</span>
          <ProgressBar value={completionPercent} label="Academy progress" />
        </div>
      </header>

      <div className="academy-workspace">
        <aside className="academy-index" aria-label="Chapter index">
          <div className="academy-index-heading">
            <span>COURSE FILES</span>
            <span>{String(academyChapters.length).padStart(2, '0')}</span>
          </div>
          <nav className="academy-chapter-list" aria-label="Academy chapters">
            {academyChapters.map((chapter) => {
              const isActive = chapter.id === activeChapter.id;
              const isComplete = completedChapterIds.includes(chapter.id);

              return (
                <button
                  key={chapter.id}
                  type="button"
                  className={`academy-chapter-link${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => selectChapter(chapter.id)}
                >
                  <span className="academy-chapter-number">{String(chapter.number).padStart(2, '0')}</span>
                  <span className="academy-chapter-copy">
                    <strong>{chapter.title}</strong>
                    <small>{chapter.era}</small>
                  </span>
                  <span className="academy-chapter-state" aria-label={isComplete ? 'Completed' : 'Not completed'}>
                    {isComplete ? '✓' : '·'}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="academy-index-note">
            <span className="academy-live-dot" />
            <span>LEARNING PATH ACTIVE</span>
          </div>
        </aside>

        <article className="academy-chapter" key={activeChapter.id} ref={chapterPanelRef} aria-labelledby="academy-chapter-title">
          <header className="academy-chapter-header">
            <div className="academy-chapter-heading">
              <div className="academy-chapter-kicker">
                <span>CHAPTER {String(activeChapter.number).padStart(2, '0')}</span>
                <span className="academy-kicker-divider">/</span>
                <span>{activeChapter.era}</span>
                {activeChapter.isDesignBrief ? <span className="academy-brief-tag">DESIGN BRIEF</span> : null}
              </div>
              <h1 id="academy-chapter-title">{activeChapter.title}</h1>
              <p>{activeChapter.subtitle}</p>
            </div>
            <div className="academy-destination">
              {activeImage ? <figure className="academy-header-photo">
                <div className="academy-header-photo-frame"><img src={activeImage.src} alt={activeImage.alt} />
                  {activeChapter.images.length > 1 ? <div className="academy-header-photo-controls">
                    <button type="button" aria-label="Previous mission photo" onClick={() => setActiveImageIndex((index) => (index - 1 + activeChapter.images.length) % activeChapter.images.length)}>‹</button>
                    <span>{String(activeImageIndex + 1).padStart(2, '0')} / {String(activeChapter.images.length).padStart(2, '0')}</span>
                    <button type="button" aria-label="Next mission photo" onClick={() => setActiveImageIndex((index) => (index + 1) % activeChapter.images.length)}>›</button>
                  </div> : null}
                </div>
                <figcaption><span>{activeImage.caption}</span><a href={activeImage.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open photo source">↗</a></figcaption>
              </figure> : null}
              <div className="academy-destination-label"><span>DESTINATION</span><strong>{activeChapter.destination}</strong></div>
            </div>
          </header>

          <div className="academy-chapter-body">
            <section className="academy-section academy-opening" aria-labelledby="academy-background-heading">
              <div className="academy-section-label">
                <span>01</span>
                <h2 id="academy-background-heading">{activeChapter.isDesignBrief ? 'The assignment' : 'Historical background'}</h2>
              </div>
              <p>{activeChapter.historicalBackground}</p>
            </section>

            <section className="academy-objective" aria-labelledby="academy-objective-heading">
              <div className="academy-objective-marker">MISSION OBJECTIVE</div>
              <p id="academy-objective-heading">{activeChapter.missionObjective}</p>
              <div className={`academy-orbit-animation${activeChapter.destination.toLowerCase().includes('mars') ? ' planet-mars' : ''}`} aria-hidden="true">
                <span className="academy-orbit-ring" />
                <span className="academy-orbit-planet" />
                <svg className="academy-orbit-craft" viewBox="0 0 48 38"><path d="m19 14 10 0 5 5v8l-5 5H19l-5-5v-8z" fill="#eaf5ff" stroke="#8deaff" strokeWidth="1.5"/><path d="M14 20H3v8h11m20-8h11v8H34" fill="#3384c2" stroke="#a8eaff" strokeWidth="1.5"/><circle cx="24" cy="23" r="3" fill="#5acfff"/><path d="m21 32-3 5 6-2 6 2-3-5" fill="#ffbc73"/></svg>
              </div>
            </section>

            <details className="academy-explore-details">
              <summary><span>Explore mission details</span><i aria-hidden="true">+</i></summary>
            <section className="academy-section" aria-labelledby="academy-images-heading">
              <div className="academy-section-label">
                <span>02</span>
                <h2 id="academy-images-heading">Image archive</h2>
              </div>
              <div className="academy-image-gallery">
                {activeChapter.images.map((image, index) => (
                  <figure className="academy-image-card" key={image.src}>
                    <button type="button" className={`academy-image-button${activeImageIndex === index ? ' is-active' : ''}`} onClick={() => setActiveImageIndex(index)} aria-label={`Show image: ${image.alt}`} aria-pressed={activeImageIndex === index}>
                      <img src={image.src} alt={image.alt} loading="lazy" />
                      <span className="academy-image-open">VIEW IMAGE <span aria-hidden="true">↗</span></span>
                    </button>
                    <figcaption>
                      <span>{image.caption}</span>
                      <a href={image.sourceUrl} target="_blank" rel="noreferrer">SOURCE</a>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>

            <section className="academy-section" aria-labelledby="academy-timeline-heading">
              <div className="academy-section-label">
                <span>03</span>
                <h2 id="academy-timeline-heading">Mission timeline</h2>
              </div>
              <ol className="academy-timeline">
                {activeChapter.timeline.map((item) => (
                  <li key={`${item.date}-${item.event}`}>
                    <time>{item.date}</time>
                    <p>{item.event}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="academy-section" aria-labelledby="academy-architecture-heading">
              <div className="academy-section-label">
                <span>04</span>
                <h2 id="academy-architecture-heading">Spacecraft architecture</h2>
              </div>
              <p className="academy-section-intro">{activeChapter.architecture}</p>
              <div className="academy-detail-grid">
                {activeChapter.components.map((component, index) => {
                  const componentId = `${activeChapter.id}-component-${index}`;
                  const isExpanded = expandedComponent === componentId;

                  return (
                    <article className={`academy-detail-item${isExpanded ? ' is-expanded' : ''}`} key={component.name}>
                      <span className="academy-detail-index">COMPONENT {String(index + 1).padStart(2, '0')}</span>
                      <button
                        type="button"
                        className="academy-component-trigger"
                        aria-expanded={isExpanded}
                        aria-controls={`${componentId}-explanation`}
                        onClick={() => setExpandedComponent(isExpanded ? null : componentId)}
                      >
                        <span>{component.name}</span>
                        <span aria-hidden="true">{isExpanded ? '−' : '+'}</span>
                      </button>
                      {isExpanded ? <p id={`${componentId}-explanation`}>{component.explanation}</p> : null}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="academy-section" aria-labelledby="academy-instruments-heading">
              <div className="academy-section-label">
                <span>05</span>
                <h2 id="academy-instruments-heading">Scientific instruments</h2>
              </div>
              <div className="academy-instrument-list">
                {activeChapter.instruments.map((instrument) => (
                  <article className="academy-instrument" key={instrument.name}>
                    <span className="academy-instrument-mark" aria-hidden="true">+</span>
                    <div><h3>{instrument.name}</h3><p>{instrument.explanation}</p></div>
                  </article>
                ))}
              </div>
            </section>

            <div className="academy-outcome-grid">
              <section className="academy-outcome" aria-labelledby="academy-achievements-heading">
                <div className="academy-section-label">
                  <span>06</span>
                  <h2 id="academy-achievements-heading">{activeChapter.isDesignBrief ? 'Design outcomes' : 'Scientific achievements'}</h2>
                </div>
                <ul>{activeChapter.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}</ul>
              </section>
              <section className="academy-outcome academy-lessons" aria-labelledby="academy-lessons-heading">
                <div className="academy-section-label">
                  <span>07</span>
                  <h2 id="academy-lessons-heading">Engineering lessons</h2>
                </div>
                <ul>{activeChapter.engineeringLessons.map((lesson) => <li key={lesson}>{lesson}</li>)}</ul>
              </section>
            </div>
            </details>

            <section className="academy-challenge" aria-labelledby="academy-challenge-heading">
              <div className="academy-challenge-header">
                <div>
                  <p className="eyebrow">Knowledge check / one question</p>
                  <h2 id="academy-challenge-heading">Lock in the lesson</h2>
                </div>
                <span className="academy-challenge-mark">Q{String(activeChapter.number).padStart(2, '0')}</span>
              </div>
              <p className="academy-question">{activeChapter.challenge.question}</p>
              <div className="academy-answer-list">
                {activeChapter.challenge.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === activeChapter.challenge.correctIndex;
                  const answerState = isSelected ? (isCorrectAnswer ? ' is-correct' : ' is-incorrect') : '';

                  return (
                    <button
                      key={option}
                      type="button"
                      className={`academy-answer${answerState}`}
                      aria-pressed={isSelected}
                      onClick={() => submitAnswer(index)}
                    >
                      <span className="academy-answer-letter">{String.fromCharCode(65 + index)}</span>
                      <span>{option}</span>
                      {isSelected ? <span className="academy-answer-result" aria-hidden="true">{isCorrectAnswer ? '✓' : '×'}</span> : null}
                    </button>
                  );
                })}
              </div>
              {selectedAnswer !== null ? (
                <p className={`academy-feedback${challengePassed ? ' is-correct' : ' is-incorrect'}`} role="status" aria-live="polite">
                  <strong>{challengePassed ? 'CHAPTER COMPLETE' : 'REVIEW AND TRY AGAIN'}</strong>
                  <span>{challengePassed ? activeChapter.challenge.correctFeedback : activeChapter.challenge.incorrectFeedback}</span>
                </p>
              ) : null}
            </section>

            <footer className="academy-chapter-footer">
              <div className="academy-sources">
                <span>PRIMARY SOURCES</span>
                <div>{activeChapter.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a>)}</div>
              </div>
              <div className="academy-chapter-controls">
                <Button variant="secondary" disabled={activeChapterIndex === 0} onClick={() => moveChapter(-1)}>← PREVIOUS</Button>
                {activeChapter.isDesignBrief ? (
                  <Button onClick={() => onNavigate('mission-design')}>OPEN MISSION DESIGN STUDIO <span aria-hidden="true">↗</span></Button>
                ) : (
                  <Button onClick={() => moveChapter(1)}>NEXT CHAPTER <span aria-hidden="true">→</span></Button>
                )}
              </div>
            </footer>
          </div>
        </article>
      </div>

    </section>
  );
}
