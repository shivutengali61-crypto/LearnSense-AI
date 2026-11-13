import type {
  Assessment,
  AssessmentAnswerKey,
  AssessmentSubmission,
  Classroom,
  LanguageCode,
  PublishedAssessment,
  Question,
  UserProfile,
  UserRole,
} from '../types/learnsense';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'shivutengali61@gmail.com';

export function emailToAllowlistId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

export function buildPublishedAssessmentPayload(
  assessment: Assessment,
  studentUids: string[]
): PublishedAssessment | null {
  if (assessment.status !== 'published' && assessment.status !== 'closed') {
    return null;
  }

  const approvedQuestions = assessment.questions
    .filter((q) => q.approvalStatus === 'approved')
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      ...(q.options && q.options.length > 0 ? { options: q.options } : {}),
      conceptId: q.conceptId,
      conceptName: q.conceptName,
      points: q.points,
    }));

  return {
    id: assessment.id,
    classroomId: assessment.classroomId,
    teacherUid: assessment.teacherUid,
    studentUids: Array.from(new Set(studentUids)),
    title: assessment.title,
    ...(assessment.description ? { description: assessment.description } : {}),
    status: assessment.status,
    ...(assessment.dueDate ? { dueDate: assessment.dueDate } : {}),
    durationMinutes: assessment.durationMinutes,
    allowRetakes: Boolean(assessment.allowRetakes),
    questions: approvedQuestions,
    createdAt: assessment.createdAt,
  };
}

export function buildAnswerKeyPayload(assessment: Assessment): AssessmentAnswerKey {
  const approvedAnswers = assessment.questions
    .filter((q) => q.approvalStatus === 'approved')
    .map((q) => ({
      questionId: q.id,
      type: q.type,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      conceptId: q.conceptId,
      conceptName: q.conceptName,
      points: q.points,
    }));

  return {
    id: assessment.id,
    assessmentId: assessment.id,
    classroomId: assessment.classroomId,
    teacherUid: assessment.teacherUid,
    allowRetakes: Boolean(assessment.allowRetakes),
    answers: approvedAnswers,
    createdAt: assessment.createdAt,
  };
}

export function rehydrateAssessmentWithAnswerKey(
  pub: PublishedAssessment,
  answerKey: AssessmentAnswerKey
): Assessment {
  const keyMap = new Map(answerKey.answers.map((a) => [a.questionId, a]));
  const questions: Question[] = pub.questions.map((pq) => {
    const key = keyMap.get(pq.id);
    return {
      id: pq.id,
      prompt: pq.prompt,
      type: pq.type,
      options: pq.options,
      correctAnswer: key?.correctAnswer ?? '',
      explanation: key?.explanation ?? '',
      conceptId: pq.conceptId,
      conceptName: pq.conceptName,
      points: pq.points,
      source: 'manual',
      approvalStatus: 'approved',
    };
  });

  return {
    id: pub.id,
    classroomId: pub.classroomId,
    teacherUid: pub.teacherUid,
    title: pub.title,
    description: pub.description,
    status: pub.status,
    dueDate: pub.dueDate,
    durationMinutes: pub.durationMinutes,
    allowRetakes: pub.allowRetakes,
    questions,
    createdAt: pub.createdAt,
  };
}

export function publishedAssessmentToStudentShell(pub: PublishedAssessment): Assessment {
  return {
    id: pub.id,
    classroomId: pub.classroomId,
    teacherUid: pub.teacherUid,
    title: pub.title,
    description: pub.description,
    status: pub.status,
    dueDate: pub.dueDate,
    durationMinutes: pub.durationMinutes,
    allowRetakes: pub.allowRetakes,
    questions: pub.questions.map((pq) => ({
      id: pq.id,
      prompt: pq.prompt,
      type: pq.type,
      options: pq.options,
      // Explicitly blank on client prior to submission; answer keys live in protected collection
      correctAnswer: '',
      explanation: '',
      conceptId: pq.conceptId,
      conceptName: pq.conceptName,
      points: pq.points,
      source: 'manual',
      approvalStatus: 'approved',
    })),
    createdAt: pub.createdAt,
  };
}

export function buildSubmissionId(
  assessmentId: string,
  studentUid: string,
  allowRetakes: boolean,
  attemptNumber: number
): string {
  if (!allowRetakes) {
    return `${assessmentId}_${studentUid}`;
  }
  return `${assessmentId}_${studentUid}_att_${attemptNumber}`;
}

export interface SubmissionCheckResult {
  allowed: boolean;
  nextAttemptNumber: number;
  submissionId: string;
  reason?: string;
}

