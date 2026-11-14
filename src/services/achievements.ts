import { academyChapters } from '../data/academy';
import type { AchievementRecord, MissionEvaluationRecord } from '../state/gameTypes';

export function createChapterAchievements(completedChapterIds: string[], earnedAt: string): AchievementRecord[] {
  if (completedChapterIds.length < academyChapters.length || !academyChapters.every((chapter) => completedChapterIds.includes(chapter.id))) return [];
  return [{ id: 'academy-complete', title: 'Academy Graduate', description: 'Completed every Mission Academy chapter.', earnedAt, evidence: `${academyChapters.length} of ${academyChapters.length} chapters completed.` }];
}

export function createMissionAchievements(evaluation: MissionEvaluationRecord, earnedAt: string): AchievementRecord[] {
  const achievements: AchievementRecord[] = [{
    id: 'mission-report', title: 'Mission Analyst', description: 'Completed a mission simulation and generated a scored report.', earnedAt,
    evidence: `${evaluation.missionName}: ${evaluation.overallScore}/100 (${evaluation.rating}).`,
  }];
  if (evaluation.overallScore >= 90) achievements.push({
    id: 'outstanding-mission', title: 'Outstanding Mission', description: 'Earned an Outstanding Mission rating.', earnedAt,
    evidence: `${evaluation.overallScore}/100 on ${evaluation.missionName}.`,
  });
  if (evaluation.objectiveCompletion.total > 0 && evaluation.objectiveCompletion.completed === evaluation.objectiveCompletion.total) achievements.push({
    id: 'full-objective-coverage', title: 'Science Complete', description: 'Returned instrument-supported evidence for every configured objective.', earnedAt,
    evidence: `${evaluation.objectiveCompletion.completed} of ${evaluation.objectiveCompletion.total} objectives supported.`,
  });
  if (evaluation.successfulDecisions.length > 0) achievements.push({
    id: 'engineering-decisions', title: 'Systems Thinker', description: 'Made an engineering response with a measurable contribution to mission results.', earnedAt,
    evidence: evaluation.successfulDecisions[0],
  });
  return achievements;
}

export function mergeAchievementRecords(current: AchievementRecord[], incoming: AchievementRecord[]): AchievementRecord[] {
  const seen = new Set(current.map((record) => record.id));
  return [...current, ...incoming.filter((record) => !seen.has(record.id))];
}
