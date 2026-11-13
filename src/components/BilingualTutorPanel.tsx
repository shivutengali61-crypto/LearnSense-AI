import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Languages,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { LanguageCode, StudyMaterial } from '../types/learnsense';

interface BilingualTutorPanelProps {
  materials: StudyMaterial[];
  initialConcept?: string;
  initialMistake?: string;
  initialMode?: 'explain' | 'notes';
  initialMaterialContext?: string;
}

interface GeneratedNotesResult {
  title: string;
  summaryEn: string;
  keyPoints: string[];
  workedExample: string;
  commonPitfalls: string[];
  summaryKn?: string;
  provider?: 'gemini_ai' | 'sarvam_ai';
}

export const BilingualTutorPanel: React.FC<BilingualTutorPanelProps> = ({
  materials,
  initialConcept = '',
  initialMistake = '',
  initialMode = 'explain',
  initialMaterialContext = '',
}) => {
  const { aiStatus, user, workspace, saveTutorDoubt, deleteTutorDoubt } = useWorkspace();
  const [language, setLanguage] = useState<LanguageCode>(user?.preferredLanguage ?? 'en');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id ?? '');
  const [tutorSubTab, setTutorSubTab] = useState<'explain' | 'notes'>(initialMode);
  const [conceptInput, setConceptInput] = useState(initialConcept);
  const [mistakeInput, setMistakeInput] = useState(initialMistake);
  const [customContext, setCustomContext] = useState(initialMaterialContext);

  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<{
    conceptName: string;
    englishExplanation: string;
    kannadaExplanation?: string;
  } | null>(null);

  const [notesTopicInput, setNotesTopicInput] = useState(initialConcept);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesResult, setNotesResult] = useState<GeneratedNotesResult | null>(null);

  const [doubtInput, setDoubtInput] = useState('');
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtError, setDoubtError] = useState<string | null>(null);

  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  useEffect(() => {
    if (initialConcept) {
      setConceptInput(initialConcept);
      setNotesTopicInput(initialConcept);
    }
  }, [initialConcept]);

  useEffect(() => {
    if (initialMistake !== undefined) {
      setMistakeInput(initialMistake);
    }
  }, [initialMistake]);

  useEffect(() => {
    if (initialMode) {
      setTutorSubTab(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (initialMaterialContext !== undefined) {
      setCustomContext(initialMaterialContext);
    }
  }, [initialMaterialContext]);

  const activeMaterial = materials.find((m) => m.id === selectedMaterialId) ?? materials[0];
  const effectiveContext = customContext.trim() || activeMaterial?.extractedText || '';

  const savedDoubts = useMemo(() => {
    const materialClassroomIds = new Set(materials.map((m) => m.classroomId));
    return workspace.tutorDoubts.filter(
      (d) =>
        (!user || d.studentUid === user.uid) &&
        (materialClassroomIds.size === 0 || materialClassroomIds.has(d.classroomId))
    );
  }, [workspace.tutorDoubts, materials, user]);

  const handleExplainConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    setExplainError(null);
    if (!conceptInput.trim()) {
      setExplainError('Enter or select a concept name to explain.');
      return;
    }

    setExplainLoading(true);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptName: conceptInput.trim(),
          materialContext: effectiveContext,
          language,
          studentMistake: mistakeInput.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate explanation.');
      }
      setExplainResult(data);
      if (activeMaterial && data.englishExplanation) {
        await saveTutorDoubt({
          classroomId: activeMaterial.classroomId,
          teacherUid: activeMaterial.teacherUid,
          materialId: activeMaterial.id,
          materialTitle: activeMaterial.title,
          question: `Concept Explanation: ${conceptInput.trim()}`,
          answerEn: data.englishExplanation,
          answerKn: data.kannadaExplanation,
          language,
          entryType: 'explanation',
        });
      }
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Explanation request failed.');
    } finally {
      setExplainLoading(false);
    }
  };

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotesError(null);
    const cleanTopic = notesTopicInput.trim() || conceptInput.trim();
    if (!cleanTopic) {
      setNotesError('Enter a DBMS or course topic to generate structured study notes.');
      return;
    }

    setNotesLoading(true);
    try {
      const response = await fetch('/api/ai/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: cleanTopic,
          materialText: effectiveContext,
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate structured AI study notes.');
      }
      setNotesResult(data);
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : 'Study notes generation failed.');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoubtError(null);
    if (!doubtInput.trim()) {
      setDoubtError('Enter your question before sending.');
      return;
    }
    if (!activeMaterial && !customContext.trim()) {
      setDoubtError('No teacher-uploaded study material or curriculum context is selected yet.');
      return;
    }

    setDoubtLoading(true);
    try {
      const response = await fetch('/api/ai/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: doubtInput.trim(),
          materialContext: effectiveContext,
          materialTitle: activeMaterial?.title || 'DBMS Starter Curriculum',
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Doubt assistant request failed.');
      }
      if (activeMaterial) {
        await saveTutorDoubt({
          classroomId: activeMaterial.classroomId,
          teacherUid: activeMaterial.teacherUid,
          materialId: activeMaterial.id,
          materialTitle: data.groundedIn || activeMaterial.title,
          question: doubtInput.trim(),
          answerEn: data.answerEn,
          answerKn: data.answerKn,
          language,
          entryType: 'doubt',
        });
      }
      setDoubtInput('');
    } catch (err) {
      setDoubtError(err instanceof Error ? err.message : 'Unable to answer doubt.');
    } finally {
      setDoubtLoading(false);
    }
  };

  const handleSpeakText = async (textToSpeak: string) => {
    setTtsError(null);
    setTtsLoading(true);
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, language }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Speech synthesis failed.');
      }
      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
      await audio.play();
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : 'Could not play speech audio.');
    } finally {
      setTtsLoading(false);
    }
  };

  const conceptSuggestions = activeMaterial?.topics.map((t) => t.title) ?? [];
  const noAiConfigured = !aiStatus.sarvamConfigured && !aiStatus.geminiConfigured;

  return (
    <div className="space-y-6">
      {/* Honest AI Configuration Status Banner */}
      {noAiConfigured ? (
        <div
          role="status"
          className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-950 dark:text-amber-100 flex items-start gap-3"
        >
          <AlertCircle
            className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-semibold">AI API keys are not configured on the server</p>
            <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
              Live AI study notes, bilingual explanations, Kannada translation, and Bulbul text-to-speech require{' '}
              <code className="font-mono font-semibold">GEMINI_API_KEY</code> or{' '}
              <code className="font-mono font-semibold">SARVAM_API_KEY</code> in server secrets. Endpoints return explicit configuration notices rather than simulated AI output.
            </p>
          </div>
        </div>
      ) : !aiStatus.sarvamConfigured ? (
        <div
          role="status"
          className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 p-4 text-sm text-[#0B1F3A] dark:text-sky-100 flex items-start gap-3"
        >
          <AlertCircle
            className="h-5 w-5 text-sky-700 dark:text-sky-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="font-semibold">
              Gemini AI is active · Sarvam AI key not configured for Kannada TTS
            </p>
            <p className="text-xs text-[#475D7C] dark:text-sky-200/90 leading-relaxed">
              AI Study Notes generation uses Gemini AI. Live Sarvam Bulbul speech synthesis and dedicated Sarvam translation require{' '}
              <code className="font-mono font-semibold">SARVAM_API_KEY</code> on the server.
            </p>
          </div>
        </div>
      ) : null}

      {/* Controls Bar: Grounding Material + Language Toggle */}
      <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1 max-w-md">
          <label
            htmlFor="tutor-material-select"
            className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1.5"
          >
            Grounded Teacher Study Material
          </label>
          <select
            id="tutor-material-select"
            value={activeMaterial?.id ?? ''}
            onChange={(e) => {
              setSelectedMaterialId(e.target.value);
              setCustomContext('');
            }}
            className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
          >
            {materials.length === 0 ? (
              <option value="">No uploaded materials in this classroom</option>
            ) : (
              materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))
            )}
          </select>
          {customContext && (
            <p className="mt-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">
              Active Syllabus Context Loaded ·{' '}
              <button
                type="button"
                onClick={() => setCustomContext('')}
                className="underline cursor-pointer"
              >
                Use classroom material only
              </button>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1]">
            Explanation &amp; Notes Language
          </span>
          <div className="inline-flex items-center rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                language === 'kn'
                  ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                  : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
              }`}
            >
              <Languages className="h-3.5 w-3.5" aria-hidden="true" />
              English + ಕನ್ನಡ (Kannada)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Switchable Concept Explainer & AI Study Notes Generator */}
        <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
            <div className="space-y-0.5">
              <h3 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                {tutorSubTab === 'notes' ? 'AI Study Notes Generator' : 'Concept Explainer'}
              </h3>
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                {tutorSubTab === 'notes'
                  ? 'Generate structured exam-ready study notes with worked examples and common pitfalls.'
                  : 'Get a clear walkthrough in English or Kannada grounded in your course notes.'}
              </p>
            </div>

            <div className="inline-flex items-center rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1 shrink-0">
              <button
                type="button"
                onClick={() => setTutorSubTab('explain')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  tutorSubTab === 'explain'
                    ? 'bg-[#0F294A] dark:bg-sky-600 text-white'
                    : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Explain Concept
              </button>
              <button
                type="button"
                onClick={() => setTutorSubTab('notes')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  tutorSubTab === 'notes'
                    ? 'bg-[#0F294A] dark:bg-sky-600 text-white'
                    : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                AI Study Notes
              </button>
            </div>
          </div>

          {conceptSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                Quick topics from notes:
              </span>
              <div className="flex flex-wrap gap-2">
                {conceptSuggestions.map((topicTitle) => (
                  <button
                    key={topicTitle}
                    type="button"
                    onClick={() => {
                      setConceptInput(topicTitle);
                      setNotesTopicInput(topicTitle);
                    }}
                    className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] px-2.5 py-1 text-xs font-medium text-[#0B1F3A] dark:text-[#E2ECF9] hover:bg-[#EAF1FB] dark:hover:bg-[#132644] hover:border-sky-400 transition-colors cursor-pointer"
                  >
                    {topicTitle}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tutorSubTab === 'explain' ? (
            <>
              <form onSubmit={handleExplainConcept} className="space-y-4">
                <div>
                  <label
                    htmlFor="explain-concept-input"
                    className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1.5"
                  >
                    Concept to Explain
                  </label>
                  <input
                    id="explain-concept-input"
                    type="text"
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                    placeholder="e.g., BCNF Normalization or ACID Isolation"
                    className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="explain-mistake-input"
                    className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1.5"
                  >
                    Optional: Confusion or Mistake from Test
                  </label>
                  <input
                    id="explain-mistake-input"
                    type="text"
                    value={mistakeInput}
                    onChange={(e) => setMistakeInput(e.target.value)}
                    placeholder="e.g., Difference between 3NF and BCNF determinant rules"
                    className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>

                {explainError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
                  >
                    {explainError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={explainLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {explainLoading ? 'Requesting AI Tutor...' : 'Explain Concept'}
                </button>
              </form>

              {explainResult && (
                <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                      {explainResult.conceptName}
                    </h4>
                    <button
                      type="button"
                      disabled={ttsLoading}
                      onClick={() =>
                        handleSpeakText(
                          language === 'kn' && explainResult.kannadaExplanation
                            ? explainResult.kannadaExplanation
                            : explainResult.englishExplanation
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1 text-xs font-medium text-[#334B6E] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {ttsLoading ? 'Synthesizing...' : 'Listen (Sarvam TTS)'}
                    </button>
                  </div>
                  {ttsError && <p className="text-xs text-rose-700 dark:text-rose-400">{ttsError}</p>}
                  <div className="space-y-2 text-sm text-[#334B6E] dark:text-[#C5D5EA] leading-relaxed">
                    <p>{explainResult.englishExplanation}</p>
                  </div>
                  {explainResult.kannadaExplanation && (
                    <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-3 space-y-1">
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                        ಕನ್ನಡ ವಿವರಣೆ (Kannada)
                      </p>
                      <p className="text-sm text-[#0B1F3A] dark:text-[#E2ECF9] leading-relaxed">
                        {explainResult.kannadaExplanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <form onSubmit={handleGenerateNotes} className="space-y-4">
                <div>
                  <label
                    htmlFor="ai-notes-topic-input"
                    className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1.5"
                  >
                    Topic for Structured Revision Notes
                  </label>
                  <input
                    id="ai-notes-topic-input"
                    type="text"
                    value={notesTopicInput}
                    onChange={(e) => setNotesTopicInput(e.target.value)}
                    placeholder="e.g., Unit 3 Normalization & BCNF Decomposition"
                    className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
                  />
                </div>

                {notesError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
                  >
                    {notesError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={notesLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  {notesLoading ? 'Generating Study Notes...' : 'Generate AI Study Notes'}
                </button>
              </form>

              {notesResult && (
                <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                        {notesResult.provider === 'sarvam_ai' ? 'Sarvam AI Notes' : 'Gemini AI Notes'}
                      </p>
                      <h4 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                        {notesResult.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      disabled={ttsLoading}
                      onClick={() =>
                        handleSpeakText(
                          language === 'kn' && notesResult.summaryKn
                            ? notesResult.summaryKn
                            : notesResult.summaryEn
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1 text-xs font-medium text-[#334B6E] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {ttsLoading ? 'Synthesizing...' : 'Listen (Sarvam TTS)'}
                    </button>
                  </div>
                  {ttsError && <p className="text-xs text-rose-700 dark:text-rose-400">{ttsError}</p>}

                  <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA] leading-relaxed">
                    {notesResult.summaryEn}
                  </p>

                  {notesResult.keyPoints?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                        Key Takeaways
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-[#334B6E] dark:text-[#C5D5EA]">
                        {notesResult.keyPoints.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {notesResult.workedExample && (
                    <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-3 space-y-1">
                      <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                        Worked Example / SQL Illustration
                      </p>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-[#334B6E] dark:text-sky-200 leading-relaxed">
                        {notesResult.workedExample}
                      </pre>
                    </div>
                  )}

                  {notesResult.commonPitfalls?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        Common Exam Pitfalls
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-[#334B6E] dark:text-[#C5D5EA]">
                        {notesResult.commonPitfalls.map((pitfall, i) => (
                          <li key={i}>{pitfall}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {notesResult.summaryKn && (
                    <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-3 space-y-1">
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                        ಕನ್ನಡ ಸಾರಾಂಶ (Kannada Summary)
                      </p>
                      <p className="text-sm text-[#0B1F3A] dark:text-[#E2ECF9] leading-relaxed">
                        {notesResult.summaryKn}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* Grounded Doubt-Solving Assistant */}
        <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Classroom Doubt Assistant
            </h3>
            <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
              Ask questions strictly grounded in{' '}
              <span className="font-medium text-[#0B1F3A] dark:text-[#E2ECF9]">
                {activeMaterial?.title || 'selected course notes'}
              </span>
              .
            </p>
          </div>

          <form onSubmit={handleAskDoubt} className="space-y-3">
            <label
              htmlFor="doubt-question-input"
              className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1]"
            >
              Your Question
            </label>
            <textarea
              id="doubt-question-input"
              rows={3}
              value={doubtInput}
              onChange={(e) => setDoubtInput(e.target.value)}
              placeholder="Ask anything about the selected study material..."
              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2.5 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
            />
            {doubtError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
              >
                {doubtError}
              </div>
            )}
            <button
              type="submit"
              disabled={doubtLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {doubtLoading ? 'Asking AI Tutor...' : 'Ask Doubt Assistant'}
            </button>
          </form>

          <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
              Saved Tutor History ({savedDoubts.length})
            </h4>
            {savedDoubts.length === 0 ? (
              <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-5 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                <MessageSquare
                  className="mx-auto mb-2 h-5 w-5 text-sky-600 dark:text-sky-400"
                  aria-hidden="true"
                />
                No saved doubts yet. Questions and explanations are persisted in your student profile and grounded in teacher material.
              </div>
            ) : (
              savedDoubts.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                      {item.entryType === 'explanation' ? item.question : `Q: ${item.question}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteTutorDoubt(item.id)}
                      aria-label={`Delete saved doubt ${item.question}`}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA] leading-relaxed">
                    {item.answerEn}
                  </p>
                  {item.answerKn && (
                    <p className="text-sm text-sky-900 dark:text-sky-300 leading-relaxed">
                      {item.answerKn}
                    </p>
                  )}
                  <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                    Grounded in: {item.materialTitle} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
