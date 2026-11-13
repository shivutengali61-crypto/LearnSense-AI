import React, { useState } from 'react';
import { Download, FileText, Sparkles, Upload } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { StudyMaterial } from '../../types/learnsense';

interface MaterialsTabProps {
  classroomId: string;
  materials: StudyMaterial[];
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ classroomId, materials }) => {
  const { workspace, uploadMaterialFile, createMaterialFromText, updateMaterialTopics, aiStatus } =
    useWorkspace();
  const activeClassroom = workspace.classrooms.find((c) => c.id === classroomId);
  const totalEnrolled = activeClassroom?.studentUids.length ?? 0;

  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawNotes, setRawNotes] = useState('');
  const [enhanceWithAi, setEnhanceWithAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusMessage(null);

    if (!classroomId) {
      setFormError('Select or create a classroom first.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'file') {
        if (!selectedFile) {
          setFormError('Choose a .pdf, .txt, or .md file before uploading.');
          setSubmitting(false);
          return;
        }
        const res = await uploadMaterialFile(classroomId, title, selectedFile, enhanceWithAi);
        setStatusMessage(
          res.warning || `Uploaded "${res.material.title}" and extracted ${res.material.topics.length} topics.`
        );
        setTitle('');
        setSelectedFile(null);
      } else {
        if (!title.trim() || rawNotes.trim().length < 20) {
          setFormError('Enter a material title and at least 20 characters of study notes.');
          setSubmitting(false);
          return;
        }
        const mat = await createMaterialFromText(classroomId, title, rawNotes);
        setStatusMessage(`Saved "${mat.title}" and extracted ${mat.topics.length} topics.`);
        setTitle('');
        setRawNotes('');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Material upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSarvamExtract = async (material: StudyMaterial) => {
    setFormError(null);
    setStatusMessage(null);
    setEnrichingId(material.id);
    try {
      const response = await fetch('/api/ai/extract-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: material.extractedText, title: material.title }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI topic extraction failed.');
      }
      await updateMaterialTopics(
        material.id,
        data.topics,
        data.extractionSource || 'gemini_ai'
      );
      setStatusMessage(`Updated "${material.title}" topics using AI concept analysis.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to run AI concept extraction.');
    } finally {
      setEnrichingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload & Extraction Form */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Upload Study Material &amp; Extract Topics
            </h2>
            <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
              Upload classroom PDFs or paste structured notes to build the concept taxonomy.
            </p>
          </div>
          <div className="flex items-center rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1">
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'file' ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm' : 'text-[#475D7C] dark:text-[#9EB3D1]'
              }`}
            >
              Upload PDF / File
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'text' ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm' : 'text-[#475D7C] dark:text-[#9EB3D1]'
              }`}
            >
              Paste Study Notes
            </button>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="mat-title" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1.5">
                Material Title
              </label>
              <input
                id="mat-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unit 3: Normalization & BCNF"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
              />
            </div>

            {mode === 'file' && (
              <div>
                <label htmlFor="mat-file" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  PDF or Text File (.pdf, .txt, .md)
                </label>
                <input
                  id="mat-file"
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-800 dark:file:text-slate-100 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
                />
              </div>
            )}
          </div>

          {mode === 'text' && (
            <div>
              <label htmlFor="mat-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Study Notes Content
              </label>
              <textarea
                id="mat-notes"
                rows={5}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder={'1. Topic Heading\nExplanation...\n- Subtopic A\n- Subtopic B'}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          )}

          {mode === 'file' && (
            <label className="inline-flex items-center gap-2 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              <input
                type="checkbox"
                checked={enhanceWithAi}
                onChange={(e) => setEnhanceWithAi(e.target.checked)}
                disabled={!aiStatus.geminiConfigured && !aiStatus.sarvamConfigured}
                className="rounded border-[#DCE5F2] dark:border-[#1D3557] text-[#0284C7] focus:ring-[#0284C7]"
              />
              <span>
                Enrich extracted concepts with AI{' '}
                {!aiStatus.geminiConfigured &&
                  !aiStatus.sarvamConfigured &&
                  '(Requires GEMINI_API_KEY or SARVAM_API_KEY on server)'}
              </span>
            </label>
          )}

          {formError && (
            <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
              {formError}
            </div>
          )}
          {statusMessage && (
            <div role="status" className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              {statusMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 transition-colors disabled:opacity-60 cursor-pointer"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {submitting ? 'Extracting Topics...' : 'Upload & Extract Topics'}
          </button>
        </form>
      </section>

      {/* Existing Materials & Extracted Topic Trees */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
          Classroom Materials &amp; Extracted Concepts ({materials.length})
        </h2>

        {materials.length === 0 ? (
          <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
            No study materials uploaded for this classroom yet. Upload a PDF or paste notes above to
            generate your concept map.
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((mat) => (
              <article key={mat.id} className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#0284C7] dark:text-sky-400 shrink-0" aria-hidden="true" />
                      <h3 className="text-base font-semibold text-[#0B1F3A] dark:text-white">{mat.title}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      <span>{mat.fileName}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Source:{' '}
                        {mat.extractionSource === 'gemini_ai'
                          ? 'Gemini AI Concept Analysis'
                          : mat.extractionSource === 'sarvam_ai'
                            ? 'Sarvam AI Concept Analysis'
                            : 'Local PDF Structural Parser'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{mat.topics.length} topics extracted</span>
                      <span aria-hidden="true">·</span>
                      {(() => {
                        const matEngagements = workspace.materialEngagements.filter(
                          (e) => e.materialId === mat.id
                        );
                        const completedCount = matEngagements.filter(
                          (e) => e.status === 'completed'
                        ).length;
                        return (
                          <span className="font-medium text-[#0284C7] dark:text-sky-400 tabular-nums">
                            Read by {matEngagements.length}/{totalEnrolled} students
                            {completedCount > 0 ? ` (${completedCount} completed)` : ''}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={enrichingId === mat.id}
                      onClick={() => handleSarvamExtract(mat)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                      {enrichingId === mat.id ? 'Analyzing...' : 'Refine with AI'}
                    </button>
                    {mat.fileUrl && (
                      <a
                        href={mat.fileUrl}
                        download={mat.fileName}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Download File
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {mat.topics.map((topic) => (
                    <div key={topic.id} className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{topic.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{topic.description}</p>
                      {topic.subtopics.length > 0 && (
                        <ul className="space-y-1 border-t border-slate-200 dark:border-slate-700 pt-2">
                          {topic.subtopics.map((sub) => (
                            <li key={sub.id} className="text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-medium">{sub.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
