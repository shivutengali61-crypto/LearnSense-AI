import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  Copy,
  FileQuestion,
  GraduationCap,
  HelpCircle,
  Languages,
  Layers,
  Lightbulb,
  Link2,
  Loader2,
  MessageSquarePlus,
  PlusCircle,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import {
  DBMS_CURRICULUM_LABEL,
  DBMS_CURRICULUM_NOTICE,
  DBMS_UNITS,
  findDbmsChapterById,
  findRelatedDbmsChapters,
  type DbmsChapter,
  type DbmsUnit,
  type DifficultyLevel,
} from '../data/dbmsCurriculum';
import {
  computeOverallCurriculumProgress,
  filterCurriculumUnits,
  getAdjacentCurriculumTopics,
  type CurriculumCompletionFilter,
} from '../utils/curriculumProgress';
import type { LanguageCode, Question, UserRole } from '../types/learnsense';

export interface SampleStudentProgressOption {
  uid: string;
  name: string;
  completedCount: number;
}

export interface CurriculumModuleProps {
  initialLanguage?: LanguageCode;
  completedTopicIds: string[];
  lastViewedTopicId?: string;
  onToggleTopicComplete: (topicId: string) => Promise<void> | void;
  onSelectTopic?: (topicId: string) => Promise<void> | void;
  togglingTopicId?: string | null;
  isDemoMode?: boolean;
  userRole?: UserRole;
  sampleStudents?: SampleStudentProgressOption[];
  selectedSampleStudentUid?: string;
  onSelectSampleStudentUid?: (uid: string) => void;
  onGenerateNotes?: (topicTitle: string, unitContext: string) => void;
  onAskTutor?: (topicTitle: string, promptContext: string) => void;
  onPublishUnitToCourse?: (unit: DbmsUnit) => Promise<void> | void;
  publishingUnitNumber?: number | null;
  publishStatusMessage?: string | null;
  onSaveGeneratedQuestion?: (subject: string, question: Question) => Promise<void> | void;
}

type ActiveAiAction = 'explain_en' | 'explain_kn' | 'examples' | 'quiz' | 'doubt' | null;

interface GeneratedNotesResponse {
  title: string;
  summaryEn: string;
  summaryKn?: string;
  keyPoints: string[];
  workedExample: string;
  commonPitfalls: string[];
  provider?: string;
}

const DIFFICULTY_STYLES: Record<
  DifficultyLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  beginner: {
    label: 'Beginner',
    badgeClass:
      'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  intermediate: {
    label: 'Intermediate',
    badgeClass:
      'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  advanced: {
    label: 'Advanced',
    badgeClass:
      'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
};

