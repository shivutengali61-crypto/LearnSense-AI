import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertProfileUpdateAllowed,
  assertRoleLoginAllowed,
  assertSubmissionAllowed,
  buildAnswerKeyPayload,
  buildLessonPlanId,
  buildMaterialEngagementId,
  buildPublishedAssessmentPayload,
  buildRevisionTaskId,
  buildSubmissionId,
  canStudentAccessClassroomResource,
  canStudentReadClassroom,
  canStudentReadSubmission,
  canStudentWriteOwnScopedRecord,
  canTeacherCreateAnnouncement,
  canTeacherManageClassroomResource,
  canTeacherReadClassroomReport,
  canUserAccessConversation,
  canUserAccessNotification,
  canUserAccessQuestionBankItem,
  canUserCreateNotification,
  canUserReadAnnouncement,
  canUserSendMessage,
  emailToAllowlistId,
  publishedAssessmentToStudentShell,
  rehydrateAssessmentWithAnswerKey,
} from './repoRules';
import type {
  Assessment,
  AssessmentSubmission,
  Classroom,
  UserProfile,
} from '../types/learnsense';

const teacherProfile: UserProfile = {
  uid: 'teacher_1',
  email: 'kavitha@school.edu',
  name: 'Dr. Kavitha Rao',
  role: 'teacher',
  preferredLanguage: 'en',
  createdAt: '2026-11-01T08:00:00Z',
};

const studentAProfile: UserProfile = {
  uid: 'stu_a',
  email: 'aarav@school.edu',
  name: 'Aarav Kulkarni',
  role: 'student',
  preferredLanguage: 'en',
  createdAt: '2026-11-02T08:00:00Z',
};

const classroom1: Classroom = {
  id: 'cls_1',
  name: 'Grade 9 Science',
  subject: 'Physics',
  gradeLevel: 'Grade 9',
  joinCode: 'SCI9A',
  teacherUid: 'teacher_1',
  teacherName: 'Dr. Kavitha Rao',
  studentUids: ['stu_a'],
  students: [{ uid: 'stu_a', name: 'Aarav Kulkarni', email: 'aarav@school.edu' }],
  createdAt: '2026-11-01T09:00:00Z',
};

const sampleAssessment: Assessment = {
  id: 'assess_1',
  classroomId: 'cls_1',
  teacherUid: 'teacher_1',
  title: 'Motion Quiz',
  status: 'published',
  durationMinutes: 15,
  allowRetakes: false,
  createdAt: '2026-11-05T10:00:00Z',
  questions: [
    {
      id: 'q1',
      prompt: 'SI unit of force?',
      type: 'mcq',
      options: ['Newton', 'Joule', 'Watt', 'Pascal'],
      correctAnswer: 'Newton',
      explanation: 'Force is measured in Newtons (kg·m/s^2).',
      conceptId: 'c_force',
      conceptName: 'Force & Units',
      points: 2,
      source: 'manual',
      approvalStatus: 'approved',
    },
    {
      id: 'q2_draft',
      prompt: 'Pending draft question',
      type: 'short_answer',
      correctAnswer: 'Secret Draft Answer',
      explanation: 'Hidden from students',
      conceptId: 'c_force',
      conceptName: 'Force & Units',
      points: 2,
      source: 'gemini_ai',
      approvalStatus: 'pending_review',
    },
  ],
};

test('role permissions validate verified email, existing role match, and teacher allowlist', () => {
  const unverified = assertRoleLoginAllowed({
    existingProfile: null,
    requestedRole: 'student',
    userEmail: 'unverified@school.edu',
    emailVerified: false,
    isAuthorizedTeacherEmail: false,
  });
  assert.equal(unverified.allowed, false);

  const unauthorizedTeacher = assertRoleLoginAllowed({
    existingProfile: null,
    requestedRole: 'teacher',
    userEmail: 'intruder@school.edu',
    emailVerified: true,
    isAuthorizedTeacherEmail: false,
  });
  assert.equal(unauthorizedTeacher.allowed, false);

  const allowlistedTeacher = assertRoleLoginAllowed({
    existingProfile: null,
    requestedRole: 'teacher',
    userEmail: 'newfaculty@school.edu',
    emailVerified: true,
    isAuthorizedTeacherEmail: true,
  });
  assert.equal(allowlistedTeacher.allowed, true);

  const roleMismatch = assertRoleLoginAllowed({
    existingProfile: studentAProfile,
    requestedRole: 'teacher',
    userEmail: studentAProfile.email,
    emailVerified: true,
    isAuthorizedTeacherEmail: true,
  });
  assert.equal(roleMismatch.allowed, false);

  const allowedStudent = assertRoleLoginAllowed({
    existingProfile: null,
    requestedRole: 'student',
    userEmail: 'newstudent@school.edu',
    emailVerified: true,
    isAuthorizedTeacherEmail: false,
  });
  assert.equal(allowedStudent.allowed, true);

  const unauthorizedAdmin = assertRoleLoginAllowed({
    existingProfile: null,
    requestedRole: 'admin',
    userEmail: 'random@school.edu',
    emailVerified: true,
    isAuthorizedTeacherEmail: false,
  });
  assert.equal(unauthorizedAdmin.allowed, false);

  const bootstrappedAdmin = assertRoleLoginAllowed({
    existingProfile: null,
    requestedRole: 'admin',
    userEmail: 'shivutengali61@gmail.com',
    emailVerified: true,
    isAuthorizedTeacherEmail: false,
  });
  assert.equal(bootstrappedAdmin.allowed, true);
});

