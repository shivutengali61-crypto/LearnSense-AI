import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClassroomConversationId,
  buildDirectConversationId,
  buildEnrollmentId,
  buildNotificationPayload,
  buildUnreadCountsOnNewMessage,
  computeAttendanceSummary,
  computeConversationUnreadForUser,
  computeStudentDashboardOverview,
  computeTeacherDashboardOverview,
  computeUnreadNotificationsCount,
  deriveUpcomingDeadlineNotifications,
  getMessageReadStatusLabel,
  markConversationUnreadCleared,
  searchWorkspaceEntities,
  sortAnnouncementsByRecent,
  sortConversationsByRecent,
  sortNotificationsByRecent,
  validateAnnouncementInput,
  validateMessageBody,
} from './communication';
import type {
  Announcement,
  Assessment,
  AssessmentSubmission,
  AttendanceSession,
  ChatMessage,
  Classroom,
  ClassroomActivity,
  Conversation,
  StudyMaterial,
  UserProfile,
} from '../types/learnsense';

const teacherUser: UserProfile = {
  uid: 'teacher_1',
  email: 'kavitha@school.edu',
  name: 'Dr. Kavitha Rao',
  role: 'teacher',
  preferredLanguage: 'en',
  createdAt: '2026-11-01T08:00:00Z',
};

const studentA: UserProfile = {
  uid: 'stu_a',
  email: 'aarav@school.edu',
  name: 'Aarav Kulkarni',
  role: 'student',
  preferredLanguage: 'en',
  createdAt: '2026-11-02T08:00:00Z',
};

const classroom1: Classroom = {
  id: 'cls_1',
  name: 'Grade 9 Physics',
  subject: 'Physics',
  gradeLevel: 'Grade 9',
  joinCode: 'PHY9A',
  teacherUid: 'teacher_1',
  teacherName: 'Dr. Kavitha Rao',
  studentUids: ['stu_a', 'stu_b'],
  students: [
    { uid: 'stu_a', name: 'Aarav Kulkarni', email: 'aarav@school.edu', rollNumber: '09-14' },
    { uid: 'stu_b', name: 'Meera Nair', email: 'meera@school.edu', rollNumber: '09-15' },
  ],
  createdAt: '2026-11-01T09:00:00Z',
};

const classroom2: Classroom = {
  id: 'cls_2',
  name: 'Grade 9 Mechanics Lab',
  subject: 'Physics',
  gradeLevel: 'Grade 9',
  joinCode: 'LAB9B',
  teacherUid: 'teacher_1',
  teacherName: 'Dr. Kavitha Rao',
  studentUids: ['stu_a', 'stu_c'],
  students: [
    { uid: 'stu_a', name: 'Aarav Kulkarni', email: 'aarav@school.edu', rollNumber: '09-14' },
    { uid: 'stu_c', name: 'Rohan Joshi', email: 'rohan@school.edu', rollNumber: '09-21' },
  ],
  createdAt: '2026-11-02T09:00:00Z',
};

const sampleMaterial: StudyMaterial = {
  id: 'mat_1',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  title: 'Newton Laws Revision Pack',
  fileName: 'newton-laws.pdf',
  extractedText: 'Newton first law inertia and second law F=ma.',
  extractionSource: 'manual',
  topics: [
    {
      id: 'c_inertia',
      title: 'Inertia & First Law',
      description: 'Motion remains constant unless acted on by net force.',
      subtopics: [],
    },
    {
      id: 'c_fma',
      title: 'Force & Acceleration',
      description: 'F = m * a',
      subtopics: [],
    },
  ],
  createdAt: '2026-11-03T10:00:00Z',
};

const publishedTestDueSoon: Assessment = {
  id: 'ass_soon',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  title: 'Newton Motion Checkpoint',
  description: 'Covers inertia and F=ma',
  status: 'published',
  dueDate: '2026-11-15',
  durationMinutes: 20,
  allowRetakes: false,
  createdAt: '2026-11-04T10:00:00Z',
  questions: [
    {
      id: 'q1',
      prompt: 'What is Newton second law?',
      type: 'mcq',
      options: ['F=ma', 'E=mc^2'],
      correctAnswer: 'F=ma',
      explanation: 'Force equals mass times acceleration.',
      conceptId: 'c_fma',
      conceptName: 'Force & Acceleration',
      points: 2,
      source: 'manual',
      approvalStatus: 'approved',
    },
  ],
};