function renderInlineRichText(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#0B1F3A] dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-[#EAF1FB] dark:bg-[#13294B] px-1.5 py-0.5 font-mono text-[0.9em] text-[#0F294A] dark:text-sky-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

export const CurriculumModule: React.FC<CurriculumModuleProps> = ({
  initialLanguage = 'en',
  completedTopicIds,
  lastViewedTopicId,
  onToggleTopicComplete,
  onSelectTopic,
  togglingTopicId = null,
  isDemoMode = false,
  userRole,
  sampleStudents,
  selectedSampleStudentUid,
  onSelectSampleStudentUid,
  onGenerateNotes,
  onAskTutor,
  onPublishUnitToCourse,
  publishingUnitNumber = null,
  publishStatusMessage = null,
  onSaveGeneratedQuestion,
}) => {
  const initialTopic = useMemo(() => {
    if (lastViewedTopicId) {
      const found = findDbmsChapterById(lastViewedTopicId);
      if (found) return found;
    }
    return DBMS_UNITS[0].chapters[0];
  }, [lastViewedTopicId]);

  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopic.id);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>(() => ({
    1: initialTopic.unitNumber === 1,
    2: initialTopic.unitNumber === 2,
    3: initialTopic.unitNumber === 3,
    4: initialTopic.unitNumber === 4,
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CurriculumCompletionFilter>('all');

  const [activeTierTab, setActiveTierTab] = useState<DifficultyLevel>(initialTopic.difficulty);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  // Inline AI Assistant State (Real server routes, explicit 503 reporting)
  const [aiAction, setAiAction] = useState<ActiveAiAction>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiExplainResult, setAiExplainResult] = useState<{
    englishExplanation: string;
    kannadaExplanation?: string;
  } | null>(null);
  const [aiExamplesResult, setAiExamplesResult] = useState<GeneratedNotesResponse | null>(null);
  const [aiQuizQuestions, setAiQuizQuestions] = useState<Question[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [savedQuizIds, setSavedQuizIds] = useState<Record<string, boolean>>({});

  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [aiDoubtResult, setAiDoubtResult] = useState<{
    question: string;
    answerEn: string;
    answerKn?: string;
  } | null>(null);

  const detailHeadingRef = useRef<HTMLDivElement | null>(null);

  const activeTopic = useMemo<DbmsChapter>(
    () => findDbmsChapterById(selectedTopicId) ?? DBMS_UNITS[0].chapters[0],
    [selectedTopicId]
  );

  const activeUnit = useMemo<DbmsUnit>(
    () => DBMS_UNITS.find((u) => u.unitNumber === activeTopic.unitNumber) ?? DBMS_UNITS[0],
    [activeTopic.unitNumber]
  );

  const completedSet = useMemo(() => new Set(completedTopicIds), [completedTopicIds]);
  const isTopicCompleted = completedSet.has(activeTopic.id);

  const overallProgress = useMemo(
    () => computeOverallCurriculumProgress(DBMS_UNITS, completedTopicIds),
    [completedTopicIds]
  );

  const filteredUnits = useMemo(
    () =>
      filterCurriculumUnits(DBMS_UNITS, {
        query: searchQuery,
        difficulty: difficultyFilter,
        status: statusFilter,
        completedTopicIds,
      }),
    [searchQuery, difficultyFilter, statusFilter, completedTopicIds]
  );

  const totalMatchingTopics = useMemo(
    () => filteredUnits.reduce((acc, item) => acc + item.matchingChapters.length, 0),
    [filteredUnits]
  );

  const relatedTopics = useMemo(
    () => findRelatedDbmsChapters(activeTopic),
    [activeTopic]
  );

  const { prevTopic, nextTopic } = useMemo(
    () => getAdjacentCurriculumTopics(DBMS_UNITS, activeTopic.id),
    [activeTopic.id]
  );

  useEffect(() => {
    setActiveTierTab(activeTopic.difficulty);
    setAiAction(null);
    setAiError(null);
    setAiExplainResult(null);
    setAiExamplesResult(null);
    setAiQuizQuestions([]);
    setQuizAnswers({});
    setQuizChecked(false);
    setAiDoubtResult(null);
    setCopiedCode(false);
  }, [activeTopic.id, activeTopic.difficulty]);

  const handleSelectTopic = (chapter: DbmsChapter) => {
    setSelectedTopicId(chapter.id);
    setExpandedUnits((prev) => ({ ...prev, [chapter.unitNumber]: true }));
    onSelectTopic?.(chapter.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && detailHeadingRef.current) {
      detailHeadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleUnitAccordion = (unitNumber: 1 | 2 | 3 | 4) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitNumber]: !prev[unitNumber],
    }));
  };

  const buildTopicContext = (chapter: DbmsChapter, unit: DbmsUnit) =>
    [
      `${unit.title} — ${chapter.code} ${chapter.title} (${DIFFICULTY_STYLES[chapter.difficulty].label})`,
      `Simple Overview: ${chapter.simpleExplanation}`,
      `Detailed Explanation: ${chapter.detailedExplanation}`,
      `Real-World Example: ${chapter.realWorldExample}`,
      `Definitions:\n${chapter.definitions.map((d) => `- ${d.term}: ${d.definition}`).join('\n')}`,
      `Learning Objectives:\n${chapter.learningObjectives.map((o) => `- ${o}`).join('\n')}`,
      `Reference (${chapter.codeOrDiagramTitle}):\n${chapter.codeOrDiagram}`,
    ].join('\n\n');

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeTopic.codeOrDiagram);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const runAiExplain = async (targetLanguage: 'en' | 'kn') => {
    setAiAction(targetLanguage === 'kn' ? 'explain_kn' : 'explain_en');
    setAiLoading(true);
    setAiError(null);
    setAiExplainResult(null);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: `${activeTopic.code} ${activeTopic.title}`,
          materialContext: buildTopicContext(activeTopic, activeUnit),
          language: targetLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setAiExplainResult({
        englishExplanation: data.englishExplanation,
        kannadaExplanation: data.kannadaExplanation,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to fetch AI topic explanation.');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiExamples = async () => {
    setAiAction('examples');
    setAiLoading(true);
    setAiError(null);
    setAiExamplesResult(null);
    try {
      const res = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${activeTopic.title} — Additional Practical SQL & Worked Examples`,
          materialText: buildTopicContext(activeTopic, activeUnit),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setAiExamplesResult(data as GeneratedNotesResponse);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate worked examples.');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiQuiz = async () => {
    setAiAction('quiz');
    setAiLoading(true);
    setAiError(null);
    setAiQuizQuestions([]);
    setQuizAnswers({});
    setQuizChecked(false);
    try {
      const res = await fetch('/api/ai/gemini-generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialTitle: `${activeUnit.title} — ${activeTopic.title}`,
          materialText: buildTopicContext(activeTopic, activeUnit),
          concepts: [{ conceptId: activeTopic.id, conceptName: activeTopic.title }],
          count: 3,
          questionStyle: 'mcq',
          difficulty:
            activeTopic.difficulty === 'beginner'
              ? 'foundational'
              : activeTopic.difficulty === 'advanced'
                ? 'challenging'
                : 'intermediate',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setAiQuizQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate AI practice quiz.');
    } finally {
      setAiLoading(false);
    }
  };

  const runAiDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = doubtQuestion.trim();
    if (!cleanQ) {
      setAiError('Please type a specific DBMS question or doubt first.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiDoubtResult(null);
    try {
      const res = await fetch('/api/ai/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: cleanQ,
          materialTitle: `${activeTopic.code} ${activeTopic.title}`,
          materialContext: buildTopicContext(activeTopic, activeUnit),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setAiDoubtResult({
        question: cleanQ,
        answerEn: data.answerEn,
        answerKn: data.answerKn,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to answer doubt right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const hasActiveFilter =
    searchQuery.trim().length > 0 || difficultyFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Top Progress Overview & Controls */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                CS-304 · Database Management Systems · {DBMS_CURRICULUM_LABEL}
              </span>
              <span className="rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 text-[11px] font-semibold text-[#0B1F3A] dark:text-sky-200">
                {DBMS_CURRICULUM_NOTICE}
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold text-[#0B1F3A] dark:text-white">
              Complete 4-Unit DBMS Curriculum Engine (67 Topics)
            </h2>
            <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] max-w-3xl">
              Navigate all four DBMS units in the collapsible syllabus explorer, track per-student mastery completion, switch difficulty tiers, and run grounded AI explanations, examples, quizzes, and doubts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            <div className="inline-flex items-center rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                    : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kn')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  language === 'kn'
                    ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                    : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
                }`}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                English + ಕನ್ನಡ
              </button>
            </div>

            {onPublishUnitToCourse && (
              <button
                type="button"
                disabled={publishingUnitNumber === activeUnit.unitNumber}
                onClick={() => onPublishUnitToCourse(activeUnit)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {publishingUnitNumber === activeUnit.unitNumber
                  ? 'Publishing...'
                  : `Publish Unit ${activeUnit.unitNumber} to Course`}
              </button>
            )}
          </div>
        </div>

        {publishStatusMessage && (
          <div
            role="status"
            className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-4 py-2.5 text-xs font-medium text-[#0B1F3A] dark:text-sky-200"
          >
            {publishStatusMessage}
          </div>
        )}

        {/* Per-Student Sample Selector (Teacher/Admin Demo Mode) + Overall Progress Bar */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-center">
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#0B1F3A] dark:text-white">
                <GraduationCap className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                <span>
                  {isDemoMode
                    ? 'Curriculum Progress (Sample Data)'
                    : 'Your DBMS Learning Progress'}
                </span>
              </div>
              <div className="font-mono font-semibold text-[#0B1F3A] dark:text-sky-200 tabular-nums">
                {overallProgress.completedCount} / {overallProgress.totalCount} topics ({overallProgress.percentage}%) ·{' '}
                {Math.round(overallProgress.remainingMinutes / 60)}h {overallProgress.remainingMinutes % 60}m left
              </div>
            </div>

            <div
              role="progressbar"
              aria-label="Overall DBMS curriculum progress"
              aria-valuenow={overallProgress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2.5 w-full overflow-hidden rounded-md bg-[#EAF1FB] dark:bg-[#071224]"
            >
              <div
                className="h-full bg-[#0284C7] transition-all duration-300"
                style={{ width: `${overallProgress.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
              {overallProgress.unitBreakdown.map((u) => (
                <button
                  key={u.unitNumber}
                  type="button"
                  onClick={() => {
                    const targetUnit = DBMS_UNITS.find((unit) => unit.unitNumber === u.unitNumber);
                    if (targetUnit?.chapters[0]) {
                      handleSelectTopic(targetUnit.chapters[0]);
                    }
                  }}
                  className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                    activeTopic.unitNumber === u.unitNumber
                      ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40'
                      : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold tabular-nums">
                    <span className="text-sky-700 dark:text-sky-300">Unit {u.unitNumber}</span>
                    <span className="text-[#0B1F3A] dark:text-white">{u.percentage}%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                    {u.completedCount}/{u.totalCount} topics done
                  </p>
                </button>
              ))}
            </div>
          </div>

          {sampleStudents && sampleStudents.length > 0 && onSelectSampleStudentUid ? (
            <div className="lg:col-span-4 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="curriculum-sample-student-select"
                  className="text-xs font-semibold text-[#0B1F3A] dark:text-white"
                >
                  Inspect Student Progress
                </label>
                <span className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                  Sample Data
                </span>
              </div>
              <select
                id="curriculum-sample-student-select"
                value={selectedSampleStudentUid ?? ''}
                onChange={(e) => onSelectSampleStudentUid(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-3 py-2 text-xs font-medium text-[#0B1F3A] dark:text-white focus:border-sky-500 focus:outline-none"
              >
                {sampleStudents.map((stu) => (
                  <option key={stu.uid} value={stu.uid}>
                    {stu.name} ({stu.completedCount}/67 completed)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                {userRole === 'student'
                  ? 'Per-student topic completion is saved individually per account.'
                  : 'Demonstration roster progress clearly labelled as Sample Data.'}
              </p>
            </div>
          ) : (
            <div className="lg:col-span-4 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5 space-y-1.5">
              <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                Active Unit Focus
              </p>
              <p className="text-xs font-medium text-sky-700 dark:text-sky-300">
                {activeUnit.title}
              </p>
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] line-clamp-2">
                {activeUnit.overviewEn}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main 2-Pane Split Workspace: Collapsible 4-Unit Sidebar + Topic Detail View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT PANE: Collapsible 4-Unit Accordion Sidebar */}
        <aside
          aria-label="DBMS Units and Topics Explorer"
          className="lg:col-span-4 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] overflow-hidden lg:sticky lg:top-4"
        >
          <div className="border-b border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#475D7C] dark:text-[#9EB3D1]"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search DBMS topics"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 67 topics, SQL, BCNF, ACID..."
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] pl-8 pr-8 py-2 text-xs text-[#0B1F3A] dark:text-white placeholder:text-[#6B82A4] focus:border-sky-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear topic search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#475D7C] hover:text-[#0B1F3A] dark:text-[#9EB3D1] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Difficulty & Completion Filter Buttons */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficultyFilter(level)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold capitalize cursor-pointer transition-colors ${
                      difficultyFilter === level
                        ? 'border-[#0284C7] bg-[#0284C7] text-white'
                        : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400'
                    }`}
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {(['all', 'pending', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold capitalize cursor-pointer transition-colors ${
                        statusFilter === st
                          ? 'border-[#0F294A] bg-[#0F294A] dark:border-sky-500 dark:bg-sky-600 text-white'
                          : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400'
                      }`}
                    >
                      {st === 'all' ? 'All' : st === 'completed' ? 'Done' : 'To Study'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setExpandedUnits({ 1: true, 2: true, 3: true, 4: true })}
                    className="text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                  >
                    Expand
                  </button>
                  <span className="text-[#9EB3D1]" aria-hidden="true">
                    /
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedUnits({ 1: false, 2: false, 3: false, 4: false })}
                    className="text-[#475D7C] dark:text-[#9EB3D1] hover:underline cursor-pointer"
                  >
                    Collapse
                  </button>
                </div>
              </div>
            </div>

            {hasActiveFilter && (
              <div className="flex items-center justify-between text-[11px] text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                <span>Showing {totalMatchingTopics} matching topics</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDifficultyFilter('all');
                    setStatusFilter('all');
                  }}
                  className="font-semibold text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>

          {/* 4 Collapsible Unit Lists */}
          <div className="max-h-[68vh] overflow-y-auto divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
            {filteredUnits.map(({ unit, matchingChapters }) => {
              const isOpen = hasActiveFilter
                ? matchingChapters.length > 0
                : Boolean(expandedUnits[unit.unitNumber]);
              const unitStats = overallProgress.unitBreakdown.find(
                (b) => b.unitNumber === unit.unitNumber
              );

              if (hasActiveFilter && matchingChapters.length === 0) {
                return null;
              }

              return (
                <div key={unit.unitNumber}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleUnitAccordion(unit.unitNumber)}
                    className="w-full px-4 py-3.5 flex items-start justify-between gap-3 text-left bg-[#F8FAFE] dark:bg-[#071224]/60 hover:bg-[#EAF1FB] dark:hover:bg-[#13294B] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-sky-700 dark:text-sky-300 tabular-nums">
                        <span>UNIT {unit.unitNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {unitStats?.completedCount ?? 0}/{unit.chapters.length} done
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white leading-snug">
                        {unit.title.replace(/^Unit \d+\s*·\s*/, '')}
                      </p>
                    </div>
                    <span className="shrink-0 mt-1 text-[#475D7C] dark:text-[#9EB3D1]">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-[#DCE5F2]/60 dark:divide-[#1D3557]/70 bg-white dark:bg-[#0F1E36]">
                      {matchingChapters.map((ch) => {
                        const isSelected = ch.id === activeTopic.id;
                        const isDone = completedSet.has(ch.id);
                        const diff = DIFFICULTY_STYLES[ch.difficulty];

                        return (
                          <button
                            key={ch.id}
                            type="button"
                            aria-current={isSelected ? 'true' : undefined}
                            onClick={() => handleSelectTopic(ch)}
                            className={`w-full px-4 py-2.5 flex items-start gap-2.5 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#EAF1FB] dark:bg-[#15315B] border-l-4 border-[#0284C7]'
                                : 'hover:bg-[#F8FAFE] dark:hover:bg-[#132644]'
                            }`}
                          >
                            <span className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckCircle2
                                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                                  aria-label="Completed"
                                />
                              ) : (
                                <Circle
                                  className="h-4 w-4 text-[#9EB3D1] dark:text-[#475D7C]"
                                  aria-label="Not completed"
                                />
                              )}
                            </span>

                            <div className="min-w-0 flex-1 space-y-1">
                              <p
                                className={`text-xs leading-snug ${
                                  isSelected
                                    ? 'font-semibold text-[#0B1F3A] dark:text-white'
                                    : 'font-medium text-[#1E365C] dark:text-slate-200'
                                }`}
                              >
                                <span className="font-mono text-[11px] text-sky-700 dark:text-sky-300 mr-1.5 tabular-nums">
                                  {ch.code}
                                </span>{' '}
                                {ch.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <span className={`h-1.5 w-1.5 rounded-sm ${diff.dotClass}`} />
                                  {diff.label}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{ch.estimatedMinutes} min</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {totalMatchingTopics === 0 && (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                  No DBMS topics match your current filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDifficultyFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs font-semibold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Clear search &amp; filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT PANE: Rich Topic Detail Workspace */}
        <section
          ref={detailHeadingRef}
          aria-label="Selected DBMS Topic Details"
          className="lg:col-span-8 space-y-6"
        >
          {/* Topic Header & Completion Card */}
          <article className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              <span className="font-mono font-semibold text-sky-700 dark:text-sky-300">
                {activeUnit.title} · Topic {activeTopic.code}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!prevTopic}
                  onClick={() => prevTopic && handleSelectTopic(prevTopic)}
                  className="inline-flex items-center gap-1 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1 text-xs font-medium text-[#0B1F3A] dark:text-slate-200 hover:bg-[#F8FAFE] dark:hover:bg-[#13294B] disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={!nextTopic}
                  onClick={() => nextTopic && handleSelectTopic(nextTopic)}
                  className="inline-flex items-center gap-1 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1 text-xs font-medium text-[#0B1F3A] dark:text-slate-200 hover:bg-[#F8FAFE] dark:hover:bg-[#13294B] disabled:opacity-40 cursor-pointer"
                >
                  Next
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold text-[#0B1F3A] dark:text-white">
                  {activeTopic.code} {activeTopic.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold ${
                      DIFFICULTY_STYLES[activeTopic.difficulty].badgeClass
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-sm ${
                        DIFFICULTY_STYLES[activeTopic.difficulty].dotClass
                      }`}
                    />
                    {DIFFICULTY_STYLES[activeTopic.difficulty].label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] px-2.5 py-1 font-medium text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                    <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                    {activeTopic.estimatedMinutes} min study time
                  </span>
                  <span className="font-mono text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                    {DBMS_CURRICULUM_LABEL}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-pressed={isTopicCompleted}
                disabled={togglingTopicId === activeTopic.id}
                onClick={() => onToggleTopicComplete(activeTopic.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 ${
                  isTopicCompleted
                    ? 'border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100'
                    : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                }`}
              >
                {togglingTopicId === activeTopic.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : isTopicCompleted ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                {isTopicCompleted ? 'Completed' : 'Mark as Completed'}
              </button>
            </div>

            {/* Simple & Detailed Explanations */}
            <div className="space-y-4">
              <div className="rounded-lg border border-sky-200 dark:border-sky-900 bg-[#F4F9FF] dark:bg-sky-950/30 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                  Simple Explanation
                </p>
                <p className="text-sm font-medium text-[#0B1F3A] dark:text-slate-100 leading-relaxed">
                  {renderInlineRichText(activeTopic.simpleExplanation)}
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                  Detailed Concept Breakdown
                </h3>
                <p className="text-sm text-[#0B1F3A] dark:text-slate-200 leading-relaxed">
                  {renderInlineRichText(activeTopic.detailedExplanation)}
                </p>
              </div>

              {language === 'kn' && (
                <div className="rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 p-4 space-y-1">
                  <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                    ಕನ್ನಡ ಸಾರಾಂಶ (Kannada Summary)
                  </p>
                  <p className="text-sm text-[#0B1F3A] dark:text-slate-100 leading-relaxed">
                    {renderInlineRichText(activeTopic.summaryKn)}
                  </p>
                </div>
              )}
            </div>

            {/* Learning Objectives & Real-World Example */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                  <Target className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                  <span>Learning Objectives</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#1E365C] dark:text-slate-200">
                  {activeTopic.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{renderInlineRichText(obj)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                  <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span>Real-World Example</span>
                </div>
                <p className="text-xs text-[#1E365C] dark:text-slate-200 leading-relaxed">
                  {renderInlineRichText(activeTopic.realWorldExample)}
                </p>
              </div>
            </div>

            {/* Three Difficulty Levels Depth Explorer */}
            <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                  <Layers className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                  <span>Three Difficulty Levels — Depth Guide</span>
                </div>
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Topic difficulty depth levels">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      role="tab"
                      aria-selected={activeTierTab === tier}
                      onClick={() => setActiveTierTab(tier)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold capitalize cursor-pointer ${
                        activeTierTab === tier
                          ? 'border-[#0284C7] bg-[#0284C7] text-white'
                          : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-[#0B1F3A] dark:text-slate-200 leading-relaxed">
                {renderInlineRichText(activeTopic.difficultyLevels[activeTierTab])}
              </p>
            </div>

            {/* Important Definitions */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                <BookMarked className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                <span>Important Definitions</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeTopic.definitions.map((def, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 p-3.5 space-y-1"
                  >
                    <p className="text-xs font-bold text-[#0B1F3A] dark:text-sky-200">
                      {def.term}
                    </p>
                    <p className="text-xs text-[#475D7C] dark:text-[#C5D5EA] leading-relaxed">
                      {renderInlineRichText(def.definition)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical SQL / Diagram / Algorithm Blueprint */}
            <div className="rounded-lg border border-[#1D3557] bg-[#0B1F3A] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                  <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{activeTopic.codeOrDiagramTitle}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 rounded border border-[#1D3557] bg-[#0F294A] px-2 py-1 text-[11px] font-medium text-sky-200 hover:bg-[#173B69] cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto font-mono text-xs text-slate-100 leading-relaxed whitespace-pre">
                {activeTopic.codeOrDiagram}
              </pre>
            </div>

            {/* Related Concepts */}
            {relatedTopics.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                  <Link2 className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                  <span>Related Concepts</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {relatedTopics.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => handleSelectTopic(rel)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] px-3 py-1.5 text-xs font-medium text-[#0B1F3A] dark:text-sky-200 hover:border-sky-400 hover:bg-[#EAF1FB] dark:hover:bg-[#13294B] cursor-pointer"
                    >
                      <span className="font-mono text-[11px] text-sky-700 dark:text-sky-300">
                        {rel.code}
                      </span>
                      <span>{rel.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Suggested Practice Questions */}
          <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
                Suggested Practice Questions
              </h3>
            </div>

            <div className="space-y-3">
              {activeTopic.practiceQuestions.map((pq, index) => {
                const hintOpen = Boolean(revealedHints[pq.id]);
                const answerOpen = Boolean(revealedAnswers[pq.id]);
                const pqDiff = DIFFICULTY_STYLES[pq.difficulty];

                return (
                  <div
                    key={pq.id}
                    className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                        Question {index + 1}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${pqDiff.badgeClass}`}
                      >
                        {pqDiff.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-[#0B1F3A] dark:text-slate-100 leading-relaxed">
                      {renderInlineRichText(pq.prompt)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-expanded={hintOpen}
                        onClick={() =>
                          setRevealedHints((prev) => ({ ...prev, [pq.id]: !prev[pq.id] }))
                        }
                        className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-2.5 py-1 text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400 cursor-pointer"
                      >
                        {hintOpen ? 'Hide Hint' : 'Show Hint'}
                      </button>
                      <button
                        type="button"
                        aria-expanded={answerOpen}
                        onClick={() =>
                          setRevealedAnswers((prev) => ({ ...prev, [pq.id]: !prev[pq.id] }))
                        }
                        className="rounded-md border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 text-xs font-semibold text-[#0B1F3A] dark:text-sky-200 hover:bg-sky-100 cursor-pointer"
                      >
                        {answerOpen ? 'Hide Answer' : 'Reveal Model Answer'}
                      </button>
                    </div>

                    {hintOpen && (
                      <p className="rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                        <strong>Hint:</strong> {renderInlineRichText(pq.hint)}
                      </p>
                    )}

                    {answerOpen && (
                      <p className="rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                        <strong>Answer:</strong> {renderInlineRichText(pq.answer)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* AI Integration Toolbar & Grounded Response Drawer */}
          <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                  <h3 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
                    AI Topic Copilot — {activeTopic.title}
                  </h3>
                </div>
                <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] mt-0.5">
                  Powered by real server-side Gemini &amp; Sarvam AI endpoints grounded in this topic’s curriculum content.
                </p>
              </div>

              {(onGenerateNotes || onAskTutor) && (
                <div className="flex flex-wrap items-center gap-2">
                  {onGenerateNotes && (
                    <button
                      type="button"
                      onClick={() =>
                        onGenerateNotes(activeTopic.title, buildTopicContext(activeTopic, activeUnit))
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:border-sky-400 cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                      Open in Tutor Notes
                    </button>
                  )}
                  {onAskTutor && (
                    <button
                      type="button"
                      onClick={() => onAskTutor(activeTopic.title, activeTopic.practicePrompt)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:border-sky-400 cursor-pointer"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                      Open Full Tutor
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5 AI Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => runAiExplain('en')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                  aiAction === 'explain_en'
                    ? 'border-[#0284C7] bg-[#0284C7] text-white'
                    : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-100 hover:border-sky-400'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Explain this topic
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={() => runAiExplain('kn')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                  aiAction === 'explain_kn'
                    ? 'border-[#0284C7] bg-[#0284C7] text-white'
                    : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-100 hover:border-sky-400'
                }`}
              >
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                Explain in Kannada
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={runAiExamples}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                  aiAction === 'examples'
                    ? 'border-[#0284C7] bg-[#0284C7] text-white'
                    : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-100 hover:border-sky-400'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                Generate examples
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={runAiQuiz}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                  aiAction === 'quiz'
                    ? 'border-[#0284C7] bg-[#0284C7] text-white'
                    : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-100 hover:border-sky-400'
                }`}
              >
                <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                Generate quiz
              </button>

              <button
                type="button"
                disabled={aiLoading}
                onClick={() => {
                  setAiAction(aiAction === 'doubt' ? null : 'doubt');
                  setAiError(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                  aiAction === 'doubt'
                    ? 'border-[#0F294A] bg-[#0F294A] dark:border-sky-500 dark:bg-sky-600 text-white'
                    : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-100 hover:border-sky-400'
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Ask AI doubt
              </button>
            </div>

            {aiLoading && (
              <div className="flex items-center gap-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 px-4 py-3 text-xs font-medium text-[#0B1F3A] dark:text-sky-200">
                <Loader2 className="h-4 w-4 animate-spin text-[#0284C7]" aria-hidden="true" />
                <span>Generating grounded response from server AI provider...</span>
              </div>
            )}

            {aiError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{aiError}</span>
              </div>
            )}

            {aiExplainResult && (aiAction === 'explain_en' || aiAction === 'explain_kn') && (
              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 space-y-3">
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                  AI Concept Explanation ({aiAction === 'explain_kn' ? 'English + ಕನ್ನಡ' : 'English'})
                </p>
                <p className="text-sm text-[#0B1F3A] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {aiExplainResult.englishExplanation}
                </p>
                {aiExplainResult.kannadaExplanation && (
                  <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-3 space-y-1">
                    <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                      ಕನ್ನಡ ವಿವರಣೆ (Kannada)
                    </p>
                    <p className="text-sm text-[#0B1F3A] dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {aiExplainResult.kannadaExplanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {aiExamplesResult && aiAction === 'examples' && (
              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    {aiExamplesResult.title}
                  </p>
                  {aiExamplesResult.provider && (
                    <span className="font-mono text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                      {aiExamplesResult.provider}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#0B1F3A] dark:text-slate-200 leading-relaxed">
                  {aiExamplesResult.summaryEn}
                </p>
                {aiExamplesResult.workedExample && (
                  <pre className="overflow-x-auto rounded-lg bg-[#0B1F3A] p-3 font-mono text-xs text-slate-100 whitespace-pre-wrap">
                    {aiExamplesResult.workedExample}
                  </pre>
                )}
                {aiExamplesResult.commonPitfalls?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Common Pitfalls
                    </p>
                    <ul className="list-disc pl-5 text-xs text-[#0B1F3A] dark:text-slate-200 space-y-1">
                      {aiExamplesResult.commonPitfalls.map((pitfall, idx) => (
                        <li key={idx}>{pitfall}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {aiQuizQuestions.length > 0 && aiAction === 'quiz' && (
              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    AI Topic Practice Quiz ({aiQuizQuestions.length} questions)
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuizChecked(true)}
                    className="rounded-md bg-[#0284C7] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer"
                  >
                    Check Answers
                  </button>
                </div>

                {aiQuizQuestions.map((q, idx) => {
                  const chosen = quizAnswers[q.id] ?? '';
                  const isCorrect = chosen === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                          Q{idx + 1}. {q.prompt}
                        </p>
                        {onSaveGeneratedQuestion && (
                          <button
                            type="button"
                            disabled={Boolean(savedQuizIds[q.id])}
                            onClick={async () => {
                              await onSaveGeneratedQuestion('Database Management Systems', q);
                              setSavedQuizIds((prev) => ({ ...prev, [q.id]: true }));
                            }}
                            className="shrink-0 rounded border border-sky-300 dark:border-sky-700 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 cursor-pointer disabled:opacity-60"
                          >
                            {savedQuizIds[q.id] ? 'Saved to Bank' : 'Save to Bank'}
                          </button>
                        )}
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {q.options.map((opt) => (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer ${
                                chosen === opt
                                  ? 'border-[#0284C7] bg-sky-50 dark:bg-sky-950/50 text-[#0B1F3A] dark:text-white'
                                  : 'border-[#DCE5F2] dark:border-[#1D3557] text-[#334B6E] dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`ai_quiz_${q.id}`}
                                checked={chosen === opt}
                                onChange={() =>
                                  setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                }
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {quizChecked && (
                        <p
                          className={`rounded px-2.5 py-1.5 text-xs ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                          }`}
                        >
                          {isCorrect ? 'Correct! ' : `Expected: ${q.correctAnswer}. `}
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {aiAction === 'doubt' && (
              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 space-y-3">
                <form onSubmit={runAiDoubt} className="flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="curriculum-doubt-input" className="sr-only">
                    Ask a question about {activeTopic.title}
                  </label>
                  <input
                    id="curriculum-doubt-input"
                    type="text"
                    value={doubtQuestion}
                    onChange={(e) => setDoubtQuestion(e.target.value)}
                    placeholder={`Ask a specific doubt about ${activeTopic.title}...`}
                    className="flex-1 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-3 py-2 text-xs text-[#0B1F3A] dark:text-white focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer disabled:opacity-60 whitespace-nowrap"
                  >
                    Ask Doubt
                  </button>
                </form>

                {aiDoubtResult && (
                  <div className="space-y-2 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-3">
                    <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                      Q: {aiDoubtResult.question}
                    </p>
                    <p className="text-sm text-[#0B1F3A] dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {aiDoubtResult.answerEn}
                    </p>
                    {aiDoubtResult.answerKn && (
                      <p className="text-sm text-sky-800 dark:text-sky-200 leading-relaxed whitespace-pre-wrap border-t border-[#DCE5F2] dark:border-[#1D3557] pt-2">
                        {aiDoubtResult.answerKn}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
};
