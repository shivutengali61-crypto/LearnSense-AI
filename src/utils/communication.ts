import { computeClassAnalytics, computeConceptMastery, extractKnownConcepts } from './mastery';
import type {
  Announcement,
  AppNotification,
  Assessment,
  AssessmentSubmission,
  AttendanceSession,
  ChatMessage,
  Classroom,
  ClassroomActivity,
  Conversation,
  NotificationType,
  StudentDashboardOverview,
  StudyMaterial,
  TeacherDashboardOverview,
  UserProfile,
  WorkspaceSearchResult,
} from '../types/learnsense';

export function buildEnrollmentId(classroomId: string, studentUid: string): string {
  return `${classroomId}_${studentUid}`;
}

export function buildDirectConversationId(classroomId: string, studentUid: string): string {
  return `conv_dir_${classroomId}_${studentUid}`;
}

export function buildClassroomConversationId(classroomId: string): string {
  return `conv_cls_${classroomId}`;
}

export function validateMessageBody(body: string): { valid: boolean; clean: string; error?: string } {
  const clean = body.trim();
  if (!clean) {
    return { valid: false, clean: '', error: 'Message cannot be empty.' };
  }
  if (clean.length > 2000) {
    return { valid: false, clean, error: 'Message cannot exceed 2,000 characters.' };
  }
  return { valid: true, clean };
}

export function validateAnnouncementInput(params: {
  title: string;
  body: string;
}): { valid: boolean; error?: string } {
  if (params.title.trim().length < 3) {
    return { valid: false, error: 'Announcement title must be at least 3 characters.' };
  }
  if (params.title.trim().length > 140) {
    return { valid: false, error: 'Announcement title cannot exceed 140 characters.' };
  }
  if (params.body.trim().length < 5) {
    return { valid: false, error: 'Announcement message must be at least 5 characters.' };
  }
  if (params.body.trim().length > 3000) {
    return { valid: false, error: 'Announcement message cannot exceed 3,000 characters.' };
  }
  return { valid: true };
}

export function computeConversationUnreadForUser(
  conversations: Conversation[],
  userUid: string
): number {
  return conversations.reduce((sum, conv) => sum + (conv.unreadCounts?.[userUid] ?? 0), 0);
}

export function computeUnreadNotificationsCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function buildUnreadCountsOnNewMessage(
  participantUids: string[],
  existingCounts: Record<string, number>,
  senderUid: string
): Record<string, number> {
  const next: Record<string, number> = {};
  for (const uid of participantUids) {
    next[uid] = uid === senderUid ? 0 : (existingCounts[uid] ?? 0) + 1;
  }
  return next;
}

export function markConversationUnreadCleared(
  existingCounts: Record<string, number>,
  readerUid: string
): Record<string, number> {
  return {
    ...existingCounts,
    [readerUid]: 0,
  };
}

export function getMessageReadStatusLabel(
  message: ChatMessage,
  conversation: Conversation,
  currentUid: string
): string {
  if (message.senderUid !== currentUid) {
    return '';
  }
  const readerEntries = Object.keys(message.readBy ?? {}).filter((uid) => uid !== message.senderUid);
  if (readerEntries.length === 0) {
    return 'Sent';
  }
  if (conversation.type === 'direct') {
    return 'Read';
  }
  return `Read by ${readerEntries.length}`;
}

export function sortConversationsByRecent(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) =>
    (b.lastMessageAt || b.createdAt).localeCompare(a.lastMessageAt || a.createdAt)
  );
}

