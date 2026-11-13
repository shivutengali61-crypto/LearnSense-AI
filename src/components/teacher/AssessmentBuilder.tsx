import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  BookmarkPlus,
  Check,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  summarizeAssessmentComposition,
  validateManualQuestionInput,
} from '../../utils/assessmentBuilder';
import type { Assessment, Question, QuestionBankItem, StudyMaterial } from '../../types/learnsense';

interface AssessmentBuilderProps {
  assessment: Assessment;
  materials: StudyMaterial[];
}

type BuilderMode = 'gemini' | 'manual' | 'bank';

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({
  assessment,
  materials,
}) => {
  const {
    aiStatus,
    workspace,
    addQuestionsToAssessment,
    updateQuestionInAssessment,
    removeQuestionFromAssessment,
    reviewAssessmentQuestion,
    setAssessmentStatus,
    setAssessmentRetakePolicy,
    saveToQuestionBank,
    deleteFromQuestionBank,
  } = useWorkspace();

  const [builderMode, setBuilderMode] = useState<BuilderMode>('gemini');
  const [bankNotice, setBankNotice] = useState<string | null>(null);

  const allConcepts = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of materials) {
      for (const t of m.topics) {
        if (!seen.has(t.id)) {
          seen.set(t.id, t.title);
        }
      }
    }
    return Array.from(seen.entries()).map(([conceptId, conceptName]) => ({
      conceptId,
      conceptName,
    }));
  }, [materials]);

  // Gemini AI generator state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id ?? '');
  const [focusConceptId, setFocusConceptId] = useState<string>('all');
  const [draftCount, setDraftCount] = useState<number>(3);
  const [questionStyle, setQuestionStyle] = useState<'mixed' | 'mcq' | 'short_answer'>('mixed');
  const [difficulty, setDifficulty] = useState<'foundational' | 'intermediate' | 'challenging'>(
    'intermediate'
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Manual question builder state
  const [qPrompt, setQPrompt] = useState('');
  const [qType, setQType] = useState<'mcq' | 'short_answer'>('mcq');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [qConceptId, setQConceptId] = useState(allConcepts[0]?.conceptId ?? 'concept_general');
  const [qPoints, setQPoints] = useState<number>(2);
  const [qError, setQError] = useState<string | null>(null);
  const [qSuccess, setQSuccess] = useState<string | null>(null);

  // Inline edit / remove state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editCorrect, setEditCorrect] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editPoints, setEditPoints] = useState(2);
  const [editConceptId, setEditConceptId] = useState('concept_general');
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const activeMaterial =
    materials.find((m) => m.id === selectedMaterialId) ?? materials[0] ?? null;

  const summary = useMemo(
    () => summarizeAssessmentComposition(assessment.questions),
    [assessment.questions]
  );

  const pendingQuestions = assessment.questions.filter(
    (q) => q.approvalStatus === 'pending_review'
  );
  const approvedQuestions = assessment.questions.filter(
    (q) => q.approvalStatus === 'approved'
  );

  const handleGenerateGeminiDrafts = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    setAiNotice(null);

    if (!activeMaterial) {
      setAiError('Upload a study material first so Gemini can ground draft questions.');
      return;
    }

    const materialConcepts = activeMaterial.topics.map((t) => ({
      conceptId: t.id,
      conceptName: t.title,
    }));
    const targetConcepts =
      focusConceptId === 'all'
        ? materialConcepts
        : materialConcepts.filter((c) => c.conceptId === focusConceptId);

    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/gemini-generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialTitle: activeMaterial.title,
          materialText: activeMaterial.extractedText,
          concepts: targetConcepts.length > 0 ? targetConcepts : materialConcepts,
          count: draftCount,
          questionStyle,
          difficulty,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gemini question generation failed.');
      }
      await addQuestionsToAssessment(assessment.id, data.questions);
      setAiNotice(
        `Generated ${data.questions.length} draft questions from "${activeMaterial.title}" via Gemini. Review and approve them below before publishing.`
      );
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unable to generate Gemini draft questions.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQError(null);
    setQSuccess(null);

    const matchedConcept = allConcepts.find((c) => c.conceptId === qConceptId);
    const check = validateManualQuestionInput({
      prompt: qPrompt,
      type: qType,
      options: qOptions,
      correctAnswer: qCorrect,
      explanation: qExplanation,
      conceptId: matchedConcept?.conceptId || 'concept_general',
      conceptName: matchedConcept?.conceptName || 'Core Concept',
      points: qPoints,
    });

    if (!check.valid) {
      setQError(check.error || 'Please check question fields.');
      return;
    }

    const newQuestion: Question = {
      id: `q_man_${Date.now()}`,
      prompt: qPrompt.trim(),
      type: qType,
      options: qType === 'mcq' ? check.cleanOptions : undefined,
      correctAnswer: qCorrect.trim(),
      explanation: qExplanation.trim() || 'Added manually by teacher.',
      conceptId: matchedConcept?.conceptId || 'concept_general',
      conceptName: matchedConcept?.conceptName || 'Core Concept',
      points: Math.round(qPoints),
      source: 'manual',
      approvalStatus: 'approved',
    };

    await addQuestionsToAssessment(assessment.id, [newQuestion]);
    setQPrompt('');
    setQCorrect('');
    setQExplanation('');
    setQOptions(['', '', '', '']);
    setQPoints(2);
    setQSuccess('Question added and approved for this assessment.');
  };

  const startEditingQuestion = (q: Question) => {
    setConfirmRemoveId(null);
    setEditError(null);
    setEditingId(q.id);
    setEditPrompt(q.prompt);
    setEditCorrect(q.correctAnswer);
    setEditExplanation(q.explanation);
    setEditPoints(q.points);
    setEditConceptId(q.conceptId);
  };

  const handleSaveEdit = async (original: Question) => {
    setEditError(null);
    if (editPrompt.trim().length < 5 || !editCorrect.trim()) {
      setEditError('Prompt (min 5 chars) and expected answer are required.');
      return;
    }

    let nextOptions = original.options;
    if (original.type === 'mcq' && nextOptions && !nextOptions.includes(editCorrect.trim())) {
      nextOptions = [editCorrect.trim(), ...nextOptions.slice(1)];
    }

    const matchedConcept = allConcepts.find((c) => c.conceptId === editConceptId);
    await updateQuestionInAssessment(assessment.id, {
      ...original,
      prompt: editPrompt.trim(),
      correctAnswer: editCorrect.trim(),
      options: nextOptions,
      explanation: editExplanation.trim() || original.explanation,
      points: Math.min(Math.max(Math.round(Number(editPoints) || 2), 1), 20),
      conceptId: matchedConcept?.conceptId ?? original.conceptId,
      conceptName: matchedConcept?.conceptName ?? original.conceptName,
    });
    setEditingId(null);
  };

  const handleSaveQuestionToBank = async (q: Question) => {
    setBankNotice(null);
    const classroomSubject =
      workspace.classrooms.find((c) => c.id === assessment.classroomId)?.subject || 'General';
    await saveToQuestionBank({ subject: classroomSubject, question: q });
    setBankNotice(`Saved "${q.prompt.slice(0, 48)}..." to your private Question Bank.`);
  };

  const handleImportFromBank = async (item: QuestionBankItem) => {
    setBankNotice(null);
    const imported: Question = {
      id: `q_bank_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      prompt: item.prompt,
      type: item.type,
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      conceptId: item.conceptId,
      conceptName: item.conceptName,
      points: item.points,
      source: 'manual',
      approvalStatus: 'approved',
    };
    await addQuestionsToAssessment(assessment.id, [imported]);
    setBankNotice(`Imported "${item.conceptName}" question into ${assessment.title}.`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
        {/* Header + Publish Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              {assessment.title}
            </h2>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
              Status:{' '}
              <strong className="text-[#0B1F3A] dark:text-slate-200 capitalize">{assessment.status}</strong> ·{' '}
              {summary.approvedCount} approved · {summary.pendingCount} pending review ·{' '}
              {summary.totalApprovedPoints} total pts · {assessment.durationMinutes} min ·{' '}
              <strong className="text-[#0B1F3A] dark:text-slate-200">
                {assessment.allowRetakes ? 'Retakes allowed' : 'Single attempt (retakes locked)'}
              </strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setAssessmentRetakePolicy(assessment.id, !Boolean(assessment.allowRetakes))
              }
              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] whitespace-nowrap cursor-pointer"
            >
              {assessment.allowRetakes ? 'Lock to Single Attempt' : 'Allow Retakes'}
            </button>
            {assessment.status !== 'published' ? (
              <button
                type="button"
                disabled={approvedQuestions.length === 0}
                onClick={() => setAssessmentStatus(assessment.id, 'published')}
                className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                Publish to Students
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAssessmentStatus(assessment.id, 'closed')}
                className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] whitespace-nowrap cursor-pointer"
              >
                Close Test
              </button>
            )}
          </div>
        </div>

        {/* Authoring Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1">
            <button
              type="button"
              onClick={() => setBuilderMode('gemini')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                builderMode === 'gemini'
                  ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                  : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
              Generate Drafts (Gemini AI)
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('manual')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                builderMode === 'manual'
                  ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                  : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-[#0B1F3A] dark:text-slate-300" aria-hidden="true" />
              Create Question Manually
            </button>
            <button
              type="button"
              onClick={() => setBuilderMode('bank')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                builderMode === 'bank'
                  ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                  : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
              }`}
            >
              <Archive className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
              Question Bank ({workspace.questionBank.length})
            </button>
          </div>

          <span className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
            {summary.coveredConceptsCount} concepts assessed
          </span>
        </div>

        {bankNotice && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs text-emerald-900 dark:text-emerald-200"
          >
            {bankNotice}
          </div>
        )}

        {/* Mode 1: Gemini API Draft Generator */}
        {builderMode === 'gemini' && (
          <form onSubmit={handleGenerateGeminiDrafts} className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            {!aiStatus.geminiConfigured && (
              <div
                role="status"
                className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-950 dark:text-amber-100 flex items-start gap-2.5"
              >
                <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Gemini API key is not configured on the server. Add{' '}
                  <code className="font-mono font-semibold">GEMINI_API_KEY</code> in{' '}
                  <strong>Settings &gt; Secrets</strong> to generate live draft questions from your
                  uploaded study materials.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="builder-material"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Source Study Material
                </label>
                <select
                  id="builder-material"
                  value={activeMaterial?.id ?? ''}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    setFocusConceptId('all');
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  {materials.length === 0 ? (
                    <option value="">No uploaded study materials in this classroom</option>
                  ) : (
                    materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.topics.length} topics)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="builder-focus-concept"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Target Concept
                </label>
                <select
                  id="builder-focus-concept"
                  value={focusConceptId}
                  onChange={(e) => setFocusConceptId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="all">All Extracted Topics</option>
                  {activeMaterial?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="builder-count"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Draft Questions
                </label>
                <select
                  id="builder-count"
                  value={draftCount}
                  onChange={(e) => setDraftCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  <option value={2}>2 questions</option>
                  <option value={3}>3 questions</option>
                  <option value={4}>4 questions</option>
                  <option value={6}>6 questions</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="builder-style"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Question Format
                </label>
                <select
                  id="builder-style"
                  value={questionStyle}
                  onChange={(e) =>
                    setQuestionStyle(e.target.value as 'mixed' | 'mcq' | 'short_answer')
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="mixed">Mixed (MCQ + Short Answer)</option>
                  <option value="mcq">Multiple Choice Only</option>
                  <option value="short_answer">Short Answer Only</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="builder-difficulty"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Difficulty
                </label>
                <select
                  id="builder-difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value as 'foundational' | 'intermediate' | 'challenging'
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="foundational">Foundational</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="challenging">Challenging</option>
                </select>
              </div>
            </div>

            {activeMaterial && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Material excerpt: {activeMaterial.extractedText.slice(0, 180)}...
              </p>
            )}

            {aiError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
              >
                {aiError}
              </div>
            )}

            {aiNotice && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200"
              >
                {aiNotice}
              </div>
            )}

            <button
              type="submit"
              disabled={aiLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {aiLoading ? 'Generating Drafts via Gemini...' : 'Generate Drafts with Gemini'}
            </button>
          </form>
        )}

        {/* Mode 2: Manual Question Creation */}
        {builderMode === 'manual' && (
          <form onSubmit={handleAddManualQuestion} className="space-y-3.5 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="q-concept" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mapped Concept
                </label>
                <select
                  id="q-concept"
                  value={qConceptId}
                  onChange={(e) => setQConceptId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  {allConcepts.length === 0 ? (
                    <option value="concept_general">Core Concept</option>
                  ) : (
                    allConcepts.map((c) => (
                      <option key={c.conceptId} value={c.conceptId}>
                        {c.conceptName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="q-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Type
                </label>
                <select
                  id="q-type"
                  value={qType}
                  onChange={(e) => setQType(e.target.value as 'mcq' | 'short_answer')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="short_answer">Short Answer</option>
                </select>
              </div>

              <div>
                <label htmlFor="q-points" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Points
                </label>
                <input
                  id="q-points"
                  type="number"
                  min={1}
                  max={20}
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm tabular-nums text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="q-prompt" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Question Prompt
              </label>
              <input
                id="q-prompt"
                type="text"
                value={qPrompt}
                onChange={(e) => setQPrompt(e.target.value)}
                placeholder="Enter question text..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {qType === 'mcq' && (
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Answer Options (select the circle beside the correct option or type it below)
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="manual-correct-option"
                        aria-label={`Mark Option ${idx + 1} as correct`}
                        checked={Boolean(opt.trim()) && qCorrect.trim() === opt.trim()}
                        onChange={() => {
                          if (opt.trim()) setQCorrect(opt.trim());
                        }}
                        className="text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        aria-label={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const prevVal = qOptions[idx];
                          const nextVal = e.target.value;
                          const copy = [...qOptions];
                          copy[idx] = nextVal;
                          setQOptions(copy);
                          if (qCorrect === prevVal) {
                            setQCorrect(nextVal);
                          }
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="q-correct" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Answer
                </label>
                <input
                  id="q-correct"
                  type="text"
                  value={qCorrect}
                  onChange={(e) => setQCorrect(e.target.value)}
                  placeholder={qType === 'mcq' ? 'Exact text of correct option' : 'Expected answer'}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="q-expl" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Concept Explanation
                </label>
                <input
                  id="q-expl"
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Why this answer is correct"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {qError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
              >
                {qError}
              </div>
            )}

            {qSuccess && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200"
              >
                {qSuccess}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Approved Question
            </button>
          </form>
        )}

        {/* Mode 3: Teacher Private Question Bank */}
        {builderMode === 'bank' && (
          <div className="space-y-3 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                Reuse vetted concept questions saved across your classrooms. Protected from student access in Firestore.
              </p>
            </div>
            {workspace.questionBank.length === 0 ? (
              <p className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                Your Question Bank is empty. Click &ldquo;Save to Bank&rdquo; on any approved question below to store it for future tests.
              </p>
            ) : (
              <div className="space-y-2.5">
                {workspace.questionBank.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-3.5 flex flex-wrap items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-[220px]">
                      <p className="text-xs font-medium text-[#0284C7] dark:text-sky-400 tabular-nums">
                        {item.subject} · {item.conceptName} · {item.type.toUpperCase()} · {item.points} pts
                      </p>
                      <p className="text-sm font-medium text-[#0B1F3A] dark:text-white">{item.prompt}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Answer: {item.correctAnswer}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleImportFromBank(item)}
                        className="inline-flex items-center gap-1 rounded-md bg-[#0F294A] dark:bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Import Question
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFromQuestionBank(item.id)}
                        aria-label={`Delete bank item ${item.conceptName}`}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-800 px-2.5 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Teacher Review Queue for AI Drafts */}
        {pendingQuestions.length > 0 && (
          <div className="space-y-3 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 tabular-nums">
              AI Draft Questions Pending Teacher Approval ({pendingQuestions.length})
            </h3>
            {pendingQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-4 space-y-2.5"
              >
                {editingId === q.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`edit-p-${q.id}`} className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1">
                          Question Prompt
                        </label>
                        <input
                          id={`edit-p-${q.id}`}
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          className="w-full rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-2.5 py-1.5 text-xs text-[#0B1F3A] dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-c-${q.id}`} className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1">
                          Expected Answer
                        </label>
                        <input
                          id={`edit-c-${q.id}`}
                          type="text"
                          value={editCorrect}
                          onChange={(e) => setEditCorrect(e.target.value)}
                          className="w-full rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-2.5 py-1.5 text-xs text-[#0B1F3A] dark:text-slate-100"
                        />
                      </div>
                    </div>
                    {editError && <p className="text-xs text-rose-700 dark:text-rose-400">{editError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(q)}
                        className="rounded-md bg-[#0284C7] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1 text-xs font-medium text-[#0B1F3A] dark:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-[220px]">
                      <p className="text-xs font-medium text-amber-900 dark:text-amber-300 tabular-nums">
                        {q.source === 'gemini_ai' ? 'Gemini AI Draft' : 'AI Draft'} · Concept:{' '}
                        {q.conceptName} · {q.type.toUpperCase()} · {q.points} pts
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{q.prompt}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Expected answer: <strong className="text-slate-900 dark:text-white">{q.correctAnswer}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => reviewAssessmentQuestion(assessment.id, q.id, 'approved')}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit draft ${q.id}`}
                        onClick={() => startEditingQuestion(q)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewAssessmentQuestion(assessment.id, q.id, 'rejected')}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Approved Questions List */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            Approved Test Questions ({approvedQuestions.length})
          </h3>
          {approvedQuestions.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No approved questions yet. Create a question manually or generate and approve Gemini
              drafts above.
            </p>
          ) : (
            approvedQuestions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 space-y-2">
                {editingId === q.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`edit-ap-p-${q.id}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Prompt
                        </label>
                        <input
                          id={`edit-ap-p-${q.id}`}
                          type="text"
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-ap-c-${q.id}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Correct Answer
                        </label>
                        <input
                          id={`edit-ap-c-${q.id}`}
                          type="text"
                          value={editCorrect}
                          onChange={(e) => setEditCorrect(e.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div>
                        <label htmlFor={`edit-ap-con-${q.id}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Concept
                        </label>
                        <select
                          id={`edit-ap-con-${q.id}`}
                          value={editConceptId}
                          onChange={(e) => setEditConceptId(e.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        >
                          {allConcepts.length === 0 ? (
                            <option value={q.conceptId}>{q.conceptName}</option>
                          ) : (
                            allConcepts.map((c) => (
                              <option key={c.conceptId} value={c.conceptId}>
                                {c.conceptName}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`edit-ap-pts-${q.id}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Points
                        </label>
                        <input
                          id={`edit-ap-pts-${q.id}`}
                          type="number"
                          min={1}
                          max={20}
                          value={editPoints}
                          onChange={(e) => setEditPoints(Number(e.target.value))}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs tabular-nums text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-ap-exp-${q.id}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Explanation
                        </label>
                        <input
                          id={`edit-ap-exp-${q.id}`}
                          type="text"
                          value={editExplanation}
                          onChange={(e) => setEditExplanation(e.target.value)}
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                    {editError && <p className="text-xs text-rose-700 dark:text-rose-400">{editError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(q)}
                        className="rounded-md bg-[#0284C7] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer"
                      >
                        Save Question
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1 text-xs font-medium text-[#0B1F3A] dark:text-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>
                          Q{idx + 1} · {q.conceptName} ·{' '}
                          {q.source === 'gemini_ai'
                            ? 'Gemini Approved'
                            : q.source === 'sarvam_ai'
                              ? 'AI Approved'
                              : 'Manual'}{' '}
                          · {q.points} pts
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{q.prompt}</p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400">Answer: {q.correctAnswer}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {confirmRemoveId === q.id ? (
                        <>
                          <button
                            type="button"
                            aria-label={`Confirm remove question ${idx + 1}`}
                            onClick={() => {
                              removeQuestionFromAssessment(assessment.id, q.id);
                              setConfirmRemoveId(null);
                            }}
                            className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
                          >
                            Confirm Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveQuestionToBank(q)}
                            className="inline-flex items-center gap-1 rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 px-2.5 py-1 text-xs font-medium text-[#0284C7] dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 cursor-pointer"
                          >
                            <BookmarkPlus className="h-3 w-3" aria-hidden="true" />
                            Save to Bank
                          </button>
                          <button
                            type="button"
                            aria-label={`Edit question ${idx + 1}`}
                            onClick={() => startEditingQuestion(q)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove question ${idx + 1}`}
                            onClick={() => {
                              setEditingId(null);
                              setConfirmRemoveId(q.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