const publishedTestCompleted: Assessment = {
  id: 'ass_done',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  title: 'Inertia Diagnostic',
  status: 'published',
  dueDate: '2026-11-14',
  durationMinutes: 15,
  allowRetakes: false,
  createdAt: '2026-11-04T08:00:00Z',
  questions: [
    {
      id: 'q_in_1',
      prompt: 'Inertia depends on?',
      type: 'mcq',
      options: ['Mass', 'Color'],
      correctAnswer: 'Mass',
      explanation: 'Greater mass means greater inertia.',
      conceptId: 'c_inertia',
      conceptName: 'Inertia & First Law',
      points: 2,
      source: 'manual',
      approvalStatus: 'approved',
    },
  ],
};

const draftAssessment: Assessment = {
  id: 'ass_draft',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  title: 'Secret Draft Newton Quiz',
  status: 'draft',
  dueDate: '2026-11-15',
  durationMinutes: 10,
  createdAt: '2026-11-05T10:00:00Z',
  questions: [],
};

const farDueAssessment: Assessment = {
  id: 'ass_far',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  title: 'Term Final Exam',
  status: 'published',
  dueDate: '2026-12-20',
  durationMinutes: 45,
  createdAt: '2026-11-05T11:00:00Z',
  questions: [],
};

const stuASubmission: AssessmentSubmission = {
  id: 'ass_done_stu_a',
  assessmentId: 'ass_done',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  studentUid: 'stu_a',
  studentName: 'Aarav Kulkarni',
  attemptNumber: 1,
  evaluationStatus: 'evaluated',
  score: 0,
  maxScore: 2,
  percentage: 0,
  responses: [
    {
      questionId: 'q_in_1',
      conceptId: 'c_inertia',
      conceptName: 'Inertia & First Law',
      prompt: 'Inertia depends on?',
      studentAnswer: 'Color',
      correctAnswer: 'Mass',
      isCorrect: false,
      pointsEarned: 0,
      maxPoints: 2,
    },
  ],
  submittedAt: '2026-11-10T10:00:00Z',
};

const directConversation: Conversation = {
  id: buildDirectConversationId('cls_1', 'stu_a'),
  type: 'direct',
  classroomId: 'cls_1',
  classroomName: 'Grade 9 Physics',
  teacherUid: 'teacher_1',
  teacherName: 'Dr. Kavitha Rao',
  studentUid: 'stu_a',
  studentName: 'Aarav Kulkarni',
  participantUids: ['teacher_1', 'stu_a'],
  title: 'Aarav Kulkarni · Direct',
  lastMessageText: 'Please review Inertia examples.',
  lastMessageAt: '2026-11-11T12:00:00Z',
  lastSenderUid: 'teacher_1',
  lastSenderName: 'Dr. Kavitha Rao',
  unreadCounts: { teacher_1: 0, stu_a: 1 },
  createdAt: '2026-11-10T09:00:00Z',
};

const classConversation: Conversation = {
  id: buildClassroomConversationId('cls_1'),
  type: 'classroom',
  classroomId: 'cls_1',
  classroomName: 'Grade 9 Physics',
  teacherUid: 'teacher_1',
  teacherName: 'Dr. Kavitha Rao',
  participantUids: ['teacher_1', 'stu_a', 'stu_b'],
  title: 'Grade 9 Physics · Class Channel',
  lastMessageText: 'Welcome to class channel!',
  lastMessageAt: '2026-11-12T09:00:00Z',
  lastSenderUid: 'teacher_1',
  lastSenderName: 'Dr. Kavitha Rao',
  unreadCounts: { teacher_1: 0, stu_a: 2, stu_b: 1 },
  createdAt: '2026-11-01T09:00:00Z',
};

const sampleAnnouncement: Announcement = {
  id: 'ann_1',
  classroomId: 'cls_1',
  classroomName: 'Grade 9 Physics',
  teacherUid: 'teacher_1',
  teacherName: 'Dr. Kavitha Rao',
  studentUids: ['stu_a', 'stu_b'],
  title: 'Newton Lab Prep Notice',
  body: 'Bring your lab notebooks tomorrow for the dynamics session.',
  priority: 'important',
  acknowledgedBy: [],
  createdAt: '2026-11-11T15:00:00Z',
};