export function sortAnnouncementsByRecent(announcements: Announcement[]): Announcement[] {
  return [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function sortNotificationsByRecent(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function buildNotificationPayload(params: {
  id?: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
  type: NotificationType;
  title: string;
  body: string;
  classroomId: string;
  targetTab: string;
  targetId: string;
  createdAt?: string;
}): AppNotification {
  const timestamp = params.createdAt ?? new Date().toISOString();
  const safeId =
    params.id ??
    `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${params.recipientUid.slice(0, 8)}`;
  return {
    id: safeId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120),
    recipientUid: params.recipientUid,
    actorUid: params.actorUid,
    actorName: params.actorName,
    type: params.type,
    title: params.title.slice(0, 140),
    body: params.body.slice(0, 400),
    classroomId: params.classroomId,
    targetTab: params.targetTab,
    targetId: params.targetId,
    read: false,
    createdAt: timestamp,
  };
}

/**
 * Derives real approaching deadline notifications solely from published assessments
 * that the student has not submitted yet and whose dueDate is within 7 days (or recently due).
 * Never invents fake deadlines.
 */
export function deriveUpcomingDeadlineNotifications(params: {
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
  classrooms: Classroom[];
  studentUid: string;
  readIds?: Set<string>;
  referenceTime?: number;
}): AppNotification[] {
  const { assessments, submissions, classrooms, studentUid, readIds, referenceTime } = params;
  const nowMs = referenceTime ?? Date.now();
  const submittedIds = new Set(
    submissions.filter((s) => s.studentUid === studentUid).map((s) => s.assessmentId)
  );
  const classroomMap = new Map(classrooms.map((c) => [c.id, c]));

  const derived: AppNotification[] = [];
  for (const test of assessments) {
    if (test.status !== 'published' || !test.dueDate || submittedIds.has(test.id)) {
      continue;
    }
    const cls = classroomMap.get(test.classroomId);
    if (!cls || !cls.studentUids.includes(studentUid)) {
      continue;
    }
    const dueMs = Date.parse(`${test.dueDate}T23:59:59Z`);
    if (Number.isNaN(dueMs)) continue;
    const diffDays = Math.ceil((dueMs - nowMs) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 7) {
      const notifId = `deadline_${test.id}_${studentUid}`;
      derived.push({
        id: notifId,
        recipientUid: studentUid,
        actorUid: test.teacherUid,
        actorName: cls.teacherName,
        type: 'assessment_deadline',
        title:
          diffDays === 0
            ? `Due today: ${test.title}`
            : `Upcoming deadline (${diffDays}d left): ${test.title}`,
        body: `${cls.name} · ${test.durationMinutes} min · Due ${test.dueDate}`,
        classroomId: test.classroomId,
        targetTab: 'tests',
        targetId: test.id,
        read: readIds ? readIds.has(notifId) : false,
        createdAt: `${test.dueDate}T08:00:00Z`,
        isDerivedDeadline: true,
      });
    }
  }
  return derived;
}

export function searchWorkspaceEntities(params: {
  queryText: string;
  user: UserProfile | null;
  classrooms: Classroom[];
  materials: StudyMaterial[];
  assessments: Assessment[];
  announcements: Announcement[];
  conversations: Conversation[];
}): WorkspaceSearchResult[] {
  const q = params.queryText.trim().toLowerCase();
  if (!q || !params.user) return [];

  const results: WorkspaceSearchResult[] = [];
  const isTeacher = params.user.role === 'teacher' || params.user.role === 'admin';

  for (const cls of params.classrooms) {
    if (
      cls.name.toLowerCase().includes(q) ||
      cls.subject.toLowerCase().includes(q) ||
      (cls.courseCode && cls.courseCode.toLowerCase().includes(q)) ||
      cls.joinCode.toLowerCase().includes(q)
    ) {
      results.push({
        id: `search_cls_${cls.id}`,
        kind: 'classroom',
        title: cls.courseCode ? `${cls.courseCode} · ${cls.name}` : cls.name,
        subtitle: `${cls.subject} · ${cls.gradeLevel} · Code ${cls.joinCode}`,
        classroomId: cls.id,
        targetTab: params.user.role === 'admin' ? 'courses' : isTeacher ? 'classrooms' : 'dashboard',
        targetId: cls.id,
      });
    }

    if (isTeacher) {
      for (const stu of cls.students) {
        if (
          stu.name.toLowerCase().includes(q) ||
          stu.email.toLowerCase().includes(q) ||
          (stu.rollNumber && stu.rollNumber.toLowerCase().includes(q))
        ) {
          results.push({
            id: `search_stu_${cls.id}_${stu.uid}`,
            kind: 'student',
            title: stu.name,
            subtitle: `${cls.name} · ${stu.email}`,
            classroomId: cls.id,
            targetTab: 'reports',
            targetId: stu.uid,
          });
        }
      }
    }
  }

  for (const mat of params.materials) {
    const topicMatch = mat.topics.some((t) => t.title.toLowerCase().includes(q));
    if (mat.title.toLowerCase().includes(q) || mat.fileName.toLowerCase().includes(q) || topicMatch) {
      results.push({
        id: `search_mat_${mat.id}`,
        kind: 'material',
        title: mat.title,
        subtitle: `${mat.fileName} · ${mat.topics.length} topics`,
        classroomId: mat.classroomId,
        targetTab: 'materials',
        targetId: mat.id,
      });
    }
  }

  for (const assess of params.assessments) {
    if (!isTeacher && assess.status !== 'published') continue;
    if (
      assess.title.toLowerCase().includes(q) ||
      (assess.description && assess.description.toLowerCase().includes(q))
    ) {
      results.push({
        id: `search_ass_${assess.id}`,
        kind: 'assessment',
        title: assess.title,
        subtitle: `${assess.status === 'published' ? 'Published' : 'Draft'} · ${assess.durationMinutes} min${
          assess.dueDate ? ` · Due ${assess.dueDate}` : ''
        }`,
        classroomId: assess.classroomId,
        targetTab: isTeacher ? 'assessments' : 'tests',
        targetId: assess.id,
      });
    }
  }

  for (const ann of params.announcements) {
    if (ann.title.toLowerCase().includes(q) || ann.body.toLowerCase().includes(q)) {
      results.push({
        id: `search_ann_${ann.id}`,
        kind: 'announcement',
        title: ann.title,
        subtitle: `${ann.classroomName} · Announcement`,
        classroomId: ann.classroomId,
        targetTab: 'communication',
        targetId: ann.id,
      });
    }
  }

  for (const conv of params.conversations) {
    if (
      conv.title.toLowerCase().includes(q) ||
      conv.classroomName.toLowerCase().includes(q) ||
      (conv.studentName && conv.studentName.toLowerCase().includes(q))
    ) {
      results.push({
        id: `search_conv_${conv.id}`,
        kind: 'conversation',
        title: conv.title,
        subtitle: `${conv.classroomName} · ${conv.type === 'classroom' ? 'Classroom Thread' : 'Direct Message'}`,
        classroomId: conv.classroomId,
        targetTab: 'communication',
        targetId: conv.id,
      });
    }
  }

  return results.slice(0, 12);
}

export function computeAttendanceSummary(params: {
  attendanceSessions: AttendanceSession[];
  studentUid?: string;
}): { recorded: boolean; pct: number | null; sessionsCount: number } {
  const { attendanceSessions, studentUid } = params;
  if (!attendanceSessions || attendanceSessions.length === 0) {
    return { recorded: false, pct: null, sessionsCount: 0 };
  }

  let present = 0;
  let total = 0;
  let sessionsCount = 0;

  for (const session of attendanceSessions) {
    if (studentUid) {
      const status = session.records?.[studentUid];
      if (status) {
        sessionsCount += 1;
        total += 1;
        if (status === 'present' || status === 'late') {
          present += 1;
        }
      }
    } else if (session.totalCount > 0) {
      sessionsCount += 1;
      present += session.presentCount;
      total += session.totalCount;
    }
  }

  if (total === 0) {
    return { recorded: false, pct: null, sessionsCount: 0 };
  }

  return {
    recorded: true,
    pct: Math.round((present / total) * 100),
    sessionsCount,
  };
}

export function computeTeacherDashboardOverview(params: {
  teacherUid: string;
  classrooms: Classroom[];
  materials: StudyMaterial[];
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
  announcements: Announcement[];
  conversations: Conversation[];
  attendanceSessions?: AttendanceSession[];
  classroomActivities?: ClassroomActivity[];
}): TeacherDashboardOverview {
  const {
    teacherUid,
    classrooms,
    materials,
    assessments,
    submissions,
    announcements,
    conversations,
    attendanceSessions = [],
    classroomActivities = [],
  } = params;

  const uniqueStudentMap = new Map<string, { uid: string; name: string; email: string }>();
  for (const cls of classrooms) {
    for (const s of cls.students) {
      if (!uniqueStudentMap.has(s.uid)) {
        uniqueStudentMap.set(s.uid, s);
      }
    }
  }
  const allStudents = Array.from(uniqueStudentMap.values());
  const knownConcepts = extractKnownConcepts(materials, assessments);
  const analytics = computeClassAnalytics(allStudents, assessments, submissions, knownConcepts);

  const activeAssessments = assessments.filter((a) => a.status === 'published');
  const upcomingAssessments = [...activeAssessments].sort((a, b) =>
    (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
  );

  const upcomingActivities = [...classroomActivities]
    .filter((act) => !act.completed)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 6);

  const recentSubmissions = [...submissions]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 6);

  const studentsNeedingSupport = analytics.studentReports.filter((r) => r.needsSupport);
  const attendanceStats = computeAttendanceSummary({ attendanceSessions });

  return {
    totalClassrooms: classrooms.length,
    totalStudents: allStudents.length,
    activeAssessmentsCount: activeAssessments.length,
    averageClassPerformancePct: analytics.averageClassPct,
    attendanceRecorded: attendanceStats.recorded,
    attendancePct: attendanceStats.pct,
    attendanceSessionsCount: attendanceStats.sessionsCount,
    recentSubmissions,
    studentsNeedingSupport,
    upcomingAssessments,
    upcomingActivities,
    recentAnnouncements: sortAnnouncementsByRecent(announcements).slice(0, 4),
    recentConversations: sortConversationsByRecent(conversations).slice(0, 4),
    unreadMessagesCount: computeConversationUnreadForUser(conversations, teacherUid),
  };
}

export function computeStudentDashboardOverview(params: {
  studentUid: string;
  classrooms: Classroom[];
  materials: StudyMaterial[];
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
  announcements: Announcement[];
  conversations: Conversation[];
  attendanceSessions?: AttendanceSession[];
  classroomActivities?: ClassroomActivity[];
}): StudentDashboardOverview {
  const {
    studentUid,
    classrooms,
    materials,
    assessments,
    submissions,
    announcements,
    conversations,
    attendanceSessions = [],
    classroomActivities = [],
  } = params;

  const enrolledIds = new Set(classrooms.map((c) => c.id));
  const mySubmissions = submissions.filter((s) => s.studentUid === studentUid);
  const published = assessments.filter(
    (a) => a.status === 'published' && enrolledIds.has(a.classroomId)
  );
  const completedTestIds = new Set(mySubmissions.map((s) => s.assessmentId));
  const pendingAssessments = published.filter((a) => !completedTestIds.has(a.id));

  const averageScorePct =
    mySubmissions.length > 0
      ? Math.round(
          mySubmissions.reduce((sum, s) => sum + s.percentage, 0) / mySubmissions.length
        )
      : null;

  const knownConcepts = extractKnownConcepts(materials, published);
  const mastery = computeConceptMastery(mySubmissions, published, knownConcepts, studentUid);
  const weakConcepts = mastery.filter(
    (c) => c.status === 'needs_support' || c.status === 'developing'
  );

  const upcomingDeadlines = [...pendingAssessments]
    .filter((a) => Boolean(a.dueDate))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const upcomingActivities = [...classroomActivities]
    .filter((act) => !act.completed && enrolledIds.has(act.classroomId))
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 6);

  const attendanceStats = computeAttendanceSummary({
    attendanceSessions,
    studentUid,
  });

  return {
    enrolledClassroomsCount: classrooms.length,
    availableMaterialsCount: materials.filter((m) => enrolledIds.has(m.classroomId)).length,
    pendingAssessments,
    completedAssessmentsCount: completedTestIds.size,
    averageScorePct,
    attendanceRecorded: attendanceStats.recorded,
    attendancePct: attendanceStats.pct,
    weakConcepts,
    recentAnnouncements: sortAnnouncementsByRecent(announcements).slice(0, 4),
    recentConversations: sortConversationsByRecent(conversations).slice(0, 4),
    upcomingDeadlines,
    upcomingActivities,
    unreadMessagesCount: computeConversationUnreadForUser(conversations, studentUid),
  };
}