export function assertSubmissionAllowed(params: {
  assessment: Pick<Assessment, 'id' | 'status' | 'classroomId' | 'allowRetakes'>;
  classroomStudentUids: string[];
  studentUid: string;
  existingSubmissions: AssessmentSubmission[];
}): SubmissionCheckResult {
  const { assessment, classroomStudentUids, studentUid, existingSubmissions } = params;

  if (assessment.status !== 'published') {
    return {
      allowed: false,
      nextAttemptNumber: 0,
      submissionId: '',
      reason: 'This assessment is not currently open for submissions.',
    };
  }

  if (!classroomStudentUids.includes(studentUid)) {
    return {
      allowed: false,
      nextAttemptNumber: 0,
      submissionId: '',
      reason: 'Access denied: you are not enrolled in this classroom.',
    };
  }

  const priorAttempts = existingSubmissions.filter(
    (s) => s.assessmentId === assessment.id && s.studentUid === studentUid
  );
  const allowRetakes = Boolean(assessment.allowRetakes);

  if (priorAttempts.length > 0 && !allowRetakes) {
    return {
      allowed: false,
      nextAttemptNumber: priorAttempts.length,
      submissionId: buildSubmissionId(assessment.id, studentUid, false, 1),
      reason:
        'Duplicate submission blocked: this assessment allows only one attempt unless your teacher enables retakes.',
    };
  }

  const maxExistingAttempt = priorAttempts.reduce(
    (max, sub, idx) => Math.max(max, sub.attemptNumber ?? idx + 1),
    0
  );
  const nextAttemptNumber = maxExistingAttempt + 1;

  return {
    allowed: true,
    nextAttemptNumber,
    submissionId: buildSubmissionId(assessment.id, studentUid, allowRetakes, nextAttemptNumber),
  };
}

export function assertRoleLoginAllowed(params: {
  existingProfile: UserProfile | null;
  requestedRole: UserRole;
  userEmail: string;
  emailVerified: boolean;
  isAuthorizedTeacherEmail: boolean;
}): { allowed: boolean; reason?: string } {
  const { existingProfile, requestedRole, userEmail, emailVerified, isAuthorizedTeacherEmail } = params;

  if (!emailVerified) {
    return {
      allowed: false,
      reason: 'Verified email authentication is required to access LearnSense.',
    };
  }

  if (existingProfile) {
    if (existingProfile.role !== requestedRole) {
      const registeredLabel =
        existingProfile.role === 'teacher'
          ? 'Teacher'
          : existingProfile.role === 'admin'
            ? 'Administrator'
            : 'Student';
      return {
        allowed: false,
        reason: `This account is registered as a ${registeredLabel}. Switch portal selection to ${registeredLabel} to sign in.`,
      };
    }
    return { allowed: true };
  }

  if (requestedRole === 'admin') {
    const isBootstrapped = userEmail.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    if (!isBootstrapped && !isAuthorizedTeacherEmail) {
      return {
        allowed: false,
        reason:
          'Administrator registration requires bootstrapped admin status or faculty allowlist approval.',
      };
    }
    return { allowed: true };
  }

  if (requestedRole === 'teacher' && !isAuthorizedTeacherEmail) {
    return {
      allowed: false,
      reason:
        'Teacher account registration requires faculty email authorization in /teacherAllowlist or admin approval.',
    };
  }

  return { allowed: true };
}

export function assertProfileUpdateAllowed(
  existingProfile: UserProfile,
  patch: { name: string; role?: UserRole; preferredLanguage?: LanguageCode }
): { allowed: boolean; reason?: string } {
  if (patch.role && patch.role !== existingProfile.role) {
    return {
      allowed: false,
      reason: 'Portal role is locked by account permissions and cannot be changed client-side.',
    };
  }
  if (!patch.name || patch.name.trim().length < 2) {
    return {
      allowed: false,
      reason: 'Full name must be at least 2 characters.',
    };
  }
  return { allowed: true };
}

export function canStudentReadClassroom(classroom: Classroom, studentUid: string): boolean {
  return classroom.studentUids.includes(studentUid);
}

export function canStudentReadSubmission(
  submission: AssessmentSubmission,
  studentUid: string
): boolean {
  return submission.studentUid === studentUid;
}

export function canTeacherReadClassroomReport(
  classroom: Classroom,
  submission: AssessmentSubmission,
  teacherUid: string
): boolean {
  return classroom.teacherUid === teacherUid && submission.classroomId === classroom.id;
}