test('deterministic ID builders and input validators enforce bounds', () => {
  assert.equal(buildEnrollmentId('cls_1', 'stu_a'), 'cls_1_stu_a');
  assert.equal(buildDirectConversationId('cls_1', 'stu_a'), 'conv_dir_cls_1_stu_a');
  assert.equal(buildClassroomConversationId('cls_1'), 'conv_cls_cls_1');

  assert.equal(validateMessageBody('   ').valid, false);
  assert.equal(validateMessageBody('a'.repeat(2001)).valid, false);
  assert.deepEqual(validateMessageBody('  Hello teacher  '), {
    valid: true,
    clean: 'Hello teacher',
  });

  assert.equal(validateAnnouncementInput({ title: 'Hi', body: 'Valid body' }).valid, false);
  assert.equal(validateAnnouncementInput({ title: 'a'.repeat(141), body: 'Valid body' }).valid, false);
  assert.equal(validateAnnouncementInput({ title: 'Quiz Prep', body: 'Hey' }).valid, false);
  assert.equal(validateAnnouncementInput({ title: 'Quiz Prep', body: 'b'.repeat(3001) }).valid, false);
  assert.equal(
    validateAnnouncementInput({ title: 'Quiz Prep', body: 'Review chapter 2 notes today.' }).valid,
    true
  );
});

test('unread counters, read receipts, and sorting helpers work accurately', () => {
  const nextCounts = buildUnreadCountsOnNewMessage(
    ['teacher_1', 'stu_a', 'stu_b'],
    { teacher_1: 1, stu_a: 2, stu_b: 0 },
    'teacher_1'
  );
  assert.deepEqual(nextCounts, { teacher_1: 0, stu_a: 3, stu_b: 1 });

  const cleared = markConversationUnreadCleared(nextCounts, 'stu_a');
  assert.deepEqual(cleared, { teacher_1: 0, stu_a: 0, stu_b: 1 });

  assert.equal(computeConversationUnreadForUser([directConversation, classConversation], 'stu_a'), 3);
  assert.equal(computeConversationUnreadForUser([directConversation, classConversation], 'teacher_1'), 0);

  const sentDirectMsg: ChatMessage = {
    id: 'm1',
    conversationId: directConversation.id,
    classroomId: 'cls_1',
    participantUids: ['teacher_1', 'stu_a'],
    senderUid: 'teacher_1',
    senderName: 'Dr. Kavitha Rao',
    senderRole: 'teacher',
    body: 'Check inertia notes',
    readBy: { teacher_1: '2026-11-11T12:00:00Z' },
    createdAt: '2026-11-11T12:00:00Z',
  };
  assert.equal(getMessageReadStatusLabel(sentDirectMsg, directConversation, 'teacher_1'), 'Sent');
  assert.equal(getMessageReadStatusLabel(sentDirectMsg, directConversation, 'stu_a'), '');

  const readDirectMsg: ChatMessage = {
    ...sentDirectMsg,
    readBy: { teacher_1: '2026-11-11T12:00:00Z', stu_a: '2026-11-11T12:05:00Z' },
  };
  assert.equal(getMessageReadStatusLabel(readDirectMsg, directConversation, 'teacher_1'), 'Read');

  const groupReadMsg: ChatMessage = {
    ...sentDirectMsg,
    conversationId: classConversation.id,
    readBy: {
      teacher_1: '2026-11-11T12:00:00Z',
      stu_a: '2026-11-11T12:05:00Z',
      stu_b: '2026-11-11T12:06:00Z',
    },
  };
  assert.equal(getMessageReadStatusLabel(groupReadMsg, classConversation, 'teacher_1'), 'Read by 2');

  const sortedConvs = sortConversationsByRecent([directConversation, classConversation]);
  assert.equal(sortedConvs[0].id, classConversation.id);

  const notifA = buildNotificationPayload({
    id: 'n_1',
    recipientUid: 'stu_a',
    actorUid: 'teacher_1',
    actorName: 'Dr. Kavitha Rao',
    type: 'teacher_message',
    title: 'New message',
    body: 'Please check notes',
    classroomId: 'cls_1',
    targetTab: 'communication',
    targetId: directConversation.id,
    createdAt: '2026-11-10T08:00:00Z',
  });
  const notifB = buildNotificationPayload({
    id: 'n_2',
    recipientUid: 'stu_a',
    actorUid: 'teacher_1',
    actorName: 'Dr. Kavitha Rao',
    type: 'announcement',
    title: 'Lab Prep',
    body: 'Bring notebooks',
    classroomId: 'cls_1',
    targetTab: 'communication',
    targetId: 'ann_1',
    createdAt: '2026-11-12T08:00:00Z',
  });
  assert.equal(computeUnreadNotificationsCount([notifA, { ...notifB, read: true }]), 1);
  assert.equal(sortNotificationsByRecent([notifA, notifB])[0].id, 'n_2');
  assert.equal(
    sortAnnouncementsByRecent([
      { ...sampleAnnouncement, id: 'old', createdAt: '2026-11-01T00:00:00Z' },
      sampleAnnouncement,
    ])[0].id,
    'ann_1'
  );
});

