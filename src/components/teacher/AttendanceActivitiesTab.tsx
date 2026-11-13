import React, { useEffect, useState } from 'react';
import {
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type {
  AttendanceStatus,
  Classroom,
  ClassroomActivityType,
} from '../../types/learnsense';

interface AttendanceActivitiesTabProps {
  classroom: Classroom | null;
}

const ACTIVITY_TYPE_LABELS: Record<ClassroomActivityType, string> = {
  lab: 'Practical Lab',
  revision_clinic: 'Revision Clinic',
  discussion: 'Class Discussion',
  assignment: 'Assignment Milestone',
};

export const AttendanceActivitiesTab: React.FC<AttendanceActivitiesTabProps> = ({
  classroom,
}) => {
  const {
    workspace,
    recordAttendanceSession,
    deleteAttendanceSession,
    createClassroomActivity,
    toggleClassroomActivity,
    deleteClassroomActivity,
  } = useWorkspace();

  const todayIso = new Date().toISOString().slice(0, 10);

  // Attendance Roll Call state
  const [sessionDate, setSessionDate] = useState(todayIso);
  const [sessionTopic, setSessionTopic] = useState('');
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [attSubmitting, setAttSubmitting] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [attStatusMsg, setAttStatusMsg] = useState<string | null>(null);

  // Activity Scheduler state
  const [actTitle, setActTitle] = useState('');
  const [actType, setActType] = useState<ClassroomActivityType>('revision_clinic');
  const [actDate, setActDate] = useState(todayIso);
  const [actDesc, setActDesc] = useState('');
  const [actSubmitting, setActSubmitting] = useState(false);
  const [actError, setActError] = useState<string | null>(null);
  const [actStatusMsg, setActStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!classroom) {
      setRecords({});
      return;
    }
    const next: Record<string, AttendanceStatus> = {};
    for (const s of classroom.students) {
      next[s.uid] = 'present';
    }
    setRecords(next);
  }, [classroom?.id, classroom?.students.length]);

  const classSessions = classroom
    ? workspace.attendanceSessions.filter((s) => s.classroomId === classroom.id)
    : [];
  const classActivities = classroom
    ? workspace.classroomActivities.filter((a) => a.classroomId === classroom.id)
    : [];

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!classroom) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const s of classroom.students) {
      next[s.uid] = status;
    }
    setRecords(next);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttError(null);
    setAttStatusMsg(null);
    if (!classroom) {
      setAttError('Select or create a classroom first.');
      return;
    }
    if (classroom.students.length === 0) {
      setAttError('Enroll at least one student in this classroom before taking attendance.');
      return;
    }
    setAttSubmitting(true);
    try {
      const saved = await recordAttendanceSession({
        classroomId: classroom.id,
        sessionDate,
        topic: sessionTopic,
        records,
      });
      setSessionTopic('');
      setAttStatusMsg(
        `Saved roll for "${saved.topic}" (${saved.presentCount}/${saved.totalCount} present or late).`
      );
    } catch (err) {
      setAttError(err instanceof Error ? err.message : 'Unable to save attendance session.');
    } finally {
      setAttSubmitting(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError(null);
    setActStatusMsg(null);
    if (!classroom) {
      setActError('Select or create a classroom first.');
      return;
    }
    setActSubmitting(true);
    try {
      const created = await createClassroomActivity({
        classroomId: classroom.id,
        title: actTitle,
        activityType: actType,
        scheduledDate: actDate,
        description: actDesc,
      });
      setActTitle('');
      setActDesc('');
      setActStatusMsg(`Scheduled "${created.title}" for ${created.scheduledDate}.`);
    } catch (err) {
      setActError(err instanceof Error ? err.message : 'Unable to schedule classroom activity.');
    } finally {
      setActSubmitting(false);
    }
  };

  if (!classroom) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Create or select a classroom in Classrooms &amp; Students to record attendance and schedule activities.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Daily Classroom Attendance Roll */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div className="flex items-center gap-2.5">
            <CalendarCheck2 className="h-5 w-5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                Classroom Attendance Roll — {classroom.name}
              </h2>
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                Record verified daily attendance sessions. Empty classes explicitly report Not Recorded.
              </p>
            </div>
          </div>
          {classroom.students.length > 0 && (
            <button
              type="button"
              onClick={() => handleMarkAll('present')}
              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-[#E2ECF9] hover:bg-[#F8FAFE] dark:hover:bg-[#132644] cursor-pointer"
            >
              Mark All Present
            </button>
          )}
        </div>

        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="att-session-date"
                className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1"
              >
                Session Date
              </label>
              <input
                id="att-session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="att-session-topic"
                className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1"
              >
                Lesson / Session Topic
              </label>
              <input
                id="att-session-topic"
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                placeholder="e.g., Unit 3 BCNF Decomposition Lab"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
              />
            </div>
          </div>

          {classroom.students.length === 0 ? (
            <p className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              No students enrolled in this classroom yet. Add students in Classrooms &amp; Students first.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Roll No</th>
                    <th className="py-2 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                  {classroom.students.map((stu) => {
                    const current = records[stu.uid] ?? 'present';
                    return (
                      <tr key={stu.uid}>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-[#0B1F3A] dark:text-slate-100">{stu.name}</p>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">{stu.email}</p>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                          {stu.rollNumber || '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="inline-flex items-center rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-0.5 gap-1">
                            {(['present', 'late', 'absent'] as AttendanceStatus[]).map((statusOption) => (
                              <button
                                key={statusOption}
                                type="button"
                                onClick={() =>
                                  setRecords((prev) => ({ ...prev, [stu.uid]: statusOption }))
                                }
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize cursor-pointer transition-colors ${
                                  current === statusOption
                                    ? statusOption === 'present'
                                      ? 'bg-emerald-700 text-white'
                                      : statusOption === 'late'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-rose-600 text-white'
                                    : 'text-[#334B6E] dark:text-[#C5D5EA] hover:bg-white dark:hover:bg-[#132644]'
                                }`}
                              >
                                {statusOption}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {attError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
            >
              {attError}
            </div>
          )}
          {attStatusMsg && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200"
            >
              {attStatusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={attSubmitting || classroom.students.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 disabled:opacity-60 cursor-pointer"
          >
            <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
            {attSubmitting ? 'Saving Roll...' : 'Save Attendance Session'}
          </button>
        </form>

        {/* Recorded Attendance History */}
        <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#0B1F3A] dark:text-white tabular-nums">
            Recorded Sessions ({classSessions.length})
          </h3>
          {classSessions.length === 0 ? (
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              No attendance sessions recorded for {classroom.name} yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Topic</th>
                    <th className="py-2 pr-4">Present</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                  {classSessions.map((sess) => {
                    const pct =
                      sess.totalCount > 0
                        ? Math.round((sess.presentCount / sess.totalCount) * 100)
                        : 0;
                    return (
                      <tr key={sess.id}>
                        <td className="py-2.5 pr-4 font-mono text-xs text-[#334B6E] dark:text-[#C5D5EA] tabular-nums">
                          {sess.sessionDate}
                        </td>
                        <td className="py-2.5 pr-4 text-sm text-[#0B1F3A] dark:text-slate-100">
                          {sess.topic}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {sess.presentCount}/{sess.totalCount} ({pct}%)
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => deleteAttendanceSession(sess.id)}
                            aria-label={`Delete attendance session ${sess.topic}`}
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-800 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Scheduled Classroom Activities & Clinics */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <CalendarPlus className="h-5 w-5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Scheduled Classroom Activities &amp; Clinics
            </h2>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              Schedule labs, revision clinics, discussions, or milestones visible to enrolled students.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="act-title"
                className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
              >
                Activity Title
              </label>
              <input
                id="act-title"
                type="text"
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                placeholder="e.g., BCNF Normalization Workshop"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="act-type"
                className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
              >
                Activity Type
              </label>
              <select
                id="act-type"
                value={actType}
                onChange={(e) => setActType(e.target.value as ClassroomActivityType)}
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              >
                <option value="revision_clinic">Revision Clinic</option>
                <option value="lab">Practical Lab</option>
                <option value="discussion">Class Discussion</option>
                <option value="assignment">Assignment Milestone</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="act-date"
                className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
              >
                Scheduled Date
              </label>
              <input
                id="act-date"
                type="date"
                value={actDate}
                onChange={(e) => setActDate(e.target.value)}
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="act-desc"
              className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
            >
              Instructions / Learning Goal
            </label>
            <input
              id="act-desc"
              type="text"
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              placeholder="Bring lab notebooks and review Unit 3 examples beforehand."
              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          {actError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
            >
              {actError}
            </div>
          )}
          {actStatusMsg && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-900 dark:text-emerald-200"
            >
              {actStatusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={actSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 disabled:opacity-60 cursor-pointer"
          >
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
            {actSubmitting ? 'Scheduling...' : 'Schedule Activity'}
          </button>
        </form>

        <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#0B1F3A] dark:text-white tabular-nums">
            Class Activities ({classActivities.length})
          </h3>
          {classActivities.length === 0 ? (
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              No classroom activities scheduled for {classroom.name} yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {classActivities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-[#EAF1FB] dark:bg-sky-950/60 px-2 py-0.5 text-[11px] font-semibold text-[#0F294A] dark:text-sky-300">
                        {ACTIVITY_TYPE_LABELS[act.activityType]}
                      </span>
                      <span className="font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                        {act.scheduledDate}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        act.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-[#0B1F3A] dark:text-slate-100'
                      }`}
                    >
                      {act.title}
                    </p>
                    {act.description && (
                      <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                        {act.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleClassroomActivity(act.id, !act.completed)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold cursor-pointer ${
                        act.completed
                          ? 'bg-emerald-700 text-white'
                          : 'border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644]'
                      }`}
                    >
                      {act.completed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                          Mark Completed
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteClassroomActivity(act.id)}
                      aria-label={`Delete activity ${act.title}`}
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
      </section>
    </div>
  );
};
