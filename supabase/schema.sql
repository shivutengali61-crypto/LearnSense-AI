-- LearnSense AI — Supabase PostgreSQL Production Schema (University LMS Edition)
-- Supports: Student, Teacher, and Administrator RBAC, Courses, 4-Unit DBMS & General Curricula,
-- Study Materials, Concept Extraction, Timed Online Assessments, Submissions, Concept Mastery,
-- Real-time Messaging, Announcements, Notifications, and Authorised Moodle REST Sync Logs.

create extension if not exists "pgcrypto";

-- 1. User Profiles (linked to auth.users)
create table if not exists public.users (
  uid uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(full_name) >= 2),
  role text not null check (role in ('student', 'teacher', 'admin')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'kn')),
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Faculty & Admin Allowlist
create table if not exists public.teacher_allowlist (
  id text primary key,
  email text not null unique,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  department text,
  authorized_by text not null,
  created_at timestamptz not null default now()
);

-- 3. University Courses / Classrooms
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

create index if not exists idx_courses_teacher on public.courses (teacher_uid);
create index if not exists idx_courses_code on public.courses (course_code);

-- 4. Student Course Enrollments
create table if not exists public.enrollments (
  id text primary key,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_uid uuid not null references public.users (uid) on delete cascade,
  student_name text not null,
  student_email text not null,
  roll_number text,
  status text not null default 'active' check (status in ('active', 'dropped')),
  enrolled_at timestamptz not null default now(),
  unique (course_id, student_uid)
);

create index if not exists idx_enrollments_student on public.enrollments (student_uid);
create index if not exists idx_enrollments_course on public.enrollments (course_id);

-- 5. Study Materials (PDFs stored in Supabase Storage bucket 'study-materials')
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  title text not null,
  file_name text not null,
  storage_path text,
  extracted_text text not null,
  extraction_source text not null check (extraction_source in ('gemini_ai', 'sarvam_ai', 'local_pdf_parser', 'manual')),
  topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_materials_course on public.study_materials (course_id);

-- 6. Assessments (Online Timed Examinations & Practice Quizzes)
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  due_date date,
  duration_minutes integer not null default 30 check (duration_minutes between 1 and 240),
  allow_retakes boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_assessments_course_status on public.assessments (course_id, status);

-- 7. Assessment Questions & Protected Answer Keys
create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  concept_id text not null,
  concept_name text not null,
  prompt text not null,
  question_type text not null check (question_type in ('mcq', 'short_answer')),
  options jsonb,
  correct_answer text not null,
  explanation text not null,
  points integer not null default 2 check (points > 0),
  source text not null check (source in ('manual', 'gemini_ai', 'sarvam_ai')),
  approval_status text not null default 'approved' check (approval_status in ('approved', 'pending_review', 'rejected')),
  order_index integer not null default 0
);

create index if not exists idx_questions_assessment on public.assessment_questions (assessment_id);

-- 8. Student Assessment Submissions & Timed Telemetry
create table if not exists public.assessment_submissions (
  id text primary key,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  student_uid uuid not null references public.users (uid) on delete cascade,
  student_name text not null,
  attempt_number integer not null default 1 check (attempt_number >= 1),
  evaluation_status text not null default 'evaluated' check (evaluation_status in ('evaluated', 'pending')),
  score numeric(6,2) not null,
  max_score numeric(6,2) not null,
  percentage numeric(5,2) not null check (percentage between 0 and 100),
  elapsed_seconds integer check (elapsed_seconds >= 0),
  timed_out boolean not null default false,
  responses jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submissions_student on public.assessment_submissions (student_uid, submitted_at desc);
create index if not exists idx_submissions_course on public.assessment_submissions (course_id, assessment_id);

-- 9. Attendance Sessions & Classroom Activities
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  session_date date not null,
  topic text not null,
  records jsonb not null default '{}'::jsonb,
  present_count integer not null default 0,
  total_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 10. Teacher Lesson Plans & Student Revision Progress
create table if not exists public.lesson_plans (
  id text primary key,
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  concept_id text not null,
  concept_name text not null,
  class_mastery_pct integer not null check (class_mastery_pct between 0 and 100),
  recommended_focus text not null,
  suggested_activity text not null,
  ai_outline jsonb,
  status text not null default 'approved' check (status in ('approved', 'completed')),
  updated_at timestamptz not null default now()
);

create table if not exists public.revision_tasks (
  id text primary key,
  course_id uuid not null references public.courses (id) on delete cascade,
  student_uid uuid not null references public.users (uid) on delete cascade,
  concept_id text not null,
  concept_name text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  reflection_note text,
  updated_at timestamptz not null default now()
);

-- 11. Announcements, Conversations, Messages & Notifications
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  teacher_uid uuid not null references public.users (uid) on delete restrict,
  title text not null,
  body text not null,
  priority text not null default 'normal' check (priority in ('normal', 'important')),
  acknowledged_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id text primary key,
  conversation_type text not null check (conversation_type in ('direct', 'classroom')),
  course_id uuid not null references public.courses (id) on delete cascade,
  participant_uids uuid[] not null,
  title text not null,
  last_message_text text,
  last_message_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender_uid uuid not null references public.users (uid) on delete cascade,
  sender_role text not null check (sender_role in ('student', 'teacher', 'admin')),
  body text not null,
  read_by jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_uid uuid not null references public.users (uid) on delete cascade,
  actor_uid uuid not null references public.users (uid) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  course_id uuid references public.courses (id) on delete set null,
  target_tab text not null,
  target_id text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 12. Authorised Moodle REST Sync Audit Log
create table if not exists public.moodle_sync_logs (
  id uuid primary key default gen_random_uuid(),
  admin_uid uuid not null references public.users (uid) on delete restrict,
  endpoint_function text not null,
  courses_synced integer not null default 0,
  status text not null check (status in ('success', 'error')),
  message text,
  synced_at timestamptz not null default now()
);

-- =========================================================================
-- Row Level Security (RLS) Policies
-- =========================================================================

alter table public.users enable row level security;
alter table public.teacher_allowlist enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.study_materials enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_submissions enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.revision_tasks enable row level security;
alter table public.announcements enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.moodle_sync_logs enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.users where uid = auth.uid();
$$;

create policy "Users read own profile or admin reads all"
  on public.users for select
  using (uid = auth.uid() or public.current_user_role() = 'admin');

create policy "Users update own name and language without role escalation"
  on public.users for update
  using (uid = auth.uid())
  with check (uid = auth.uid() and role = (select role from public.users where uid = auth.uid()));

create policy "Teachers and admins manage own courses"
  on public.courses for all
  using (
    teacher_uid = auth.uid()
    or public.current_user_role() = 'admin'
    or exists (
      select 1 from public.enrollments e
      where e.course_id = courses.id and e.student_uid = auth.uid()
    )
  )
  with check (
    teacher_uid = auth.uid() or public.current_user_role() = 'admin'
  );

create policy "Students read only own submissions; teachers read course submissions"
  on public.assessment_submissions for select
  using (
    student_uid = auth.uid()
    or teacher_uid = auth.uid()
    or public.current_user_role() = 'admin'
  );

create policy "Enrolled students insert own submissions"
  on public.assessment_submissions for insert
  with check (
    student_uid = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.course_id = assessment_submissions.course_id
        and e.student_uid = auth.uid()
        and e.status = 'active'
    )
  );
