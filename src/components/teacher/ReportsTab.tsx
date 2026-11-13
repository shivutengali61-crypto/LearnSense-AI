import React, { useMemo, useState } from 'react';
import { CheckCircle2, Sparkles, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { buildLessonPlanId } from '../../lib/repoRules';
import { ConceptMasteryBarChart } from '../Charts';
import type {
  ClassAnalyticsSummary,
  Classroom,
  LessonRecommendation,
} from '../../types/learnsense';

interface ReportsTabProps {
  classroom: Classroom | null;
  analytics: ClassAnalyticsSummary;
  lessonRecommendations: LessonRecommendation[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  classroom,
  analytics,
  lessonRecommendations,
}) => {
  const { workspace, saveLessonPlan, deleteLessonPlan } = useWorkspace();
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>(
    analytics.studentReports[0]?.studentUid ?? ''
  );
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanError, setAiPlanError] = useState<string | null>(null);
  const [latestAiPlan, setLatestAiPlan] = useState<{
    focusSummary: string;
    warmUp: string;
    reteachActivity: string;
    exitCheck: string;
  } | null>(null);

  const classLessonPlans = useMemo(
    () =>
      classroom
        ? workspace.lessonPlans.filter((p) => p.classroomId === classroom.id)
        : [],
    [workspace.lessonPlans, classroom]
  );

  const persistedOutlinePlan = classLessonPlans.find((p) => Boolean(p.aiOutline));
  const displayedAiOutline = latestAiPlan ?? persistedOutlinePlan?.aiOutline ?? null;

  const activeStudent =
    analytics.studentReports.find((s) => s.studentUid === selectedStudentUid) ??
    analytics.studentReports[0] ??
    null;

  const handleRequestAiLessonPlan = async () => {
    setAiPlanError(null);
    const difficult = analytics.mostDifficultConcepts.map((c) => ({
      conceptName: c.conceptName,
      masteryPct: c.masteryPct ?? 0,
      correctCount: c.correctCount,
      attemptedCount: c.attemptedCount,
    }));

    if (difficult.length === 0) {
      setAiPlanError('No difficult concepts (<75% mastery) detected from evaluated tests yet.');
      return;
    }

    setAiPlanLoading(true);
    try {
      const response = await fetch('/api/ai/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomName: classroom?.name,
          difficultConcepts: difficult,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI lesson plan.');
      }
      setLatestAiPlan(data.plan);
      const topRec = lessonRecommendations[0];
      const topConcept = analytics.mostDifficultConcepts[0];
      if (classroom && topConcept) {
        await saveLessonPlan({
          classroomId: classroom.id,
          conceptId: topConcept.conceptId,
          conceptName: topConcept.conceptName,
          classMasteryPct: topConcept.masteryPct ?? 0,
          recommendedFocus:
            topRec?.recommendedFocus || data.plan.focusSummary || 'Targeted concept reteach',
          suggestedActivity:
            topRec?.suggestedActivity || data.plan.reteachActivity || 'Guided 30-minute clinic',
          aiOutline: data.plan,
          status: 'approved',
        });
      }
    } catch (err) {
      setAiPlanError(err instanceof Error ? err.message : 'Unable to generate AI lesson plan.');
    } finally {
      setAiPlanLoading(false);
    }
  };

  const handleToggleApproveRec = async (rec: LessonRecommendation) => {
    if (!classroom) return;
    const planId = buildLessonPlanId(classroom.id, rec.conceptId);
    const existing = classLessonPlans.find((p) => p.id === planId);
    setSavingPlanId(rec.id);
    setAiPlanError(null);
    try {
      if (existing) {
        await deleteLessonPlan(existing.id);
      } else {
        await saveLessonPlan({
          classroomId: classroom.id,
          conceptId: rec.conceptId,
          conceptName: rec.conceptName,
          classMasteryPct: rec.classMasteryPct,
          recommendedFocus: rec.recommendedFocus,
          suggestedActivity: rec.suggestedActivity,
          status: 'approved',
        });
      }
    } catch (err) {
      setAiPlanError(err instanceof Error ? err.message : 'Unable to update saved lesson plan.');
    } finally {
      setSavingPlanId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Individual Student Concept Report */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Individual Student Diagnostic Report
            </h2>
            <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
              Every mastery figure links directly to actual submitted question responses.
            </p>
          </div>
          <div className="min-w-[240px]">
            <label htmlFor="report-student-select" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
              Select Student
            </label>
            <select
              id="report-student-select"
              value={activeStudent?.studentUid ?? ''}
              onChange={(e) => setSelectedStudentUid(e.target.value)}
              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD]"
            >
              {analytics.studentReports.map((s) => (
                <option key={s.studentUid} value={s.studentUid}>
                  {s.studentName} {s.averagePct !== null ? `(${s.averagePct}%)` : '(No tests yet)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!activeStudent ? (
          <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">Add students to this classroom to view individual reports.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-5">
              <div>
                <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Student</p>
                <p className="mt-1 text-base font-semibold text-[#0B1F3A] dark:text-white">{activeStudent.studentName}</p>
                <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">{activeStudent.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Evaluated Average</p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
                  {activeStudent.averagePct !== null ? `${activeStudent.averagePct}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Support Flag</p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    activeStudent.needsSupport ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {activeStudent.testsCompleted === 0
                    ? 'Awaiting first assessment'
                    : activeStudent.needsSupport
                      ? 'Needs Targeted Support'
                      : 'Progressing On Track'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">Concept Mastery Breakdown</h3>
              <ConceptMasteryBarChart concepts={activeStudent.conceptMastery} accentVariant="teacher" />
            </div>

            {activeStudent.conceptMastery.some((c) => c.evidence.length > 0) && (
              <div className="space-y-3 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-5">
                <h3 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">Assessment Evidence Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                        <th className="py-2.5 pr-4">Concept</th>
                        <th className="py-2.5 pr-4">Question</th>
                        <th className="py-2.5 pr-4">Student Answer</th>
                        <th className="py-2.5 pr-4">Expected</th>
                        <th className="py-2.5 text-right">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                      {activeStudent.conceptMastery.flatMap((c) =>
                        c.evidence.map((ev, idx) => (
                          <tr key={`${c.conceptId}_${idx}`} className="hover:bg-[#F8FAFE] dark:hover:bg-[#132644]/60">
                            <td className="py-2.5 pr-4 font-medium text-[#0B1F3A] dark:text-slate-100">{c.conceptName}</td>
                            <td className="py-2.5 pr-4 text-[#334B6E] dark:text-[#C5D5EA] max-w-xs truncate">{ev.prompt}</td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-[#334B6E] dark:text-[#C5D5EA]">
                              {ev.studentAnswer || '(blank)'}
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1]">{ev.correctAnswer}</td>
                            <td className="py-2.5 text-right">
                              <span
                                className={`text-xs font-semibold ${
                                  ev.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {ev.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Next Lesson Recommendations */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Next Lesson Planning Recommendations
            </h2>
            <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
              Evidence-based teaching priorities for teacher review and approval.
            </p>
          </div>
          <button
            type="button"
            disabled={aiPlanLoading}
            onClick={handleRequestAiLessonPlan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {aiPlanLoading ? 'Drafting Lesson Plan...' : 'Draft 30-Min Plan (AI)'}
          </button>
        </div>

        {aiPlanError && (
          <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200">
            {aiPlanError}
          </div>
        )}

        {displayedAiOutline && (
          <div className="rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-[#0B1F3A] dark:text-sky-200">
              AI Suggested Lesson Outline (Saved)
            </h3>
            <p className="text-sm text-[#0B1F3A] dark:text-slate-200">
              <strong>Focus:</strong> {displayedAiOutline.focusSummary}
            </p>
            <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA]">
              <strong>Warm-up (5 min):</strong> {displayedAiOutline.warmUp}
            </p>
            <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA]">
              <strong>Reteach Activity (15 min):</strong> {displayedAiOutline.reteachActivity}
            </p>
            <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA]">
              <strong>Exit Check (10 min):</strong> {displayedAiOutline.exitCheck}
            </p>
          </div>
        )}

        {lessonRecommendations.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            All evaluated concepts are currently above 75% class mastery, or no tests have been submitted yet.
          </p>
        ) : (
          <div className="space-y-3">
            {lessonRecommendations.map((rec) => {
              const planId = classroom ? buildLessonPlanId(classroom.id, rec.conceptId) : '';
              const savedPlan = classLessonPlans.find((p) => p.id === planId);
              const approved = Boolean(savedPlan);
              return (
                <div
                  key={rec.id}
                  className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#0B1F3A] dark:text-white">{rec.conceptName}</span>
                      <span aria-hidden="true" className="text-[#DCE5F2] dark:text-[#1D3557]">·</span>
                      <span className="font-mono text-xs text-rose-700 dark:text-rose-400 tabular-nums">
                        {rec.classMasteryPct}% class mastery
                      </span>
                      <span aria-hidden="true" className="text-[#DCE5F2] dark:text-[#1D3557]">·</span>
                      <span className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                        {rec.affectedStudentsCount} student{rec.affectedStudentsCount === 1 ? '' : 's'} below 70%
                      </span>
                    </div>
                    <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA]">{rec.recommendedFocus}</p>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">{rec.suggestedActivity}</p>
                  </div>
                  <button
                    type="button"
                    disabled={savingPlanId === rec.id}
                    onClick={() => handleToggleApproveRec(rec)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                      approved
                        ? 'bg-emerald-700 text-white'
                        : 'border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644]'
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {approved ? 'Approved & Saved' : 'Approve Recommendation'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {classLessonPlans.length > 0 && (
          <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
              Saved Lesson Plans for {classroom?.name} ({classLessonPlans.length})
            </h3>
            <div className="space-y-2">
              {classLessonPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-lg border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100">
                      {plan.conceptName} ·{' '}
                      <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 capitalize">
                        {plan.status}
                      </span>
                    </p>
                    <p className="text-xs text-[#334B6E] dark:text-[#C5D5EA] truncate">
                      {plan.suggestedActivity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        saveLessonPlan({
                          classroomId: plan.classroomId,
                          conceptId: plan.conceptId,
                          conceptName: plan.conceptName,
                          classMasteryPct: plan.classMasteryPct,
                          recommendedFocus: plan.recommendedFocus,
                          suggestedActivity: plan.suggestedActivity,
                          aiOutline: plan.aiOutline,
                          status: plan.status === 'completed' ? 'approved' : 'completed',
                        })
                      }
                      className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-2.5 py-1 text-xs font-medium text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer"
                    >
                      {plan.status === 'completed' ? 'Reopen Plan' : 'Mark Taught'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLessonPlan(plan.id)}
                      aria-label={`Delete saved lesson plan ${plan.conceptName}`}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-800 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