export function canUserAccessConversation(params: {
  conversation: {
    type: 'direct' | 'classroom';
    classroomId: string;
    teacherUid: string;
    studentUid?: string;
    participantUids: string[];
  };
  classroom: Pick<Classroom, 'id' | 'teacherUid' | 'studentUids'>;
  userUid: string;
  userRole: UserRole;
}): boolean {
  const { conversation, classroom, userUid, userRole } = params;
  if (conversation.classroomId !== classroom.id) return false;
  if (!conversation.participantUids.includes(userUid)) return false;

  if (userRole === 'teacher') {
    return classroom.teacherUid === userUid && conversation.teacherUid === userUid;
  }

  if (!classroom.studentUids.includes(userUid)) return false;
  if (conversation.type === 'direct') {
    return conversation.studentUid === userUid;
  }
  return true;
}

export function canUserSendMessage(params: {
  conversation: {
    type: 'direct' | 'classroom';
    classroomId: string;
    teacherUid: string;
    studentUid?: string;
    participantUids: string[];
  };
  classroom: Pick<Classroom, 'id' | 'teacherUid' | 'studentUids'>;
  senderUid: string;
  senderRole: UserRole;
}): boolean {
  return canUserAccessConversation({
    conversation: params.conversation,
    classroom: params.classroom,
    userUid: params.senderUid,
    userRole: params.senderRole,
  });
}

export function canTeacherCreateAnnouncement(params: {
  classroom: Pick<Classroom, 'id' | 'teacherUid'>;
  userUid: string;
  userRole: UserRole;
}): boolean {
  return params.userRole === 'teacher' && params.classroom.teacherUid === params.userUid;
}

export function canUserReadAnnouncement(params: {
  announcement: { classroomId: string; teacherUid: string; studentUids: string[] };
  classroom: Pick<Classroom, 'id' | 'teacherUid' | 'studentUids'>;
  userUid: string;
  userRole: UserRole;
}): boolean {
  const { announcement, classroom, userUid, userRole } = params;
  if (announcement.classroomId !== classroom.id) return false;
  if (userRole === 'teacher') {
    return classroom.teacherUid === userUid && announcement.teacherUid === userUid;
  }
  return classroom.studentUids.includes(userUid) && announcement.studentUids.includes(userUid);
}

export function canUserAccessNotification(params: {
  notification: { recipientUid: string };
  userUid: string;
}): boolean {
  return params.notification.recipientUid === params.userUid;
}

export function canUserCreateNotification(params: {
  actorUid: string;
  actorRole: UserRole;
  recipientUid: string;
  classroom: Pick<Classroom, 'id' | 'teacherUid' | 'studentUids'>;
}): boolean {
  const { actorUid, actorRole, recipientUid, classroom } = params;
  if (recipientUid === actorUid) return true;
  if (actorRole === 'teacher') {
    return classroom.teacherUid === actorUid && classroom.studentUids.includes(recipientUid);
  }
  return classroom.studentUids.includes(actorUid) && classroom.teacherUid === recipientUid;
}

export function buildRevisionTaskId(studentUid: string, classroomId: string, conceptId: string): string {
  return `rev_${studentUid}_${classroomId}_${conceptId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

export function buildMaterialEngagementId(materialId: string, studentUid: string): string {
  return `eng_${materialId}_${studentUid}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

export function buildLessonPlanId(classroomId: string, conceptId: string): string {
  return `plan_${classroomId}_${conceptId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

export function canTeacherManageClassroomResource(params: {
  classroom: Pick<Classroom, 'id' | 'teacherUid'>;
  userUid: string;
  userRole: UserRole;
}): boolean {
  if (params.userRole === 'admin') return true;
  return params.userRole === 'teacher' && params.classroom.teacherUid === params.userUid;
}

export function canStudentAccessClassroomResource(params: {
  classroom: Pick<Classroom, 'id' | 'teacherUid' | 'studentUids'>;
  userUid: string;
  userRole: UserRole;
}): boolean {
  if (params.userRole === 'admin') return true;
  if (params.userRole === 'teacher') {
    return params.classroom.teacherUid === params.userUid;
  }
  return params.classroom.studentUids.includes(params.userUid);
}

export function canStudentWriteOwnScopedRecord(params: {
  classroom: Pick<Classroom, 'id' | 'studentUids'>;
  recordStudentUid: string;
  actorUid: string;
  actorRole: UserRole;
}): boolean {
  return (
    params.actorRole === 'student' &&
    params.recordStudentUid === params.actorUid &&
    params.classroom.studentUids.includes(params.actorUid)
  );
}

export function canUserAccessQuestionBankItem(params: {
  itemTeacherUid: string;
  actorUid: string;
  actorRole: UserRole;
}): boolean {
  if (params.actorRole === 'admin') return true;
  return params.actorRole === 'teacher' && params.itemTeacherUid === params.actorUid;
}

export function buildCurriculumProgressId(
  studentUid: string,
  curriculumId = 'dbms_starter'
): string {
  return `curr_${studentUid}_${curriculumId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

