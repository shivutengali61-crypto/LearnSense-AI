import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { FirestoreOp, db, handleFirestoreError } from './firebase';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  buildAnswerKeyPayload,
  buildPublishedAssessmentPayload,
  emailToAllowlistId,
  publishedAssessmentToStudentShell,
} from './repoRules';
import {
  buildClassroomConversationId,
  buildDirectConversationId,
  buildEnrollmentId,
  buildUnreadCountsOnNewMessage,
  markConversationUnreadCleared,
  sortAnnouncementsByRecent,
  sortConversationsByRecent,
  sortNotificationsByRecent,
} from '../utils/communication';
import type {
  Announcement,
  AppNotification,
  Assessment,
  AssessmentAnswerKey,
  AssessmentSubmission,
  AttendanceSession,
  ChatMessage,
  Classroom,
  ClassroomActivity,
  ClassroomEnrollment,
  ClassroomInvite,
  Conversation,
  CurriculumTopicProgress,
  MaterialEngagement,
  PersistedLessonPlan,
  PublishedAssessment,
  QuestionBankItem,
  RevisionTaskProgress,
  StudentRosterEntry,
  StudentStudyNote,
  StudyMaterial,
  SubmissionLock,
  TutorDoubtEntry,
  UserProfile,
  UserRole,
} from '../types/learnsense';

function cleanNestedValue(val: unknown): unknown {
  if (Array.isArray(val)) {
    return val.map((item) => cleanNestedValue(item));
  }
  if (val !== null && typeof val === 'object') {
    const nested: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        nested[k] = cleanNestedValue(v);
      }
    }
    return nested;
  }
  return val;
}

function stripUndefined<T extends object>(obj: T): Record<string, unknown> {
  return cleanNestedValue(obj) as Record<string, unknown>;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.GET, path);
  }
}

