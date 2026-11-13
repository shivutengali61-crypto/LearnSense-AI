import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, MinusCircle } from 'lucide-react';
import type { ConceptMasteryRecord, StudentPerformanceSummary } from '../types/learnsense';

export function MasteryStatusLabel({ status }: { status: ConceptMasteryRecord['status'] }) {
  if (status === 'mastered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Mastered
      </span>
    );
  }
  if (status === 'developing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Developing
      </span>
    );
  }
  if (status === 'needs_support') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Needs Support
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      <MinusCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Unassessed
    </span>
  );
}

export const ConceptMasteryBarChart: React.FC<{
  concepts: ConceptMasteryRecord[];
  accentVariant?: 'teacher' | 'student' | 'admin';
}> = ({ concepts, accentVariant = 'teacher' }) => {
  const assessed = concepts.filter((c) => c.masteryPct !== null);
  if (assessed.length === 0) {
    return (
      <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 p-6 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
        No assessment evidence yet. Mastery bars appear once students submit an evaluated test.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assessed.map((concept) => {
        const pct = concept.masteryPct ?? 0;
        const barColor =
          concept.status === 'needs_support'
            ? 'bg-rose-600'
            : concept.status === 'developing'
              ? 'bg-amber-500'
              : accentVariant === 'student'
                ? 'bg-[#0284C7] dark:bg-sky-500'
                : 'bg-[#0F294A] dark:bg-sky-500';

        return (
          <div key={concept.conceptId} className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="font-medium text-[#0B1F3A] dark:text-slate-100">{concept.conceptName}</div>
              <div className="flex items-center gap-3">
                <MasteryStatusLabel status={concept.status} />
                <span className="font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                  {concept.correctCount}/{concept.attemptedCount} correct
                </span>
                <span className="w-11 text-right font-mono text-sm font-semibold text-[#0B1F3A] dark:text-white tabular-nums">
                  {pct}%
                </span>
              </div>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-md bg-[#EAF1FB] dark:bg-[#071224]"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${concept.conceptName} mastery ${pct}%`}
            >
              <div
                className={`h-full rounded-md transition-all duration-300 ${barColor}`}
                style={{ width: `${Math.max(pct, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ClassScoreDistributionChart: React.FC<{
  students: StudentPerformanceSummary[];
}> = ({ students }) => {
  const assessedStudents = students.filter((s) => s.averagePct !== null);
  if (assessedStudents.length === 0) {
    return (
      <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 p-6 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
        Student score comparison appears once at least one student completes a published test.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {assessedStudents.map((stu) => {
          const pct = stu.averagePct ?? 0;
          const barClass = stu.needsSupport ? 'bg-rose-600' : 'bg-[#0284C7] dark:bg-sky-500';
          return (
            <div
              key={stu.studentUid}
              className="flex flex-col justify-between rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224]/60 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-[#0B1F3A] dark:text-slate-100">{stu.studentName}</span>
                <span className="font-mono text-sm font-semibold text-[#0B1F3A] dark:text-white tabular-nums">
                  {pct}%
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded bg-[#EAF1FB] dark:bg-[#142D52]">
                <div className={`h-full rounded ${barClass}`} style={{ width: `${Math.max(pct, 4)}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                <span>
                  {stu.testsCompleted} test{stu.testsCompleted === 1 ? '' : 's'}
                </span>
                <span>
                  {stu.needsSupport ? 'Priority Support' : 'On Track'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
