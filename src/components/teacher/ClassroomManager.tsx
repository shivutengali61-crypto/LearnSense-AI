import React, { useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  buildStudentInviteMessage,
  filterRosterStudents,
} from '../../utils/classroomManager';
import type { Classroom, StudentRosterEntry } from '../../types/learnsense';

interface ClassroomManagerProps {
  activeClassroom: Classroom | null;
}

export const ClassroomManager: React.FC<ClassroomManagerProps> = ({ activeClassroom }) => {
  const {
    user,
    isDemoMode,
    workspace,
    selectedClassroomId,
    setSelectedClassroomId,
    createClassroom,
    regenerateClassroomCode,
    addStudentToClassroom,
    updateStudentInClassroom,
    removeStudentFromClassroom,
    authorizeTeacherEmail,
  } = useWorkspace();

  const isPrimaryAdmin =
    user?.role === 'admin' ||
    (!isDemoMode && user?.email?.trim().toLowerCase() === 'shivutengali61@gmail.com');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [facultySuccess, setFacultySuccess] = useState<string | null>(null);

  // Create classroom form state
  const [clsName, setClsName] = useState('');
  const [clsSubject, setClsSubject] = useState('');
  const [clsGrade, setClsGrade] = useState('');
  const [clsCourseCode, setClsCourseCode] = useState('');
  const [clsSemester, setClsSemester] = useState('');
  const [clsCredits, setClsCredits] = useState('4');
  const [clsCustomCode, setClsCustomCode] = useState('');
  const [clsError, setClsError] = useState<string | null>(null);
  const [clsSuccess, setClsSuccess] = useState<string | null>(null);
  const [creatingCls, setCreatingCls] = useState(false);

  // Invite code actions state
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'code' | 'invite' | null>(null);
  const [updatingCode, setUpdatingCode] = useState(false);

  // Add student form state
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuRoll, setStuRoll] = useState('');
  const [stuError, setStuError] = useState<string | null>(null);
  const [addingStu, setAddingStu] = useState(false);

  // Roster search & inline edit/remove state
  const [rosterSearch, setRosterSearch] = useState('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [rosterActionError, setRosterActionError] = useState<string | null>(null);
  const [confirmRemoveUid, setConfirmRemoveUid] = useState<string | null>(null);

  const filteredStudents = filterRosterStudents(activeClassroom?.students ?? [], rosterSearch);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setClsError(null);
    setClsSuccess(null);

    if (clsName.trim().length < 2 || clsSubject.trim().length < 2 || !clsGrade.trim()) {
      setClsError('Enter classroom name, subject, and grade level.');
      return;
    }

    setCreatingCls(true);
    try {
      const parsedCredits = clsCredits.trim() ? Number(clsCredits) : undefined;
      const created = await createClassroom({
        name: clsName,
        subject: clsSubject,
        gradeLevel: clsGrade,
        courseCode: clsCourseCode.trim() || undefined,
        semester: clsSemester.trim() || undefined,
        credits: parsedCredits,
        joinCode: clsCustomCode.trim() || undefined,
      });
      setClsName('');
      setClsSubject('');
      setClsGrade('');
      setClsCourseCode('');
      setClsSemester('');
      setClsCredits('4');
      setClsCustomCode('');
      setClsSuccess(`Created "${created.name}" with invite code ${created.joinCode}.`);
    } catch (err) {
      setClsError(err instanceof Error ? err.message : 'Unable to create classroom.');
    } finally {
      setCreatingCls(false);
    }
  };

  const handleCopy = async (kind: 'code' | 'invite') => {
    if (!activeClassroom) return;
    setCodeError(null);
    const text =
      kind === 'code'
        ? activeClassroom.joinCode
        : buildStudentInviteMessage({
            classroomName: activeClassroom.name,
            subject: activeClassroom.subject,
            gradeLevel: activeClassroom.gradeLevel,
            joinCode: activeClassroom.joinCode,
            teacherName: user?.name || activeClassroom.teacherName,
          });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(kind);
      setCodeStatus(
        kind === 'code'
          ? `Copied join code ${activeClassroom.joinCode} to clipboard.`
          : 'Copied full student invitation instructions to clipboard.'
      );
      window.setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setCodeStatus(
        `Share code ${activeClassroom.joinCode} with students to join ${activeClassroom.name}.`
      );
    }
  };

  const handleRegenerateCode = async () => {
    if (!activeClassroom) return;
    setCodeError(null);
    setCodeStatus(null);
    setUpdatingCode(true);
    try {
      const next = await regenerateClassroomCode(activeClassroom.id);
      setCodeStatus(`Updated classroom invite code to ${next}.`);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Unable to regenerate join code.');
    } finally {
      setUpdatingCode(false);
    }
  };

  const handleApplyCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassroom) return;
    setCodeError(null);
    setCodeStatus(null);
    if (!customCodeInput.trim()) {
      setCodeError('Enter a custom code (4–16 letters or numbers) to update.');
      return;
    }
    setUpdatingCode(true);
    try {
      const next = await regenerateClassroomCode(activeClassroom.id, customCodeInput);
      setCustomCodeInput('');
      setCodeStatus(`Classroom invite code updated to ${next}.`);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Unable to update join code.');
    } finally {
      setUpdatingCode(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStuError(null);
    if (!activeClassroom) {
      setStuError('Create or select a classroom first.');
      return;
    }
    setAddingStu(true);
    try {
      await addStudentToClassroom(activeClassroom.id, {
        name: stuName,
        email: stuEmail,
        rollNumber: stuRoll,
      });
      setStuName('');
      setStuEmail('');
      setStuRoll('');
    } catch (err) {
      setStuError(err instanceof Error ? err.message : 'Unable to add student.');
    } finally {
      setAddingStu(false);
    }
  };

  const beginEditStudent = (student: StudentRosterEntry) => {
    setRosterActionError(null);
    setConfirmRemoveUid(null);
    setEditingUid(student.uid);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditRoll(student.rollNumber ?? '');
  };

  const handleSaveStudentEdit = async (studentUid: string) => {
    if (!activeClassroom) return;
    setRosterActionError(null);
    try {
      await updateStudentInClassroom(activeClassroom.id, studentUid, {
        name: editName,
        email: editEmail,
        rollNumber: editRoll,
      });
      setEditingUid(null);
    } catch (err) {
      setRosterActionError(err instanceof Error ? err.message : 'Unable to update student.');
    }
  };

  const handleConfirmRemove = async (studentUid: string) => {
    if (!activeClassroom) return;
    setRosterActionError(null);
    try {
      await removeStudentFromClassroom(activeClassroom.id, studentUid);
      setConfirmRemoveUid(null);
    } catch (err) {
      setRosterActionError(err instanceof Error ? err.message : 'Unable to remove student.');
    }
  };

  const handleAuthorizeFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyError(null);
    setFacultySuccess(null);
    if (!facultyEmail.trim().includes('@')) {
      setFacultyError('Enter a valid faculty Google email address.');
      return;
    }
    setFacultyLoading(true);
    try {
      await authorizeTeacherEmail(facultyEmail);
      setFacultySuccess(
        `Authorized ${facultyEmail.trim().toLowerCase()} in /teacherAllowlist. They can now register a Teacher / Admin account.`
      );
      setFacultyEmail('');
    } catch (err) {
      setFacultyError(err instanceof Error ? err.message : 'Unable to authorize faculty email.');
    } finally {
      setFacultyLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Classroom Switcher Cards */}
      <section aria-label="Your Classrooms" className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Course &amp; Classroom Directory ({workspace.classrooms.length})
            </h2>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              Select a classroom to manage its student invite code and enrolled roster.
            </p>
          </div>
        </div>

        {workspace.classrooms.length === 0 ? (
          <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
            No classrooms created yet. Create your first classroom below to generate a unique student join code.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workspace.classrooms.map((cls) => {
              const isSelected = cls.id === (activeClassroom?.id ?? selectedClassroomId);
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassroomId(cls.id);
                    setEditingUid(null);
                    setConfirmRemoveUid(null);
                    setCodeError(null);
                    setCodeStatus(null);
                  }}
                  aria-pressed={isSelected}
                  className={`rounded-lg border p-4 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-[#0284C7] bg-sky-50/70 dark:bg-sky-950/40'
                      : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] hover:border-sky-300 dark:hover:border-sky-700 hover:bg-[#F8FAFE] dark:hover:bg-[#132644]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white truncate">
                    {cls.courseCode ? `${cls.courseCode} · ${cls.name}` : cls.name}
                  </p>
                  <p className="mt-1 text-xs text-[#334B6E] dark:text-[#C5D5EA] truncate">
                    {cls.subject} · {cls.gradeLevel}
                    {cls.semester ? ` · ${cls.semester}` : ''}
                    {cls.credits ? ` · ${cls.credits} cr` : ''}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                    <span>{cls.students.length} students</span>
                    <span className="font-mono font-semibold text-[#0F294A] dark:text-sky-300">
                      Code: {cls.joinCode}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Two-column Create Classroom + Invite Code Manager */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Create New Classroom */}
        <section className="lg:col-span-6 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              Create New Course / Classroom
            </h2>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
              Each classroom receives a unique invite code students can use on sign-in.
            </p>
          </div>

          <form onSubmit={handleCreateClassroom} className="space-y-3.5">
            <div>
              <label htmlFor="cls-name" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                Classroom / Section Name
              </label>
              <input
                id="cls-name"
                type="text"
                value={clsName}
                onChange={(e) => setClsName(e.target.value)}
                placeholder="e.g., B.Tech CSE — Database Management Systems"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="cls-subject" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Subject
                </label>
                <input
                  id="cls-subject"
                  type="text"
                  value={clsSubject}
                  onChange={(e) => setClsSubject(e.target.value)}
                  placeholder="e.g., DBMS"
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cls-grade" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Level / Year
                </label>
                <input
                  id="cls-grade"
                  type="text"
                  value={clsGrade}
                  onChange={(e) => setClsGrade(e.target.value)}
                  placeholder="e.g., 3rd Year B.Tech"
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="cls-course-code" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Course Code (Optional)
                </label>
                <input
                  id="cls-course-code"
                  type="text"
                  value={clsCourseCode}
                  onChange={(e) => setClsCourseCode(e.target.value.toUpperCase())}
                  placeholder="e.g., CS-304"
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cls-semester" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Semester (Optional)
                </label>
                <input
                  id="cls-semester"
                  type="text"
                  value={clsSemester}
                  onChange={(e) => setClsSemester(e.target.value)}
                  placeholder="e.g., Semester V"
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="cls-credits" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                  Credits
                </label>
                <input
                  id="cls-credits"
                  type="number"
                  min={1}
                  max={10}
                  value={clsCredits}
                  onChange={(e) => setClsCredits(e.target.value)}
                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono tabular-nums text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cls-custom-code" className="block text-xs font-semibold text-[#334B6E] dark:text-[#9EB3D1] mb-1">
                Custom Classroom Join Code (Optional)
              </label>
              <input
                id="cls-custom-code"
                type="text"
                value={clsCustomCode}
                onChange={(e) => setClsCustomCode(e.target.value.toUpperCase())}
                placeholder="Auto-generated if left blank (e.g., DBMS304)"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-[#F1F6FD] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            {clsError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
              >
                {clsError}
              </div>
            )}

            {clsSuccess && (
              <div
                role="status"
                className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200"
              >
                {clsSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={creatingCls}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {creatingCls ? 'Creating...' : 'Create Classroom'}
            </button>
          </form>
        </section>

        {/* Invite Students via Unique Classroom Code */}
        <section className="lg:col-span-6 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                Invite Students via Classroom Code
              </h2>
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                {activeClassroom
                  ? `Share this unique code so students can join ${activeClassroom.name}.`
                  : 'Select or create a classroom to manage its student invite code.'}
              </p>
            </div>

            {activeClassroom ? (
              <>
                <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">Active Invite Code</p>
                    <p
                      data-testid="active-classroom-code"
                      className="mt-1 font-mono text-2xl font-bold tracking-wider text-[#0B1F3A] dark:text-white tabular-nums"
                    >
                      {activeClassroom.joinCode}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy('code')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer whitespace-nowrap"
                    >
                      {copiedType === 'code' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {copiedType === 'code' ? 'Copied Code' : 'Copy Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy('invite')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer whitespace-nowrap"
                    >
                      {copiedType === 'invite' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {copiedType === 'invite' ? 'Copied Invite' : 'Copy Full Invite'}
                    </button>

                    <button
                      type="button"
                      disabled={updatingCode}
                      onClick={handleRegenerateCode}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Regenerate Code
                    </button>
                  </div>
                </div>

                <form onSubmit={handleApplyCustomCode} className="space-y-2 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4">
                  <label htmlFor="update-join-code" className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA]">
                    Set Specific Join Code
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="update-join-code"
                      type="text"
                      value={customCodeInput}
                      onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g., DBMS-2026"
                      className="flex-1 min-w-[180px] rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-xs font-mono text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={updatingCode}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer disabled:opacity-60 whitespace-nowrap"
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                      Update Code
                    </button>
                  </div>
                </form>

                {codeError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
                  >
                    {codeError}
                  </div>
                )}

                {codeStatus && (
                  <div
                    role="status"
                    className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200"
                  >
                    {codeStatus}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">No active classroom selected.</p>
            )}
          </div>

          <p className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-3 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
            Authenticated student accounts self-enroll using this Classroom Invite Code during
            registration or from their Student Portal.
          </p>
        </section>
      </div>

      {isPrimaryAdmin && (
        <section className="rounded-xl border border-sky-200 dark:border-sky-900 bg-white dark:bg-[#0F1E36] p-6 space-y-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#0284C7] dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
                Authorize Faculty / Co-Teacher Email
              </h2>
              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                Grant Teacher / Admin registration access in Firestore (<code className="font-mono">/teacherAllowlist</code>) for verified faculty Google accounts.
              </p>
            </div>
          </div>

          <form onSubmit={handleAuthorizeFaculty} className="flex flex-wrap items-center gap-3">
            <label htmlFor="faculty-allowlist-email" className="sr-only">
              Faculty Email Address
            </label>
            <input
              id="faculty-allowlist-email"
              type="email"
              value={facultyEmail}
              onChange={(e) => setFacultyEmail(e.target.value)}
              placeholder="faculty.member@university.edu"
              className="flex-1 min-w-[240px] rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
            />
            <button
              type="submit"
              disabled={facultyLoading}
              className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {facultyLoading ? 'Authorizing...' : 'Authorize Teacher Email'}
            </button>
          </form>

          {facultyError && (
            <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
              {facultyError}
            </div>
          )}
          {facultySuccess && (
            <div role="status" className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200">
              {facultySuccess}
            </div>
          )}
        </section>
      )}

      {/* Active Class Roster Management */}
      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
              {activeClassroom ? `${activeClassroom.name} — Roster` : 'Classroom Roster'}
            </h2>
            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
              {activeClassroom
                ? `${activeClassroom.students.length} enrolled students · ${activeClassroom.subject} · ${activeClassroom.gradeLevel}`
                : 'Select a classroom above to manage enrolled students.'}
            </p>
          </div>

          {activeClassroom && activeClassroom.students.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="roster-search" className="sr-only">
                Search enrolled students
              </label>
              <input
                id="roster-search"
                type="search"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search name, email, roll no..."
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] pl-8 pr-3 py-1.5 text-xs text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Enroll Student Inline Form */}
        <form onSubmit={handleAddStudent} className="border-b border-[#DCE5F2] dark:border-[#1D3557] pb-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200">
            <UserPlus className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
            <span>Enroll Student Directly</span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-4">
              <label htmlFor="stu-name" className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1">
                Student Full Name
              </label>
              <input
                id="stu-name"
                type="text"
                value={stuName}
                onChange={(e) => setStuName(e.target.value)}
                placeholder="e.g., Diya Deshmukh"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              />
            </div>
            <div className="md:col-span-4">
              <label htmlFor="stu-email" className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1">
                Student Email
              </label>
              <input
                id="stu-email"
                type="email"
                value={stuEmail}
                onChange={(e) => setStuEmail(e.target.value)}
                placeholder="diya@university.edu"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="stu-roll" className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1">
                Roll No (Optional)
              </label>
              <input
                id="stu-roll"
                type="text"
                value={stuRoll}
                onChange={(e) => setStuRoll(e.target.value)}
                placeholder="CS304-05"
                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={addingStu || !activeClassroom}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {addingStu ? 'Enrolling...' : 'Enroll Student'}
              </button>
            </div>
          </div>

          {stuError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
            >
              {stuError}
            </div>
          )}
        </form>

        {rosterActionError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3 py-2 text-xs text-rose-800 dark:text-rose-200"
          >
            {rosterActionError}
          </div>
        )}

        {/* Roster Table */}
        {!activeClassroom || activeClassroom.students.length === 0 ? (
          <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
            No students enrolled in this classroom yet. Enroll students directly above or share invite code{' '}
            <span className="font-mono font-semibold text-[#0B1F3A] dark:text-slate-200">
              {activeClassroom?.joinCode ?? '—'}
            </span>
            .
          </p>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-[#475D7C] dark:text-[#9EB3D1]">
            <span>No enrolled students match &ldquo;{rosterSearch}&rdquo;.</span>
            <button
              type="button"
              onClick={() => setRosterSearch('')}
              className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                  <th className="py-2.5 pr-4">Roll No</th>
                  <th className="py-2.5 pr-4">Student Name</th>
                  <th className="py-2.5 pr-4">Email</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                {filteredStudents.map((s) => {
                  const isEditing = editingUid === s.uid;
                  const isConfirmingRemove = confirmRemoveUid === s.uid;

                  return (
                    <tr key={s.uid} className="hover:bg-[#F8FAFE] dark:hover:bg-[#132644]">
                      <td className="py-3 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                        {isEditing ? (
                          <>
                            <label htmlFor={`edit-roll-${s.uid}`} className="sr-only">
                              Roll Number for {s.name}
                            </label>
                            <input
                              id={`edit-roll-${s.uid}`}
                              type="text"
                              value={editRoll}
                              onChange={(e) => setEditRoll(e.target.value)}
                              className="w-24 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-2 py-1 text-xs font-mono text-[#0B1F3A] dark:text-slate-100"
                            />
                          </>
                        ) : (
                          s.rollNumber || '—'
                        )}
                      </td>

                      <td className="py-3 pr-4 font-medium text-[#0B1F3A] dark:text-slate-100">
                        {isEditing ? (
                          <>
                            <label htmlFor={`edit-name-${s.uid}`} className="sr-only">
                              Full Name for {s.name}
                            </label>
                            <input
                              id={`edit-name-${s.uid}`}
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full min-w-[140px] rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-2.5 py-1 text-xs text-[#0B1F3A] dark:text-slate-100"
                            />
                          </>
                        ) : (
                          s.name
                        )}
                      </td>

                      <td className="py-3 pr-4 text-[#334B6E] dark:text-[#C5D5EA]">
                        {isEditing ? (
                          <>
                            <label htmlFor={`edit-email-${s.uid}`} className="sr-only">
                              Email for {s.name}
                            </label>
                            <input
                              id={`edit-email-${s.uid}`}
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full min-w-[160px] rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-2.5 py-1 text-xs text-[#0B1F3A] dark:text-slate-100"
                            />
                          </>
                        ) : (
                          s.email
                        )}
                      </td>

                      <td className="py-3 text-right">
                        {isEditing ? (
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveStudentEdit(s.uid)}
                              className="inline-flex items-center gap-1 rounded-md bg-[#0284C7] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer whitespace-nowrap"
                            >
                              <Check className="h-3 w-3" aria-hidden="true" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUid(null);
                                setRosterActionError(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-2.5 py-1 text-xs font-medium text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer whitespace-nowrap"
                            >
                              <X className="h-3 w-3" aria-hidden="true" />
                              Cancel
                            </button>
                          </div>
                        ) : isConfirmingRemove ? (
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              aria-label={`Confirm remove ${s.name}`}
                              onClick={() => handleConfirmRemove(s.uid)}
                              className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer whitespace-nowrap"
                            >
                              Confirm Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveUid(null)}
                              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              aria-label={`Edit ${s.name}`}
                              onClick={() => beginEditStudent(s)}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                            >
                              <Pencil className="h-3 w-3" aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${s.name}`}
                              onClick={() => {
                                setEditingUid(null);
                                setConfirmRemoveUid(s.uid);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer whitespace-nowrap"
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