test('assertProfileUpdateAllowed prevents client-side role self-escalation', () => {
  const attemptRoleChange = assertProfileUpdateAllowed(studentAProfile, {
    name: 'Aarav Kulkarni',
    role: 'teacher',
    preferredLanguage: 'en',
  });
  assert.equal(attemptRoleChange.allowed, false);

  const validUpdate = assertProfileUpdateAllowed(studentAProfile, {
    name: 'Aarav K.',
    role: 'student',
    preferredLanguage: 'kn',
  });
  assert.equal(validUpdate.allowed, true);
  assert.equal(emailToAllowlistId('Faculty.One@School.EDU'), 'faculty_one_school_edu');
});

test('published assessment projection strips answer keys, explanations, and draft questions', () => {
  const draftOnly: Assessment = { ...sampleAssessment, status: 'draft' };
  assert.equal(buildPublishedAssessmentPayload(draftOnly, ['stu_a']), null);

  const pub = buildPublishedAssessmentPayload(sampleAssessment, ['stu_a']);
  assert.ok(pub);
  assert.equal(pub.questions.length, 1);
  assert.equal(pub.questions[0].id, 'q1');
  assert.equal('correctAnswer' in pub.questions[0], false);
  assert.equal('explanation' in pub.questions[0], false);

  const studentShell = publishedAssessmentToStudentShell(pub);
  assert.equal(studentShell.questions[0].correctAnswer, '');

  const answerKey = buildAnswerKeyPayload(sampleAssessment);
  assert.equal(answerKey.answers.length, 1);
  assert.equal(answerKey.answers[0].correctAnswer, 'Newton');

  const rehydrated = rehydrateAssessmentWithAnswerKey(pub, answerKey);
  assert.equal(rehydrated.questions[0].correctAnswer, 'Newton');
  assert.equal(rehydrated.questions[0].explanation, 'Force is measured in Newtons (kg·m/s^2).');
});

test('assertSubmissionAllowed blocks duplicate submissions unless allowRetakes is enabled', () => {
  const firstCheck = assertSubmissionAllowed({
    assessment: sampleAssessment,
    classroomStudentUids: ['stu_a'],
    studentUid: 'stu_a',
    existingSubmissions: [],
  });
  assert.equal(firstCheck.allowed, true);
  assert.equal(firstCheck.nextAttemptNumber, 1);
  assert.equal(firstCheck.submissionId, 'assess_1_stu_a');

  const existingSub: AssessmentSubmission = {
    id: 'assess_1_stu_a',
    assessmentId: 'assess_1',
    classroomId: 'cls_1',
    teacherUid: 'teacher_1',
    studentUid: 'stu_a',
    studentName: 'Aarav Kulkarni',
    attemptNumber: 1,
    evaluationStatus: 'evaluated',
    score: 2,
    maxScore: 2,
    percentage: 100,
    responses: [],
    submittedAt: '2026-11-06T12:00:00Z',
  };

  const duplicateBlocked = assertSubmissionAllowed({
    assessment: sampleAssessment,
    classroomStudentUids: ['stu_a'],
    studentUid: 'stu_a',
    existingSubmissions: [existingSub],
  });
  assert.equal(duplicateBlocked.allowed, false);
  assert.ok(duplicateBlocked.reason?.includes('Duplicate submission blocked'));

  const retakeAssessment: Assessment = { ...sampleAssessment, allowRetakes: true };
  const secondAttempt = assertSubmissionAllowed({
    assessment: retakeAssessment,
    classroomStudentUids: ['stu_a'],
    studentUid: 'stu_a',
    existingSubmissions: [existingSub],
  });
  assert.equal(secondAttempt.allowed, true);
  assert.equal(secondAttempt.nextAttemptNumber, 2);
  assert.equal(secondAttempt.submissionId, buildSubmissionId('assess_1', 'stu_a', true, 2));

  const nonEnrolled = assertSubmissionAllowed({
    assessment: sampleAssessment,
    classroomStudentUids: ['stu_a'],
    studentUid: 'stu_b',
    existingSubmissions: [],
  });
  assert.equal(nonEnrolled.allowed, false);
});

