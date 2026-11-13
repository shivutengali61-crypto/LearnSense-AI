export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TopicDefinition {
  term: string;
  definition: string;
}

export interface TopicPracticeQuestion {
  id: string;
  difficulty: DifficultyLevel;
  prompt: string;
  hint: string;
  answer: string;
}

export interface DifficultyTierNotes {
  beginner: string;
  intermediate: string;
  advanced: string;
}

export interface DbmsChapter {
  id: string;
  unitNumber: 1 | 2 | 3 | 4;
  code: string;
  title: string;
  estimatedMinutes: number;
  difficulty: DifficultyLevel;
  simpleExplanation: string;
  detailedExplanation: string;
  summaryEn: string;
  summaryKn: string;
  realWorldExample: string;
  definitions: TopicDefinition[];
  learningObjectives: string[];
  difficultyLevels: DifficultyTierNotes;
  keyTakeaways: string[];
  codeOrDiagramTitle: string;
  codeOrDiagram: string;
  relatedConceptIds: string[];
  practiceQuestions: TopicPracticeQuestion[];
  practicePrompt: string;
}

export interface DbmsUnit {
  unitNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  attributionLabel: 'Starter Curriculum';
  noticeText: string;
  overviewEn: string;
  overviewKn: string;
  chapters: DbmsChapter[];
}

export const DBMS_CURRICULUM_LABEL = 'Starter Curriculum' as const;
export const DBMS_CURRICULUM_NOTICE =
  'Comprehensive Starter DBMS Curriculum (Pending Official Syllabus Verification)';
