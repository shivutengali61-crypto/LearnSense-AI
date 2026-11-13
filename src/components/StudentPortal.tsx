import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Download,
  Eye,
  FileEdit,
  GraduationCap,
  KeyRound,
  Languages,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  MessageSquare,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { buildMaterialEngagementId, buildRevisionTaskId } from '../lib/repoRules';
import {
  computeConceptMastery,
  extractKnownConcepts,
  generateRevisionRecommendations,
  getApprovedQuestions,
  getEvidenceStrength,
} from '../utils/mastery';
import {
  computeElapsedSeconds,
  clampDurationSeconds,
  formatCountdown,
  getTimerSeverity,
} from '../utils/examTimer';
import {
  computeStudentDashboardOverview,
  computeUnreadNotificationsCount,
} from '../utils/communication';
import { ConceptMasteryBarChart, MasteryStatusLabel } from './Charts';
import { StudentPerformanceDashboard } from './StudentPerformanceDashboard';
import { BilingualTutorPanel } from './BilingualTutorPanel';
import { DbmsCurriculumBrowser } from './DbmsCurriculumBrowser';
import { AccountSettingsModal } from './AccountSettingsModal';
import { TopNavBar } from './TopNavBar';
import { CommunicationHub } from './CommunicationHub';
import type {
  Assessment,
  AssessmentSubmission,
  LanguageCode,
  StudyMaterial,
} from '../types/learnsense';

type StudentTab =
  | 'dashboard'
  | 'curriculum'
  | 'materials'
  | 'tests'
  | 'mastery'
  | 'tutor'
  | 'communication';

