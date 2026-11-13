import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  ClipboardCheck,
  Database,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  RotateCcw,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  computeClassAnalytics,
  extractKnownConcepts,
  generateNextLessonRecommendations,
} from '../utils/mastery';
import {
  computeTeacherDashboardOverview,
  computeUnreadNotificationsCount,
} from '../utils/communication';
import type { DbmsUnit } from '../data/dbmsCurriculum';
import { DbmsCurriculumBrowser } from './DbmsCurriculumBrowser';
import { ClassScoreDistributionChart, ConceptMasteryBarChart } from './Charts';
import { ClassroomManager } from './teacher/ClassroomManager';
import { MaterialsTab } from './teacher/MaterialsTab';
import { AssessmentsTab } from './teacher/AssessmentsTab';
import { ReportsTab } from './teacher/ReportsTab';
import { AttendanceActivitiesTab } from './teacher/AttendanceActivitiesTab';
import { AccountSettingsModal } from './AccountSettingsModal';
import { TopNavBar } from './TopNavBar';
import { CommunicationHub } from './CommunicationHub';

type TeacherTab =
  | 'overview'
  | 'classrooms'
  | 'materials'
  | 'curriculum'
  | 'assessments'
  | 'attendance'
  | 'reports'
  | 'communication';

export const TeacherPortal: React.FC = () => {
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
    createMaterialFromText,
    switchDemoRole,
    resetDemoWorkspace,
    startDirectConversation,
    logout,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<TeacherTab>('overview');
  const [commSection, setCommSection] = useState<'messages' | 'announcements'>('messages');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [publishingUnitNumber, setPublishingUnitNumber] = useState<number | null>(null);
  const [publishStatusMessage, setPublishStatusMessage] = useState<string | null>(null);

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

  const classAssessments = useMemo(
    () =>
      activeClassroom
        ? workspace.assessments.filter((a) => a.classroomId === activeClassroom.id)
        : [],
    [workspace.assessments, activeClassroom]
  );

  const classSubmissions = useMemo(
    () =>
      activeClassroom
        ? workspace.submissions.filter((s) => s.classroomId === activeClassroom.id)
        : [],
    [workspace.submissions, activeClassroom]
  );

  const knownConcepts = useMemo(
    () => extractKnownConcepts(classMaterials, classAssessments),
    [classMaterials, classAssessments]
  );

  const analytics = useMemo(
    () =>
      computeClassAnalytics(
        activeClassroom?.students ?? [],
        classAssessments,
        classSubmissions,
        knownConcepts
      ),
    [activeClassroom, classAssessments, classSubmissions, knownConcepts]
  );

  const lessonRecommendations = useMemo(
    () => generateNextLessonRecommendations(analytics, classMaterials),
    [analytics, classMaterials]
  );

  const dashboardOverview = useMemo(
    () =>
      computeTeacherDashboardOverview({
        teacherUid: user?.uid ?? '',
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

  const unreadNotifications = useMemo(
    () => computeUnreadNotificationsCount(allNotifications),
    [allNotifications]
  );

  const handleMessageSupportStudent = async (studentUid: string) => {
    const classroom =
      workspace.classrooms.find((c) => c.studentUids.includes(studentUid)) ?? activeClassroom;
    if (!classroom) return;
    try {
      const conv = await startDirectConversation(classroom.id, studentUid);
      setActiveConversationId(conv.id);
      setCommSection('messages');
      setActiveTab('communication');
    } catch {
      setCommSection('messages');
      setActiveTab('communication');
    }
  };

  const handlePublishDbmsUnit = async (unit: DbmsUnit) => {
    if (!activeClassroom) {
      setPublishStatusMessage('Select or create a classroom first before publishing a DBMS unit.');
      return;
    }
    setPublishingUnitNumber(unit.unitNumber);
    setPublishStatusMessage(null);
    try {
      const compiled = unit.chapters
        .map(
          (ch) =>
            `## ${ch.code} ${ch.title}\n${ch.summaryEn}\n\nKey Takeaways:\n${ch.keyTakeaways
              .map((k) => `- ${k}`)
              .join('\n')}\n\nReference:\n${ch.codeOrDiagram}`
        )
        .join('\n\n');
      const mat = await createMaterialFromText(
        activeClassroom.id,
        `Unit ${unit.unitNumber}: ${unit.title}`,
        compiled
      );
      setPublishStatusMessage(
        `Published "${mat.title}" (${mat.topics.length} extracted concepts) to ${activeClassroom.name}.`
      );
    } catch (err) {
      setPublishStatusMessage(
        err instanceof Error ? err.message : 'Unable to publish DBMS curriculum unit.'
      );
    } finally {
      setPublishingUnitNumber(null);
    }
  };

  const navItems: Array<{
    id: TeacherTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'classrooms',
      label: 'Classrooms & Students',
      icon: <Users className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'materials',
      label: 'Materials & Topics',
      icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'curriculum',
      label: 'DBMS Curriculum',
      icon: <Database className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'assessments',
      label: 'Tests & AI Review',
      icon: <ClipboardCheck className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'attendance',
      label: 'Attendance & Schedule',
      icon: <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'reports',
      label: 'Reports & Lesson Plan',
      icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'communication',
      label: 'Messages & Alerts',
      icon: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
      badge: dashboardOverview.unreadMessagesCount,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1F3A] dark:bg-[#050E1C] border-r border-[#1D3557] text-[#F1F6FD] p-5">
      <div className="space-y-6">
        <div className="border-b border-[#1D3557] pb-4">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            LearnSense AI
          </span>
          <p className="mt-0.5 text-xs text-sky-300 font-medium">Teacher &amp; Faculty Portal</p>
        </div>

        {/* Classroom Switcher */}
        <div className="space-y-1.5">
          <label
            htmlFor="teacher-classroom-select"
            className="block text-xs font-medium text-[#9EB3D1]"
          >
            Active Course / Classroom
          </label>
          <select
            id="teacher-classroom-select"
            value={activeClassroom?.id ?? ''}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="w-full rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-2 text-xs font-medium text-white focus:border-sky-400 focus:outline-none"
          >
            {workspace.classrooms.length === 0 ? (
              <option value="">No classrooms yet</option>
            ) : (
              workspace.classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode ? `${c.courseCode} · ${c.name}` : c.name}
                </option>
              ))
            )}
          </select>
        </div>

        <nav aria-label="Teacher Portal Navigation" className="space-y-1">
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
              onClick={() => switchDemoRole('student')}
              className="w-full rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-2 text-xs font-medium text-[#E2ECF9] hover:bg-[#173B69] transition-colors cursor-pointer"
            >
              Switch to Student Portal
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('admin')}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-[#173B69] transition-colors cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Switch to Admin Console
            </button>
            <button
              type="button"
              onClick={resetDemoWorkspace}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1D3557] px-3 py-1.5 text-xs text-[#C5D5EA] hover:bg-[#132C4E] cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset Demo Data
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
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#071224] text-[#0B1F3A] dark:text-[#F1F6FD] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto ls-sidebar-scroll">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
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

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar
          title={activeClassroom ? activeClassroom.name : 'Teacher Workspace'}
          subtitle={
            activeClassroom ? (
              <span>
                {activeClassroom.courseCode ? `${activeClassroom.courseCode} · ` : ''}
                {activeClassroom.subject} · {activeClassroom.gradeLevel}
                {activeClassroom.semester ? ` · ${activeClassroom.semester}` : ''} · Join Code:{' '}
                <span className="font-mono font-semibold text-[#0B1F3A] dark:text-sky-200">
                  {activeClassroom.joinCode}
                </span>
              </span>
            ) : (
              'Create a classroom to begin authoring materials and assessments'
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
              if (kind === 'conversation' || kind === 'teacher_message' || kind === 'student_message') {
                if (targetId) setActiveConversationId(targetId);
              }
            }
            if (
              tab === 'overview' ||
              tab === 'classrooms' ||
              tab === 'materials' ||
              tab === 'curriculum' ||
              tab === 'assessments' ||
              tab === 'attendance' ||
              tab === 'reports' ||
              tab === 'communication'
            ) {
              setActiveTab(tab);
            }
          }}
          primaryAction={{
            label: 'Manage Tests',
            onClick: () => setActiveTab('assessments'),
            variant: 'teacher',
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
                  <strong>Sample Data · Starter Curriculum:</strong> Demonstration student rosters, marks, and analytics are clearly labelled for interactive preview and are separate from live university records.
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
                    className="rounded-md border border-rose-300 dark:border-rose-700 bg-white dark:bg-[#0F1E36] px-2.5 py-1 font-semibold text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={clearError}
                    className="rounded-md px-2 py-1 font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {dataLoading && workspace.classrooms.length === 0 && (
              <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                Synchronizing classrooms, materials, tests, messages, and student submissions from Firestore...
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-8">
                {!dataLoading && workspace.classrooms.length === 0 && (
                  <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-8 text-center space-y-3">
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                      Welcome to your Teacher Workspace
                    </h2>
                    <p className="mx-auto max-w-md text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                      No classrooms exist yet in your account. Create your first classroom to generate
                      a unique student invite code, upload notes, and publish concept-mapped tests.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('classrooms')}
                      className="rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer"
                    >
                      Create First Classroom
                    </button>
                  </section>
                )}

                {/* Top SaaS KPI Row */}
                <section
                  aria-label="Teacher Workspace Overview KPIs"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
                >
                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Total Classrooms
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                      {dashboardOverview.totalClassrooms}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Active teaching sections
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Total Students
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                      {dashboardOverview.totalStudents}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {analytics.totalStudents} in active class
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Active Assessments
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#0284C7] dark:text-sky-400 tabular-nums">
                      {dashboardOverview.activeAssessmentsCount}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                      {dashboardOverview.recentSubmissions.length} recent submissions
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Avg Class Performance
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#0B1F3A] dark:text-slate-50 tabular-nums">
                      {dashboardOverview.averageClassPerformancePct !== null
                        ? `${dashboardOverview.averageClassPerformancePct}%`
                        : '—'}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      {dashboardOverview.averageClassPerformancePct !== null
                        ? 'From evaluated tests'
                        : 'No evaluated tests yet'}
                    </p>
                  </div>

                  {/* Honest Attendance Distinction: Unavailable vs 0% vs Recorded */}
                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Student Attendance
                    </p>
                    <p className="mt-2 font-mono text-2xl font-bold text-[#0B1F3A] dark:text-slate-100 tabular-nums">
                      {dashboardOverview.attendanceRecorded &&
                      dashboardOverview.attendancePct !== null
                        ? `${dashboardOverview.attendancePct}%`
                        : 'Not Recorded'}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                      {dashboardOverview.attendanceRecorded
                        ? `${dashboardOverview.attendanceSessionsCount} recorded session${dashboardOverview.attendanceSessionsCount === 1 ? '' : 's'}`
                        : 'No attendance sessions recorded'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('attendance')}
                      className="mt-1.5 text-[11px] font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {dashboardOverview.attendanceRecorded ? 'Manage Roll →' : 'Record Attendance →'}
                    </button>
                  </div>
                </section>

                {/* Learning Progress Charts (Selected Classroom) */}
                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Concept Mastery Across Class
                      </h2>
                      <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                        Computed strictly from evaluated student responses in{' '}
                        {activeClassroom?.name ?? 'selected class'}.
                      </p>
                    </div>
                    <ConceptMasteryBarChart
                      concepts={analytics.conceptBreakdown}
                      accentVariant="teacher"
                    />
                  </div>

                  <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Student Assessment Performance
                      </h2>
                      <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                        Average score per student across completed tests.
                      </p>
                    </div>
                    <ClassScoreDistributionChart students={analytics.studentReports} />
                  </div>
                </section>

                {/* Recent Submissions & Students Needing Support */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <section className="lg:col-span-7 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Recent Student Submissions
                        </h2>
                        <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                          Latest evaluated test attempts across your classrooms.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('reports')}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Full Reports →
                      </button>
                    </div>

                    {dashboardOverview.recentSubmissions.length === 0 ? (
                      <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        No student test submissions recorded yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                              <th className="py-2 pr-4">Student</th>
                              <th className="py-2 pr-4">Assessment</th>
                              <th className="py-2 pr-4">Submitted</th>
                              <th className="py-2 text-right">Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                            {dashboardOverview.recentSubmissions.map((sub) => {
                              const assessTitle =
                                workspace.assessments.find((a) => a.id === sub.assessmentId)
                                  ?.title ?? 'Assessment';
                              return (
                                <tr
                                  key={sub.id}
                                  className="hover:bg-[#F8FAFE] dark:hover:bg-[#132644]"
                                >
                                  <td className="py-2.5 pr-4 font-medium text-[#0B1F3A] dark:text-slate-100">
                                    {sub.studentName}
                                  </td>
                                  <td className="py-2.5 pr-4 text-xs text-[#334B6E] dark:text-[#C5D5EA] truncate max-w-[180px]">
                                    {assessTitle}
                                  </td>
                                  <td className="py-2.5 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                    {new Date(sub.submittedAt).toLocaleDateString()}
                                  </td>
                                  <td
                                    className={`py-2.5 text-right font-mono text-xs font-semibold tabular-nums ${
                                      sub.percentage < 65
                                        ? 'text-rose-700 dark:text-rose-400'
                                        : 'text-emerald-700 dark:text-emerald-400'
                                    }`}
                                  >
                                    {sub.percentage}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="lg:col-span-5 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Students Needing Additional Support
                      </h2>
                      <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                        Students scoring below 65% or showing weak concept mastery.
                      </p>
                    </div>

                    {dashboardOverview.studentsNeedingSupport.length === 0 ? (
                      <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        No students currently flagged for priority intervention from evaluated tests.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardOverview.studentsNeedingSupport.map((stu) => (
                          <div
                            key={stu.studentUid}
                            className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                  {stu.studentName}
                                </p>
                                <span className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                                  {stu.averagePct !== null ? `${stu.averagePct}%` : '—'}
                                </span>
                              </div>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] truncate">
                                {stu.weakConcepts.length > 0
                                  ? `Focus: ${stu.weakConcepts.map((w) => w.conceptName).join(', ')}`
                                  : 'Low overall average score'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMessageSupportStudent(stu.studentUid)}
                              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-800 bg-[#EAF1FB] dark:bg-sky-950/50 px-2.5 py-1.5 text-xs font-semibold text-[#0F294A] dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 cursor-pointer"
                            >
                              <MessageSquare className="h-3 w-3" aria-hidden="true" />
                              Message
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Upcoming Tests & Recent Communication / Announcements */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <section className="lg:col-span-5 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Upcoming Tests &amp; Activities
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('assessments')}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Author Tests →
                      </button>
                    </div>

                    {dashboardOverview.upcomingAssessments.length === 0 &&
                    dashboardOverview.upcomingActivities.length === 0 ? (
                      <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        No published tests or classroom activities scheduled yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dashboardOverview.upcomingAssessments.slice(0, 3).map((test) => {
                          const clsName =
                            workspace.classrooms.find((c) => c.id === test.classroomId)?.name ??
                            'Classroom';
                          return (
                            <div
                              key={test.id}
                              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                  {test.title}
                                </p>
                                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                                  {test.dueDate || 'No due date'}
                                </span>
                              </div>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] truncate tabular-nums">
                                {clsName} · {test.durationMinutes} min · {test.questions.length} questions
                              </p>
                            </div>
                          );
                        })}
                        {dashboardOverview.upcomingActivities.slice(0, 3).map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setActiveTab('attendance')}
                            className="w-full rounded-lg border border-sky-200/80 dark:border-sky-900/70 bg-sky-50/40 dark:bg-sky-950/20 p-3.5 text-left space-y-1 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                                {act.title}
                              </p>
                              <span className="font-mono text-xs text-[#0284C7] dark:text-sky-400 shrink-0 tabular-nums">
                                {act.scheduledDate}
                              </span>
                            </div>
                            <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] truncate">
                              {act.classroomName} · {act.activityType.replace('_', ' ')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="lg:col-span-7 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-[#0284C7] dark:text-sky-400" aria-hidden="true" />
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                          Recent Communication &amp; Announcements
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCommSection('messages');
                          setActiveTab('communication');
                        }}
                        className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer tabular-nums"
                      >
                        Open Hub ({unreadNotifications} alerts) →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {dashboardOverview.recentAnnouncements.slice(0, 2).map((ann) => (
                        <button
                          key={ann.id}
                          type="button"
                          onClick={() => {
                            setCommSection('announcements');
                            setActiveTab('communication');
                          }}
                          className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 text-left hover:bg-[#F8FAFE] dark:hover:bg-[#132644] cursor-pointer space-y-1"
                        >
                          <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            Announcement · {ann.classroomName}
                          </p>
                          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                            {ann.title}
                          </p>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] line-clamp-2">
                            {ann.body}
                          </p>
                        </button>
                      ))}

                      {dashboardOverview.recentConversations.slice(0, 2).map((conv) => (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => {
                            setActiveConversationId(conv.id);
                            setCommSection('messages');
                            setActiveTab('communication');
                          }}
                          className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 text-left hover:bg-[#F8FAFE] dark:hover:bg-[#132644] cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-[#0284C7] dark:text-sky-400 truncate">
                              {conv.type === 'classroom' ? 'Class Thread' : 'Direct Thread'}
                            </p>
                            {user && (conv.unreadCounts?.[user.uid] ?? 0) > 0 && (
                              <span className="font-mono text-[11px] font-bold text-[#0284C7] dark:text-sky-400 tabular-nums">
                                {conv.unreadCounts[user.uid]} new
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-[#0B1F3A] dark:text-slate-100 truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] line-clamp-2">
                            {conv.lastMessageText}
                          </p>
                        </button>
                      ))}

                      {dashboardOverview.recentAnnouncements.length === 0 &&
                        dashboardOverview.recentConversations.length === 0 && (
                          <p className="sm:col-span-2 text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                            No messages or announcements yet. Open Messages &amp; Alerts to contact students or broadcast a classroom notice.
                          </p>
                        )}
                    </div>
                  </section>
                </div>

                {/* Individual Student Summary Table for Active Class */}
                <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-slate-100">
                        Active Class Student Roster &amp; Mastery
                      </h2>
                      <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                        Prioritized by students needing targeted concept support in{' '}
                        {activeClassroom?.name ?? 'this class'}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Open Full Diagnostic View →
                    </button>
                  </div>

                  {analytics.studentReports.length === 0 ? (
                    <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                      No students enrolled in this classroom yet. Add students in Classrooms &amp; Students.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                            <th className="py-2.5 pr-4">Student</th>
                            <th className="py-2.5 pr-4">Tests Completed</th>
                            <th className="py-2.5 pr-4">Weak Concepts</th>
                            <th className="py-2.5 pr-4">Status</th>
                            <th className="py-2.5 text-right">Avg Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DCE5F2] dark:divide-[#1D3557]">
                          {analytics.studentReports.map((stu) => (
                            <tr
                              key={stu.studentUid}
                              className="hover:bg-[#F8FAFE] dark:hover:bg-[#132644]"
                            >
                              <td className="py-3 pr-4">
                                <p className="font-medium text-[#0B1F3A] dark:text-slate-100">
                                  {stu.studentName}
                                </p>
                                <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                                  {stu.email}
                                </p>
                              </td>
                              <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                                {stu.testsCompleted}
                              </td>
                              <td className="py-3 pr-4 text-xs text-[#334B6E] dark:text-[#C5D5EA]">
                                {stu.weakConcepts.length > 0
                                  ? stu.weakConcepts.map((w) => w.conceptName).join(', ')
                                  : 'None detected'}
                              </td>
                              <td className="py-3 pr-4 text-xs font-semibold">
                                {stu.testsCompleted === 0 ? (
                                  <span className="text-[#475D7C] dark:text-[#9EB3D1]">
                                    Not Tested
                                  </span>
                                ) : stu.needsSupport ? (
                                  <span className="text-rose-700 dark:text-rose-400">
                                    Needs Support
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 dark:text-emerald-400">
                                    On Track
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right font-mono font-semibold text-[#0B1F3A] dark:text-slate-100 tabular-nums">
                                {stu.averagePct !== null ? `${stu.averagePct}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'classrooms' && <ClassroomManager activeClassroom={activeClassroom} />}

            {activeTab === 'materials' && (
              <MaterialsTab classroomId={activeClassroom?.id ?? ''} materials={classMaterials} />
            )}

            {activeTab === 'curriculum' && (
              <DbmsCurriculumBrowser
                initialLanguage={user?.preferredLanguage ?? 'en'}
                onPublishUnitToCourse={handlePublishDbmsUnit}
                publishingUnitNumber={publishingUnitNumber}
                publishStatusMessage={publishStatusMessage}
              />
            )}

            {activeTab === 'assessments' && (
              <AssessmentsTab
                classroomId={activeClassroom?.id ?? ''}
                materials={classMaterials}
                assessments={classAssessments}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceActivitiesTab classroom={activeClassroom} />
            )}

            {activeTab === 'reports' && (
              <ReportsTab
                classroom={activeClassroom}
                analytics={analytics}
                lessonRecommendations={lessonRecommendations}
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