test('deriveUpcomingDeadlineNotifications only emits unsubmitted published tests due within 7 days', () => {
  const refTime = Date.parse('2026-11-12T10:00:00Z');
  const deadlines = deriveUpcomingDeadlineNotifications({
    assessments: [publishedTestDueSoon, publishedTestCompleted, draftAssessment, farDueAssessment],
    submissions: [stuASubmission],
    classrooms: [classroom1],
    studentUid: 'stu_a',
    readIds: new Set<string>(),
    referenceTime: refTime,
  });

  assert.equal(deadlines.length, 1);
  assert.equal(deadlines[0].targetId, 'ass_soon');
  assert.equal(deadlines[0].read, false);
  assert.equal(deadlines[0].isDerivedDeadline, true);

  const readDeadlines = deriveUpcomingDeadlineNotifications({
    assessments: [publishedTestDueSoon],
    submissions: [],
    classrooms: [classroom1],
    studentUid: 'stu_a',
    readIds: new Set(['deadline_ass_soon_stu_a']),
    referenceTime: refTime,
  });
  assert.equal(readDeadlines[0].read, true);
});

test('searchWorkspaceEntities scopes results by user role', () => {
  const teacherResults = searchWorkspaceEntities({
    queryText: 'Newton',
    user: teacherUser,
    classrooms: [classroom1],
    materials: [sampleMaterial],
    assessments: [publishedTestDueSoon, draftAssessment],
    announcements: [sampleAnnouncement],
    conversations: [directConversation],
  });
  assert.ok(teacherResults.some((r) => r.kind === 'material' && r.targetId === 'mat_1'));
  assert.ok(teacherResults.some((r) => r.kind === 'assessment' && r.targetId === 'ass_draft'));
  assert.ok(teacherResults.some((r) => r.kind === 'announcement' && r.targetId === 'ann_1'));

  const studentResultsForDraft = searchWorkspaceEntities({
    queryText: 'Secret Draft',
    user: studentA,
    classrooms: [classroom1],
    materials: [sampleMaterial],
    assessments: [publishedTestDueSoon, draftAssessment],
    announcements: [sampleAnnouncement],
    conversations: [directConversation],
  });
  assert.equal(studentResultsForDraft.length, 0);

  const studentSearchStudentName = searchWorkspaceEntities({
    queryText: 'Meera',
    user: studentA,
    classrooms: [classroom1],
    materials: [],
    assessments: [],
    announcements: [],
    conversations: [],
  });
  assert.equal(studentSearchStudentName.some((r) => r.kind === 'student'), false);

  const teacherSearchStudentName = searchWorkspaceEntities({
    queryText: 'Meera',
    user: teacherUser,
    classrooms: [classroom1],
    materials: [],
    assessments: [],
    announcements: [],
    conversations: [],
  });
  assert.equal(teacherSearchStudentName.some((r) => r.kind === 'student' && r.targetId === 'stu_b'), true);
});

test('computeTeacherDashboardOverview calculates distinct student totals and keeps attendance explicitly unavailable', () => {
  const overview = computeTeacherDashboardOverview({
    teacherUid: 'teacher_1',
    classrooms: [classroom1, classroom2],
    materials: [sampleMaterial],
    assessments: [publishedTestDueSoon, publishedTestCompleted, draftAssessment],
    submissions: [stuASubmission],
    announcements: [sampleAnnouncement],
    conversations: [directConversation, classConversation],
  });

  // stu_a is in both cls_1 and cls_2; distinct students = {stu_a, stu_b, stu_c} -> 3
  assert.equal(overview.totalClassrooms, 2);
  assert.equal(overview.totalStudents, 3);
  assert.equal(overview.activeAssessmentsCount, 2);
  assert.equal(overview.attendanceRecorded, false);
  assert.equal(overview.attendancePct, null);
  assert.equal(overview.recentSubmissions.length, 1);
  assert.equal(overview.studentsNeedingSupport.length, 1);
  assert.equal(overview.studentsNeedingSupport[0].studentUid, 'stu_a');
});

test('computeStudentDashboardOverview aggregates pending vs completed assessments and weak concepts', () => {
  const overview = computeStudentDashboardOverview({
    studentUid: 'stu_a',
    classrooms: [classroom1],
    materials: [sampleMaterial],
    assessments: [publishedTestDueSoon, publishedTestCompleted, draftAssessment],
    submissions: [stuASubmission],
    announcements: [sampleAnnouncement],
    conversations: [directConversation, classConversation],
  });

  assert.equal(overview.enrolledClassroomsCount, 1);
  assert.equal(overview.availableMaterialsCount, 1);
  assert.equal(overview.completedAssessmentsCount, 1);
  assert.equal(overview.pendingAssessments.length, 1);
  assert.equal(overview.pendingAssessments[0].id, 'ass_soon');
  assert.equal(overview.averageScorePct, 0);
  assert.equal(overview.weakConcepts.length, 1);
  assert.equal(overview.weakConcepts[0].conceptId, 'c_inertia');
  assert.equal(overview.upcomingDeadlines.length, 1);
  assert.equal(overview.unreadMessagesCount, 3);
  assert.equal(overview.attendanceRecorded, false);
  assert.equal(overview.attendancePct, null);
});