test('access isolation between students and scoped teacher classroom report access', () => {
  const stuASub: AssessmentSubmission = {
    id: 'assess_1_stu_a',
    assessmentId: 'assess_1',
    classroomId: 'cls_1',
    teacherUid: 'teacher_1',
    studentUid: 'stu_a',
    studentName: 'Aarav Kulkarni',
    score: 2,
    maxScore: 2,
    percentage: 100,
    responses: [],
    submittedAt: '2026-11-06T12:00:00Z',
  };

  // Student classroom & report isolation
  assert.equal(canStudentReadClassroom(classroom1, 'stu_a'), true);
  assert.equal(canStudentReadClassroom(classroom1, 'stu_b'), false);
  assert.equal(canStudentReadSubmission(stuASub, 'stu_a'), true);
  assert.equal(canStudentReadSubmission(stuASub, 'stu_b'), false);

  // Teacher classroom report scoping
  assert.equal(canTeacherReadClassroomReport(classroom1, stuASub, teacherProfile.uid), true);
  assert.equal(canTeacherReadClassroomReport(classroom1, stuASub, 'other_teacher'), false);
});

test('Phase 3 conversation access & message sending enforce participant and enrollment isolation', () => {
  const directConv = {
    type: 'direct' as const,
    classroomId: 'cls_1',
    teacherUid: 'teacher_1',
    studentUid: 'stu_a',
    participantUids: ['teacher_1', 'stu_a'],
  };
  const classConv = {
    type: 'classroom' as const,
    classroomId: 'cls_1',
    teacherUid: 'teacher_1',
    participantUids: ['teacher_1', 'stu_a'],
  };

  assert.equal(
    canUserAccessConversation({
      conversation: directConv,
      classroom: classroom1,
      userUid: 'teacher_1',
      userRole: 'teacher',
    }),
    true
  );
  assert.equal(
    canUserAccessConversation({
      conversation: directConv,
      classroom: classroom1,
      userUid: 'stu_a',
      userRole: 'student',
    }),
    true
  );
  // Non-enrolled / non-participant student blocked from direct and classroom chats
  assert.equal(
    canUserAccessConversation({
      conversation: directConv,
      classroom: classroom1,
      userUid: 'stu_b',
      userRole: 'student',
    }),
    false
  );
  assert.equal(
    canUserAccessConversation({
      conversation: classConv,
      classroom: classroom1,
      userUid: 'stu_b',
      userRole: 'student',
    }),
    false
  );
  // Other teacher blocked
  assert.equal(
    canUserSendMessage({
      conversation: classConv,
      classroom: classroom1,
      senderUid: 'other_teacher',
      senderRole: 'teacher',
    }),
    false
  );
  // Enrolled student can send in classroom chat and own direct chat
  assert.equal(
    canUserSendMessage({
      conversation: classConv,
      classroom: classroom1,
      senderUid: 'stu_a',
      senderRole: 'student',
    }),
    true
  );
});

test('Phase 3 announcement creation & reading restrict writes to owner teacher and reads to enrolled students', () => {
  assert.equal(
    canTeacherCreateAnnouncement({
      classroom: classroom1,
      userUid: 'teacher_1',
      userRole: 'teacher',
    }),
    true
  );
  assert.equal(
    canTeacherCreateAnnouncement({
      classroom: classroom1,
      userUid: 'stu_a',
      userRole: 'student',
    }),
    false
  );
  assert.equal(
    canTeacherCreateAnnouncement({
      classroom: classroom1,
      userUid: 'other_teacher',
      userRole: 'teacher',
    }),
    false
  );

  const announcement = {
    classroomId: 'cls_1',
    teacherUid: 'teacher_1',
    studentUids: ['stu_a'],
  };
  assert.equal(
    canUserReadAnnouncement({
      announcement,
      classroom: classroom1,
      userUid: 'stu_a',
      userRole: 'student',
    }),
    true
  );
  assert.equal(
    canUserReadAnnouncement({
      announcement,
      classroom: classroom1,
      userUid: 'stu_b',
      userRole: 'student',
    }),
    false
  );
  assert.equal(
    canUserReadAnnouncement({
      announcement,
      classroom: classroom1,
      userUid: 'teacher_1',
      userRole: 'teacher',
    }),
    true
  );
});

