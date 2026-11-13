import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AssessmentBuilder } from './AssessmentBuilder';
import type { Assessment, StudyMaterial } from '../../types/learnsense';

interface AssessmentsTabProps {
  classroomId: string;
  materials: StudyMaterial[];
  assessments: Assessment[];
}

export const AssessmentsTab: React.FC<AssessmentsTabProps> = ({
  classroomId,
  materials,
  assessments,
}) => {
  const { createAssessment } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [dueDate, setDueDate] = useState('2026-11-25');
  const [allowRetakes, setAllowRetakes] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [activeAssessmentId, setActiveAssessmentId] = useState<string>(assessments[0]?.id ?? '');

  const selectedAssessment =
    assessments.find((a) => a.id === activeAssessmentId) ?? assessments[0] ?? null;

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Assessment title is required.');
      return;
    }
    setCreating(true);
    try {
      const created = await createAssessment({
        classroomId,
        title,
        description,
        durationMinutes,
        dueDate,
        allowRetakes,
        questions: [],
        status: 'draft',
      });
      setActiveAssessmentId(created.id);
      setTitle('');
      setDescription('');
      setAllowRetakes(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create test.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Create Test + Classroom Test List */}
        <section className="lg:col-span-5 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5 h-fit">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Create Assessment
            </h2>
            <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
              Start a new test shell, then author questions manually or draft them with Gemini AI.
            </p>
          </div>

          <form onSubmit={handleCreateTest} className="space-y-3.5">
            <div>
              <label htmlFor="test-title" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                Test Title
              </label>
              <input
                id="test-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Unit 3 Normalization Concept Check"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="test-duration" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Duration (min)
                </label>
                <input
                  id="test-duration"
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm tabular-nums text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="test-due" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Due Date
                </label>
                <input
                  id="test-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm tabular-nums text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="test-desc" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                Instructions / Scope
              </label>
              <input
                id="test-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Topics covered..."
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-3 text-xs text-[#334B6E] dark:text-[#C5D5EA] cursor-pointer">
              <input
                type="checkbox"
                checked={allowRetakes}
                onChange={(e) => setAllowRetakes(e.target.checked)}
                className="mt-0.5 rounded border-[#DCE5F2] dark:border-[#1D3557] text-[#0284C7] focus:ring-[#0284C7]"
              />
              <span>
                <strong className="font-semibold text-[#0B1F3A] dark:text-white">Allow student retakes</strong>
                <span className="block text-[#475D7C] dark:text-[#9EB3D1]">
                  Leave unchecked to lock after 1 submitted attempt and prevent duplicate submissions.
                </span>
              </span>
            </label>

            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {creating ? 'Creating...' : 'Create Draft Test'}
            </button>
          </form>

          <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-2">
            <h3 className="text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
              Classroom Tests ({assessments.length})
            </h3>
            {assessments.length === 0 ? (
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">No tests created in this classroom yet.</p>
            ) : (
              assessments.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAssessmentId(a.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                    selectedAssessment?.id === a.id
                      ? 'border-[#0284C7] bg-sky-50/70 dark:bg-sky-950/40'
                      : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] hover:bg-[#F8FAFE] dark:hover:bg-[#132644]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#0B1F3A] dark:text-white truncate">{a.title}</span>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        a.status === 'published'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : a.status === 'draft'
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-[#475D7C] dark:text-[#9EB3D1]'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                    <span>
                      {a.questions.filter((q) => q.approvalStatus === 'approved').length} approved
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {a.questions.filter((q) => q.approvalStatus === 'pending_review').length}{' '}
                      pending review
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{a.durationMinutes} min</span>
                    <span aria-hidden="true">·</span>
                    <span>{a.allowRetakes ? 'Retakes allowed' : 'Single attempt'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Right: AssessmentBuilder */}
        <section className="lg:col-span-7">
          {!selectedAssessment ? (
            <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
              Select or create a test on the left to open the Assessment Builder.
            </div>
          ) : (
            <AssessmentBuilder
              key={selectedAssessment.id}
              assessment={selectedAssessment}
              materials={materials}
            />
          )}
        </section>
      </div>
    </div>
  );
};