test('computeAttendanceSummary and dashboard overviews aggregate recorded attendance and upcoming activities', () => {
  const emptySummary = computeAttendanceSummary({ attendanceSessions: [] });
  assert.deepEqual(emptySummary, { recorded: false, pct: null, sessionsCount: 0 });

  const session1: AttendanceSession = {
    id: 'att_1',
    classroomId: 'cls_1',
    classroomName: 'Grade 9 Physics',
    teacherUid: 'teacher_1',
    sessionDate: '2026-11-12',
    topic: 'Inertia & Free Body Diagrams',
    studentUids: ['stu_a', 'stu_b'],
    records: { stu_a: 'present', stu_b: 'absent' },
    presentCount: 1,
    totalCount: 2,
    createdAt: '2026-11-12T09:00:00Z',
  };
  const session2: AttendanceSession = {
    id: 'att_2',
    classroomId: 'cls_1',
    classroomName: 'Grade 9 Physics',
    teacherUid: 'teacher_1',
    sessionDate: '2026-11-13',
    topic: 'Momentum Conservation Lab',
    studentUids: ['stu_a', 'stu_b'],
    records: { stu_a: 'late', stu_b: 'present' },
    presentCount: 2,
    totalCount: 2,
    createdAt: '2026-11-13T09:00:00Z',
  };

  const pendingActivity: ClassroomActivity = {
    id: 'act_1',
    classroomId: 'cls_1',
    classroomName: 'Grade 9 Physics',
    teacherUid: 'teacher_1',
    studentUids: ['stu_a', 'stu_b'],
    title: 'Momentum Trolley Lab',
    activityType: 'lab',
    scheduledDate: '2026-11-16',
    description: 'Measure pre and post collision speeds.',
    completed: false,
    createdAt: '2026-11-12T10:00:00Z',
  };
  const completedActivity: ClassroomActivity = {
    ...pendingActivity,
    id: 'act_done',
    title: 'Completed Orientation',
    completed: true,
  };

  assert.deepEqual(computeAttendanceSummary({ attendanceSessions: [session1, session2] }), {
    recorded: true,
    pct: 75,
    sessionsCount: 2,
  });
  assert.deepEqual(
    computeAttendanceSummary({ attendanceSessions: [session1, session2], studentUid: 'stu_a' }),
    { recorded: true, pct: 100, sessionsCount: 2 }
  );
  assert.deepEqual(
    computeAttendanceSummary({ attendanceSessions: [session1, session2], studentUid: 'stu_b' }),
    { recorded: true, pct: 50, sessionsCount: 2 }
  );

  const teacherOverview = computeTeacherDashboardOverview({
    teacherUid: 'teacher_1',
    classrooms: [classroom1],
    materials: [sampleMaterial],
    assessments: [publishedTestDueSoon],
    submissions: [stuASubmission],
    announcements: [sampleAnnouncement],
    conversations: [directConversation],
    attendanceSessions: [session1, session2],
    classroomActivities: [pendingActivity, completedActivity],
  });
  assert.equal(teacherOverview.attendanceRecorded, true);
  assert.equal(teacherOverview.attendancePct, 75);
  assert.equal(teacherOverview.attendanceSessionsCount, 2);
  assert.equal(teacherOverview.upcomingActivities.length, 1);
  assert.equal(teacherOverview.upcomingActivities[0].id, 'act_1');

  const studentOverview = computeStudentDashboardOverview({
    studentUid: 'stu_a',
    classrooms: [classroom1],
    materials: [sampleMaterial],
    assessments: [publishedTestDueSoon],
    submissions: [stuASubmission],
    announcements: [sampleAnnouncement],
    conversations: [directConversation],
    attendanceSessions: [session1, session2],
    classroomActivities: [pendingActivity, completedActivity],
  });
  assert.equal(studentOverview.attendanceRecorded, true);
  assert.equal(studentOverview.attendancePct, 100);
  assert.equal(studentOverview.upcomingActivities.length, 1);
  assert.equal(studentOverview.upcomingActivities[0].id, 'act_1');
});