export const StudentPortal: React.FC = () => {
  const {
    user,
    dataLoading,
    isDemoMode,
    workspace,
    selectedClassroomId,
    setSelectedClassroomId,
    setActiveConversationId,
    allNotifications,
    errorMessage,
    clearError,
    refreshWorkspace,
    joinClassroomWithCode,
    submitAssessment,
    acknowledgeAnnouncement,
    startDirectConversation,
    toggleRevisionTask,
    trackMaterialEngagement,
    saveStudentNote,
    deleteStudentNote,
    switchDemoRole,
    logout,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');
  const [commSection, setCommSection] = useState<'messages' | 'announcements'>('messages');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Join classroom with code state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joiningClass, setJoiningClass] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Active online test + countdown timer state
  const [activeTest, setActiveTest] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [testError, setTestError] = useState<string | null>(null);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<AssessmentSubmission | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(0);
  const autoSubmittedRef = useRef(false);
  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

  // Tutor pre-fill when jumping from weak concept or DBMS Curriculum
  const [tutorConceptSeed, setTutorConceptSeed] = useState('');
  const [tutorMistakeSeed, setTutorMistakeSeed] = useState('');
  const [tutorModeSeed, setTutorModeSeed] = useState<'explain' | 'notes'>('explain');
  const [tutorContextSeed, setTutorContextSeed] = useState('');

  // Persisted revision task, material tracking & bilingual student notes state
  const [togglingRevisionConceptId, setTogglingRevisionConceptId] = useState<string | null>(null);
  const [trackingMaterialKey, setTrackingMaterialKey] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteConceptId, setNoteConceptId] = useState('');
  const [noteLanguage, setNoteLanguage] = useState<LanguageCode>('en');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);

  const activeClassroom = useMemo(
    () =>
      workspace.classrooms.find((c) => c.id === selectedClassroomId) ??
      workspace.classrooms[0] ??
      null,
    [workspace.classrooms, selectedClassroomId]
  );

  const classMaterials = useMemo(
    () =>
      activeClassroom
        ? workspace.materials.filter((m) => m.classroomId === activeClassroom.id)
        : [],
    [workspace.materials, activeClassroom]
  );

  const publishedTests = useMemo(
    () =>
      activeClassroom
        ? workspace.assessments.filter(
            (a) => a.classroomId === activeClassroom.id && a.status === 'published'
          )
        : [],
    [workspace.assessments, activeClassroom]
  );

  const mySubmissions = useMemo(
    () =>
      workspace.submissions
        .filter(
          (s) =>
            s.studentUid === user?.uid &&
            (!activeClassroom || s.classroomId === activeClassroom.id)
        )
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [workspace.submissions, user?.uid, activeClassroom]
  );

  const knownConcepts = useMemo(
    () => extractKnownConcepts(classMaterials, publishedTests),
    [classMaterials, publishedTests]
  );

  const myMastery = useMemo(
    () => computeConceptMastery(mySubmissions, publishedTests, knownConcepts, user?.uid),
    [mySubmissions, publishedTests, knownConcepts, user?.uid]
  );

  const revisionRecs = useMemo(
    () => generateRevisionRecommendations(myMastery, classMaterials, publishedTests),
    [myMastery, classMaterials, publishedTests]
  );

  const studentOverview = useMemo(
    () =>
      computeStudentDashboardOverview({
        studentUid: user?.uid ?? '',
        classrooms: workspace.classrooms,
        materials: workspace.materials,
        assessments: workspace.assessments,
        submissions: workspace.submissions,
        announcements: workspace.announcements,
        conversations: workspace.conversations,
        attendanceSessions: workspace.attendanceSessions,
        classroomActivities: workspace.classroomActivities,
      }),
    [
      user?.uid,
      workspace.classrooms,
      workspace.materials,
      workspace.assessments,
      workspace.submissions,
      workspace.announcements,
      workspace.conversations,
      workspace.attendanceSessions,
      workspace.classroomActivities,
    ]
  );

  const classStudentNotes = useMemo(
    () =>
      workspace.studentNotes
        .filter(
          (n) =>
            n.studentUid === user?.uid &&
            (!activeClassroom || n.classroomId === activeClassroom.id)
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [workspace.studentNotes, user?.uid, activeClassroom]
  );

  const unreadNotifications = useMemo(
    () => computeUnreadNotificationsCount(allNotifications),
    [allNotifications]
  );

  const completedAssessmentIds = new Set(mySubmissions.map((s) => s.assessmentId));
  const upcomingTests = publishedTests.filter((t) => !completedAssessmentIds.has(t.id));

  useEffect(() => {
    if (!activeTest) return;
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeTest?.id]);

  useEffect(() => {
    if (
      !activeTest ||
      remainingSeconds > 0 ||
      totalDurationSeconds <= 0 ||
      autoSubmittedRef.current ||
      submittingTest
    ) {
      return;
    }
    autoSubmittedRef.current = true;
    setSubmittingTest(true);
    setTestError(null);
    submitAssessment(activeTest.id, answersRef.current, {
      elapsedSeconds: totalDurationSeconds,
      timedOut: true,
    })
      .then((submission) => {
        setLatestSubmission(submission);
        setActiveTest(null);
      })
      .catch((err) => {
        setTestError(err instanceof Error ? err.message : 'Unable to auto-submit expired exam.');
      })
      .finally(() => {
        setSubmittingTest(false);
      });
  }, [activeTest, remainingSeconds, totalDurationSeconds, submittingTest, submitAssessment]);

  const handleStartTest = (assessment: Assessment) => {
    const priorAttempts = mySubmissions.filter((s) => s.assessmentId === assessment.id);
    if (priorAttempts.length > 0 && !assessment.allowRetakes) {
      setTestError('Duplicate submission blocked: retakes are locked by your teacher.');
      return;
    }
    const durationSecs = clampDurationSeconds(assessment.durationMinutes);
    setTotalDurationSeconds(durationSecs);
    setRemainingSeconds(durationSecs);
    autoSubmittedRef.current = false;
    setActiveTest(assessment);
    setAnswers({});
    setTestError(null);
    setLatestSubmission(null);
    setActiveTab('tests');
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    if (!joinCodeInput.trim()) {
      setJoinError('Enter a classroom invite code.');
      return;
    }
    setJoiningClass(true);
    try {
      const joined = await joinClassroomWithCode(joinCodeInput);
      setJoinSuccess(`Enrolled in ${joined.name}.`);
      setJoinCodeInput('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join classroom.');
    } finally {
      setJoiningClass(false);
    }
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTest) return;
    setTestError(null);
    const approved = getApprovedQuestions(activeTest);
    const unanswered = approved.filter((q) => !(answers[q.id] || '').trim());
    if (unanswered.length > 0) {
      setTestError(
        `Please answer all ${approved.length} questions before submitting (${unanswered.length} remaining).`
      );
      return;
    }
    setSubmittingTest(true);
    try {
      const elapsedSeconds = computeElapsedSeconds(totalDurationSeconds, remainingSeconds);
      const submission = await submitAssessment(activeTest.id, answers, {
        elapsedSeconds,
        timedOut: false,
      });
      setLatestSubmission(submission);
      setActiveTest(null);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Unable to submit assessment.');
    } finally {
      setSubmittingTest(false);
    }
  };

  const openTutorForConcept = (
    conceptName: string,
    mistakeNote?: string,
    mode: 'explain' | 'notes' = 'explain',
    contextText = ''
  ) => {
    setTutorConceptSeed(conceptName);
    setTutorMistakeSeed(mistakeNote || '');
    setTutorModeSeed(mode);
    setTutorContextSeed(contextText);
    setActiveTab('tutor');
  };

  const handleMessageTeacher = async () => {
    if (!activeClassroom) return;
    try {
      const conv = await startDirectConversation(activeClassroom.id);
      setActiveConversationId(conv.id);
      setCommSection('messages');
      setActiveTab('communication');
    } catch {
      setCommSection('messages');
      setActiveTab('communication');
    }
  };

  const handleToggleRevision = async (conceptId: string, conceptName: string) => {
    if (!activeClassroom) return;
    setTogglingRevisionConceptId(conceptId);
    try {
      const matchedMat = classMaterials.find((m) =>
        m.topics.some(
          (t) => t.title.toLowerCase() === conceptName.toLowerCase() || t.id === conceptId
        )
      );
      await toggleRevisionTask({
        classroomId: activeClassroom.id,
        teacherUid: activeClassroom.teacherUid,
        conceptId,
        conceptName,
        matchedMaterialId: matchedMat?.id,
        matchedMaterialTitle: matchedMat?.title,
      });
    } finally {
      setTogglingRevisionConceptId(null);
    }
  };

  const handleTrackMaterial = async (material: StudyMaterial, status: 'viewed' | 'completed') => {
    setTrackingMaterialKey(`${material.id}_${status}`);
    try {
      await trackMaterialEngagement({ material, status });
    } finally {
      setTrackingMaterialKey(null);
    }
  };

  const handleSaveStudentNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);
    setNoteSuccess(null);
    if (!activeClassroom) {
      setNoteError('Select or join a classroom before saving notes.');
      return;
    }
    const cleanTitle = noteTitle.trim();
    const cleanContent = noteContent.trim();
    if (cleanTitle.length < 2) {
      setNoteError('Note title must be at least 2 characters.');
      return;
    }
    if (cleanContent.length < 2) {
      setNoteError('Note content must be at least 2 characters.');
      return;
    }

    const matchedConcept = knownConcepts.find((c) => c.conceptId === noteConceptId);
    setSavingNote(true);
    try {
      await saveStudentNote({
        classroomId: activeClassroom.id,
        conceptId: matchedConcept?.conceptId,
        conceptName: matchedConcept?.conceptName,
        title: cleanTitle,
        content: cleanContent,
        language: noteLanguage,
      });
      setNoteTitle('');
      setNoteContent('');
      setNoteSuccess('Revision note saved to your Firestore notebook.');
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Unable to save revision note.');
    } finally {
      setSavingNote(false);
    }
  };

  const navItems: Array<{
    id: StudentTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'curriculum',
      label: 'DBMS Curriculum',
      icon: <Database className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'materials',
      label: 'Study Materials',
      icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'tests',
      label: 'Online Tests',
      icon: <ClipboardList className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'mastery',
      label: 'Concept Mastery',
      icon: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'tutor',
      label: 'Bilingual AI Tutor',
      icon: <Languages className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'communication',
      label: 'Messages & Notices',
      icon: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
      badge: studentOverview.unreadMessagesCount,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1F3A] dark:bg-[#050E1C] border-r border-[#1D3557] text-[#F1F6FD] p-5">
      <div className="space-y-6">
        <div className="border-b border-[#1D3557] pb-4">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            LearnSense AI
          </span>
          <p className="mt-0.5 text-xs text-sky-300 font-medium">
            Student Learning Portal
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="student-classroom-select"
            className="block text-xs font-medium text-[#9EB3D1]"
          >
            Course / Classroom
          </label>
          <select
            id="student-classroom-select"
            value={activeClassroom?.id ?? ''}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="w-full rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-2 text-xs font-medium text-white focus:border-sky-400 focus:outline-none"
          >
            {workspace.classrooms.length === 0 ? (
              <option value="">No classrooms joined</option>
            ) : (
              workspace.classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode ? `${c.courseCode} · ${c.name}` : c.name}
                </option>
              ))
            )}
          </select>

          <form onSubmit={handleJoinClassroom} className="pt-1.5 space-y-1.5">
            <label htmlFor="sidebar-join-code" className="sr-only">
              Join Classroom Code
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="sidebar-join-code"
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Code (e.g. DBMS304)"
                className="min-w-0 flex-1 rounded-lg border border-[#1D3557] bg-[#0F294A] px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-[#7D95B8] focus:border-sky-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={joiningClass}
                className="rounded-lg bg-[#0284C7] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {joiningClass ? '...' : 'Join'}
              </button>
            </div>
            {joinError && <p className="text-xs text-rose-300">{joinError}</p>}
            {joinSuccess && <p className="text-xs text-sky-300">{joinSuccess}</p>}
          </form>
        </div>

        <nav aria-label="Student Portal Navigation" className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#C5D5EA] hover:bg-[#132C4E] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="rounded-md bg-sky-400/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-sky-200 tabular-nums">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-3 border-t border-[#1D3557] pt-4">
        <div className="text-xs">
          <p className="font-semibold text-white truncate">{user?.name}</p>
          <p className="text-[#9EB3D1] truncate">{user?.email}</p>
          {isDemoMode && (
            <p className="mt-1 text-sky-300 font-medium">Sample Data · Starter Curriculum</p>
          )}
        </div>

        {isDemoMode && (
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => switchDemoRole('teacher')}
              className="w-full rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-2 text-xs font-medium text-[#E2ECF9] hover:bg-[#173B69] transition-colors cursor-pointer"
            >
              Switch to Teacher Portal
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('admin')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-[#173B69] transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Switch to Admin Console
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D3557] bg-[#0F294A]/70 px-3 py-2 text-xs font-medium text-[#E2ECF9] hover:bg-[#173B69] transition-colors cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" aria-hidden="true" />
          Account Settings
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D3557] bg-[#0F294A]/70 px-3 py-2 text-xs font-medium text-[#E2ECF9] hover:bg-[#173B69] transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-portal="student"
      className="min-h-screen bg-[#F4F7FB] dark:bg-[#071224] text-[#0B1F3A] dark:text-[#F1F6FD] flex"
    >
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ls-sidebar-scroll">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 shrink-0 h-full">{sidebarContent}</div>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="flex-1 bg-[#0B1F3A]/50 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar
          title={activeClassroom ? activeClassroom.name : 'Student Learning Space'}
          subtitle={
            activeClassroom ? (
              <span>
                {activeClassroom.courseCode ? `${activeClassroom.courseCode} · ` : ''}
                {activeClassroom.subject} · Teacher: {activeClassroom.teacherName}
              </span>
            ) : (
              'Join a classroom with an invite code to access study notes and tests'
            )
          }
          mobileMenuOpen={mobileMenuOpen}
          onOpenMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onOpenSettings={() => setSettingsOpen(true)}
          onNavigate={({ tab, classroomId, targetId, kind }) => {
            if (classroomId) {
              setSelectedClassroomId(classroomId);
            }
            if (tab === 'communication') {
              setCommSection(kind === 'announcement' ? 'announcements' : 'messages');
              if (
                (kind === 'conversation' ||
                  kind === 'teacher_message' ||
                  kind === 'student_message') &&
                targetId
              ) {
                setActiveConversationId(targetId);
              }
            }
            if (
              tab === 'dashboard' ||
              tab === 'curriculum' ||
              tab === 'materials' ||
              tab === 'tests' ||
              tab === 'mastery' ||
              tab === 'tutor' ||
              tab === 'communication'
            ) {
              setActiveTab(tab);
            }
          }}
          primaryAction={{
            label: 'Ask AI Tutor',
            onClick: () => setActiveTab('tutor'),
            variant: 'student',
          }}
        />

        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <div key={activeTab} className="ls-panel-enter space-y-8">
            {isDemoMode && (
              <div
                role="note"
                className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/90 dark:bg-sky-950/40 px-4 py-2.5 text-xs text-[#0B1F3A] dark:text-sky-100 flex flex-wrap items-center justify-between gap-2"
              >
                <span className="font-medium">
                  <strong>Sample Data · Starter Curriculum:</strong> Demonstration student marks, courses, and mastery snapshots are clearly labelled for interactive preview and are separate from live university records.
                </span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-900 dark:text-rose-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => refreshWorkspace()}
                    className="rounded-md border border-rose-300 dark:border-rose-700 bg-white dark:bg-[#0F1E36] px-2.5 py-1 font-semibold text-rose-800 dark:text-rose-200 hover:bg-rose-100 cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={clearError}
                    className="rounded-md px-2 py-1 font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {dataLoading && workspace.classrooms.length === 0 && (
              <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                Synchronizing your enrolled classrooms, study notes, tests, messages, and scores from Firestore...
              </div>
            )}

            {activeTab === 'curriculum' && (
              <DbmsCurriculumBrowser
                initialLanguage={user?.preferredLanguage ?? 'en'}
                onGenerateNotes={(topicTitle, unitContext) =>
                  openTutorForConcept(topicTitle, '', 'notes', unitContext)
                }
                onAskTutor={(topicTitle, promptContext) =>
                  openTutorForConcept(topicTitle, '', 'explain', promptContext)
                }
              />
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {!dataLoading && workspace.classrooms.length === 0 && (
                  <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <KeyRound className="h-5 w-5 text-[#0284C7] dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Join a Classroom with Invite Code
                        </h2>
                        <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] mt-0.5">
                          You are not enrolled in any classrooms yet. Enter the unique Classroom Invite Code shared by your teacher to unlock study materials and tests.
                        </p>
                      </div>
                    </div>
                    <form onSubmit={handleJoinClassroom} className="flex flex-wrap items-center gap-3 max-w-md">
                      <label htmlFor="empty-join-code" className="sr-only">
                        Classroom Invite Code
                      </label>
                      <input
                        id="empty-join-code"
                        type="text"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter Classroom Code (e.g., DBMS304)"
                        className="flex-1 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={joiningClass}
                        className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {joiningClass ? 'Joining...' : 'Join Classroom'}
                      </button>
                    </form>
                  </section>
                )}

                {/* Student SaaS KPI Summary Row */}
                <section
                  aria-label="Student Dashboard KPIs"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
                >
                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Enrolled Classrooms
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                      {studentOverview.enrolledClassroomsCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Active enrollments
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Available Materials
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                      {studentOverview.availableMaterialsCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {classMaterials.length} in active class
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Pending Assessments
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#0284C7] dark:text-sky-400 tabular-nums">
                      {studentOverview.pendingAssessments.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {studentOverview.upcomingDeadlines[0]?.dueDate
                        ? `Next due ${studentOverview.upcomingDeadlines[0].dueDate}`
                        : 'Ready to complete'}
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Completed Assessments
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                      {studentOverview.completedAssessmentsCount}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {studentOverview.averageScorePct !== null
                        ? `${studentOverview.averageScorePct}% overall avg`
                        : 'No completed tests yet'}
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      My Attendance
                    </p>
                    {studentOverview.attendanceRecorded &&
                    studentOverview.attendancePct !== null ? (
                      <>
                        <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                          {studentOverview.attendancePct}%
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          From teacher roll calls
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-lg font-bold text-slate-600 dark:text-slate-300">
                          Not Recorded
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          No roll sessions yet
                        </p>
                      </>
                    )}
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Weak Concepts
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                      {studentOverview.weakConcepts.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {studentOverview.weakConcepts[0]?.conceptName || 'No weak concepts detected'}
                    </p>
                  </div>
                </section>

                {/* Upcoming Deadlines + Recent Scores */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Pending Assessments &amp; Deadlines
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('tests')}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        All Tests →
                      </button>
                    </div>
                    {upcomingTests.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        You have completed all currently published tests for this classroom.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingTests.map((test) => (
                          <div
                            key={test.id}
                            className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                {test.title}
                              </p>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                {getApprovedQuestions(test).length} questions · {test.durationMinutes} min
                                {test.dueDate ? ` · Due ${test.dueDate}` : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartTest(test)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Start Test
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                      Recent Scores
                    </h2>
                    {mySubmissions.length === 0 ? (
                      <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        Complete a test to see your evaluated scores and concept breakdown.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {mySubmissions.map((sub) => {
                          const testTitle =
                            publishedTests.find((t) => t.id === sub.assessmentId)?.title ||
                            'Classroom Assessment';
                          return (
                            <div
                              key={sub.id}
                              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                  {testTitle}
                                </p>
                                <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                  Attempt #{sub.attemptNumber ?? 1} ·{' '}
                                  <span className="capitalize text-emerald-700 dark:text-emerald-400 font-medium">
                                    {sub.evaluationStatus ?? 'evaluated'}
                                  </span>{' '}
                                  · {sub.score}/{sub.maxScore} pts ·{' '}
                                  {new Date(sub.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="font-mono text-lg font-bold text-[#0B1F3A] dark:text-slate-100 tabular-nums">
                                {sub.percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* Scheduled Classroom Activities & Labs */}
                <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        className="h-4 w-4 text-[#0284C7] dark:text-sky-400"
                        aria-hidden="true"
                      />
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Upcoming Classroom Schedule &amp; Activities
                      </h2>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                      {studentOverview.upcomingActivities.length} scheduled
                    </span>
                  </div>

                  {studentOverview.upcomingActivities.length === 0 ? (
                    <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                      No upcoming labs, revision clinics, or classroom activities scheduled yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {studentOverview.upcomingActivities.map((act) => (
                        <div
                          key={act.id}
                          className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                            <span className="uppercase tracking-wide text-[#0284C7] dark:text-sky-400">
                              {act.activityType.replace('_', ' ')}
                            </span>
                            <span className="font-mono text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                              {act.scheduledDate}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100">
                            {act.title}
                          </p>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                            {act.classroomName}
                          </p>
                          {act.description && (
                            <p className="text-xs text-[#334B6E] dark:text-[#C5D5EA] pt-0.5">
                              {act.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Teacher Announcements & Recent Messages */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <section className="lg:col-span-6 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Teacher Announcements
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCommSection('announcements');
                          setActiveTab('communication');
                        }}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        View All →
                      </button>
                    </div>

                    {studentOverview.recentAnnouncements.length === 0 ? (
                      <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        No classroom announcements posted yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {studentOverview.recentAnnouncements.slice(0, 3).map((ann) => {
                          const acknowledged = user
                            ? ann.acknowledgedBy.includes(user.uid)
                            : false;
                          return (
                            <div
                              key={ann.id}
                              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                    {ann.priority === 'important' ? 'Important Notice' : 'Update'} ·{' '}
                                    {ann.classroomName}
                                  </p>
                                  <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100">
                                    {ann.title}
                                  </p>
                                </div>
                                {acknowledged ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                                    <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                    Read
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => acknowledgeAnnouncement(ann.id)}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer shrink-0"
                                  >
                                    <Check className="h-3 w-3" aria-hidden="true" />
                                    Mark Read
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-[#334B6E] dark:text-[#C5D5EA] line-clamp-2">
                                {ann.body}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="lg:col-span-6 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Recent Messages &amp; Notifications
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={handleMessageTeacher}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer tabular-nums"
                      >
                        Message Teacher ({unreadNotifications} alerts) →
                      </button>
                    </div>

                    {studentOverview.recentConversations.length === 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                          Have a question about a lesson or test? Send a direct message to your teacher.
                        </p>
                        {activeClassroom && (
                          <button
                            type="button"
                            onClick={handleMessageTeacher}
                            className="rounded-lg bg-[#0284C7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer"
                          >
                            Start Chat with {activeClassroom.teacherName}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {studentOverview.recentConversations.slice(0, 3).map((conv) => (
                          <button
                            key={conv.id}
                            type="button"
                            onClick={() => {
                              setActiveConversationId(conv.id);
                              setCommSection('messages');
                              setActiveTab('communication');
                            }}
                            className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 text-left hover:bg-[#F8FAFE] dark:hover:bg-[#132644] cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                {conv.title}
                              </p>
                              {user && (conv.unreadCounts?.[user.uid] ?? 0) > 0 && (
                                <span className="font-mono text-xs font-bold text-[#0284C7] dark:text-sky-400 tabular-nums shrink-0">
                                  {conv.unreadCounts[user.uid]} new
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] truncate">
                              {conv.lastMessageText}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Recharts Visual Performance Dashboard (Compact Progression) */}
                <StudentPerformanceDashboard
                  submissions={mySubmissions}
                  assessments={publishedTests}
                  conceptMastery={myMastery}
                  loading={dataLoading}
                  error={errorMessage}
                  onRetry={refreshWorkspace}
                  onTakeAssessmentClick={() => setActiveTab('tests')}
                  compact
                />

                {/* Concept Mastery & Recommended Revision */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <section className="lg:col-span-7 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Concept Mastery Overview
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('mastery')}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Open Progression Charts →
                      </button>
                    </div>
                    <ConceptMasteryBarChart concepts={myMastery} accentVariant="student" />
                  </section>

                  <section className="lg:col-span-5 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                      Recommended Revision Activities
                    </h2>
                    {revisionRecs.length === 0 ? (
                      <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        No weak concepts identified from your evaluated tests.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {revisionRecs.map((rec) => {
                          const taskId = buildRevisionTaskId(
                            user?.uid ?? '',
                            activeClassroom?.id ?? '',
                            rec.conceptId
                          );
                          const taskRecord = workspace.revisionTasks.find((t) => t.id === taskId);
                          const isDone = taskRecord?.status === 'completed';
                          const isSaving = togglingRevisionConceptId === rec.conceptId;

                          return (
                            <div
                              key={rec.conceptId}
                              className={`rounded-lg border p-4 space-y-2 transition-colors ${
                                isDone
                                  ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                                  : 'border-[#DCE5F2] dark:border-[#1D3557]'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100">
                                  {rec.conceptName}
                                </span>
                                <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                                  {rec.masteryPct}%
                                </span>
                              </div>
                              <p className="text-xs text-[#334B6E] dark:text-[#C5D5EA]">
                                {rec.reason}
                              </p>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                                {rec.suggestedAction}
                              </p>
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => openTutorForConcept(rec.conceptName, rec.reason)}
                                  className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                                >
                                  Explain in English / ಕನ್ನಡ →
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  aria-label={`Mark revision for ${rec.conceptName} as ${
                                    isDone ? 'pending' : 'done'
                                  }`}
                                  onClick={() =>
                                    handleToggleRevision(rec.conceptId, rec.conceptName)
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 ${
                                    isDone
                                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                                      : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644]'
                                  }`}
                                >
                                  <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  {isSaving
                                    ? 'Saving...'
                                    : isDone
                                    ? 'Revision Completed ✓'
                                    : 'Mark Revision Done'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-slate-100">
                    Classroom Study Materials
                  </h2>
                  <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                    Read extracted topic notes, track reading completion, or download original classroom files.
                  </p>
                </div>

                {classMaterials.length === 0 ? (
                  <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                    Your teacher has not uploaded study materials to this classroom yet.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {classMaterials.map((mat) => {
                      const engId = buildMaterialEngagementId(mat.id, user?.uid ?? '');
                      const engagement = workspace.materialEngagements.find((e) => e.id === engId);
                      const isCompleted = engagement?.status === 'completed';

                      return (
                        <article
                          key={mat.id}
                          className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                            <div>
                              <h3 className="text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                                {mat.title}
                              </h3>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                                {mat.fileName} · {mat.topics.length} core topics ·{' '}
                                <span
                                  className={
                                    isCompleted
                                      ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                      : engagement
                                      ? 'font-medium text-[#0B1F3A] dark:text-slate-300'
                                      : 'text-[#475D7C] dark:text-[#9EB3D1]'
                                  }
                                >
                                  {isCompleted
                                    ? `Completed (${engagement.viewCount}x)`
                                    : engagement
                                    ? `Viewed (${engagement.viewCount}x)`
                                    : 'Not opened yet'}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={trackingMaterialKey === `${mat.id}_viewed`}
                                onClick={() => handleTrackMaterial(mat, 'viewed')}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer disabled:opacity-60"
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                {trackingMaterialKey === `${mat.id}_viewed`
                                  ? 'Logging...'
                                  : 'Record Read'}
                              </button>
                              <button
                                type="button"
                                disabled={trackingMaterialKey === `${mat.id}_completed`}
                                onClick={() => handleTrackMaterial(mat, 'completed')}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-60 ${
                                  isCompleted
                                    ? 'border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                {trackingMaterialKey === `${mat.id}_completed`
                                  ? 'Saving...'
                                  : isCompleted
                                  ? 'Completed ✓'
                                  : 'Mark Completed'}
                              </button>
                              {mat.fileUrl ? (
                                <a
                                  href={mat.fileUrl}
                                  download={mat.fileName}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644]"
                                >
                                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                                  Download Material
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const blob = new Blob([mat.extractedText], {
                                      type: 'text/plain',
                                    });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = mat.fileName;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#132644] cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                                  Download Notes
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {mat.topics.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 p-3.5 space-y-1"
                              >
                                <p className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-100">
                                  {t.title}
                                </p>
                                <p className="text-xs text-[#334B6E] dark:text-[#C5D5EA]">
                                  {t.description}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/50 p-4">
                            <p className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-2">
                              Study Notes Text
                            </p>
                            <pre className="whitespace-pre-wrap font-sans text-sm text-[#334B6E] dark:text-[#C5D5EA] leading-relaxed">
                              {mat.extractedText}
                            </pre>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Persisted Student Bilingual Revision Notebook */}
                <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                    <div className="flex items-center gap-2">
                      <FileEdit
                        className="h-4 w-4 text-[#0284C7] dark:text-sky-400"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          My Bilingual Revision Notes ({classStudentNotes.length})
                        </h3>
                        <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                          Write personal English or ಕನ್ನಡ summaries for any classroom concept. Saved privately to your Firestore notebook.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveStudentNote} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label
                          htmlFor="student-note-title"
                          className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
                        >
                          Note Title
                        </label>
                        <input
                          id="student-note-title"
                          type="text"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="e.g., BCNF Decomposition Rules"
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="student-note-concept"
                          className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
                        >
                          Linked Concept
                        </label>
                        <select
                          id="student-note-concept"
                          value={noteConceptId}
                          onChange={(e) => setNoteConceptId(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                        >
                          <option value="">General Classroom Note</option>
                          {knownConcepts.map((c) => (
                            <option key={c.conceptId} value={c.conceptId}>
                              {c.conceptName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="student-note-language"
                          className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
                        >
                          Language
                        </label>
                        <select
                          id="student-note-language"
                          value={noteLanguage}
                          onChange={(e) => setNoteLanguage(e.target.value as LanguageCode)}
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                        >
                          <option value="en">English</option>
                          <option value="kn">ಕನ್ನಡ (Kannada)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="student-note-content"
                        className="block text-xs font-semibold text-[#334B6E] dark:text-[#C5D5EA] mb-1"
                      >
                        Revision Summary
                      </label>
                      <textarea
                        id="student-note-content"
                        rows={3}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write key definitions, SQL snippets, or bilingual mnemonics..."
                        className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                      />
                    </div>

                    {noteError && (
                      <p role="alert" className="text-xs font-medium text-rose-700 dark:text-rose-400">
                        {noteError}
                      </p>
                    )}
                    {noteSuccess && (
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        {noteSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={savingNote || !activeClassroom}
                      className="rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer disabled:opacity-60"
                    >
                      {savingNote ? 'Saving Note...' : 'Save Revision Note'}
                    </button>
                  </form>

                  {classStudentNotes.length === 0 ? (
                    <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                      You have not saved any personal revision notes for this classroom yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {classStudentNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/60 p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                {note.title}
                              </p>
                              <p className="text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                                {note.language === 'kn' ? 'ಕನ್ನಡ' : 'English'}
                                {note.conceptName ? ` · ${note.conceptName}` : ''} ·{' '}
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              aria-label={`Delete note ${note.title}`}
                              onClick={() => deleteStudentNote(note.id)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <p className="text-xs text-[#334B6E] dark:text-[#C5D5EA] whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-6">
                {activeTest ? (() => {
                  const approvedQuestions = getApprovedQuestions(activeTest);
                  const answeredCount = approvedQuestions.filter(
                    (q) => Boolean((answers[q.id] || '').trim())
                  ).length;
                  const severity = getTimerSeverity(remainingSeconds, totalDurationSeconds);
                  const timerClasses =
                    severity === 'critical'
                      ? 'border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100'
                      : severity === 'warning'
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100'
                      : 'border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] text-[#0B1F3A] dark:text-[#F1F6FD]';

                  return (
                    <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-6">
                      {/* Sticky Timed Exam HUD */}
                      <div
                        className={`sticky top-16 z-20 rounded-xl border p-4 space-y-3 shadow-sm ${timerClasses}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h2 className="font-display text-lg font-semibold">{activeTest.title}</h2>
                            <p className="text-xs opacity-80 tabular-nums">
                              {answeredCount} of {approvedQuestions.length} questions answered ·{' '}
                              {activeTest.durationMinutes} min time limit
                              {severity === 'critical' ? ' · Auto-submits at 00:00' : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div
                              aria-label="Exam countdown timer"
                              className="inline-flex items-center gap-2 rounded-lg border border-current/20 bg-white/80 dark:bg-[#0F1E36]/80 px-3.5 py-2 font-mono text-lg font-bold tabular-nums"
                            >
                              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span>{formatCountdown(remainingSeconds)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTest(null)}
                              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#132644] cursor-pointer whitespace-nowrap"
                            >
                              Exit Exam
                            </button>
                          </div>
                        </div>

                        {/* Question Palette Quick Jump */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] font-semibold mr-1 opacity-75">
                            Question Palette:
                          </span>
                          {approvedQuestions.map((q, i) => {
                            const isAnswered = Boolean((answers[q.id] || '').trim());
                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => {
                                  document
                                    .getElementById(`exam-q-${q.id}`)
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                                className={`rounded-md px-2 py-1 font-mono text-xs font-semibold tabular-nums cursor-pointer transition-colors ${
                                  isAnswered
                                    ? 'bg-[#0284C7] text-white'
                                    : 'border border-current/25 bg-white/70 dark:bg-[#0F1E36] hover:bg-sky-50 dark:hover:bg-[#132644]'
                                }`}
                              >
                                Q{i + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <form onSubmit={handleSubmitTest} className="space-y-6">
                        {approvedQuestions.map((q, idx) => (
                          <fieldset
                            id={`exam-q-${q.id}`}
                            key={q.id}
                            className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-3"
                          >
                            <legend className="text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1] px-1">
                              Question {idx + 1} · {q.conceptName} ({q.points} pts)
                            </legend>
                            <p className="text-sm font-medium text-[#0B1F3A] dark:text-slate-100">
                              {q.prompt}
                            </p>

                            {q.type === 'mcq' && q.options ? (
                              <div className="space-y-2">
                                {q.options.map((opt) => (
                                  <label
                                    key={opt}
                                    className={`flex items-center gap-2.5 rounded-lg border p-3 text-sm cursor-pointer transition-colors ${
                                      answers[q.id] === opt
                                        ? 'border-[#0284C7] bg-sky-50/80 dark:bg-sky-950/50 text-[#0B1F3A] dark:text-slate-100'
                                        : 'border-[#DCE5F2] dark:border-[#1D3557] hover:bg-[#F8FAFE] dark:hover:bg-[#132644]'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question_${q.id}`}
                                      value={opt}
                                      checked={answers[q.id] === opt}
                                      onChange={(e) =>
                                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                      }
                                      className="text-[#0284C7] focus:ring-[#0284C7]"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div>
                                <label htmlFor={`input_${q.id}`} className="sr-only">
                                  Answer for question {idx + 1}
                                </label>
                                <input
                                  id={`input_${q.id}`}
                                  type="text"
                                  value={answers[q.id] || ''}
                                  onChange={(e) =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                                  }
                                  placeholder="Type your concise answer..."
                                  className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3.5 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                                />
                              </div>
                            )}
                          </fieldset>
                        ))}

                        {testError && (
                          <div
                            role="alert"
                            className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200"
                          >
                            {testError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingTest}
                          className="rounded-lg bg-[#0284C7] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1] transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {submittingTest ? 'Evaluating Answers...' : 'Submit Test for Evaluation'}
                        </button>
                      </form>
                    </section>
                  );
                })() : (
                  <div className="space-y-6">
                    {latestSubmission && (
                      <section className="rounded-xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                            <div>
                              <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-slate-100">
                                Test Evaluated: {latestSubmission.percentage}%
                              </h2>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                Attempt #{latestSubmission.attemptNumber ?? 1} · Status:{' '}
                                <strong className="text-emerald-700 dark:text-emerald-400 capitalize">
                                  {latestSubmission.evaluationStatus ?? 'evaluated'}
                                </strong>{' '}
                                · Scored {latestSubmission.score} out of {latestSubmission.maxScore} points
                                {typeof latestSubmission.elapsedSeconds === 'number'
                                  ? ` · Elapsed ${formatCountdown(latestSubmission.elapsedSeconds)}`
                                  : ''}
                                {latestSubmission.timedOut ? ' · Auto-submitted (Time Expired)' : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('mastery')}
                            className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            View Updated Concept Mastery →
                          </button>
                        </div>

                        <div className="space-y-3">
                          {latestSubmission.responses.map((resp) => (
                            <div
                              key={resp.questionId}
                              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#334B6E] dark:text-[#C5D5EA]">
                                  {resp.conceptName}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    resp.isCorrect
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-700 dark:text-rose-400'
                                  }`}
                                >
                                  {resp.isCorrect ? 'Correct' : 'Needs Review'}
                                </span>
                              </div>
                              <p className="text-sm text-[#0B1F3A] dark:text-slate-100">
                                {resp.prompt}
                              </p>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                                Your answer:{' '}
                                <strong className="text-[#0B1F3A] dark:text-slate-100">
                                  {resp.studentAnswer || '(blank)'}
                                </strong>{' '}
                                · Expected:{' '}
                                <strong className="text-emerald-800 dark:text-emerald-400">
                                  {resp.correctAnswer}
                                </strong>
                              </p>
                              {!resp.isCorrect && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openTutorForConcept(resp.conceptName, resp.mistakeNote)
                                  }
                                  className="mt-1 text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                                >
                                  Ask Bilingual AI Tutor about this mistake →
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section className="space-y-4">
                      <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Published Classroom Tests ({publishedTests.length})
                      </h2>
                      {publishedTests.length === 0 ? (
                        <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                          No published tests available yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {publishedTests.map((test) => {
                            const priorAttempts = mySubmissions.filter(
                              (s) => s.assessmentId === test.id
                            );
                            const latestAttempt = priorAttempts[0];
                            const lockedDuplicate =
                              priorAttempts.length > 0 && !Boolean(test.allowRetakes);

                            return (
                              <div
                                key={test.id}
                                className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-5 flex flex-col justify-between gap-4"
                              >
                                <div className="space-y-1">
                                  <h3 className="text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                                    {test.title}
                                  </h3>
                                  <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                    {getApprovedQuestions(test).length} approved questions ·{' '}
                                    {test.durationMinutes} min ·{' '}
                                    {test.allowRetakes ? 'Retakes allowed' : 'Single attempt'}
                                  </p>
                                  {test.description && (
                                    <p className="text-sm text-[#334B6E] dark:text-[#C5D5EA] pt-1">
                                      {test.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-3">
                                  <div className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                    {latestAttempt ? (
                                      <span>
                                        <strong className="font-mono text-[#0B1F3A] dark:text-slate-100">
                                          {latestAttempt.percentage}%
                                        </strong>{' '}
                                        · Attempt #{latestAttempt.attemptNumber ?? priorAttempts.length}{' '}
                                        ({latestAttempt.evaluationStatus ?? 'evaluated'})
                                      </span>
                                    ) : (
                                      <span>Not attempted yet</span>
                                    )}
                                  </div>

                                  {lockedDuplicate ? (
                                    <button
                                      type="button"
                                      disabled
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224] px-3 py-2 text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1] cursor-not-allowed whitespace-nowrap"
                                    >
                                      <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                                      Submitted · Retakes Locked
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleStartTest(test)}
                                      className="rounded-lg bg-[#0284C7] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer whitespace-nowrap"
                                    >
                                      {priorAttempts.length > 0
                                        ? `Retake Test (Attempt #${priorAttempts.length + 1})`
                                        : 'Take Timed Test'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {mySubmissions.length > 0 && (
                      <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                        <div>
                          <h3 className="text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                            Submitted Attempt History ({mySubmissions.length})
                          </h3>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                            Historical test attempts and evaluation records preserved from Firestore.
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                                <th className="py-2 pr-4">Assessment</th>
                                <th className="py-2 pr-4">Attempt</th>
                                <th className="py-2 pr-4">Duration</th>
                                <th className="py-2 pr-4">Evaluation Status</th>
                                <th className="py-2 pr-4">Submitted</th>
                                <th className="py-2 text-right">Score</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                              {mySubmissions.map((sub) => {
                                const title =
                                  publishedTests.find((t) => t.id === sub.assessmentId)?.title ??
                                  'Classroom Assessment';
                                return (
                                  <tr key={sub.id}>
                                    <td className="py-2.5 pr-4 font-medium text-[#0B1F3A] dark:text-slate-100">
                                      {title}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                      #{sub.attemptNumber ?? 1}
                                    </td>
                                    <td className="py-2.5 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                      {typeof sub.elapsedSeconds === 'number'
                                        ? formatCountdown(sub.elapsedSeconds)
                                        : '—'}
                                      {sub.timedOut ? ' (Timed Out)' : ''}
                                    </td>
                                    <td className="py-2.5 pr-4 text-xs font-semibold capitalize text-emerald-700 dark:text-emerald-400">
                                      {sub.evaluationStatus ?? 'evaluated'}
                                    </td>
                                    <td className="py-2.5 pr-4 text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                      {new Date(sub.submittedAt).toLocaleString()}
                                    </td>
                                    <td className="py-2.5 text-right font-mono font-semibold text-[#0B1F3A] dark:text-slate-100 tabular-nums">
                                      {sub.percentage}% ({sub.score}/{sub.maxScore})
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mastery' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-slate-100">
                    Evidence-Based Concept Mastery &amp; Progression
                  </h2>
                  <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                    Every mastery score reflects your actual evaluated responses. Unassessed concepts
                    are clearly marked until tested.
                  </p>
                </div>

                <StudentPerformanceDashboard
                  submissions={mySubmissions}
                  assessments={publishedTests}
                  conceptMastery={myMastery}
                  loading={dataLoading}
                  error={errorMessage}
                  onRetry={refreshWorkspace}
                  onTakeAssessmentClick={() => setActiveTab('tests')}
                />

                <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-3">
                  <h3 className="text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                    Current Concept Snapshot
                  </h3>
                  <ConceptMasteryBarChart concepts={myMastery} accentVariant="student" />
                </div>

                <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                  <h3 className="text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                    All Curriculum Concepts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                          <th className="py-2.5 pr-4">Concept</th>
                          <th className="py-2.5 pr-4">Status</th>
                          <th className="py-2.5 pr-4">Contributing Questions</th>
                          <th className="py-2.5 pr-4">Evidence Strength</th>
                          <th className="py-2.5 text-right">Mastery</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                        {myMastery.map((c) => {
                          const ev = getEvidenceStrength(c.attemptedCount);
                          return (
                            <tr key={c.conceptId}>
                              <td className="py-3 pr-4 font-medium text-[#0B1F3A] dark:text-slate-100">
                                {c.conceptName}
                              </td>
                              <td className="py-3 pr-4">
                                <MasteryStatusLabel status={c.status} />
                              </td>
                              <td className="py-3 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                {c.attemptedCount > 0
                                  ? `${c.correctCount}/${c.attemptedCount} questions`
                                  : '0 questions'}
                              </td>
                              <td className="py-3 pr-4 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                                {ev.label}
                              </td>
                              <td className="py-3 text-right font-mono font-semibold text-[#0B1F3A] dark:text-slate-100 tabular-nums">
                                {c.masteryPct !== null ? `${c.masteryPct}%` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tutor' && (
              <BilingualTutorPanel
                materials={classMaterials}
                initialConcept={tutorConceptSeed}
                initialMistake={tutorMistakeSeed}
                initialMode={tutorModeSeed}
                initialMaterialContext={tutorContextSeed}
              />
            )}

            {activeTab === 'communication' && (
              <CommunicationHub
                initialSection={commSection}
                onOpenMaterials={(clsId) => {
                  setSelectedClassroomId(clsId);
                  setActiveTab('materials');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {settingsOpen && (
        <AccountSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
};
