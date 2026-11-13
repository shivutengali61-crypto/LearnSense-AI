import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  Database,
  Download,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { SUPABASE_SCHEMA_SQL_PREVIEW, SUPABASE_TABLE_SUMMARIES } from '../data/supabaseSchemaSpec';
import { computeClassAnalytics, extractKnownConcepts } from '../utils/mastery';
import { AccountSettingsModal } from './AccountSettingsModal';
import { ConceptMasteryBarChart } from './Charts';
import { DbmsCurriculumBrowser } from './DbmsCurriculumBrowser';
import { TopNavBar } from './TopNavBar';

type AdminTab = 'overview' | 'courses' | 'curriculum' | 'database' | 'moodle' | 'faculty';

interface MoodleStatusResponse {
  configured: boolean;
  authMethod: string;
  baseUrlHost: string | null;
  siteName?: string;
  moodleRelease?: string;
  supportedFunctions: string[];
  securityGuarantee: string;
}

interface MoodleSyncResponse {
  configured: boolean;
  authMethod: string;
  courses: Array<{
    moodleId: number;
    courseCode: string;
    fullName: string;
    visible: boolean;
    startDateIso?: string;
  }>;
  message: string;
  fieldMapping: Array<{ moodleField: string; learnsenseField: string }>;
}

