export interface SupabaseTableSummary {
  tableName: string;
  category: 'Identity & RBAC' | 'Curriculum & Courses' | 'Assessments & Mastery' | 'Communication & LMS';
  rlsEnabled: boolean;
  purpose: string;
  keyColumns: string[];
}

export const SUPABASE_TABLE_SUMMARIES: SupabaseTableSummary[] = [
  {
    tableName: 'public.users',
    category: 'Identity & RBAC',
    rlsEnabled: true,
    purpose: 'Authenticated student, teacher, and administrator profiles with locked role validation.',
    keyColumns: ['uid (PK)', 'email', 'role (student|teacher|admin)', 'preferred_language'],
  },
  {
    tableName: 'public.teacher_allowlist',
    category: 'Identity & RBAC',
    rlsEnabled: true,
    purpose: 'Admin-managed registry authorizing verified university faculty and admin accounts.',
    keyColumns: ['id (PK)', 'email', 'role', 'authorized_by'],
  },
  {
    tableName: 'public.courses',
    category: 'Curriculum & Courses',
    rlsEnabled: true,
    purpose: 'University courses with course code, semester, credits, join code, and optional Moodle ID.',
    keyColumns: ['id (PK)', 'course_code', 'semester', 'credits', 'teacher_uid (FK)', 'moodle_course_id'],
  },
  {
    tableName: 'public.enrollments',
    category: 'Curriculum & Courses',
    rlsEnabled: true,
    purpose: 'Active student-course roster mappings enforced across RLS policies.',
    keyColumns: ['id (PK)', 'course_id (FK)', 'student_uid (FK)', 'roll_number', 'status'],
  },
  {
    tableName: 'public.study_materials',
    category: 'Curriculum & Courses',
    rlsEnabled: true,
    purpose: 'Uploaded lecture PDFs/notes (Storage path) and AI-extracted hierarchical concept outlines.',
    keyColumns: ['id (PK)', 'course_id (FK)', 'extraction_source', 'topics (jsonb)'],
  },
  {
    tableName: 'public.assessments',
    category: 'Assessments & Mastery',
    rlsEnabled: true,
    purpose: 'Online timed examinations with countdown duration, due date, and retake controls.',
    keyColumns: ['id (PK)', 'course_id (FK)', 'status', 'duration_minutes', 'allow_retakes'],
  },
  {
    tableName: 'public.assessment_questions',
    category: 'Assessments & Mastery',
    rlsEnabled: true,
    purpose: 'Concept-tagged questions, rubrics, and teacher approval state isolated from unpublished view.',
    keyColumns: ['id (PK)', 'assessment_id (FK)', 'concept_id', 'approval_status', 'points'],
  },
  {
    tableName: 'public.assessment_submissions',
    category: 'Assessments & Mastery',
    rlsEnabled: true,
    purpose: 'Evaluated student attempts, elapsed seconds, timeout flag, and per-question responses.',
    keyColumns: ['id (PK)', 'assessment_id (FK)', 'student_uid (FK)', 'percentage', 'elapsed_seconds', 'timed_out'],
  },
  {
    tableName: 'public.attendance_sessions',
    category: 'Curriculum & Courses',
    rlsEnabled: true,
    purpose: 'Per-session lecture attendance percentages for enrolled rosters.',
    keyColumns: ['id (PK)', 'course_id (FK)', 'session_date', 'present_count', 'total_count'],
  },
  {
    tableName: 'public.lesson_plans',
    category: 'Assessments & Mastery',
    rlsEnabled: true,
    purpose: 'AI-assisted reteach lesson outlines anchored to low-mastery classroom concepts.',
    keyColumns: ['id (PK)', 'course_id (FK)', 'concept_id', 'class_mastery_pct', 'status'],
  },
  {
    tableName: 'public.revision_tasks',
    category: 'Assessments & Mastery',
    rlsEnabled: true,
    purpose: 'Personalised student revision tasks and reflection logs derived from concept evidence.',
    keyColumns: ['id (PK)', 'student_uid (FK)', 'concept_id', 'status'],
  },
  {
    tableName: 'public.announcements',
    category: 'Communication & LMS',
    rlsEnabled: true,
    purpose: 'Course-wide faculty notices with priority and student acknowledgement tracking.',
    keyColumns: ['id (PK)', 'course_id (FK)', 'priority', 'acknowledged_by'],
  },
  {
    tableName: 'public.conversations',
    category: 'Communication & LMS',
    rlsEnabled: true,
    purpose: 'Direct mentoring and classroom discussion channels.',
    keyColumns: ['id (PK)', 'conversation_type', 'course_id (FK)', 'participant_uids'],
  },
  {
    tableName: 'public.chat_messages',
    category: 'Communication & LMS',
    rlsEnabled: true,
    purpose: 'Real-time messages with read-receipt timestamps.',
    keyColumns: ['id (PK)', 'conversation_id (FK)', 'sender_uid (FK)', 'read_by'],
  },
  {
    tableName: 'public.notifications',
    category: 'Communication & LMS',
    rlsEnabled: true,
    purpose: 'Targeted student & faculty alerts for assessments, messages, and announcements.',
    keyColumns: ['id (PK)', 'recipient_uid (FK)', 'notification_type', 'is_read'],
  },
  {
    tableName: 'public.moodle_sync_logs',
    category: 'Communication & LMS',
    rlsEnabled: true,
    purpose: 'Audit trail for authorised Moodle Web Services REST course synchronisation.',
    keyColumns: ['id (PK)', 'admin_uid (FK)', 'endpoint_function', 'courses_synced', 'status'],
  },
];

export const SUPABASE_SCHEMA_SQL_PREVIEW = `-- LearnSense AI — Supabase PostgreSQL Production Schema
-- Full file available at /supabase/schema.sql (16 RLS-protected tables)

create extension if not exists "pgcrypto";

create table if not exists public.users (
  uid uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(full_name) >= 2),
  role text not null check (role in ('student', 'teacher', 'admin')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'kn')),
  department text,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  name text not null,
  subject text not null,
  grade_level text not null,
  semester text,
  credits numeric(3,1),
  join_code text not null unique,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  teacher_name text not null,
  moodle_course_id integer unique,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_submissions (
  id text primary key,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  student_uid uuid not null references public.users (uid) on delete cascade,
  attempt_number integer not null default 1,
  score numeric(6,2) not null,
  max_score numeric(6,2) not null,
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  elapsed_seconds integer check (elapsed_seconds >= 0),
  timed_out boolean not null default false,
  responses jsonb not null,
  submitted_at timestamptz not null default now()
);

-- RLS Policies isolate student submissions and block client-side role self-escalation.`;