export async function isEmailAuthorizedForTeacher(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const allowId = emailToAllowlistId(normalized);
  const path = `teacherAllowlist/${allowId}`;
  try {
    const snap = await getDoc(doc(db, 'teacherAllowlist', allowId));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function addTeacherToAllowlist(
  email: string,
  grantedByUid: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const allowId = emailToAllowlistId(normalized);
  const path = `teacherAllowlist/${allowId}`;
  try {
    await setDoc(doc(db, 'teacherAllowlist', allowId), {
      id: allowId,
      email: normalized,
      grantedBy: grantedByUid,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      uid: profile.uid,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      preferredLanguage: profile.preferredLanguage ?? 'en',
      createdAt: profile.createdAt,
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, 'name' | 'preferredLanguage'>>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), stripUndefined(patch));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, path);
  }
}

export async function fetchClassroomsForTeacher(
  teacherUid: string
): Promise<{
  classrooms: Classroom[];
  materialIdsByClassroom: Record<string, string[]>;
  publishedIdsByClassroom: Record<string, string[]>;
}> {
  const path = 'classrooms';
  try {
    const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
    const snap = await getDocs(q);
    const materialIdsByClassroom: Record<string, string[]> = {};
    const publishedIdsByClassroom: Record<string, string[]> = {};

    const classrooms = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data() as Record<string, unknown>;
        const id = String(data.id ?? d.id);
        materialIdsByClassroom[id] = Array.isArray(data.materialIds)
          ? (data.materialIds as string[])
          : [];
        publishedIdsByClassroom[id] = Array.isArray(data.publishedAssessmentIds)
          ? (data.publishedAssessmentIds as string[])
          : [];

        // Fetch private roster subcollection isolated from students
        const rosterSnap = await getDocs(
          query(collection(db, `classrooms/${id}/roster`), where('teacherUid', '==', teacherUid))
        );
        const students: StudentRosterEntry[] = rosterSnap.docs.map((rd) => {
          const r = rd.data() as Record<string, unknown>;
          return {
            uid: String(r.uid ?? rd.id),
            name: String(r.name ?? ''),
            email: String(r.email ?? ''),
            rollNumber: typeof r.rollNumber === 'string' ? r.rollNumber : undefined,
          };
        });

        return {
          id,
          name: String(data.name ?? ''),
          subject: String(data.subject ?? ''),
          gradeLevel: String(data.gradeLevel ?? ''),
          courseCode: typeof data.courseCode === 'string' ? data.courseCode : undefined,
          semester: typeof data.semester === 'string' ? data.semester : undefined,
          credits: typeof data.credits === 'number' ? data.credits : undefined,
          joinCode: String(data.joinCode ?? ''),
          teacherUid: String(data.teacherUid ?? ''),
          teacherName: String(data.teacherName ?? ''),
          studentUids: Array.isArray(data.studentUids) ? (data.studentUids as string[]) : [],
          students,
          createdAt: String(data.createdAt ?? ''),
        } satisfies Classroom;
      })
    );

    return { classrooms, materialIdsByClassroom, publishedIdsByClassroom };
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function fetchClassroomsForStudent(
  studentUid: string
): Promise<{
  classrooms: Classroom[];
  materialIds: string[];
  publishedAssessmentIds: string[];
}> {
  const path = 'classrooms';
  try {
    const q = query(collection(db, path), where('studentUids', 'array-contains', studentUid));
    const snap = await getDocs(q);
    const materialIdSet = new Set<string>();
    const publishedIdSet = new Set<string>();

    const classrooms: Classroom[] = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      if (Array.isArray(data.materialIds)) {
        for (const mid of data.materialIds) {
          if (typeof mid === 'string') materialIdSet.add(mid);
        }
      }
      if (Array.isArray(data.publishedAssessmentIds)) {
        for (const aid of data.publishedAssessmentIds) {
          if (typeof aid === 'string') publishedIdSet.add(aid);
        }
      }
      return {
        id: String(data.id ?? d.id),
        name: String(data.name ?? ''),
        subject: String(data.subject ?? ''),
        gradeLevel: String(data.gradeLevel ?? ''),
        courseCode: typeof data.courseCode === 'string' ? data.courseCode : undefined,
        semester: typeof data.semester === 'string' ? data.semester : undefined,
        credits: typeof data.credits === 'number' ? data.credits : undefined,
        joinCode: String(data.joinCode ?? ''),
        teacherUid: String(data.teacherUid ?? ''),
        teacherName: String(data.teacherName ?? ''),
        studentUids: Array.isArray(data.studentUids) ? (data.studentUids as string[]) : [],
        // Never expose classmate PII in student memory
        students: [],
        createdAt: String(data.createdAt ?? ''),
      };
    });

    return {
      classrooms,
      materialIds: Array.from(materialIdSet),
      publishedAssessmentIds: Array.from(publishedIdSet),
    };
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function saveClassroom(
  classroom: Classroom,
  options?: {
    previousJoinCode?: string;
    materialIds?: string[];
    publishedAssessmentIds?: string[];
  }
): Promise<void> {
  const path = `classrooms/${classroom.id}`;
  try {
    await setDoc(
      doc(db, 'classrooms', classroom.id),
      stripUndefined({
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        gradeLevel: classroom.gradeLevel,
        courseCode: classroom.courseCode,
        semester: classroom.semester,
        credits: classroom.credits,
        joinCode: classroom.joinCode,
        teacherUid: classroom.teacherUid,
        teacherName: classroom.teacherName,
        studentUids: classroom.studentUids,
        ...(options?.materialIds ? { materialIds: options.materialIds } : {}),
        ...(options?.publishedAssessmentIds
          ? { publishedAssessmentIds: options.publishedAssessmentIds }
          : {}),
        createdAt: classroom.createdAt,
      })
    );

    // Keep public-lookup invite code in sync (zero PII)
    if (options?.previousJoinCode && options.previousJoinCode !== classroom.joinCode) {
      await deleteDoc(doc(db, 'classroomInvites', options.previousJoinCode)).catch(() => {});
    }
    const invite: ClassroomInvite = {
      joinCode: classroom.joinCode,
      classroomId: classroom.id,
      classroomName: classroom.name,
      subject: classroom.subject,
      gradeLevel: classroom.gradeLevel,
      teacherUid: classroom.teacherUid,
      teacherName: classroom.teacherName,
      active: true,
      createdAt: classroom.createdAt,
    };
    await setDoc(doc(db, 'classroomInvites', classroom.joinCode), invite);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function upsertRosterStudent(
  classroomId: string,
  teacherUid: string,
  student: StudentRosterEntry
): Promise<void> {
  const path = `classrooms/${classroomId}/roster/${student.uid}`;
  try {
    await setDoc(
      doc(db, `classrooms/${classroomId}/roster`, student.uid),
      stripUndefined({
        uid: student.uid,
        classroomId,
        teacherUid,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        enrolledAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function removeRosterStudent(
  classroomId: string,
  studentUid: string
): Promise<void> {
  const path = `classrooms/${classroomId}/roster/${studentUid}`;
  try {
    await deleteDoc(doc(db, `classrooms/${classroomId}/roster`, studentUid));
    await deleteDoc(doc(db, 'enrollments', buildEnrollmentId(classroomId, studentUid))).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

export async function saveEnrollmentRecord(enrollment: ClassroomEnrollment): Promise<void> {
  const path = `enrollments/${enrollment.id}`;
  try {
    await setDoc(doc(db, 'enrollments', enrollment.id), stripUndefined(enrollment));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function joinClassroomByInviteCode(
  rawJoinCode: string,
  student: UserProfile
): Promise<Classroom> {
  const code = rawJoinCode.trim().toUpperCase();
  const invitePath = `classroomInvites/${code}`;
  let invite: ClassroomInvite | null = null;

  try {
    const inviteSnap = await getDoc(doc(db, 'classroomInvites', code));
    if (!inviteSnap.exists()) {
      throw new Error(`No active classroom found for join code "${code}".`);
    }
    invite = inviteSnap.data() as ClassroomInvite;
    if (!invite.active) {
      throw new Error(`Classroom invite code "${code}" is no longer active.`);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('No active classroom') || error.message.includes('no longer active'))
    ) {
      throw error;
    }
    handleFirestoreError(error, FirestoreOp.GET, invitePath);
  }

  const clsPath = `classrooms/${invite.classroomId}`;
  try {
    await updateDoc(doc(db, 'classrooms', invite.classroomId), {
      studentUids: arrayUnion(student.uid),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, clsPath);
  }

  const nowIso = new Date().toISOString();
  const rosterPath = `classrooms/${invite.classroomId}/roster/${student.uid}`;
  try {
    await setDoc(doc(db, `classrooms/${invite.classroomId}/roster`, student.uid), {
      uid: student.uid,
      classroomId: invite.classroomId,
      teacherUid: invite.teacherUid,
      name: student.name,
      email: student.email,
      enrolledAt: nowIso,
    });
    const enrollmentId = buildEnrollmentId(invite.classroomId, student.uid);
    await saveEnrollmentRecord({
      id: enrollmentId,
      classroomId: invite.classroomId,
      teacherUid: invite.teacherUid,
      studentUid: student.uid,
      studentName: student.name,
      studentEmail: student.email,
      joinCode: invite.joinCode,
      status: 'active',
      enrolledAt: nowIso,
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, rosterPath);
  }

  try {
    const clsSnap = await getDoc(doc(db, 'classrooms', invite.classroomId));
    const data = clsSnap.data() as Record<string, unknown>;
    return {
      id: String(data.id ?? invite.classroomId),
      name: String(data.name ?? invite.classroomName),
      subject: String(data.subject ?? invite.subject),
      gradeLevel: String(data.gradeLevel ?? invite.gradeLevel),
      joinCode: String(data.joinCode ?? invite.joinCode),
      teacherUid: String(data.teacherUid ?? invite.teacherUid),
      teacherName: String(data.teacherName ?? invite.teacherName),
      studentUids: Array.isArray(data.studentUids) ? (data.studentUids as string[]) : [student.uid],
      students: [],
      createdAt: String(data.createdAt ?? invite.createdAt),
    };
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.GET, clsPath);
  }
}

export async function fetchMaterialsForTeacher(teacherUid: string): Promise<StudyMaterial[]> {
  const path = 'materials';
  try {
    const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StudyMaterial);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function fetchMaterialsForStudent(
  studentUid: string,
  materialIdsFromClassrooms: string[]
): Promise<StudyMaterial[]> {
  const path = 'materials';
  try {
    const byId = new Map<string, StudyMaterial>();

    const listSnap = await getDocs(
      query(collection(db, path), where('studentUids', 'array-contains', studentUid))
    );
    for (const d of listSnap.docs) {
      const m = d.data() as StudyMaterial;
      byId.set(m.id, m);
    }

    const missingIds = materialIdsFromClassrooms.filter((id) => !byId.has(id));
    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, path, id));
          if (snap.exists()) {
            const m = snap.data() as StudyMaterial;
            byId.set(m.id, m);
          }
        } catch {
          // Ignore deleted or inaccessible material IDs cleanly
        }
      })
    );

    return Array.from(byId.values());
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function saveMaterial(
  material: StudyMaterial,
  classroomStudentUids: string[]
): Promise<void> {
  const path = `materials/${material.id}`;
  try {
    await setDoc(
      doc(db, 'materials', material.id),
      stripUndefined({
        ...material,
        studentUids: Array.from(new Set(classroomStudentUids)),
      })
    );
    await updateDoc(doc(db, 'classrooms', material.classroomId), {
      materialIds: arrayUnion(material.id),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function fetchAssessmentsForTeacher(teacherUid: string): Promise<Assessment[]> {
  const path = 'assessments';
  try {
    const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Assessment);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function fetchPublishedAssessmentsForStudent(
  studentUid: string,
  publishedIdsFromClassrooms: string[]
): Promise<Assessment[]> {
  const path = 'publishedAssessments';
  try {
    const byId = new Map<string, Assessment>();

    const listSnap = await getDocs(
      query(
        collection(db, path),
        where('status', '==', 'published'),
        where('studentUids', 'array-contains', studentUid)
      )
    );
    for (const d of listSnap.docs) {
      const pub = d.data() as PublishedAssessment;
      byId.set(pub.id, publishedAssessmentToStudentShell(pub));
    }

    const missingIds = publishedIdsFromClassrooms.filter((id) => !byId.has(id));
    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, path, id));
          if (snap.exists()) {
            const pub = snap.data() as PublishedAssessment;
            if (pub.status === 'published') {
              byId.set(pub.id, publishedAssessmentToStudentShell(pub));
            }
          }
        } catch {
          // Ignore closed or unpublished docs safely
        }
      })
    );

    return Array.from(byId.values());
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

async function syncAssessmentProjections(
  assessment: Assessment,
  studentUids: string[]
): Promise<void> {
  const pubPayload = buildPublishedAssessmentPayload(assessment, studentUids);
  if (pubPayload) {
    await setDoc(doc(db, 'publishedAssessments', assessment.id), stripUndefined(pubPayload));
    const keyPayload = buildAnswerKeyPayload(assessment);
    await setDoc(doc(db, 'assessmentAnswerKeys', assessment.id), stripUndefined(keyPayload));
    if (assessment.status === 'published') {
      await updateDoc(doc(db, 'classrooms', assessment.classroomId), {
        publishedAssessmentIds: arrayUnion(assessment.id),
      });
    } else {
      await updateDoc(doc(db, 'classrooms', assessment.classroomId), {
        publishedAssessmentIds: arrayRemove(assessment.id),
      });
    }
  } else {
    await deleteDoc(doc(db, 'publishedAssessments', assessment.id)).catch(() => {});
    await deleteDoc(doc(db, 'assessmentAnswerKeys', assessment.id)).catch(() => {});
    await updateDoc(doc(db, 'classrooms', assessment.classroomId), {
      publishedAssessmentIds: arrayRemove(assessment.id),
    }).catch(() => {});
  }
}

export async function saveAssessment(
  assessment: Assessment,
  classroomStudentUids: string[] = []
): Promise<void> {
  const path = `assessments/${assessment.id}`;
  try {
    await setDoc(
      doc(db, 'assessments', assessment.id),
      stripUndefined({
        ...assessment,
        allowRetakes: Boolean(assessment.allowRetakes),
      })
    );
    await syncAssessmentProjections(assessment, classroomStudentUids);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function updateAssessment(
  assessment: Assessment,
  classroomStudentUids: string[] = []
): Promise<void> {
  const path = `assessments/${assessment.id}`;
  try {
    await updateDoc(
      doc(db, 'assessments', assessment.id),
      stripUndefined({
        title: assessment.title,
        description: assessment.description,
        status: assessment.status,
        dueDate: assessment.dueDate,
        durationMinutes: assessment.durationMinutes,
        allowRetakes: Boolean(assessment.allowRetakes),
        questions: assessment.questions,
      })
    );
    await syncAssessmentProjections(assessment, classroomStudentUids);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, path);
  }
}

export async function createSubmissionLock(lock: SubmissionLock): Promise<void> {
  const path = `submissionLocks/${lock.id}`;
  try {
    await setDoc(doc(db, 'submissionLocks', lock.id), lock);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

export async function getAssessmentAnswerKey(
  assessmentId: string
): Promise<AssessmentAnswerKey | null> {
  const path = `assessmentAnswerKeys/${assessmentId}`;
  try {
    const snap = await getDoc(doc(db, 'assessmentAnswerKeys', assessmentId));
    return snap.exists() ? (snap.data() as AssessmentAnswerKey) : null;
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.GET, path);
  }
}

export async function fetchSubmissionsForTeacher(
  teacherUid: string
): Promise<AssessmentSubmission[]> {
  const path = 'submissions';
  try {
    const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AssessmentSubmission);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function fetchSubmissionsForStudent(
  studentUid: string
): Promise<AssessmentSubmission[]> {
  const path = 'submissions';
  try {
    const q = query(collection(db, path), where('studentUid', '==', studentUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AssessmentSubmission);
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  }
}

export async function saveSubmission(submission: AssessmentSubmission): Promise<void> {
  const path = `submissions/${submission.id}`;
  try {
    await setDoc(doc(db, 'submissions', submission.id), stripUndefined(submission));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

function reportSnapshotError(
  error: unknown,
  path: string,
  onError?: (err: Error) => void
): void {
  try {
    handleFirestoreError(error, FirestoreOp.LIST, path);
  } catch (formatted) {
    onError?.(formatted instanceof Error ? formatted : new Error(String(formatted)));
  }
}

// =========================================================================
// Real-Time Firestore onSnapshot Listeners
// =========================================================================

export function subscribeToTeacherClassrooms(
  teacherUid: string,
  onData: (classrooms: Classroom[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'classrooms';
  const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    async (snap) => {
      try {
        const classrooms = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data() as Record<string, unknown>;
            const id = String(data.id ?? d.id);
            const rosterSnap = await getDocs(
              query(collection(db, `classrooms/${id}/roster`), where('teacherUid', '==', teacherUid))
            );
            const students: StudentRosterEntry[] = rosterSnap.docs.map((rd) => {
              const r = rd.data() as Record<string, unknown>;
              return {
                uid: String(r.uid ?? rd.id),
                name: String(r.name ?? ''),
                email: String(r.email ?? ''),
                rollNumber: typeof r.rollNumber === 'string' ? r.rollNumber : undefined,
              };
            });
            return {
              id,
              name: String(data.name ?? ''),
              subject: String(data.subject ?? ''),
              gradeLevel: String(data.gradeLevel ?? ''),
              courseCode: typeof data.courseCode === 'string' ? data.courseCode : undefined,
              semester: typeof data.semester === 'string' ? data.semester : undefined,
              credits: typeof data.credits === 'number' ? data.credits : undefined,
              joinCode: String(data.joinCode ?? ''),
              teacherUid: String(data.teacherUid ?? ''),
              teacherName: String(data.teacherName ?? ''),
              studentUids: Array.isArray(data.studentUids) ? (data.studentUids as string[]) : [],
              students,
              createdAt: String(data.createdAt ?? ''),
            } satisfies Classroom;
          })
        );
        onData(classrooms.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch (err) {
        reportSnapshotError(err, path, onError);
      }
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToAdminClassrooms(
  onData: (classrooms: Classroom[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'classrooms';
  const q = query(collection(db, path));
  return onSnapshot(
    q,
    (snap) => {
      const classrooms: Classroom[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: String(data.id ?? d.id),
          name: String(data.name ?? ''),
          subject: String(data.subject ?? ''),
          gradeLevel: String(data.gradeLevel ?? ''),
          courseCode: typeof data.courseCode === 'string' ? data.courseCode : undefined,
          semester: typeof data.semester === 'string' ? data.semester : undefined,
          credits: typeof data.credits === 'number' ? data.credits : undefined,
          joinCode: String(data.joinCode ?? ''),
          teacherUid: String(data.teacherUid ?? ''),
          teacherName: String(data.teacherName ?? ''),
          studentUids: Array.isArray(data.studentUids) ? (data.studentUids as string[]) : [],
          students: [],
          createdAt: String(data.createdAt ?? ''),
        };
      });
      onData(classrooms.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToStudentClassrooms(
  studentUid: string,
  onData: (classrooms: Classroom[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'classrooms';
  const q = query(collection(db, path), where('studentUids', 'array-contains', studentUid));
  return onSnapshot(
    q,
    (snap) => {
      const classrooms: Classroom[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: String(data.id ?? d.id),
          name: String(data.name ?? ''),
          subject: String(data.subject ?? ''),
          gradeLevel: String(data.gradeLevel ?? ''),
          courseCode: typeof data.courseCode === 'string' ? data.courseCode : undefined,
          semester: typeof data.semester === 'string' ? data.semester : undefined,
          credits: typeof data.credits === 'number' ? data.credits : undefined,
          joinCode: String(data.joinCode ?? ''),
          teacherUid: String(data.teacherUid ?? ''),
          teacherName: String(data.teacherName ?? ''),
          studentUids: Array.isArray(data.studentUids) ? (data.studentUids as string[]) : [],
          students: [],
          createdAt: String(data.createdAt ?? ''),
        };
      });
      onData(classrooms.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToTeacherMaterials(
  teacherUid: string,
  onData: (materials: StudyMaterial[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'materials';
  const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as StudyMaterial)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToStudentMaterials(
  studentUid: string,
  onData: (materials: StudyMaterial[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'materials';
  const q = query(collection(db, path), where('studentUids', 'array-contains', studentUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as StudyMaterial)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToTeacherAssessments(
  teacherUid: string,
  onData: (assessments: Assessment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'assessments';
  const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as Assessment)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToStudentPublishedAssessments(
  studentUid: string,
  onData: (assessments: Assessment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'publishedAssessments';
  const q = query(
    collection(db, path),
    where('status', '==', 'published'),
    where('studentUids', 'array-contains', studentUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => publishedAssessmentToStudentShell(d.data() as PublishedAssessment))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToTeacherSubmissions(
  teacherUid: string,
  onData: (submissions: AssessmentSubmission[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'submissions';
  const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as AssessmentSubmission)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToStudentSubmissions(
  studentUid: string,
  onData: (submissions: AssessmentSubmission[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'submissions';
  const q = query(collection(db, path), where('studentUid', '==', studentUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as AssessmentSubmission)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToConversations(
  userUid: string,
  onData: (conversations: Conversation[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'conversations';
  const q = query(collection(db, path), where('participantUids', 'array-contains', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as Conversation);
      onData(sortConversationsByRecent(items));
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToMessages(
  conversationId: string,
  userUid: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `conversations/${conversationId}/messages`;
  const q = query(collection(db, path), where('participantUids', 'array-contains', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as ChatMessage)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToAnnouncementsForUser(
  userUid: string,
  role: UserRole,
  onData: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'announcements';
  const q =
    role === 'teacher' || role === 'admin'
      ? query(collection(db, path), where('teacherUid', '==', userUid))
      : query(collection(db, path), where('studentUids', 'array-contains', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as Announcement);
      onData(sortAnnouncementsByRecent(items));
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export function subscribeToNotifications(
  recipientUid: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'notifications';
  const q = query(collection(db, path), where('recipientUid', '==', recipientUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as AppNotification);
      onData(sortNotificationsByRecent(items));
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

// =========================================================================
// Communication, Announcement & Notification Mutations
// =========================================================================

export async function ensureDirectConversation(params: {
  classroom: Classroom;
  studentUid: string;
  studentName: string;
  senderUid: string;
  senderName: string;
}): Promise<Conversation> {
  const { classroom, studentUid, studentName, senderUid, senderName } = params;
  const id = buildDirectConversationId(classroom.id, studentUid);
  const path = `conversations/${id}`;
  try {
    const existingSnap = await getDoc(doc(db, 'conversations', id));
    if (existingSnap.exists()) {
      return existingSnap.data() as Conversation;
    }
    const nowIso = new Date().toISOString();
    const conv: Conversation = {
      id,
      type: 'direct',
      classroomId: classroom.id,
      classroomName: classroom.name,
      teacherUid: classroom.teacherUid,
      teacherName: classroom.teacherName,
      studentUid,
      studentName,
      participantUids: Array.from(new Set([classroom.teacherUid, studentUid])),
      title: `${studentName} · Direct Mentoring`,
      lastMessageText: 'Conversation started',
      lastMessageAt: nowIso,
      lastSenderUid: senderUid,
      lastSenderName: senderName,
      unreadCounts: {
        [classroom.teacherUid]: 0,
        [studentUid]: 0,
      },
      createdAt: nowIso,
    };
    await setDoc(doc(db, 'conversations', id), stripUndefined(conv));
    return conv;
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function ensureClassroomConversation(params: {
  classroom: Classroom;
}): Promise<Conversation> {
  const { classroom } = params;
  const id = buildClassroomConversationId(classroom.id);
  const path = `conversations/${id}`;
  try {
    const participantUids = Array.from(
      new Set([classroom.teacherUid, ...classroom.studentUids])
    );
    const existingSnap = await getDoc(doc(db, 'conversations', id));
    if (existingSnap.exists()) {
      const existing = existingSnap.data() as Conversation;
      const sameParticipants =
        existing.participantUids.length === participantUids.length &&
        participantUids.every((u) => existing.participantUids.includes(u));
      if (!sameParticipants) {
        const nextUnread: Record<string, number> = {};
        for (const uid of participantUids) {
          nextUnread[uid] = existing.unreadCounts?.[uid] ?? 0;
        }
        await updateDoc(doc(db, 'conversations', id), {
          participantUids,
          unreadCounts: nextUnread,
        });
        return { ...existing, participantUids, unreadCounts: nextUnread };
      }
      return existing;
    }
    const nowIso = new Date().toISOString();
    const unreadCounts: Record<string, number> = {};
    for (const uid of participantUids) {
      unreadCounts[uid] = 0;
    }
    const conv: Conversation = {
      id,
      type: 'classroom',
      classroomId: classroom.id,
      classroomName: classroom.name,
      teacherUid: classroom.teacherUid,
      teacherName: classroom.teacherName,
      participantUids,
      title: `${classroom.name} (Class Channel)`,
      lastMessageText: 'Classroom discussion channel opened',
      lastMessageAt: nowIso,
      lastSenderUid: classroom.teacherUid,
      lastSenderName: classroom.teacherName,
      unreadCounts,
      createdAt: nowIso,
    };
    await setDoc(doc(db, 'conversations', id), stripUndefined(conv));
    return conv;
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function sendMessageToConversation(params: {
  conversation: Conversation;
  sender: UserProfile;
  body: string;
  materialId?: string;
  materialTitle?: string;
}): Promise<ChatMessage> {
  const { conversation, sender, body, materialId, materialTitle } = params;
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `conversations/${conversation.id}/messages/${msgId}`;
  const nowIso = new Date().toISOString();
  const message: ChatMessage = {
    id: msgId,
    conversationId: conversation.id,
    classroomId: conversation.classroomId,
    participantUids: conversation.participantUids,
    senderUid: sender.uid,
    senderName: sender.name,
    senderRole: sender.role,
    body,
    materialId,
    materialTitle,
    readBy: {
      [sender.uid]: nowIso,
    },
    createdAt: nowIso,
  };
  try {
    await setDoc(doc(db, `conversations/${conversation.id}/messages`, msgId), stripUndefined(message));
    await updateDoc(doc(db, 'conversations', conversation.id), {
      lastMessageText: body.slice(0, 380),
      lastMessageAt: nowIso,
      lastSenderUid: sender.uid,
      lastSenderName: sender.name,
      unreadCounts: buildUnreadCountsOnNewMessage(
        conversation.participantUids,
        conversation.unreadCounts ?? {},
        sender.uid
      ),
    });
    return message;
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

export async function markConversationAsRead(params: {
  conversation: Conversation;
  messages: ChatMessage[];
  readerUid: string;
}): Promise<void> {
  const { conversation, messages, readerUid } = params;
  const nowIso = new Date().toISOString();
  try {
    if ((conversation.unreadCounts?.[readerUid] ?? 0) > 0) {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        unreadCounts: markConversationUnreadCleared(conversation.unreadCounts ?? {}, readerUid),
      });
    }
    const unreadMessages = messages.filter(
      (m) => m.senderUid !== readerUid && !m.readBy?.[readerUid]
    );
    await Promise.all(
      unreadMessages.slice(-25).map((m) =>
        updateDoc(doc(db, `conversations/${conversation.id}/messages`, m.id), {
          [`readBy.${readerUid}`]: nowIso,
        })
      )
    );
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, `conversations/${conversation.id}`);
  }
}

export async function createAnnouncementDoc(announcement: Announcement): Promise<void> {
  const path = `announcements/${announcement.id}`;
  try {
    await setDoc(doc(db, 'announcements', announcement.id), stripUndefined(announcement));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

export async function acknowledgeAnnouncementDoc(
  announcementId: string,
  studentUid: string
): Promise<void> {
  const path = `announcements/${announcementId}`;
  try {
    await updateDoc(doc(db, 'announcements', announcementId), {
      acknowledgedBy: arrayUnion(studentUid),
    });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, path);
  }
}

export async function createNotificationDoc(notification: AppNotification): Promise<void> {
  const path = `notifications/${notification.id}`;
  try {
    await setDoc(doc(db, 'notifications', notification.id), stripUndefined(notification));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

export async function markNotificationReadDoc(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, path);
  }
}

// =========================================================================
// Phase 4: 8 Expanded Classroom Persistence Collections
// =========================================================================

// 1. Attendance Sessions
export function subscribeToAttendanceSessions(
  userUid: string,
  role: UserRole,
  onData: (sessions: AttendanceSession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'attendanceSessions';
  const q =
    role === 'teacher' || role === 'admin'
      ? query(collection(db, path), where('teacherUid', '==', userUid))
      : query(collection(db, path), where('studentUids', 'array-contains', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as AttendanceSession)
        .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate) || b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveAttendanceSessionDoc(session: AttendanceSession): Promise<void> {
  const path = `attendanceSessions/${session.id}`;
  try {
    await setDoc(doc(db, 'attendanceSessions', session.id), stripUndefined(session));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function deleteAttendanceSessionDoc(sessionId: string): Promise<void> {
  const path = `attendanceSessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'attendanceSessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

// 2. Teacher Lesson Plans
export function subscribeToLessonPlans(
  teacherUid: string,
  onData: (plans: PersistedLessonPlan[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'lessonPlans';
  const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as PersistedLessonPlan)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveLessonPlanDoc(plan: PersistedLessonPlan): Promise<void> {
  const path = `lessonPlans/${plan.id}`;
  try {
    const existing = await getDoc(doc(db, 'lessonPlans', plan.id));
    if (existing.exists()) {
      await updateDoc(doc(db, 'lessonPlans', plan.id), stripUndefined({
        recommendedFocus: plan.recommendedFocus,
        suggestedActivity: plan.suggestedActivity,
        aiOutline: plan.aiOutline,
        status: plan.status,
        updatedAt: plan.updatedAt,
      }));
    } else {
      await setDoc(doc(db, 'lessonPlans', plan.id), stripUndefined(plan));
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function deleteLessonPlanDoc(planId: string): Promise<void> {
  const path = `lessonPlans/${planId}`;
  try {
    await deleteDoc(doc(db, 'lessonPlans', planId));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

// 3. Bilingual Tutor Doubts & Explanations
export function subscribeToTutorDoubts(
  userUid: string,
  role: UserRole,
  onData: (doubts: TutorDoubtEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'tutorDoubts';
  const q =
    role === 'teacher' || role === 'admin'
      ? query(collection(db, path), where('teacherUid', '==', userUid))
      : query(collection(db, path), where('studentUid', '==', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as TutorDoubtEntry)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveTutorDoubtDoc(doubt: TutorDoubtEntry): Promise<void> {
  const path = `tutorDoubts/${doubt.id}`;
  try {
    await setDoc(doc(db, 'tutorDoubts', doubt.id), stripUndefined(doubt));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

export async function deleteTutorDoubtDoc(doubtId: string): Promise<void> {
  const path = `tutorDoubts/${doubtId}`;
  try {
    await deleteDoc(doc(db, 'tutorDoubts', doubtId));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

// 4. Student Revision Task Progress
export function subscribeToRevisionTasks(
  userUid: string,
  role: UserRole,
  onData: (tasks: RevisionTaskProgress[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'revisionTasks';
  const q =
    role === 'teacher' || role === 'admin'
      ? query(collection(db, path), where('teacherUid', '==', userUid))
      : query(collection(db, path), where('studentUid', '==', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as RevisionTaskProgress)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveRevisionTaskDoc(task: RevisionTaskProgress): Promise<void> {
  const path = `revisionTasks/${task.id}`;
  try {
    const existing = await getDoc(doc(db, 'revisionTasks', task.id));
    if (existing.exists()) {
      await updateDoc(doc(db, 'revisionTasks', task.id), stripUndefined({
        status: task.status,
        reflectionNote: task.reflectionNote,
        updatedAt: task.updatedAt,
      }));
    } else {
      await setDoc(doc(db, 'revisionTasks', task.id), stripUndefined(task));
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

// 5. Material Engagement Tracking
export function subscribeToMaterialEngagements(
  userUid: string,
  role: UserRole,
  onData: (engagements: MaterialEngagement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'materialEngagements';
  const q =
    role === 'teacher' || role === 'admin'
      ? query(collection(db, path), where('teacherUid', '==', userUid))
      : query(collection(db, path), where('studentUid', '==', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as MaterialEngagement)
        .sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveMaterialEngagementDoc(engagement: MaterialEngagement): Promise<void> {
  const path = `materialEngagements/${engagement.id}`;
  try {
    const existing = await getDoc(doc(db, 'materialEngagements', engagement.id));
    if (existing.exists()) {
      await updateDoc(doc(db, 'materialEngagements', engagement.id), stripUndefined({
        status: engagement.status,
        viewCount: engagement.viewCount,
        lastViewedAt: engagement.lastViewedAt,
      }));
    } else {
      await setDoc(doc(db, 'materialEngagements', engagement.id), stripUndefined(engagement));
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

// 6. Classroom Scheduled Activities
export function subscribeToClassroomActivities(
  userUid: string,
  role: UserRole,
  onData: (activities: ClassroomActivity[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'classroomActivities';
  const q =
    role === 'teacher' || role === 'admin'
      ? query(collection(db, path), where('teacherUid', '==', userUid))
      : query(collection(db, path), where('studentUids', 'array-contains', userUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as ClassroomActivity)
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveClassroomActivityDoc(activity: ClassroomActivity): Promise<void> {
  const path = `classroomActivities/${activity.id}`;
  try {
    await setDoc(doc(db, 'classroomActivities', activity.id), stripUndefined(activity));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.CREATE, path);
  }
}

export async function toggleClassroomActivityDoc(
  activityId: string,
  completed: boolean
): Promise<void> {
  const path = `classroomActivities/${activityId}`;
  try {
    await updateDoc(doc(db, 'classroomActivities', activityId), { completed });
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.UPDATE, path);
  }
}

export async function deleteClassroomActivityDoc(activityId: string): Promise<void> {
  const path = `classroomActivities/${activityId}`;
  try {
    await deleteDoc(doc(db, 'classroomActivities', activityId));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

// 7. Teacher Private Question Bank
export function subscribeToQuestionBank(
  teacherUid: string,
  onData: (items: QuestionBankItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'questionBank';
  const q = query(collection(db, path), where('teacherUid', '==', teacherUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as QuestionBankItem)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveQuestionBankItemDoc(item: QuestionBankItem): Promise<void> {
  const path = `questionBank/${item.id}`;
  try {
    await setDoc(doc(db, 'questionBank', item.id), stripUndefined(item));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function deleteQuestionBankItemDoc(itemId: string): Promise<void> {
  const path = `questionBank/${itemId}`;
  try {
    await deleteDoc(doc(db, 'questionBank', itemId));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

// 8. Student Personal Bilingual Revision Notes
export function subscribeToStudentNotes(
  studentUid: string,
  onData: (notes: StudentStudyNote[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'studentNotes';
  const q = query(collection(db, path), where('studentUid', '==', studentUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as StudentStudyNote)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveStudentNoteDoc(note: StudentStudyNote): Promise<void> {
  const path = `studentNotes/${note.id}`;
  try {
    const existing = await getDoc(doc(db, 'studentNotes', note.id));
    if (existing.exists()) {
      await updateDoc(doc(db, 'studentNotes', note.id), stripUndefined({
        conceptId: note.conceptId,
        conceptName: note.conceptName,
        title: note.title,
        content: note.content,
        language: note.language,
        updatedAt: note.updatedAt,
      }));
    } else {
      await setDoc(doc(db, 'studentNotes', note.id), stripUndefined(note));
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

export async function deleteStudentNoteDoc(noteId: string): Promise<void> {
  const path = `studentNotes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'studentNotes', noteId));
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.DELETE, path);
  }
}

// 9. Per-Student DBMS Curriculum Topic Completion
export function subscribeToCurriculumProgress(
  studentUid: string,
  onData: (records: CurriculumTopicProgress[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'curriculumProgress';
  const q = query(collection(db, path), where('studentUid', '==', studentUid));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .map((d) => d.data() as CurriculumTopicProgress)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onData(items);
    },
    (error) => reportSnapshotError(error, path, onError)
  );
}

export async function saveCurriculumProgressDoc(
  progress: CurriculumTopicProgress
): Promise<void> {
  const path = `curriculumProgress/${progress.id}`;
  try {
    const existing = await getDoc(doc(db, 'curriculumProgress', progress.id));
    if (existing.exists()) {
      await updateDoc(
        doc(db, 'curriculumProgress', progress.id),
        stripUndefined({
          completedTopicIds: progress.completedTopicIds,
          lastViewedTopicId: progress.lastViewedTopicId,
          updatedAt: progress.updatedAt,
        })
      );
    } else {
      await setDoc(doc(db, 'curriculumProgress', progress.id), stripUndefined(progress));
    }
  } catch (error) {
    handleFirestoreError(error, FirestoreOp.WRITE, path);
  }
}