export const AdminPortal: React.FC = () => {
  const {
    user,
    dataLoading,
    isDemoMode,
    workspace,
    selectedClassroomId,
    setSelectedClassroomId,
    errorMessage,
    clearError,
    refreshWorkspace,
    createClassroom,
    authorizeTeacherEmail,
    switchDemoRole,
    resetDemoWorkspace,
    logout,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Course catalog creation state
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseSubject, setCourseSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [semester, setSemester] = useState('Semester 5');
  const [credits, setCredits] = useState('4');
  const [joinCode, setJoinCode] = useState('');
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseSuccess, setCourseSuccess] = useState<string | null>(null);

  // Faculty allowlist state
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [facultySuccess, setFacultySuccess] = useState<string | null>(null);

  // Supabase schema viewer/download state
  const [schemaCategory, setSchemaCategory] = useState<string>('all');
  const [downloadingSql, setDownloadingSql] = useState(false);
  const [sqlDownloadMsg, setSqlDownloadMsg] = useState<string | null>(null);

  // Authorised Moodle adapter state
  const [moodleStatus, setMoodleStatus] = useState<MoodleStatusResponse | null>(null);
  const [moodleLoading, setMoodleLoading] = useState(false);
  const [moodleSyncing, setMoodleSyncing] = useState(false);
  const [moodleSyncResult, setMoodleSyncResult] = useState<MoodleSyncResponse | null>(null);
  const [moodleError, setMoodleError] = useState<string | null>(null);

  const activeCourse = useMemo(
    () =>
      workspace.classrooms.find((c) => c.id === selectedClassroomId) ??
      workspace.classrooms[0] ??
      null,
    [workspace.classrooms, selectedClassroomId]
  );

  const totalUniqueStudents = useMemo(() => {
    const uids = new Set<string>();
    for (const cls of workspace.classrooms) {
      for (const uid of cls.studentUids) {
        uids.add(uid);
      }
    }
    return uids.size;
  }, [workspace.classrooms]);

  const publishedAssessmentsCount = useMemo(
    () => workspace.assessments.filter((a) => a.status === 'published').length,
    [workspace.assessments]
  );

  const overallAveragePct = useMemo(() => {
    if (workspace.submissions.length === 0) return null;
    const sum = workspace.submissions.reduce((acc, s) => acc + s.percentage, 0);
    return Math.round(sum / workspace.submissions.length);
  }, [workspace.submissions]);

  const institutionalConcepts = useMemo(() => {
    const known = extractKnownConcepts(workspace.materials, workspace.assessments);
    const analytics = computeClassAnalytics(
      activeCourse?.students ?? [],
      workspace.assessments,
      workspace.submissions,
      known
    );
    return analytics.conceptBreakdown;
  }, [activeCourse, workspace.materials, workspace.assessments, workspace.submissions]);

  const filteredSchemaTables = useMemo(() => {
    if (schemaCategory === 'all') return SUPABASE_TABLE_SUMMARIES;
    return SUPABASE_TABLE_SUMMARIES.filter((t) => t.category === schemaCategory);
  }, [schemaCategory]);

  const loadMoodleStatus = async () => {
    setMoodleLoading(true);
    setMoodleError(null);
    try {
      const res = await fetch('/api/integrations/moodle/status');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not inspect Moodle adapter.');
      setMoodleStatus(data);
    } catch (err) {
      setMoodleError(err instanceof Error ? err.message : 'Unable to reach Moodle integration API.');
    } finally {
      setMoodleLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'moodle' && !moodleStatus && !moodleLoading) {
      loadMoodleStatus();
    }
  }, [activeTab]);

  const handleSyncMoodle = async () => {
    setMoodleSyncing(true);
    setMoodleError(null);
    try {
      const res = await fetch('/api/integrations/moodle/sync-courses', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Moodle Web Services sync failed.');
      setMoodleSyncResult(data);
    } catch (err) {
      setMoodleError(err instanceof Error ? err.message : 'Moodle Web Services sync failed.');
    } finally {
      setMoodleSyncing(false);
    }
  };

  const handleDownloadSchemaSql = async () => {
    setDownloadingSql(true);
    setSqlDownloadMsg(null);
    try {
      let sqlContent = SUPABASE_SCHEMA_SQL_PREVIEW;
      const res = await fetch('/api/schema/supabase');
      if (res.ok) {
        const data = await res.json();
        if (data?.sql) sqlContent = data.sql;
      }
      const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'learnsense_supabase_schema.sql';
      a.click();
      URL.revokeObjectURL(url);
      setSqlDownloadMsg('Downloaded learnsense_supabase_schema.sql (16 RLS-protected PostgreSQL tables).');
    } catch {
      setSqlDownloadMsg('Unable to download full schema from server; preview SQL remains visible below.');
    } finally {
      setDownloadingSql(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseError(null);
    setCourseSuccess(null);
    if (!courseName.trim() || !courseSubject.trim() || !gradeLevel.trim()) {
      setCourseError('Course title, subject, and degree/year cohort are required.');
      return;
    }

    setCreatingCourse(true);
    try {
      const parsedCredits = Number(credits);
      const created = await createClassroom({
        name: courseName,
        subject: courseSubject,
        gradeLevel,
        courseCode: courseCode.trim() || undefined,
        semester: semester.trim() || undefined,
        credits: Number.isFinite(parsedCredits) && parsedCredits > 0 ? parsedCredits : undefined,
        joinCode: joinCode.trim() || undefined,
      });
      setCourseName('');
      setCourseCode('');
      setCourseSubject('');
      setGradeLevel('');
      setJoinCode('');
      setCourseSuccess(`Created university course "${created.name}" (${created.joinCode}).`);
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : 'Unable to create course.');
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleAuthorizeFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyError(null);
    setFacultySuccess(null);
    if (!facultyEmail.trim().includes('@')) {
      setFacultyError('Enter a valid university faculty email address.');
      return;
    }
    setFacultyLoading(true);
    try {
      await authorizeTeacherEmail(facultyEmail);
      setFacultySuccess(
        `Authorized ${facultyEmail.trim().toLowerCase()} in Firestore /teacherAllowlist.`
      );
      setFacultyEmail('');
    } catch (err) {
      setFacultyError(err instanceof Error ? err.message : 'Could not authorize faculty account.');
    } finally {
      setFacultyLoading(false);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'courses',
      label: 'Course Catalog',
      icon: <Building2 className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'curriculum',
      label: 'DBMS Curriculum',
      icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'database',
      label: 'Supabase Schema',
      icon: <Database className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'moodle',
      label: 'Moodle REST Adapter',
      icon: <Link2 className="h-4 w-4" aria-hidden="true" />,
    },
    {
      id: 'faculty',
      label: 'Faculty & Governance',
      icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0B1F3A] dark:bg-[#050E1C] border-r border-[#1D3557] text-slate-100 p-5">
      <div className="space-y-6">
        <div className="border-b border-[#1D3557] pb-4">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            LearnSense AI
          </span>
          <p className="mt-0.5 text-xs text-sky-300 font-medium">Administrator Console</p>
        </div>

        <nav aria-label="Administrator Navigation" className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer ${
                activeTab === item.id
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-[#142D52] hover:text-white'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-3 border-t border-[#1D3557] pt-4">
        <div className="text-xs">
          <p className="font-semibold text-white truncate">{user?.name}</p>
          <p className="text-slate-400 truncate">{user?.email}</p>
          {isDemoMode && (
            <p className="mt-1 text-sky-300 font-medium">Demo · Sample Data</p>
          )}
        </div>

        {isDemoMode && (
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => switchDemoRole('teacher')}
              className="w-full rounded-lg border border-[#2C4A75] bg-[#0F294A] px-3 py-2 text-xs font-medium text-slate-100 hover:bg-[#173B69] cursor-pointer whitespace-nowrap"
            >
              Switch to Teacher Portal
            </button>
            <button
              type="button"
              onClick={() => switchDemoRole('student')}
              className="w-full rounded-lg border border-[#2C4A75] bg-[#0F294A] px-3 py-2 text-xs font-medium text-slate-100 hover:bg-[#173B69] cursor-pointer whitespace-nowrap"
            >
              Switch to Student Portal
            </button>
            <button
              type="button"
              onClick={resetDemoWorkspace}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1D3557] px-3 py-1.5 text-xs text-slate-300 hover:bg-[#142D52] cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset Demo Data
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D3557] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#142D52] cursor-pointer whitespace-nowrap"
        >
          <Settings className="h-3.5 w-3.5" aria-hidden="true" />
          Account Settings
        </button>

        <button
          type="button"
          onClick={() => logout()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#1D3557] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-[#142D52] cursor-pointer whitespace-nowrap"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-portal="admin"
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
            className="flex-1 bg-[#0B1F3A]/60 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar
          title="University Administration & LMS Architecture"
          subtitle={
            <span>
              Institutional Governance · {workspace.classrooms.length} Courses ·{' '}
              {isDemoMode ? 'Sample Data Preview' : 'Firestore Live Workspace'}
            </span>
          }
          mobileMenuOpen={mobileMenuOpen}
          onOpenMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onOpenSettings={() => setSettingsOpen(true)}
          onNavigate={({ tab, classroomId }) => {
            if (classroomId) setSelectedClassroomId(classroomId);
            if (
              tab === 'overview' ||
              tab === 'courses' ||
              tab === 'curriculum' ||
              tab === 'database' ||
              tab === 'moodle' ||
              tab === 'faculty'
            ) {
              setActiveTab(tab);
            } else if (tab === 'classrooms') {
              setActiveTab('courses');
            }
          }}
          primaryAction={{
            label: 'Manage Courses',
            onClick: () => setActiveTab('courses'),
            variant: 'teacher',
          }}
        />

        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <div key={activeTab} className="ls-panel-enter space-y-6">
            {isDemoMode && (
              <div
                role="note"
                className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 px-4 py-3 text-xs text-[#0B1F3A] dark:text-sky-100 flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  <strong>Sample Data Notice:</strong> Student rosters, test marks, and analytics shown in Demo Mode are demonstration records and never represent real university student records.
                </span>
                <span className="font-mono font-semibold text-sky-700 dark:text-sky-300">
                  Sample Data · Starter Curriculum
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
                    className="rounded-md border border-rose-300 dark:border-rose-700 bg-white dark:bg-[#0F1E36] px-2.5 py-1 font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={clearError}
                    className="rounded-md px-2 py-1 font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <section
                  aria-label="Institutional KPIs"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Active Courses
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
                      {workspace.classrooms.length}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Department course sections
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Enrolled Students {isDemoMode ? '(Sample Data)' : ''}
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
                      {totalUniqueStudents}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Verified across course rosters
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Published Assessments
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                      {publishedAssessmentsCount}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                      {workspace.submissions.length} evaluated attempts
                    </p>
                  </div>

                  <div className="ls-kpi-card p-5">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Mean Institutional Score
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold text-[#0B1F3A] dark:text-white tabular-nums">
                      {overallAveragePct !== null ? `${overallAveragePct}%` : '—'}
                    </p>
                    <p className="mt-1 text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      {overallAveragePct !== null
                        ? 'Computed from evaluated attempts'
                        : 'Awaiting first evaluated exam'}
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <section className="lg:col-span-7 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
                          Concept Mastery Health — {activeCourse?.name || 'Course'}
                        </h2>
                        <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                          Aggregated directly from submitted exam evidence.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('curriculum')}
                        className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Inspect DBMS Syllabus →
                      </button>
                    </div>
                    <ConceptMasteryBarChart concepts={institutionalConcepts} accentVariant="teacher" />
                  </section>

                  <section className="lg:col-span-5 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                    <h2 className="font-display text-base font-semibold text-[#0B1F3A] dark:text-white">
                      Architecture &amp; Integration Readiness
                    </h2>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 space-y-1">
                        <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                          Live Auth &amp; Database (Active)
                        </p>
                        <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                          Firebase Authentication + Cloud Firestore with strict role-locked security rules.
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                            Supabase PostgreSQL Blueprint
                          </p>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                            16 RLS-enabled tables ready for university data warehouse deployment.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('database')}
                          className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-[#142D52] cursor-pointer whitespace-nowrap"
                        >
                          View SQL
                        </button>
                      </div>
                      <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-3.5 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#0B1F3A] dark:text-white">
                            Moodle LMS API Adapter
                          </p>
                          <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                            Authorised token REST integration (<code className="font-mono break-all">webservice/rest/server.php</code>).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('moodle')}
                          className="rounded-md border border-[#DCE5F2] dark:border-[#1D3557] px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-[#142D52] cursor-pointer whitespace-nowrap"
                        >
                          Configure
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <section className="lg:col-span-5 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4 h-fit">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                      Register University Course
                    </h2>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Provision a course section with academic metadata and unique student enrollment code.
                    </p>
                  </div>

                  <form onSubmit={handleCreateCourse} className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-course-code" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                          Course Code
                        </label>
                        <input
                          id="admin-course-code"
                          type="text"
                          value={courseCode}
                          onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                          placeholder="e.g., CS-402"
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-credits" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                          Credits
                        </label>
                        <input
                          id="admin-credits"
                          type="number"
                          min={1}
                          max={12}
                          value={credits}
                          onChange={(e) => setCredits(e.target.value)}
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm tabular-nums text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="admin-course-name" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                        Course Title
                      </label>
                      <input
                        id="admin-course-name"
                        type="text"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        placeholder="e.g., Operating Systems & Concurrency"
                        className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-subject" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                          Department / Subject
                        </label>
                        <input
                          id="admin-subject"
                          type="text"
                          value={courseSubject}
                          onChange={(e) => setCourseSubject(e.target.value)}
                          placeholder="e.g., Computer Science"
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-cohort" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                          Cohort / Degree Level
                        </label>
                        <input
                          id="admin-cohort"
                          type="text"
                          value={gradeLevel}
                          onChange={(e) => setGradeLevel(e.target.value)}
                          placeholder="e.g., B.E. CSE · Year 3"
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="admin-semester" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                          Semester
                        </label>
                        <input
                          id="admin-semester"
                          type="text"
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          placeholder="Semester 5"
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="admin-join-code" className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1">
                          Join Code (Optional)
                        </label>
                        <input
                          id="admin-join-code"
                          type="text"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="Auto if blank"
                          className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {courseError && (
                      <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
                        {courseError}
                      </div>
                    )}
                    {courseSuccess && (
                      <div role="status" className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs text-[#0B1F3A] dark:text-sky-200">
                        {courseSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={creatingCourse}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      {creatingCourse ? 'Provisioning...' : 'Create Course'}
                    </button>
                  </form>
                </section>

                <section className="lg:col-span-7 rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                      University Course Catalog ({workspace.classrooms.length})
                    </h2>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Active courses, faculty leads, enrollment codes, and assessment counts.
                    </p>
                  </div>

                  {workspace.classrooms.length === 0 ? (
                    <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                      No courses registered yet. Create the first course on the left.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {workspace.classrooms.map((cls) => {
                        const selected = cls.id === activeCourse?.id;
                        const courseTests = workspace.assessments.filter((a) => a.classroomId === cls.id).length;
                        return (
                          <div
                            key={cls.id}
                            className={`rounded-lg border p-4 flex flex-wrap items-center justify-between gap-4 ${
                              selected
                                ? 'border-sky-600 bg-sky-50/50 dark:bg-[#142D52]'
                                : 'border-[#DCE5F2] dark:border-[#1D3557]'
                            }`}
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-sky-700 dark:text-sky-300 font-mono">
                                {cls.courseCode && <span>{cls.courseCode}</span>}
                                {cls.courseCode && <span aria-hidden="true">·</span>}
                                <span>{cls.semester || cls.gradeLevel}</span>
                                {cls.credits && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="tabular-nums">{cls.credits} credits</span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                                {cls.name}
                              </p>
                              <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] tabular-nums">
                                Instructor: {cls.teacherName} · {cls.students.length} students · {courseTests} tests · Join Code:{' '}
                                <strong className="font-mono text-[#0B1F3A] dark:text-white">
                                  {cls.joinCode}
                                </strong>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedClassroomId(cls.id)}
                              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:border-sky-500 cursor-pointer whitespace-nowrap"
                            >
                              {selected ? 'Selected' : 'Inspect Course'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <DbmsCurriculumBrowser initialLanguage={user?.preferredLanguage ?? 'en'} />
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                    <div className="space-y-1">
                      <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                        Supabase PostgreSQL Production Schema (16 RLS Tables)
                      </h2>
                      <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] max-w-3xl">
                        Active runtime persistence uses Firebase Auth + Cloud Firestore. This PostgreSQL DDL defines the production Supabase migration blueprint with Row-Level Security policies for authorised university records.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={downloadingSql}
                      onClick={handleDownloadSchemaSql}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer whitespace-nowrap disabled:opacity-60"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {downloadingSql ? 'Preparing SQL...' : 'Download schema.sql'}
                    </button>
                  </div>

                  {sqlDownloadMsg && (
                    <div role="status" className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-3.5 py-2 text-xs text-[#0B1F3A] dark:text-sky-200">
                      {sqlDownloadMsg}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 bg-[#EAF1FB] dark:bg-[#071224] p-1 rounded-lg w-fit">
                    {[
                      'all',
                      'Identity & RBAC',
                      'Curriculum & Courses',
                      'Assessments & Mastery',
                      'Communication & LMS',
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSchemaCategory(cat)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          schemaCategory === cat
                            ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                            : 'text-[#475D7C] dark:text-[#9EB3D1]'
                        }`}
                      >
                        {cat === 'all' ? 'All Tables (16)' : cat}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                          <th className="py-2.5 pr-4">Table</th>
                          <th className="py-2.5 pr-4">Domain</th>
                          <th className="py-2.5 pr-4">RLS</th>
                          <th className="py-2.5 pr-4">Key Columns</th>
                          <th className="py-2.5">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAF1FB] dark:divide-[#1D3557]">
                        {filteredSchemaTables.map((t) => (
                          <tr key={t.tableName} className="hover:bg-[#F8FAFE] dark:hover:bg-[#142746]/60">
                            <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#0B1F3A] dark:text-white whitespace-nowrap">
                              {t.tableName}
                            </td>
                            <td className="py-3 pr-4 text-xs text-sky-700 dark:text-sky-300 whitespace-nowrap">
                              {t.category}
                            </td>
                            <td className="py-3 pr-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              {t.rlsEnabled ? 'Enabled' : 'Disabled'}
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                              {t.keyColumns.join(', ')}
                            </td>
                            <td className="py-3 text-xs text-[#0B1F3A] dark:text-slate-300">
                              {t.purpose}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-[#1D3557] bg-[#0B1F3A] p-5 space-y-2.5">
                  <h3 className="text-xs font-semibold text-sky-300">
                    SQL Blueprint Excerpt (/supabase/schema.sql)
                  </h3>
                  <pre className="overflow-x-auto font-mono text-xs text-slate-100 leading-relaxed whitespace-pre">
                    {SUPABASE_SCHEMA_SQL_PREVIEW}
                  </pre>
                </section>
              </div>
            )}

            {activeTab === 'moodle' && (
              <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                      Authorised Moodle LMS REST API Adapter
                    </h2>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] max-w-2xl break-words">
                      {moodleStatus?.securityGuarantee ||
                        'Connects exclusively via official university Moodle Web Services REST tokens (webservice/rest/server.php). Never scrapes pages or bypasses institutional LMS authentication.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 max-w-full">
                    <button
                      type="button"
                      disabled={moodleLoading}
                      onClick={loadMoodleStatus}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 hover:border-sky-500 cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${moodleLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                      Check Status
                    </button>
                    <button
                      type="button"
                      disabled={moodleSyncing}
                      onClick={handleSyncMoodle}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] cursor-pointer whitespace-nowrap disabled:opacity-60"
                    >
                      <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {moodleSyncing ? 'Syncing Courses...' : 'Test Authorised Course Sync'}
                    </button>
                  </div>
                </div>

                {moodleError && (
                  <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200">
                    {moodleError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-1">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Server Credential State
                    </p>
                    <p className="text-sm font-semibold text-[#0B1F3A] dark:text-white flex items-center gap-1.5">
                      {moodleStatus?.configured ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                          Connected ({moodleStatus.baseUrlHost})
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                          Not Configured on Server
                        </>
                      )}
                    </p>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Set <code className="font-mono">MOODLE_BASE_URL</code> &amp; <code className="font-mono">MOODLE_WS_TOKEN</code> in server env.
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-1">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Auth Protocol
                    </p>
                    <p className="font-mono text-xs font-semibold text-[#0B1F3A] dark:text-white">
                      {moodleStatus?.authMethod || 'moodle_webservice_rest_token'}
                    </p>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Zero HTML scraping or credential capture
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-1">
                    <p className="text-xs font-medium text-[#475D7C] dark:text-[#9EB3D1]">
                      Allowed WS Functions
                    </p>
                    <p className="font-mono text-xs text-[#0B1F3A] dark:text-slate-200">
                      {(moodleStatus?.supportedFunctions || ['core_course_get_courses']).join(', ')}
                    </p>
                  </div>
                </div>

                {moodleSyncResult && (
                  <div className="space-y-4 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4">
                    <p className="text-xs font-medium text-[#0B1F3A] dark:text-sky-200 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 px-3.5 py-2.5">
                      {moodleSyncResult.message}
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#DCE5F2] dark:border-[#1D3557] text-xs font-semibold text-[#475D7C] dark:text-[#9EB3D1]">
                            <th className="py-2 pr-4">Moodle JSON Field</th>
                            <th className="py-2">LearnSense Target Column</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAF1FB] dark:divide-[#1D3557]">
                          {moodleSyncResult.fieldMapping.map((map) => (
                            <tr key={map.moodleField}>
                              <td className="py-2 pr-4 font-mono text-xs text-[#0B1F3A] dark:text-white">
                                {map.moodleField}
                              </td>
                              <td className="py-2 font-mono text-xs text-sky-700 dark:text-sky-300">
                                {map.learnsenseField}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'faculty' && (
              <section className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                      Faculty Allowlist &amp; Role Governance
                    </h2>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1]">
                      Teacher and Administrator roles are enforced by Firestore Security Rules and cannot be escalated client-side. Authorize verified faculty emails below to permit Teacher registration.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAuthorizeFaculty} className="flex flex-wrap items-center gap-3 max-w-xl">
                  <label htmlFor="admin-faculty-email" className="sr-only">
                    Faculty Email Address
                  </label>
                  <input
                    id="admin-faculty-email"
                    type="email"
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                    placeholder="professor@university.edu"
                    className="flex-1 min-w-[220px] rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-white focus:border-sky-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={facultyLoading}
                    className="rounded-lg bg-[#0F294A] dark:bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-sky-500 cursor-pointer whitespace-nowrap disabled:opacity-60"
                  >
                    {facultyLoading ? 'Authorizing...' : 'Authorize Faculty Email'}
                  </button>
                </form>

                {facultyError && (
                  <div role="alert" className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-xs text-rose-800 dark:text-rose-200">
                    {facultyError}
                  </div>
                )}
                {facultySuccess && (
                  <div role="status" className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-3.5 py-2 text-xs text-[#0B1F3A] dark:text-sky-200">
                    {facultySuccess}
                  </div>
                )}

                <div className="border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                      <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                      <span>Student Data Isolation</span>
                    </div>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                      Firestore rules block students from reading answer keys, unpublished assessment questions, or other students’ private evaluation records.
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] p-4 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                      <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                      <span>Demo vs Live Separation</span>
                    </div>
                    <p className="text-xs text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                      Demonstration student scores and rosters reside exclusively in browser local sandbox state and are visibly tagged Sample Data.
                    </p>
                  </div>
                </div>
              </section>
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
