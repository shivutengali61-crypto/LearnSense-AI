import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, Award, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  computeStudentConceptMasteryTimeline,
  getEvidenceStrength,
} from '../utils/mastery';
import type {
  Assessment,
  AssessmentSubmission,
  ConceptMasteryRecord,
} from '../types/learnsense';

interface StudentPerformanceDashboardProps {
  submissions: AssessmentSubmission[];
  assessments: Assessment[];
  conceptMastery: ConceptMasteryRecord[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onTakeAssessmentClick?: () => void;
  compact?: boolean;
}

type ChartMode = 'concepts' | 'scores';

export const StudentPerformanceDashboard: React.FC<StudentPerformanceDashboardProps> = ({
  submissions,
  assessments,
  conceptMastery,
  loading = false,
  error = null,
  onRetry,
  onTakeAssessmentClick,
  compact = false,
}) => {
  const { theme } = useWorkspace();
  const isDark = theme === 'dark';
  const [chartMode, setChartMode] = useState<ChartMode>('concepts');

  const gridStroke = isDark ? '#1D3557' : '#DCE5F2';
  const axisTickColor = isDark ? '#9EB3D1' : '#475D7C';
  const axisLineStroke = isDark ? '#2C4A75' : '#C5D3E8';
  const dotStrokeColor = isDark ? '#0F1E36' : '#ffffff';

  const timeline = useMemo(
    () => computeStudentConceptMasteryTimeline(submissions, assessments),
    [submissions, assessments]
  );

  const [visibleConcepts, setVisibleConcepts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVisibleConcepts((prev) => {
      const next: Record<string, boolean> = {};
      for (const s of timeline.series) {
        next[s.conceptName] = prev[s.conceptName] !== undefined ? prev[s.conceptName] : true;
      }
      return next;
    });
  }, [timeline.series]);

  const chartData = useMemo(() => {
    return timeline.points.map((pt) => ({
      ...pt,
      ...pt.conceptMasteryByName,
    }));
  }, [timeline.points]);

  const toggleConcept = (conceptName: string) => {
    setVisibleConcepts((prev) => {
      const currentlyShown = Object.values(prev).filter(Boolean).length;
      if (prev[conceptName] && currentlyShown <= 1) {
        return prev;
      }
      return { ...prev, [conceptName]: !prev[conceptName] };
    });
  };

