import type { DbmsChapter, DbmsUnit, DifficultyLevel } from '../data/dbmsCurriculumTypes';

export const DBMS_CURRICULUM_ID = 'dbms_starter';

export interface UnitProgressSummary {
  unitNumber: 1 | 2 | 3 | 4;
  title: string;
  totalCount: number;
  completedCount: number;
  percentage: number;
  totalMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
}

export interface OverallCurriculumProgress {
  totalCount: number;
  completedCount: number;
  percentage: number;
  totalMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  unitBreakdown: UnitProgressSummary[];
}

export type CurriculumCompletionFilter = 'all' | 'completed' | 'pending';

export interface FilteredCurriculumUnit {
  unit: DbmsUnit;
  matchingChapters: DbmsChapter[];
}

export function normalizeCompletedTopicIds(
  completedTopicIds: string[],
  validTopicIds?: Set<string>
): string[] {
  const seen = new Set<string>();
  for (const id of completedTopicIds) {
    if (typeof id === 'string' && id.trim().length > 0) {
      if (!validTopicIds || validTopicIds.has(id)) {
        seen.add(id);
      }
    }
  }
  return Array.from(seen).sort();
}

export function toggleTopicIdInList(
  completedTopicIds: string[],
  topicId: string,
  validTopicIds?: Set<string>
): string[] {
  const normalized = new Set(normalizeCompletedTopicIds(completedTopicIds, validTopicIds));
  if (normalized.has(topicId)) {
    normalized.delete(topicId);
  } else if (!validTopicIds || validTopicIds.has(topicId)) {
    normalized.add(topicId);
  }
  return Array.from(normalized).sort();
}

export function computeUnitProgress(
  unit: DbmsUnit,
  completedTopicIds: string[]
): UnitProgressSummary {
  const completedSet = new Set(completedTopicIds);
  const totalCount = unit.chapters.length;
  let completedCount = 0;
  let totalMinutes = 0;
  let completedMinutes = 0;

  for (const ch of unit.chapters) {
    totalMinutes += ch.estimatedMinutes;
    if (completedSet.has(ch.id)) {
      completedCount += 1;
      completedMinutes += ch.estimatedMinutes;
    }
  }

  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const remainingMinutes = Math.max(0, totalMinutes - completedMinutes);

  return {
    unitNumber: unit.unitNumber,
    title: unit.title,
    totalCount,
    completedCount,
    percentage,
    totalMinutes,
    completedMinutes,
    remainingMinutes,
  };
}

export function computeOverallCurriculumProgress(
  units: DbmsUnit[],
  completedTopicIds: string[]
): OverallCurriculumProgress {
  const unitBreakdown = units.map((unit) => computeUnitProgress(unit, completedTopicIds));
  const totalCount = unitBreakdown.reduce((sum, u) => sum + u.totalCount, 0);
  const completedCount = unitBreakdown.reduce((sum, u) => sum + u.completedCount, 0);
  const totalMinutes = unitBreakdown.reduce((sum, u) => sum + u.totalMinutes, 0);
  const completedMinutes = unitBreakdown.reduce((sum, u) => sum + u.completedMinutes, 0);
  const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    totalCount,
    completedCount,
    percentage,
    totalMinutes,
    completedMinutes,
    remainingMinutes: Math.max(0, totalMinutes - completedMinutes),
    unitBreakdown,
  };
}

export function filterCurriculumUnits(
  units: DbmsUnit[],
  options: {
    query?: string;
    difficulty?: DifficultyLevel | 'all';
    status?: CurriculumCompletionFilter;
    completedTopicIds?: string[];
  }
): FilteredCurriculumUnit[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const difficulty = options.difficulty ?? 'all';
  const status = options.status ?? 'all';
  const completedSet = new Set(options.completedTopicIds ?? []);

  return units.map((unit) => {
    const matchingChapters = unit.chapters.filter((ch) => {
      if (difficulty !== 'all' && ch.difficulty !== difficulty) {
        return false;
      }
      const isDone = completedSet.has(ch.id);
      if (status === 'completed' && !isDone) {
        return false;
      }
      if (status === 'pending' && isDone) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        ch.code,
        ch.title,
        ch.simpleExplanation,
        ch.detailedExplanation,
        ch.realWorldExample,
        ch.codeOrDiagram,
        ...ch.learningObjectives,
        ...ch.definitions.map((d) => `${d.term} ${d.definition}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    return {
      unit,
      matchingChapters,
    };
  });
}

export function getAdjacentCurriculumTopics(
  units: DbmsUnit[],
  currentTopicId: string
): { prevTopic: DbmsChapter | null; nextTopic: DbmsChapter | null } {
  const flat = units.flatMap((u) => u.chapters);
  const index = flat.findIndex((c) => c.id === currentTopicId);
  if (index === -1) {
    return { prevTopic: null, nextTopic: flat[0] ?? null };
  }
  return {
    prevTopic: index > 0 ? flat[index - 1] : null,
    nextTopic: index < flat.length - 1 ? flat[index + 1] : null,
  };
}