test('Phase 3 notification access & creation enforce recipient privacy and classroom relationship', () => {
  assert.equal(
    canUserAccessNotification({
      notification: { recipientUid: 'stu_a' },
      userUid: 'stu_a',
    }),
    true
  );
  assert.equal(
    canUserAccessNotification({
      notification: { recipientUid: 'stu_a' },
      userUid: 'stu_b',
    }),
    false
  );

  // Teacher can notify enrolled student, not unenrolled student
  assert.equal(
    canUserCreateNotification({
      actorUid: 'teacher_1',
      actorRole: 'teacher',
      recipientUid: 'stu_a',
      classroom: classroom1,
    }),
    true
  );
  assert.equal(
    canUserCreateNotification({
      actorUid: 'teacher_1',
      actorRole: 'teacher',
      recipientUid: 'stu_b',
      classroom: classroom1,
    }),
    false
  );

  // Enrolled student can notify classroom teacher, not another student
  assert.equal(
    canUserCreateNotification({
      actorUid: 'stu_a',
      actorRole: 'student',
      recipientUid: 'teacher_1',
      classroom: classroom1,
    }),
    true
  );
  assert.equal(
    canUserCreateNotification({
      actorUid: 'stu_a',
      actorRole: 'student',
      recipientUid: 'stu_b',
      classroom: classroom1,
    }),
    false
  );
});

test('8 new database collection rules enforce deterministic IDs, ownership, and classroom isolation', () => {
  assert.equal(
    buildRevisionTaskId('stu_a', 'cls_1', 'concept:force/1'),
    'rev_stu_a_cls_1_concept_force_1'
  );
  assert.equal(buildMaterialEngagementId('mat_1', 'stu_a'), 'eng_mat_1_stu_a');
  assert.equal(buildLessonPlanId('cls_1', 'concept_force'), 'plan_cls_1_concept_force');

  // Attendance sessions & classroom activities: owner teacher manages; enrolled student can read
  assert.equal(
    canTeacherManageClassroomResource({
      classroom: classroom1,
      userUid: 'teacher_1',
      userRole: 'teacher',
    }),
    true
  );
  assert.equal(
    canTeacherManageClassroomResource({
      classroom: classroom1,
      userUid: 'other_teacher',
      userRole: 'teacher',
    }),
    false
  );
  assert.equal(
    canTeacherManageClassroomResource({
      classroom: classroom1,
      userUid: 'stu_a',
      userRole: 'student',
    }),
    false
  );
  assert.equal(
    canStudentAccessClassroomResource({
      classroom: classroom1,
      userUid: 'stu_a',
      userRole: 'student',
    }),
    true
  );
  assert.equal(
    canStudentAccessClassroomResource({
      classroom: classroom1,
      userUid: 'stu_b',
      userRole: 'student',
    }),
    false
  );

  // Student-scoped records (tutorDoubts, revisionTasks, materialEngagements, studentNotes)
  assert.equal(
    canStudentWriteOwnScopedRecord({
      classroom: classroom1,
      recordStudentUid: 'stu_a',
      actorUid: 'stu_a',
      actorRole: 'student',
    }),
    true
  );
  assert.equal(
    canStudentWriteOwnScopedRecord({
      classroom: classroom1,
      recordStudentUid: 'stu_a',
      actorUid: 'stu_b',
      actorRole: 'student',
    }),
    false
  );
  assert.equal(
    canStudentWriteOwnScopedRecord({
      classroom: classroom1,
      recordStudentUid: 'stu_b',
      actorUid: 'stu_b',
      actorRole: 'student',
    }),
    false
  );
  assert.equal(
    canStudentWriteOwnScopedRecord({
      classroom: classroom1,
      recordStudentUid: 'stu_a',
      actorUid: 'teacher_1',
      actorRole: 'teacher',
    }),
    false
  );

  // Teacher-private question bank isolation
  assert.equal(
    canUserAccessQuestionBankItem({
      itemTeacherUid: 'teacher_1',
      actorUid: 'teacher_1',
      actorRole: 'teacher',
    }),
    true
  );
  assert.equal(
    canUserAccessQuestionBankItem({
      itemTeacherUid: 'teacher_1',
      actorUid: 'other_teacher',
      actorRole: 'teacher',
    }),
    false
  );
  assert.equal(
    canUserAccessQuestionBankItem({
      itemTeacherUid: 'teacher_1',
      actorUid: 'stu_a',
      actorRole: 'student',
    }),
    false
  );
});