  if (loading) {
    return (
      <section
        aria-label="Performance Progression Loading"
        className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4"
      >
        <div className="h-5 w-56 rounded bg-[#EAF1FB] dark:bg-[#142D52]" />
        <div className="h-64 w-full rounded-lg bg-[#F8FAFE] dark:bg-[#071224] border border-[#DCE5F2] dark:border-[#1D3557]" />
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-start gap-2.5 text-sm text-rose-900 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Unable to load concept progression</p>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-[#0F1E36] px-3 py-1.5 text-xs font-semibold text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry Sync
          </button>
        )}
      </section>
    );
  }

  if (timeline.totalAttempts === 0) {
    return (
      <section
        data-testid="student-performance-empty"
        className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center space-y-3"
      >
        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
          Concept Mastery Progression
        </h2>
        <p className="mx-auto max-w-md text-sm text-[#475D7C] dark:text-[#9EB3D1]">
          No evaluated test attempts yet. Complete an online test to start tracking your cumulative
          concept mastery trajectory from real assessment evidence.
        </p>
        {onTakeAssessmentClick && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onTakeAssessmentClick}
              className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer"
            >
              Go to Online Tests
            </button>
          </div>
        )}
      </section>
    );
  }

  const unassessedConcepts = conceptMastery.filter((c) => c.masteryPct === null);

  return (
    <section
      data-testid="student-performance-dashboard"
      className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5"
    >
      {/* Header + View Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
            Concept Mastery Over Time
          </h2>
          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
            Cumulative accuracy tracked chronologically across {timeline.totalAttempts} evaluated{' '}
            {timeline.totalAttempts === 1 ? 'attempt' : 'attempts'} — zero fabricated data points.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1">
          <button
            type="button"
            onClick={() => setChartMode('concepts')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
              chartMode === 'concepts'
                ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
            }`}
          >
            Concept Trajectories
          </button>
          <button
            type="button"
            onClick={() => setChartMode('scores')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
              chartMode === 'scores'
                ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
            }`}
          >
            Test Score Progression
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5">
          <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Evaluated Attempts</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {timeline.totalAttempts}
          </p>
        </div>

        <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5">
          <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Latest Score</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-[#0284C7] dark:text-sky-400 tabular-nums">
              {timeline.latestScorePct !== null ? `${timeline.latestScorePct}%` : '—'}
            </span>
            {timeline.scoreDeltaPct !== null && (
              <span
                className={`inline-flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${
                  timeline.scoreDeltaPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {timeline.scoreDeltaPct >= 0 ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                {timeline.scoreDeltaPct >= 0 ? '+' : ''}
                {timeline.scoreDeltaPct}%
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5">
          <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Average Score</p>
          <p className="mt-1 font-mono text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
            {timeline.averageScorePct !== null ? `${timeline.averageScorePct}%` : '—'}
          </p>
        </div>

        <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5">
          <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Best Score</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-[#0284C7] dark:text-sky-400 shrink-0" aria-hidden="true" />
            <span className="font-mono text-2xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
              {timeline.bestScorePct !== null ? `${timeline.bestScorePct}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Single-attempt notice */}
      {timeline.totalAttempts === 1 && (
        <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] px-3.5 py-2 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
          Showing your baseline concept snapshot from 1 evaluated attempt. Multi-attempt trend lines
          appear automatically as you complete additional tests or teacher-permitted retakes.
        </div>
      )}

      {/* Concept Toggles when in Concept Mode */}
      {chartMode === 'concepts' && timeline.series.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Filter concepts:</span>
          {timeline.series.map((s) => {
            const active = Boolean(visibleConcepts[s.conceptName]);
            const evidence = getEvidenceStrength(s.attemptedCount);
            return (
              <button
                key={s.conceptId}
                type="button"
                aria-pressed={active}
                onClick={() => toggleConcept(s.conceptName)}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600'
                }`}
                title={`${evidence.label} · ${s.correctCount}/${s.attemptedCount} correct`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: active ? s.color : isDark ? '#334155' : '#cbd5e1' }}
                  aria-hidden="true"
                />
                <span>{s.conceptName}</span>
                <span className="font-mono text-xs tabular-nums">
                  {s.latestMasteryPct !== null ? `${s.latestMasteryPct}%` : '—'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Recharts Interactive Chart */}
      <div className={compact ? 'h-64 w-full' : 'h-80 w-full'}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'concepts' ? (
            <LineChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisLineStroke}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisLineStroke}
                width={42}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-md text-xs space-y-1.5 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-white">{point.assessmentTitle}</p>
                      <p className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        Test Score: {point.testPercentage}% ({point.score}/{point.maxScore} pts)
                      </p>
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 space-y-1">
                        {payload.map((entry) => {
                          const conceptName = String(entry.name || '');
                          const ev = point.conceptEvidenceByName?.[conceptName];
                          return (
                            <div
                              key={conceptName}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                                <span
                                  className="h-2 w-2 rounded-sm shrink-0"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {conceptName}
                              </span>
                              <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums shrink-0">
                                {entry.value}%
                                {ev ? ` (${ev.correct}/${ev.attempted})` : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: axisTickColor }} />
              <ReferenceLine
                y={80}
                stroke={isDark ? '#10b981' : '#047857'}
                strokeDasharray="4 4"
                label={{
                  value: 'Mastered 80%',
                  position: 'insideTopRight',
                  fill: isDark ? '#34d399' : '#047857',
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={55}
                stroke={isDark ? '#f59e0b' : '#d97706'}
                strokeDasharray="4 4"
                label={{
                  value: 'Support <55%',
                  position: 'insideBottomRight',
                  fill: isDark ? '#fbbf24' : '#b45309',
                  fontSize: 10,
                }}
              />
              {timeline.series
                .filter((s) => visibleConcepts[s.conceptName])
                .map((s) => (
                  <Line
                    key={s.conceptId}
                    type="monotone"
                    dataKey={s.conceptName}
                    name={s.conceptName}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: dotStrokeColor }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                ))}
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="lsScoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#38bdf8' : '#0284c7'} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={isDark ? '#38bdf8' : '#0284c7'} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisLineStroke}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: axisTickColor }}
                stroke={axisLineStroke}
                width={42}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-3 shadow-md text-xs space-y-1">
                      <p className="font-semibold text-[#0B1F3A] dark:text-white">{point.assessmentTitle}</p>
                      <p className="font-mono text-[#0284C7] dark:text-sky-400 font-semibold tabular-nums">
                        Test Score: {point.testPercentage}% ({point.score}/{point.maxScore} pts)
                      </p>
                      <p className="font-mono text-[#0F294A] dark:text-sky-200 tabular-nums">
                        Cumulative Average: {point.overallCumulativePct}%
                      </p>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: axisTickColor }} />
              <ReferenceLine y={80} stroke={isDark ? '#10b981' : '#047857'} strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="testPercentage"
                name="Test Score %"
                stroke={isDark ? '#38bdf8' : '#0284c7'}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#lsScoreFill)"
                isAnimationActive={false}
                dot={{ r: 4, fill: isDark ? '#38bdf8' : '#0284c7', strokeWidth: 2, stroke: dotStrokeColor }}
              />
              <Line
                type="monotone"
                dataKey="overallCumulativePct"
                name="Cumulative Average %"
                stroke={isDark ? '#7dd3fc' : '#0F294A'}
                strokeWidth={2}
                strokeDasharray="5 3"
                isAnimationActive={false}
                dot={{ r: 3, fill: isDark ? '#7dd3fc' : '#0F294A' }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Per-Concept Evidence Breakdown Footer */}
      {!compact && (
        <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-200">
              Evidence Strength by Assessed Concept
            </h3>
            {unassessedConcepts.length > 0 && (
              <span className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                {unassessedConcepts.length} curriculum{' '}
                {unassessedConcepts.length === 1 ? 'concept' : 'concepts'} not yet assessed
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {timeline.series.map((s) => {
              const ev = getEvidenceStrength(s.attemptedCount);
              return (
                <div
                  key={s.conceptId}
                  className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-100 truncate flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ backgroundColor: s.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{s.conceptName}</span>
                    </p>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                      {ev.label} · {s.correctCount}/{s.attemptedCount} correct
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold text-[#0B1F3A] dark:text-white tabular-nums">
                      {s.latestMasteryPct !== null ? `${s.latestMasteryPct}%` : '—'}
                    </p>
                    {s.deltaPct !== null && (
                      <p
                        className={`font-mono text-xs tabular-nums ${
                          s.deltaPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {s.deltaPct >= 0 ? `+${s.deltaPct}%` : `${s.deltaPct}%`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
