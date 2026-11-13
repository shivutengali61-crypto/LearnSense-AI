import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { LanguageCode, UserRole } from '../types/learnsense';

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC = () => {
  const {
    signInWithGoogle,
    enterDemoMode,
    authLoading,
    errorMessage,
    clearError,
    theme,
    toggleTheme,
  } = useWorkspace();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>('en');
  const [joinCode, setJoinCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (authMode === 'register' && displayName.trim().length > 0 && displayName.trim().length < 2) {
      setFormError('Full name must be at least 2 characters.');
      return;
    }

    await signInWithGoogle({
      mode: authMode,
      role: selectedRole,
      customName: authMode === 'register' ? displayName.trim() || undefined : undefined,
      preferredLanguage: authMode === 'register' ? preferredLanguage : undefined,
      joinCode:
        authMode === 'register' && selectedRole === 'student' && joinCode.trim()
          ? joinCode.trim().toUpperCase()
          : undefined,
    });
  };

  const switchRole = (role: UserRole) => {
    setSelectedRole(role);
    setFormError(null);
    clearError();
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setFormError(null);
    clearError();
  };

  const roleLabel =
    selectedRole === 'admin' ? 'Administrator' : selectedRole === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#071224] text-[#0B1F3A] dark:text-[#F1F6FD] flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-[#DCE5F2] dark:border-[#1D3557] bg-white/95 dark:bg-[#0B1F3A]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-[#0B1F3A] dark:text-white whitespace-nowrap shrink-0"
          >
            LearnSense <span className="text-[#0284C7] dark:text-sky-400">AI</span>
          </a>
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475D7C] dark:text-[#9EB3D1]"
          >
            <a href="#workflow" className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Workflow
            </a>
            <a href="#portals" className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              3 Role Portals
            </a>
            <a href="#ai-transparency" className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              DBMS Curriculum
            </a>
            <a href="#bilingual" className="hover:text-[#0B1F3A] dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              English &amp; ಕನ್ನಡ
            </a>
          </nav>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-2 text-[#475D7C] dark:text-slate-200 hover:bg-[#EAF1FB] dark:hover:bg-[#142D52] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => enterDemoMode(selectedRole)}
              className="rounded-lg bg-[#0F294A] dark:bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B69] dark:hover:bg-[#0369A1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Launch Demo
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        <section className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
            {/* Left Editorial Column */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8 py-2">
              <div className="space-y-5">
                <p className="font-mono text-xs font-semibold text-[#0284C7] dark:text-sky-300">
                  University-Grade Learning, Assessment &amp; Concept Mastery Platform
                </p>
                <h1 className="font-display text-4xl font-bold tracking-tight text-[#0B1F3A] dark:text-white sm:text-5xl leading-[1.12]">
                  Pinpoint learning gaps concept by concept.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-[#475D7C] dark:text-[#9EB3D1]">
                  Explore a complete 4-Unit DBMS starter curriculum, administer timed online
                  assessments, extract topics from PDFs, and track student mastery from evaluated
                  evidence—paired with English and Kannada study notes and explanations.
                </p>
              </div>

              <div
                id="workflow"
                className="grid grid-cols-1 gap-5 sm:grid-cols-3 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-7"
              >
                <div className="space-y-1.5">
                  <p className="font-mono text-xs font-semibold text-[#0284C7] dark:text-sky-400">
                    01. 4-Unit DBMS Syllabus
                  </p>
                  <h2 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                    Curriculum &amp; PDF Extraction
                  </h2>
                  <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                    Database Fundamentals, SQL, Normalization (1NF–BCNF), and ACID Transactions.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-mono text-xs font-semibold text-[#0284C7] dark:text-sky-400">
                    02. Timed Examinations
                  </p>
                  <h2 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                    Auto-Scored Evidence
                  </h2>
                  <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                    Live countdown exams, question review, and concept-level mastery analytics.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="font-mono text-xs font-semibold text-[#0284C7] dark:text-sky-400">
                    03. Bilingual AI Notes
                  </p>
                  <h2 className="text-sm font-semibold text-[#0B1F3A] dark:text-white">
                    English &amp; Kannada Support
                  </h2>
                  <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                    Generate structured study notes, revision plans, and grounded doubt explanations.
                  </p>
                </div>
              </div>

              <div
                id="ai-transparency"
                className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-5 text-xs text-[#475D7C] dark:text-[#9EB3D1]"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-xs bg-sky-600 dark:bg-sky-400 shrink-0" aria-hidden="true" />
                  Firebase Auth &amp; Firestore Rules
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-xs bg-sky-600 dark:bg-sky-400 shrink-0" aria-hidden="true" />
                  Supabase 16-Table RLS Blueprint
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-xs bg-sky-600 dark:bg-sky-400 shrink-0" aria-hidden="true" />
                  Authorised Moodle REST Adapter
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-xs bg-sky-600 dark:bg-sky-400 shrink-0" aria-hidden="true" />
                  Gemini &amp; Sarvam AI
                </span>
              </div>
            </div>

            {/* Right Portal Sign-In & Registration Card */}
            <div className="lg:col-span-6">
              <div className="h-full rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0F1E36] p-6 sm:p-7 flex flex-col justify-between shadow-sm">
                <div className="space-y-5">
                  <div className="space-y-3 border-b border-[#DCE5F2] dark:border-[#1D3557] pb-4">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-[#0B1F3A] dark:text-white">
                        {authMode === 'login'
                          ? 'Sign in to LearnSense AI'
                          : 'Register Portal Account'}
                      </h2>
                      <p className="mt-1 text-sm text-[#475D7C] dark:text-[#9EB3D1]">
                        {authMode === 'login'
                          ? 'Authenticate with Google. Your verified profile enforces your portal permissions.'
                          : 'Create a verified Firebase account bound to your Student, Teacher, or Administrator role.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#EAF1FB] dark:bg-[#071224] p-1">
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          authMode === 'login'
                            ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                            : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          authMode === 'register'
                            ? 'bg-white dark:bg-[#0F294A] text-[#0B1F3A] dark:text-white shadow-sm'
                            : 'text-[#475D7C] dark:text-[#9EB3D1] hover:text-[#0B1F3A] dark:hover:text-white'
                        }`}
                      >
                        Register Account
                      </button>
                    </div>
                  </div>

                  {/* 3-Role Selector */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200">
                      Select Portal Role
                    </span>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => switchRole('student')}
                        aria-pressed={selectedRole === 'student'}
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                          selectedRole === 'student'
                            ? 'border-[#0284C7] bg-sky-50/80 dark:bg-[#142D52] text-[#0B1F3A] dark:text-white'
                            : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224]/60 text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                          <GraduationCap className="h-4 w-4 text-[#0284C7] dark:text-sky-400 shrink-0" aria-hidden="true" />
                          Student
                        </div>
                        <span className="mt-1 text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                          DBMS syllabus, timed exams &amp; AI tutor
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchRole('teacher')}
                        aria-pressed={selectedRole === 'teacher'}
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                          selectedRole === 'teacher'
                            ? 'border-[#0F294A] dark:border-sky-500 bg-[#EAF1FB]/80 dark:bg-[#142D52] text-[#0B1F3A] dark:text-white'
                            : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224]/60 text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                          <ShieldCheck className="h-4 w-4 text-[#0F294A] dark:text-sky-400 shrink-0" aria-hidden="true" />
                          Teacher
                        </div>
                        <span className="mt-1 text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                          Courses, PDFs, tests &amp; analytics
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchRole('admin')}
                        aria-pressed={selectedRole === 'admin'}
                        className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                          selectedRole === 'admin'
                            ? 'border-[#0F294A] dark:border-sky-500 bg-[#EAF1FB]/80 dark:bg-[#142D52] text-[#0B1F3A] dark:text-white'
                            : 'border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224]/60 text-[#475D7C] dark:text-[#9EB3D1] hover:border-sky-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B1F3A] dark:text-white">
                          <Building2 className="h-4 w-4 text-[#0F294A] dark:text-sky-400 shrink-0" aria-hidden="true" />
                          Administrator
                        </div>
                        <span className="mt-1 text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                          Governance, Supabase &amp; Moodle
                        </span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleGoogleAuth} className="space-y-3.5">
                    {authMode === 'register' && (
                      <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="register-name"
                              className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1"
                            >
                              Full Name (Optional)
                            </label>
                            <input
                              id="register-name"
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder={
                                selectedRole === 'admin'
                                  ? 'Dr. Ramesh Hebbar'
                                  : selectedRole === 'teacher'
                                    ? 'Prof. Kavitha Rao'
                                    : 'Aarav Kulkarni'
                              }
                              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 placeholder:text-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="preferred-language"
                              className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1"
                            >
                              Preferred Language
                            </label>
                            <select
                              id="preferred-language"
                              value={preferredLanguage}
                              onChange={(e) => setPreferredLanguage(e.target.value as LanguageCode)}
                              className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-sm text-[#0B1F3A] dark:text-slate-100 focus:border-[#0284C7] focus:outline-none"
                            >
                              <option value="en">English</option>
                              <option value="kn">ಕನ್ನಡ (Kannada)</option>
                            </select>
                          </div>
                        </div>

                        {selectedRole === 'student' && (
                          <div>
                            <label
                              htmlFor="student-join-code"
                              className="block text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 mb-1"
                            >
                              Course Enrollment Code (Optional)
                            </label>
                            <div className="relative">
                              <KeyRound
                                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                              />
                              <input
                                id="student-join-code"
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="e.g., DBMS304 (or join inside portal later)"
                                className="w-full rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] pl-8 pr-3 py-2 text-sm font-mono text-[#0B1F3A] dark:text-slate-100 placeholder:text-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Security / Role Validation Notice */}
                    <div className="rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#071224]/70 px-3.5 py-2.5 text-xs text-[#475D7C] dark:text-[#9EB3D1] flex items-start gap-2.5">
                      <Lock className="h-4 w-4 text-[#0284C7] dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="leading-relaxed">
                        {selectedRole === 'admin'
                          ? 'Administrator access requires verified primary institutional Google credentials enforced by Firestore security rules.'
                          : selectedRole === 'teacher'
                            ? 'Teacher registration requires verified Google authentication and an authorized faculty email in Firestore (/teacherAllowlist). Roles are locked server-side.'
                            : 'Student access verifies your Google account, isolates your private assessment reports, and grants access only to enrolled courses.'}
                      </p>
                    </div>

                    {(formError || errorMessage) && (
                      <div
                        role="alert"
                        className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-200"
                      >
                        {formError || errorMessage}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-60 ${
                          selectedRole === 'student'
                            ? 'bg-[#0284C7] hover:bg-[#0369A1]'
                            : 'bg-[#0F294A] hover:bg-[#173B69] dark:bg-sky-600 dark:hover:bg-sky-500'
                        }`}
                      >
                        {authLoading
                          ? 'Authenticating...'
                          : `${authMode === 'login' ? 'Sign in' : 'Register'} with Google (${roleLabel})`}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Clearly Labelled Demo Preview Mode */}
                <div className="mt-5 border-t border-[#DCE5F2] dark:border-[#1D3557] pt-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-200">
                      Demo Preview Mode (Sample Data · Starter Curriculum)
                    </span>
                    <span className="font-mono text-[11px] text-[#475D7C] dark:text-[#9EB3D1]">
                      Local sandbox
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => enterDemoMode('student')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/50 px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400 shrink-0" aria-hidden="true" />
                      Student Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => enterDemoMode('teacher')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#1D3557] bg-[#0F294A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#173B69] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Teacher Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => enterDemoMode('admin')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#071224] px-3 py-2 text-xs font-semibold text-[#0B1F3A] dark:text-slate-100 hover:bg-[#EAF1FB] dark:hover:bg-[#142D52] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Building2 className="h-3.5 w-3.5 text-[#0284C7] dark:text-sky-400 shrink-0" aria-hidden="true" />
                      Admin Demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Distinct 3-Portal Comparison Section */}
        <section id="portals" className="border-t border-[#DCE5F2] dark:border-[#1D3557] bg-white dark:bg-[#0B1F3A] py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#0F1E36] p-6 space-y-2.5">
                <p className="font-mono text-xs font-semibold text-[#0284C7] dark:text-sky-300">
                  Student Learning Portal
                </p>
                <h3 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                  4-Unit DBMS Syllabus, Timed Exams &amp; Bilingual Tutor
                </h3>
                <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                  Study Units 1–4 in English and ಕನ್ನಡ, take countdown online examinations, inspect
                  Recharts concept mastery progression, and generate personalised AI study notes.
                </p>
              </div>

              <div id="bilingual" className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#0F1E36] p-6 space-y-2.5">
                <p className="font-mono text-xs font-semibold text-[#0F294A] dark:text-sky-300">
                  Teacher &amp; Faculty Portal
                </p>
                <h3 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                  Curriculum Authoring, AI Approval &amp; Class Analytics
                </h3>
                <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                  Manage CS-304 and custom courses, extract topics from PDFs, approve AI-drafted
                  questions before publishing, track attendance, and inspect concept mastery reports.
                </p>
              </div>

              <div className="rounded-xl border border-[#DCE5F2] dark:border-[#1D3557] bg-[#F8FAFE] dark:bg-[#0F1E36] p-6 space-y-2.5">
                <p className="font-mono text-xs font-semibold text-[#0F294A] dark:text-sky-300">
                  Administrator Console
                </p>
                <h3 className="font-display text-lg font-semibold text-[#0B1F3A] dark:text-white">
                  Course Governance, Supabase SQL &amp; Moodle API
                </h3>
                <p className="text-sm text-[#475D7C] dark:text-[#9EB3D1] leading-relaxed">
                  Oversee institutional courses, manage faculty allowlists, export the 16-table RLS
                  Supabase PostgreSQL schema, and test authorised Moodle Web Services REST sync.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
