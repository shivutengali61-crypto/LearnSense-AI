import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { auth, googleAuthProvider, testFirestoreConnection } from '../lib/firebase';
import {
  acknowledgeAnnouncementDoc,
  addTeacherToAllowlist,
  createAnnouncementDoc,
  createNotificationDoc,
  createSubmissionLock,
  deleteAttendanceSessionDoc,
  deleteClassroomActivityDoc,
  deleteLessonPlanDoc,
  deleteQuestionBankItemDoc,
  deleteStudentNoteDoc,
  deleteTutorDoubtDoc,
  ensureClassroomConversation,
  ensureDirectConversation,
  getAssessmentAnswerKey,
  getUserProfile,
  isEmailAuthorizedForTeacher,
  joinClassroomByInviteCode,
  markConversationAsRead,
  markNotificationReadDoc,
  removeRosterStudent,
  saveAssessment,
  saveAttendanceSessionDoc,
  saveClassroom,
  saveClassroomActivityDoc,
  saveCurriculumProgressDoc,
  saveEnrollmentRecord,
  saveLessonPlanDoc,
  saveMaterial,
  saveMaterialEngagementDoc,
  saveQuestionBankItemDoc,
  saveRevisionTaskDoc,
  saveStudentNoteDoc,
  saveSubmission,
  saveTutorDoubtDoc,
  saveUserProfile,
  sendMessageToConversation,
  subscribeToAdminClassrooms,
  subscribeToAnnouncementsForUser,
  subscribeToAttendanceSessions,
  subscribeToClassroomActivities,
  subscribeToConversations,
  subscribeToCurriculumProgress,
  subscribeToLessonPlans,
  subscribeToMaterialEngagements,
  subscribeToMessages,
  subscribeToNotifications,
  subscribeToQuestionBank,
  subscribeToRevisionTasks,
  subscribeToStudentClassrooms,
  subscribeToStudentMaterials,
  subscribeToStudentNotes,
  subscribeToStudentPublishedAssessments,
  subscribeToStudentSubmissions,
  subscribeToTeacherAssessments,
  subscribeToTeacherClassrooms,
  subscribeToTeacherMaterials,
  subscribeToTeacherSubmissions,
  subscribeToTutorDoubts,
  toggleClassroomActivityDoc,
  updateAssessment,
  updateUserProfile,
  upsertRosterStudent,
} from '../lib/firestoreRepo';
import {
  assertProfileUpdateAllowed,
  assertRoleLoginAllowed,
  assertSubmissionAllowed,
  buildCurriculumProgressId,
  buildLessonPlanId,
  buildMaterialEngagementId,
  buildRevisionTaskId,
  rehydrateAssessmentWithAnswerKey,
} from '../lib/repoRules';
import { getAllDbmsChapters } from '../data/dbmsCurriculum';
import { DBMS_CURRICULUM_ID, toggleTopicIdInList } from '../utils/curriculumProgress';
import {
  DEMO_ADMIN,
  DEMO_STUDENT,
  DEMO_TEACHER,
  type LearnSenseWorkspaceState,
  createInitialDemoWorkspace,
} from '../data/demoSeed';
import { evaluateAssessmentSubmission } from '../utils/mastery';
import {
  generateUniqueClassroomCode,
  validateJoinCode,
  validateRosterStudentInput,
} from '../utils/classroomManager';
import {
  buildClassroomConversationId,
  buildDirectConversationId,
  buildEnrollmentId,
  buildNotificationPayload,
  buildUnreadCountsOnNewMessage,
  deriveUpcomingDeadlineNotifications,
  markConversationUnreadCleared,
  sortAnnouncementsByRecent,
  sortConversationsByRecent,
  sortNotificationsByRecent,
  validateAnnouncementInput,
  validateMessageBody,
} from '../utils/communication';
import type {
  Announcement,
  AppNotification,
  Assessment,
  AssessmentStatus,
  AssessmentSubmission,
  AttendanceSession,
  AttendanceStatus,
  ChatMessage,
  Classroom,
  ClassroomActivity,
  ClassroomActivityType,
  Conversation,
  CurriculumTopicProgress,
  LanguageCode,
  MaterialEngagement,
  PersistedLessonPlan,
  PublishedAssessment,
  Question,
  QuestionApprovalStatus,
  QuestionBankItem,
  RevisionTaskProgress,
  StudentRosterEntry,
  StudentStudyNote,
  StudyMaterial,
  SubmissionLock,
  ThemeMode,
  TopicNode,
  TutorDoubtEntry,
  UserProfile,
  UserRole,
} from '../types/learnsense';

const DEMO_STORAGE_KEY = 'learnsense_demo_workspace_v2';
const THEME_STORAGE_KEY = 'learnsense_theme_v1';
const DEADLINE_READ_STORAGE_KEY = 'learnsense_read_deadlines_v1';

const EMPTY_WORKSPACE: LearnSenseWorkspaceState = {
  classrooms: [],
  materials: [],
  assessments: [],
  submissions: [],
  conversations: [],
  messagesByConversation: {},
  announcements: [],
  notifications: [],
  attendanceSessions: [],
  lessonPlans: [],
  tutorDoubts: [],
  revisionTasks: [],
  materialEngagements: [],
  classroomActivities: [],
  questionBank: [],
  studentNotes: [],
  curriculumProgress: [],
};

interface AiStatusInfo {
  geminiConfigured: boolean;
  sarvamConfigured: boolean;
  moodleConfigured: boolean;
  pdfParserReady: boolean;
}

interface WorkspaceContextValue {
  user: UserProfile | null;
  authLoading: boolean;
  dataLoading: boolean;
  isDemoMode: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  workspace: LearnSenseWorkspaceState;
  selectedClassroomId: string;
  setSelectedClassroomId: (id: string) => void;
  activeConversationId: string;
  setActiveConversationId: (id: string) => void;
  allNotifications: AppNotification[];
  aiStatus: AiStatusInfo;
  errorMessage: string | null;
  clearError: () => void;
  refreshWorkspace: () => Promise<void>;
  signInWithGoogle: (options: {
    mode: 'login' | 'register';
    role: UserRole;
    customName?: string;
    preferredLanguage?: LanguageCode;
    joinCode?: string;
  }) => Promise<void>;
  updateCurrentProfile: (patch: {
    name: string;
    preferredLanguage: LanguageCode;
  }) => Promise<void>;
  authorizeTeacherEmail: (email: string) => Promise<void>;
  joinClassroomWithCode: (joinCode: string) => Promise<Classroom>;
  enterDemoMode: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  resetDemoWorkspace: () => void;
  logout: () => Promise<void>;
  createClassroom: (input: {
    name: string;
    subject: string;
    gradeLevel: string;
    courseCode?: string;
    semester?: string;
    credits?: number;
    joinCode?: string;
  }) => Promise<Classroom>;
  regenerateClassroomCode: (classroomId: string, customCode?: string) => Promise<string>;
  addStudentToClassroom: (
    classroomId: string,
    student: Omit<StudentRosterEntry, 'uid'>
  ) => Promise<void>;
  updateStudentInClassroom: (
    classroomId: string,
    studentUid: string,
    patch: { name: string; email: string; rollNumber?: string }
  ) => Promise<void>;
  removeStudentFromClassroom: (classroomId: string, studentUid: string) => Promise<void>;
  uploadMaterialFile: (
    classroomId: string,
    title: string,
    file: File,
    enhanceWithAi: boolean
  ) => Promise<{ material: StudyMaterial; warning?: string }>;
  createMaterialFromText: (
    classroomId: string,
    title: string,
    rawText: string
  ) => Promise<StudyMaterial>;
  updateMaterialTopics: (
    materialId: string,
    topics: TopicNode[],
    source: 'gemini_ai' | 'sarvam_ai' | 'local_pdf_parser' | 'manual'
  ) => Promise<void>;
  createAssessment: (input: {
    classroomId: string;
    title: string;
    description: string;
    durationMinutes: number;
    dueDate: string;
    allowRetakes?: boolean;
    questions: Question[];
    status: AssessmentStatus;
  }) => Promise<Assessment>;
  addQuestionsToAssessment: (assessmentId: string, newQuestions: Question[]) => Promise<void>;
  updateQuestionInAssessment: (assessmentId: string, updatedQuestion: Question) => Promise<void>;
  removeQuestionFromAssessment: (assessmentId: string, questionId: string) => Promise<void>;
  reviewAssessmentQuestion: (
    assessmentId: string,
    questionId: string,
    approvalStatus: QuestionApprovalStatus
  ) => Promise<void>;
  setAssessmentStatus: (assessmentId: string, status: AssessmentStatus) => Promise<void>;
  setAssessmentRetakePolicy: (assessmentId: string, allowRetakes: boolean) => Promise<void>;
  submitAssessment: (
    assessmentId: string,
    answersByQuestionId: Record<string, string>,
    meta?: { elapsedSeconds?: number; timedOut?: boolean }
  ) => Promise<AssessmentSubmission>;
  startDirectConversation: (classroomId: string, studentUid?: string) => Promise<Conversation>;
  startClassroomConversation: (classroomId: string) => Promise<Conversation>;
  sendMessage: (
    conversationId: string,
    body: string,
    material?: { id: string; title: string }
  ) => Promise<ChatMessage>;
  markConversationRead: (conversationId: string) => Promise<void>;
  publishAnnouncement: (input: {
    classroomId: string;
    title: string;
    body: string;
    priority: 'normal' | 'important';
    materialId?: string;
  }) => Promise<Announcement>;
  acknowledgeAnnouncement: (announcementId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  recordAttendanceSession: (input: {
    classroomId: string;
    sessionDate: string;
    topic: string;
    records: Record<string, AttendanceStatus>;
  }) => Promise<AttendanceSession>;
  deleteAttendanceSession: (sessionId: string) => Promise<void>;
  saveLessonPlan: (input: {
    classroomId: string;
    conceptId: string;
    conceptName: string;
    classMasteryPct: number;
    recommendedFocus: string;
    suggestedActivity: string;
    aiOutline?: PersistedLessonPlan['aiOutline'];
    status?: 'approved' | 'completed';
  }) => Promise<PersistedLessonPlan>;
  deleteLessonPlan: (planId: string) => Promise<void>;
  saveTutorDoubt: (input: {
    classroomId: string;
    teacherUid: string;
    materialId: string;
    materialTitle: string;
    question: string;
    answerEn: string;
    answerKn?: string;
    language: LanguageCode;
    entryType: 'doubt' | 'explanation';
  }) => Promise<TutorDoubtEntry>;
  deleteTutorDoubt: (doubtId: string) => Promise<void>;
  toggleRevisionTask: (input: {
    classroomId: string;
    teacherUid: string;
    conceptId: string;
    conceptName: string;
    matchedMaterialId?: string;
    matchedMaterialTitle?: string;
    reflectionNote?: string;
  }) => Promise<RevisionTaskProgress>;
  trackMaterialEngagement: (input: {
    material: StudyMaterial;
    status: 'viewed' | 'completed';
  }) => Promise<MaterialEngagement>;
  createClassroomActivity: (input: {
    classroomId: string;
    title: string;
    activityType: ClassroomActivityType;
    scheduledDate: string;
    description: string;
  }) => Promise<ClassroomActivity>;
  toggleClassroomActivity: (activityId: string, completed: boolean) => Promise<void>;
  deleteClassroomActivity: (activityId: string) => Promise<void>;
  saveToQuestionBank: (input: {
    subject: string;
    question: Question;
  }) => Promise<QuestionBankItem>;
  deleteFromQuestionBank: (itemId: string) => Promise<void>;
  saveStudentNote: (input: {
    id?: string;
    classroomId: string;
    conceptId?: string;
    conceptName?: string;
    title: string;
    content: string;
    language: LanguageCode;
  }) => Promise<StudentStudyNote>;
  deleteStudentNote: (noteId: string) => Promise<void>;
  toggleCurriculumTopicCompleted: (
    topicId: string,
    targetStudentUid?: string
  ) => Promise<CurriculumTopicProgress>;
  setLastViewedCurriculumTopic: (
    topicId: string,
    targetStudentUid?: string
  ) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // ignore storage access issues
  }
  return 'light';
}

function loadReadDeadlineIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DEADLINE_READ_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((item): item is string => typeof item === 'string'));
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

function loadDemoWorkspaceFromStorage(): LearnSenseWorkspaceState {
  const seed = createInitialDemoWorkspace();
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LearnSenseWorkspaceState>;
      if (parsed && Array.isArray(parsed.classrooms)) {
        return {
          classrooms: parsed.classrooms,
          materials: Array.isArray(parsed.materials) ? parsed.materials : seed.materials,
          assessments: Array.isArray(parsed.assessments) ? parsed.assessments : seed.assessments,
          submissions: Array.isArray(parsed.submissions) ? parsed.submissions : seed.submissions,
          conversations: Array.isArray(parsed.conversations)
            ? parsed.conversations
            : seed.conversations,
          messagesByConversation:
            parsed.messagesByConversation && typeof parsed.messagesByConversation === 'object'
              ? parsed.messagesByConversation
              : seed.messagesByConversation,
          announcements: Array.isArray(parsed.announcements)
            ? parsed.announcements
            : seed.announcements,
          notifications: Array.isArray(parsed.notifications)
            ? parsed.notifications
            : seed.notifications,
          attendanceSessions: Array.isArray(parsed.attendanceSessions)
            ? parsed.attendanceSessions
            : seed.attendanceSessions,
          lessonPlans: Array.isArray(parsed.lessonPlans)
            ? parsed.lessonPlans
            : seed.lessonPlans,
          tutorDoubts: Array.isArray(parsed.tutorDoubts)
            ? parsed.tutorDoubts
            : seed.tutorDoubts,
          revisionTasks: Array.isArray(parsed.revisionTasks)
            ? parsed.revisionTasks
            : seed.revisionTasks,
          materialEngagements: Array.isArray(parsed.materialEngagements)
            ? parsed.materialEngagements
            : seed.materialEngagements,
          classroomActivities: Array.isArray(parsed.classroomActivities)
            ? parsed.classroomActivities
            : seed.classroomActivities,
          questionBank: Array.isArray(parsed.questionBank)
            ? parsed.questionBank
            : seed.questionBank,
          studentNotes: Array.isArray(parsed.studentNotes)
            ? parsed.studentNotes
            : seed.studentNotes,
          curriculumProgress: Array.isArray(parsed.curriculumProgress)
            ? parsed.curriculumProgress
            : seed.curriculumProgress,
        };
      }
    }
  } catch {
    // ignore storage parse failure
  }
  return seed;
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [workspace, setWorkspace] = useState<LearnSenseWorkspaceState>(EMPTY_WORKSPACE);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [readDeadlineIds, setReadDeadlineIds] = useState<Set<string>>(loadReadDeadlineIds);
  const [syncEpoch, setSyncEpoch] = useState(0);
  const [aiStatus, setAiStatus] = useState<AiStatusInfo>({
    geminiConfigured: false,
    sarvamConfigured: false,
    moodleConfigured: false,
    pdfParserReady: true,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signingInRef = useRef(false);
  const workspaceUnsubsRef = useRef<Unsubscribe[]>([]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  // Sync Tailwind v4 class-based dark mode on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAiStatus({
            geminiConfigured: Boolean(data.geminiConfigured),
            sarvamConfigured: Boolean(data.sarvamConfigured),
            moodleConfigured: Boolean(data.moodleConfigured),
            pdfParserReady: Boolean(data.pdfParserReady),
          });
        }
      })
      .catch(() => {
        // non-blocking
      });

    testFirestoreConnection().catch(() => {});
  }, []);

  const updateWorkspace = useCallback(
    (updater: (prev: LearnSenseWorkspaceState) => LearnSenseWorkspaceState) => {
      setWorkspace((prev) => {
        const next = updater(prev);
        if (isDemoMode) {
          try {
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore quota errors
          }
        }
        return next;
      });
    },
    [isDemoMode]
  );

  // Real-time Firestore onSnapshot workspace synchronization
  useEffect(() => {
    for (const unsub of workspaceUnsubsRef.current) {
      try {
        unsub();
      } catch {
        // ignore
      }
    }
    workspaceUnsubsRef.current = [];

    if (!user || isDemoMode) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    setDataLoading(true);
    setErrorMessage(null);

    const handleSubError = (err: Error) => {
      if (cancelled) return;
      setDataLoading(false);
      setErrorMessage(
        `Real-time Firestore sync error: ${err.message}`
      );
    };

    const unsubs: Unsubscribe[] = [];

    if (user.role === 'teacher' || user.role === 'admin') {
      unsubs.push(
        (user.role === 'admin'
          ? subscribeToAdminClassrooms(
              (classrooms) => {
                if (cancelled) return;
                setWorkspace((prev) => ({ ...prev, classrooms }));
                setSelectedClassroomId((prev) =>
                  prev && classrooms.some((c) => c.id === prev) ? prev : classrooms[0]?.id ?? ''
                );
                setDataLoading(false);
              },
              handleSubError
            )
          : subscribeToTeacherClassrooms(
              user.uid,
              (classrooms) => {
                if (cancelled) return;
                setWorkspace((prev) => ({ ...prev, classrooms }));
                setSelectedClassroomId((prev) =>
                  prev && classrooms.some((c) => c.id === prev) ? prev : classrooms[0]?.id ?? ''
                );
                setDataLoading(false);
              },
              handleSubError
            )),
        subscribeToTeacherMaterials(
          user.uid,
          (materials) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, materials }));
          },
          handleSubError
        ),
        subscribeToTeacherAssessments(
          user.uid,
          (assessments) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, assessments }));
          },
          handleSubError
        ),
        subscribeToTeacherSubmissions(
          user.uid,
          (submissions) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, submissions }));
          },
          handleSubError
        )
      );
    } else {
      unsubs.push(
        subscribeToStudentClassrooms(
          user.uid,
          (classrooms) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, classrooms }));
            setSelectedClassroomId((prev) =>
              prev && classrooms.some((c) => c.id === prev) ? prev : classrooms[0]?.id ?? ''
            );
            setDataLoading(false);
          },
          handleSubError
        ),
        subscribeToStudentMaterials(
          user.uid,
          (materials) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, materials }));
          },
          handleSubError
        ),
        subscribeToStudentPublishedAssessments(
          user.uid,
          (assessments) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, assessments }));
          },
          handleSubError
        ),
        subscribeToStudentSubmissions(
          user.uid,
          (submissions) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, submissions }));
          },
          handleSubError
        )
      );
    }

    // Shared real-time communication, announcement & notification streams
    unsubs.push(
      subscribeToConversations(
        user.uid,
        (conversations) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, conversations }));
          setActiveConversationId((prev) =>
            prev && conversations.some((c) => c.id === prev) ? prev : conversations[0]?.id ?? ''
          );
        },
        handleSubError
      ),
      subscribeToAnnouncementsForUser(
        user.uid,
        user.role,
        (announcements) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, announcements }));
        },
        handleSubError
      ),
      subscribeToNotifications(
        user.uid,
        (notifications) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, notifications }));
        },
        handleSubError
      ),
      subscribeToAttendanceSessions(
        user.uid,
        user.role,
        (attendanceSessions) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, attendanceSessions }));
        },
        handleSubError
      ),
      subscribeToTutorDoubts(
        user.uid,
        user.role,
        (tutorDoubts) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, tutorDoubts }));
        },
        handleSubError
      ),
      subscribeToRevisionTasks(
        user.uid,
        user.role,
        (revisionTasks) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, revisionTasks }));
        },
        handleSubError
      ),
      subscribeToMaterialEngagements(
        user.uid,
        user.role,
        (materialEngagements) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, materialEngagements }));
        },
        handleSubError
      ),
      subscribeToClassroomActivities(
        user.uid,
        user.role,
        (classroomActivities) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, classroomActivities }));
        },
        handleSubError
      )
    );

    if (user.role === 'teacher' || user.role === 'admin') {
      unsubs.push(
        subscribeToLessonPlans(
          user.uid,
          (lessonPlans) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, lessonPlans }));
          },
          handleSubError
        ),
        subscribeToQuestionBank(
          user.uid,
          (questionBank) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, questionBank }));
          },
          handleSubError
        )
      );
    } else {
      unsubs.push(
        subscribeToStudentNotes(
          user.uid,
          (studentNotes) => {
            if (cancelled) return;
            setWorkspace((prev) => ({ ...prev, studentNotes }));
          },
          handleSubError
        )
      );
    }

    unsubs.push(
      subscribeToCurriculumProgress(
        user.uid,
        (curriculumProgress) => {
          if (cancelled) return;
          setWorkspace((prev) => ({ ...prev, curriculumProgress }));
        },
        handleSubError
      )
    );

    workspaceUnsubsRef.current = unsubs;

    return () => {
      cancelled = true;
      for (const unsub of unsubs) {
        try {
          unsub();
        } catch {
          // ignore
        }
      }
      workspaceUnsubsRef.current = [];
    };
  }, [user?.uid, user?.role, isDemoMode, syncEpoch]);

  // Real-time onSnapshot subscription for messages of the active conversation
  useEffect(() => {
    if (!user || isDemoMode || !activeConversationId) {
      return;
    }
    let cancelled = false;
    const unsub = subscribeToMessages(
      activeConversationId,
      user.uid,
      (messages) => {
        if (cancelled) return;
        setWorkspace((prev) => ({
          ...prev,
          messagesByConversation: {
            ...prev.messagesByConversation,
            [activeConversationId]: messages,
          },
        }));
      },
      (err) => {
        if (cancelled) return;
        setErrorMessage(`Unable to sync conversation messages: ${err.message}`);
      }
    );

    return () => {
      cancelled = true;
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, [user?.uid, isDemoMode, activeConversationId]);

  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    if (isDemoMode) {
      const demoData = loadDemoWorkspaceFromStorage();
      setWorkspace(demoData);
      return;
    }
    setSyncEpoch((prev) => prev + 1);
  }, [user, isDemoMode]);

  // Real Firebase Auth session persistence across page refreshes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (signingInRef.current) {
        return;
      }
      if (!fbUser) {
        if (!isDemoMode) {
          setUser(null);
        }
        setAuthLoading(false);
        return;
      }
      if (isDemoMode) {
        setAuthLoading(false);
        return;
      }
      try {
        const existing = await getUserProfile(fbUser.uid);
        if (existing) {
          setUser(existing);
        } else {
          setUser(null);
        }
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to verify existing user session.'
        );
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, [isDemoMode]);

  const signInWithGoogle = useCallback(
    async (options: {
      mode: 'login' | 'register';
      role: UserRole;
      customName?: string;
      preferredLanguage?: LanguageCode;
      joinCode?: string;
    }) => {
      setErrorMessage(null);
      setAuthLoading(true);
      signingInRef.current = true;
      try {
        const cred = await signInWithPopup(auth, googleAuthProvider);
        const fbUser = cred.user;
        const email = (fbUser.email || '').trim().toLowerCase();
        const existing = await getUserProfile(fbUser.uid);

        if (options.mode === 'login' && !existing) {
          await signOut(auth);
          throw new Error(
            'No LearnSense profile found for this Google account yet. Switch to Register to create your portal account.'
          );
        }

        const isAuthorizedTeacher =
          !existing && (options.role === 'teacher' || options.role === 'admin')
            ? await isEmailAuthorizedForTeacher(email)
            : false;

        const gate = assertRoleLoginAllowed({
          existingProfile: existing,
          requestedRole: options.role,
          userEmail: email,
          emailVerified: fbUser.emailVerified,
          isAuthorizedTeacherEmail: isAuthorizedTeacher,
        });

        if (!gate.allowed) {
          await signOut(auth);
          throw new Error(gate.reason || 'Role validation failed.');
        }

        let activeProfile = existing;
        if (!activeProfile) {
          activeProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'user@learnsense.edu',
            name: options.customName?.trim() || fbUser.displayName || 'LearnSense User',
            role: options.role,
            preferredLanguage: options.preferredLanguage ?? 'en',
            createdAt: new Date().toISOString(),
          };
          await saveUserProfile(activeProfile);
        }

        if (activeProfile.role === 'student' && options.joinCode?.trim()) {
          await joinClassroomByInviteCode(options.joinCode, activeProfile);
        }

        setIsDemoMode(false);
        setUser(activeProfile);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Google Sign-In could not complete.'
        );
      } finally {
        signingInRef.current = false;
        setAuthLoading(false);
      }
    },
    []
  );

  const updateCurrentProfile = useCallback(
    async (patch: { name: string; preferredLanguage: LanguageCode }) => {
      if (!user) return;
      const check = assertProfileUpdateAllowed(user, {
        name: patch.name,
        role: user.role,
        preferredLanguage: patch.preferredLanguage,
      });
      if (!check.allowed) {
        throw new Error(check.reason || 'Profile update rejected.');
      }

      const cleanPatch = {
        name: patch.name.trim(),
        preferredLanguage: patch.preferredLanguage,
      };
      if (!isDemoMode) {
        await updateUserProfile(user.uid, cleanPatch);
      }
      setUser({
        ...user,
        ...cleanPatch,
      });
    },
    [user, isDemoMode]
  );

  const authorizeTeacherEmail = useCallback(
    async (email: string) => {
      if (!user || isDemoMode) {
        throw new Error('Sign in with your live admin account to authorize teacher emails.');
      }
      if (!email.trim().includes('@')) {
        throw new Error('Enter a valid faculty email address.');
      }
      await addTeacherToAllowlist(email, user.uid);
    },
    [user, isDemoMode]
  );

  const joinClassroomWithCode = useCallback(
    async (rawCode: string): Promise<Classroom> => {
      if (!user) throw new Error('Authentication required.');
      const code = rawCode.trim().toUpperCase();
      if (!code) throw new Error('Enter a classroom invite code.');

      if (isDemoMode) {
        const target = workspace.classrooms.find((c) => c.joinCode.toUpperCase() === code);
        if (!target) {
          throw new Error(`Demo classroom code "${code}" not found (try SCI9A or ALG10).`);
        }
        if (!target.studentUids.includes(user.uid)) {
          const updated: Classroom = {
            ...target,
            studentUids: [...target.studentUids, user.uid],
            students: [
              ...target.students,
              { uid: user.uid, name: user.name, email: user.email },
            ],
          };
          updateWorkspace((prev) => ({
            ...prev,
            classrooms: prev.classrooms.map((c) => (c.id === target.id ? updated : c)),
          }));
          setSelectedClassroomId(updated.id);
          return updated;
        }
        setSelectedClassroomId(target.id);
        return target;
      }

      const joined = await joinClassroomByInviteCode(code, user);
      setSelectedClassroomId(joined.id);
      return joined;
    },
    [user, isDemoMode, workspace.classrooms, updateWorkspace]
  );

  const enterDemoMode = useCallback((role: UserRole) => {
    setErrorMessage(null);
    const demoState = loadDemoWorkspaceFromStorage();
    setIsDemoMode(true);
    setWorkspace(demoState);
    setSelectedClassroomId(demoState.classrooms[0]?.id ?? '');
    setActiveConversationId(demoState.conversations[0]?.id ?? '');
    setUser(role === 'admin' ? DEMO_ADMIN : role === 'teacher' ? DEMO_TEACHER : DEMO_STUDENT);
    setAuthLoading(false);
  }, []);

  const switchDemoRole = useCallback(
    (role: UserRole) => {
      if (!isDemoMode) return;
      setErrorMessage(null);
      setUser((prev) => {
        const base =
          role === 'admin' ? DEMO_ADMIN : role === 'teacher' ? DEMO_TEACHER : DEMO_STUDENT;
        return prev?.preferredLanguage
          ? { ...base, preferredLanguage: prev.preferredLanguage }
          : base;
      });
    },
    [isDemoMode]
  );

  const resetDemoWorkspace = useCallback(() => {
    if (!isDemoMode) return;
    const fresh = createInitialDemoWorkspace();
    setWorkspace(fresh);
    setSelectedClassroomId(fresh.classrooms[0]?.id ?? '');
    setActiveConversationId(fresh.conversations[0]?.id ?? '');
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }, [isDemoMode]);

  const logout = useCallback(async () => {
    setErrorMessage(null);
    for (const unsub of workspaceUnsubsRef.current) {
      try {
        unsub();
      } catch {
        // ignore
      }
    }
    workspaceUnsubsRef.current = [];
    if (!isDemoMode && auth.currentUser) {
      await signOut(auth);
    }
    setIsDemoMode(false);
    setUser(null);
    setWorkspace(EMPTY_WORKSPACE);
    setSelectedClassroomId('');
    setActiveConversationId('');
  }, [isDemoMode]);

  // Helper to dispatch real notifications to Firestore or Demo store
  const emitNotifications = useCallback(
    async (items: AppNotification[]) => {
      if (items.length === 0) return;
      if (!isDemoMode) {
        await Promise.all(
          items.map((n) => createNotificationDoc(n).catch(() => {}))
        );
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          notifications: sortNotificationsByRecent([...items, ...prev.notifications]),
        }));
      }
    },
    [isDemoMode, updateWorkspace]
  );

  const getClassroomHelperArrays = useCallback(
    (classroomId: string) => ({
      materialIds: workspace.materials
        .filter((m) => m.classroomId === classroomId)
        .map((m) => m.id),
      publishedAssessmentIds: workspace.assessments
        .filter((a) => a.classroomId === classroomId && a.status === 'published')
        .map((a) => a.id),
    }),
    [workspace.materials, workspace.assessments]
  );

  const createClassroom = useCallback(
    async (input: {
      name: string;
      subject: string;
      gradeLevel: string;
      courseCode?: string;
      semester?: string;
      credits?: number;
      joinCode?: string;
    }) => {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        throw new Error('Only authenticated teachers or administrators can create courses.');
      }
      const existingCodes = workspace.classrooms.map((c) => c.joinCode);
      let finalCode: string;
      if (input.joinCode && input.joinCode.trim()) {
        const check = validateJoinCode(input.joinCode, existingCodes);
        if (!check.valid) {
          throw new Error(check.error || 'Invalid classroom code.');
        }
        finalCode = check.normalized;
      } else {
        finalCode = generateUniqueClassroomCode(input.courseCode || input.subject, existingCodes);
      }

      const id = `cls_${Date.now()}`;
      const classroom: Classroom = {
        id,
        name: input.name.trim(),
        subject: input.subject.trim(),
        gradeLevel: input.gradeLevel.trim(),
        courseCode: input.courseCode?.trim().toUpperCase() || undefined,
        semester: input.semester?.trim() || undefined,
        credits: typeof input.credits === 'number' && !Number.isNaN(input.credits) ? input.credits : undefined,
        joinCode: finalCode,
        teacherUid: user.uid,
        teacherName: user.name,
        studentUids: [],
        students: [],
        createdAt: new Date().toISOString(),
      };
      if (!isDemoMode) {
        await saveClassroom(classroom, { materialIds: [], publishedAssessmentIds: [] });
      }
      updateWorkspace((prev) => ({
        ...prev,
        classrooms: [classroom, ...prev.classrooms],
      }));
      setSelectedClassroomId(classroom.id);
      return classroom;
    },
    [user, workspace.classrooms, isDemoMode, updateWorkspace]
  );

  const regenerateClassroomCode = useCallback(
    async (classroomId: string, customCode?: string) => {
      const target = workspace.classrooms.find((c) => c.id === classroomId);
      if (!target) throw new Error('Classroom not found.');

      const existingCodes = workspace.classrooms.map((c) => c.joinCode);
      let nextCode: string;
      if (customCode && customCode.trim()) {
        const check = validateJoinCode(customCode, existingCodes, target.joinCode);
        if (!check.valid) {
          throw new Error(check.error || 'Invalid classroom code.');
        }
        nextCode = check.normalized;
      } else {
        nextCode = generateUniqueClassroomCode(target.subject, existingCodes);
      }

      const updated: Classroom = { ...target, joinCode: nextCode };
      if (!isDemoMode) {
        await saveClassroom(updated, {
          previousJoinCode: target.joinCode,
          ...getClassroomHelperArrays(classroomId),
        });
      }
      updateWorkspace((prev) => ({
        ...prev,
        classrooms: prev.classrooms.map((c) => (c.id === classroomId ? updated : c)),
      }));
      return nextCode;
    },
    [workspace.classrooms, isDemoMode, updateWorkspace, getClassroomHelperArrays]
  );

  const syncClassroomStudentVisibility = useCallback(
    async (classroomId: string, studentUids: string[]) => {
      if (isDemoMode) return;
      const mats = workspace.materials.filter((m) => m.classroomId === classroomId);
      const assess = workspace.assessments.filter(
        (a) => a.classroomId === classroomId && a.status !== 'draft'
      );
      await Promise.all([
        ...mats.map((m) => saveMaterial(m, studentUids)),
        ...assess.map((a) => updateAssessment(a, studentUids)),
      ]);
    },
    [isDemoMode, workspace.materials, workspace.assessments]
  );

  const addStudentToClassroom = useCallback(
    async (classroomId: string, student: Omit<StudentRosterEntry, 'uid'>) => {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        throw new Error('Teacher authorization required.');
      }
      const target = workspace.classrooms.find((c) => c.id === classroomId);
      if (!target) throw new Error('Classroom not found.');

      const check = validateRosterStudentInput(student, target.students);
      if (!check.valid) {
        throw new Error(check.error || 'Invalid student details.');
      }

      const nowIso = new Date().toISOString();
      const entry: StudentRosterEntry = {
        uid: `stu_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: student.name.trim(),
        email: student.email.trim(),
        rollNumber: student.rollNumber?.trim() || undefined,
      };
      const nextUids = [...target.studentUids, entry.uid];
      const updated: Classroom = {
        ...target,
        studentUids: nextUids,
        students: [...target.students, entry],
      };
      if (!isDemoMode) {
        await saveClassroom(updated, getClassroomHelperArrays(classroomId));
        await upsertRosterStudent(classroomId, target.teacherUid, entry);
        await saveEnrollmentRecord({
          id: buildEnrollmentId(classroomId, entry.uid),
          classroomId,
          teacherUid: target.teacherUid,
          studentUid: entry.uid,
          studentName: entry.name,
          studentEmail: entry.email,
          joinCode: target.joinCode,
          status: 'active',
          enrolledAt: nowIso,
        });
        await syncClassroomStudentVisibility(classroomId, nextUids);
      }
      updateWorkspace((prev) => ({
        ...prev,
        classrooms: prev.classrooms.map((c) => (c.id === classroomId ? updated : c)),
      }));
    },
    [
      user,
      workspace.classrooms,
      isDemoMode,
      updateWorkspace,
      getClassroomHelperArrays,
      syncClassroomStudentVisibility,
    ]
  );

  const updateStudentInClassroom = useCallback(
    async (
      classroomId: string,
      studentUid: string,
      patch: { name: string; email: string; rollNumber?: string }
    ) => {
      const target = workspace.classrooms.find((c) => c.id === classroomId);
      if (!target) throw new Error('Classroom not found.');

      const check = validateRosterStudentInput(patch, target.students, studentUid);
      if (!check.valid) {
        throw new Error(check.error || 'Invalid student details.');
      }

      const updatedStudents = target.students.map((s) =>
        s.uid === studentUid
          ? {
              ...s,
              name: patch.name.trim(),
              email: patch.email.trim(),
              rollNumber: patch.rollNumber?.trim() || undefined,
            }
          : s
      );
      const updatedEntry = updatedStudents.find((s) => s.uid === studentUid);
      const updated: Classroom = { ...target, students: updatedStudents };
      if (!isDemoMode && updatedEntry) {
        await upsertRosterStudent(classroomId, target.teacherUid, updatedEntry);
      }
      updateWorkspace((prev) => ({
        ...prev,
        classrooms: prev.classrooms.map((c) => (c.id === classroomId ? updated : c)),
      }));
    },
    [workspace.classrooms, isDemoMode, updateWorkspace]
  );

  const removeStudentFromClassroom = useCallback(
    async (classroomId: string, studentUid: string) => {
      const target = workspace.classrooms.find((c) => c.id === classroomId);
      if (!target) throw new Error('Classroom not found.');

      const nextUids = target.studentUids.filter((id) => id !== studentUid);
      const updated: Classroom = {
        ...target,
        studentUids: nextUids,
        students: target.students.filter((s) => s.uid !== studentUid),
      };
      if (!isDemoMode) {
        await saveClassroom(updated, getClassroomHelperArrays(classroomId));
        await removeRosterStudent(classroomId, studentUid);
        await syncClassroomStudentVisibility(classroomId, nextUids);
      }
      updateWorkspace((prev) => ({
        ...prev,
        classrooms: prev.classrooms.map((c) => (c.id === classroomId ? updated : c)),
      }));
    },
    [
      workspace.classrooms,
      isDemoMode,
      updateWorkspace,
      getClassroomHelperArrays,
      syncClassroomStudentVisibility,
    ]
  );

  const notifyStudentsInClassroom = useCallback(
    async (params: {
      classroom: Classroom | undefined;
      actor: UserProfile;
      type: 'material_published' | 'assessment_published' | 'announcement';
      title: string;
      body: string;
      targetTab: string;
      targetId: string;
    }) => {
      const { classroom, actor, type, title, body, targetTab, targetId } = params;
      if (!classroom || classroom.studentUids.length === 0) return;
      const payloads = classroom.studentUids.map((stuUid) =>
        buildNotificationPayload({
          recipientUid: stuUid,
          actorUid: actor.uid,
          actorName: actor.name,
          type,
          title,
          body,
          classroomId: classroom.id,
          targetTab,
          targetId,
        })
      );
      await emitNotifications(payloads);
    },
    [emitNotifications]
  );

  const uploadMaterialFile = useCallback(
    async (classroomId: string, title: string, file: File, enhanceWithAi: boolean) => {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        throw new Error('Teacher authentication required.');
      }
      const cls = workspace.classrooms.find((c) => c.id === classroomId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('enhanceWithAi', String(enhanceWithAi));

      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload and extract material.');
      }

      const material: StudyMaterial = {
        id: `mat_${Date.now()}`,
        classroomId,
        teacherUid: user.uid,
        title: title.trim() || file.name.replace(/\.[^.]+$/, ''),
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        extractedText: data.extractedText,
        extractionSource: data.extractionSource,
        topics: data.topics,
        createdAt: new Date().toISOString(),
      };

      if (!isDemoMode) {
        await saveMaterial(material, cls?.studentUids ?? []);
      }
      updateWorkspace((prev) => ({
        ...prev,
        materials: [material, ...prev.materials],
      }));
      await notifyStudentsInClassroom({
        classroom: cls,
        actor: user,
        type: 'material_published',
        title: `New study material: ${material.title}`,
        body: `${cls?.name ?? 'Classroom'} · ${material.topics.length} extracted topics ready to study.`,
        targetTab: 'materials',
        targetId: material.id,
      });
      return { material, warning: data.aiWarning as string | undefined };
    },
    [user, workspace.classrooms, isDemoMode, updateWorkspace, notifyStudentsInClassroom]
  );

  const createMaterialFromText = useCallback(
    async (classroomId: string, title: string, rawText: string) => {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        throw new Error('Teacher authentication required.');
      }
      const cls = workspace.classrooms.find((c) => c.id === classroomId);
      const response = await fetch('/api/materials/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text: rawText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse study notes.');
      }

      const material: StudyMaterial = {
        id: `mat_${Date.now()}`,
        classroomId,
        teacherUid: user.uid,
        title: title.trim(),
        fileName: `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}.txt`,
        extractedText: data.extractedText,
        extractionSource: data.extractionSource,
        topics: data.topics,
        createdAt: new Date().toISOString(),
      };

      if (!isDemoMode) {
        await saveMaterial(material, cls?.studentUids ?? []);
      }
      updateWorkspace((prev) => ({
        ...prev,
        materials: [material, ...prev.materials],
      }));
      await notifyStudentsInClassroom({
        classroom: cls,
        actor: user,
        type: 'material_published',
        title: `New study notes: ${material.title}`,
        body: `${cls?.name ?? 'Classroom'} · ${material.topics.length} concepts mapped.`,
        targetTab: 'materials',
        targetId: material.id,
      });
      return material;
    },
    [user, workspace.classrooms, isDemoMode, updateWorkspace, notifyStudentsInClassroom]
  );

  const updateMaterialTopics = useCallback(
    async (
      materialId: string,
      topics: TopicNode[],
      source: 'gemini_ai' | 'sarvam_ai' | 'local_pdf_parser' | 'manual'
    ) => {
      const existing = workspace.materials.find((m) => m.id === materialId);
      if (!existing) return;
      const cls = workspace.classrooms.find((c) => c.id === existing.classroomId);
      const updated: StudyMaterial = {
        ...existing,
        topics,
        extractionSource: source,
      };
      if (!isDemoMode) {
        await saveMaterial(updated, cls?.studentUids ?? []);
      }
      updateWorkspace((prev) => ({
        ...prev,
        materials: prev.materials.map((m) => (m.id === materialId ? updated : m)),
      }));
    },
    [workspace.materials, workspace.classrooms, isDemoMode, updateWorkspace]
  );

  const persistUpdatedAssessment = useCallback(
    async (updated: Assessment) => {
      const cls = workspace.classrooms.find((c) => c.id === updated.classroomId);
      if (!isDemoMode) {
        await updateAssessment(updated, cls?.studentUids ?? []);
      }
      updateWorkspace((prev) => ({
        ...prev,
        assessments: prev.assessments.map((a) => (a.id === updated.id ? updated : a)),
      }));
    },
    [workspace.classrooms, isDemoMode, updateWorkspace]
  );

  const createAssessment = useCallback(
    async (input: {
      classroomId: string;
      title: string;
      description: string;
      durationMinutes: number;
      dueDate: string;
      allowRetakes?: boolean;
      questions: Question[];
      status: AssessmentStatus;
    }) => {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        throw new Error('Teacher authentication required.');
      }
      const cls = workspace.classrooms.find((c) => c.id === input.classroomId);
      const assessment: Assessment = {
        id: `assess_${Date.now()}`,
        classroomId: input.classroomId,
        teacherUid: user.uid,
        title: input.title.trim(),
        description: input.description.trim() || undefined,
        status: input.status,
        dueDate: input.dueDate || undefined,
        durationMinutes: input.durationMinutes,
        allowRetakes: Boolean(input.allowRetakes),
        questions: input.questions,
        createdAt: new Date().toISOString(),
      };
      if (!isDemoMode) {
        await saveAssessment(assessment, cls?.studentUids ?? []);
      }
      updateWorkspace((prev) => ({
        ...prev,
        assessments: [assessment, ...prev.assessments],
      }));
      if (assessment.status === 'published') {
        await notifyStudentsInClassroom({
          classroom: cls,
          actor: user,
          type: 'assessment_published',
          title: `New published test: ${assessment.title}`,
          body: `${cls?.name ?? 'Classroom'} · ${assessment.durationMinutes} min${
            assessment.dueDate ? ` · Due ${assessment.dueDate}` : ''
          }`,
          targetTab: 'tests',
          targetId: assessment.id,
        });
      }
      return assessment;
    },
    [user, workspace.classrooms, isDemoMode, updateWorkspace, notifyStudentsInClassroom]
  );

  const addQuestionsToAssessment = useCallback(
    async (assessmentId: string, newQuestions: Question[]) => {
      const target = workspace.assessments.find((a) => a.id === assessmentId);
      if (!target) return;
      await persistUpdatedAssessment({
        ...target,
        questions: [...target.questions, ...newQuestions],
      });
    },
    [workspace.assessments, persistUpdatedAssessment]
  );

  const updateQuestionInAssessment = useCallback(
    async (assessmentId: string, updatedQuestion: Question) => {
      const target = workspace.assessments.find((a) => a.id === assessmentId);
      if (!target) return;
      await persistUpdatedAssessment({
        ...target,
        questions: target.questions.map((q) =>
          q.id === updatedQuestion.id ? updatedQuestion : q
        ),
      });
    },
    [workspace.assessments, persistUpdatedAssessment]
  );

  const removeQuestionFromAssessment = useCallback(
    async (assessmentId: string, questionId: string) => {
      const target = workspace.assessments.find((a) => a.id === assessmentId);
      if (!target) return;
      await persistUpdatedAssessment({
        ...target,
        questions: target.questions.filter((q) => q.id !== questionId),
      });
    },
    [workspace.assessments, persistUpdatedAssessment]
  );

  const reviewAssessmentQuestion = useCallback(
    async (
      assessmentId: string,
      questionId: string,
      approvalStatus: QuestionApprovalStatus
    ) => {
      const target = workspace.assessments.find((a) => a.id === assessmentId);
      if (!target) return;
      await persistUpdatedAssessment({
        ...target,
        questions: target.questions.map((q) =>
          q.id === questionId ? { ...q, approvalStatus } : q
        ),
      });
    },
    [workspace.assessments, persistUpdatedAssessment]
  );

  const setAssessmentStatus = useCallback(
    async (assessmentId: string, status: AssessmentStatus) => {
      const target = workspace.assessments.find((a) => a.id === assessmentId);
      if (!target) return;
      await persistUpdatedAssessment({ ...target, status });
      if (status === 'published' && target.status !== 'published' && user) {
        const cls = workspace.classrooms.find((c) => c.id === target.classroomId);
        await notifyStudentsInClassroom({
          classroom: cls,
          actor: user,
          type: 'assessment_published',
          title: `Test published: ${target.title}`,
          body: `${cls?.name ?? 'Classroom'} · ${target.durationMinutes} min${
            target.dueDate ? ` · Due ${target.dueDate}` : ''
          }`,
          targetTab: 'tests',
          targetId: target.id,
        });
      }
    },
    [workspace.assessments, workspace.classrooms, persistUpdatedAssessment, user, notifyStudentsInClassroom]
  );

  const setAssessmentRetakePolicy = useCallback(
    async (assessmentId: string, allowRetakes: boolean) => {
      const target = workspace.assessments.find((a) => a.id === assessmentId);
      if (!target) return;
      await persistUpdatedAssessment({ ...target, allowRetakes });
    },
    [workspace.assessments, persistUpdatedAssessment]
  );

  const submitAssessment = useCallback(
    async (
      assessmentId: string,
      answersByQuestionId: Record<string, string>,
      meta?: { elapsedSeconds?: number; timedOut?: boolean }
    ) => {
      if (!user) throw new Error('Authentication required.');
      const assessment = workspace.assessments.find((a) => a.id === assessmentId);
      if (!assessment) throw new Error('Assessment not found.');

      const classroom = workspace.classrooms.find((c) => c.id === assessment.classroomId);
      const check = assertSubmissionAllowed({
        assessment,
        classroomStudentUids: classroom?.studentUids ?? [],
        studentUid: user.uid,
        existingSubmissions: workspace.submissions,
      });

      if (!check.allowed) {
        throw new Error(check.reason || 'Submission not allowed.');
      }

      let gradingAssessment = assessment;

      if (!isDemoMode) {
        const lock: SubmissionLock = {
          id: check.submissionId,
          assessmentId,
          classroomId: assessment.classroomId,
          teacherUid: assessment.teacherUid,
          studentUid: user.uid,
          attemptNumber: check.nextAttemptNumber,
          answers: answersByQuestionId,
          lockedAt: new Date().toISOString(),
        };
        await createSubmissionLock(lock);

        const answerKey = await getAssessmentAnswerKey(assessmentId);
        if (!answerKey) {
          throw new Error('Assessment answer key unavailable for evaluation.');
        }

        const pubProjection: PublishedAssessment = {
          id: assessment.id,
          classroomId: assessment.classroomId,
          teacherUid: assessment.teacherUid,
          studentUids: classroom?.studentUids ?? [],
          title: assessment.title,
          description: assessment.description,
          status: assessment.status === 'closed' ? 'closed' : 'published',
          dueDate: assessment.dueDate,
          durationMinutes: assessment.durationMinutes,
          allowRetakes: Boolean(assessment.allowRetakes),
          questions: assessment.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            type: q.type,
            options: q.options,
            conceptId: q.conceptId,
            conceptName: q.conceptName,
            points: q.points,
          })),
          createdAt: assessment.createdAt,
        };
        gradingAssessment = rehydrateAssessmentWithAnswerKey(pubProjection, answerKey);
      }

      const evaluated = evaluateAssessmentSubmission(
        gradingAssessment,
        user.uid,
        user.name,
        answersByQuestionId
      );

      const submission: AssessmentSubmission = {
        ...evaluated,
        id: check.submissionId,
        attemptNumber: check.nextAttemptNumber,
        evaluationStatus: 'evaluated',
        ...(typeof meta?.elapsedSeconds === 'number'
          ? { elapsedSeconds: Math.max(0, Math.round(meta.elapsedSeconds)) }
          : {}),
        ...(typeof meta?.timedOut === 'boolean' ? { timedOut: meta.timedOut } : {}),
      };

      if (!isDemoMode) {
        await saveSubmission(submission);
      }
      updateWorkspace((prev) => ({
        ...prev,
        submissions: [submission, ...prev.submissions],
      }));

      // Notify classroom teacher of real evaluated student submission
      const teacherNotif = buildNotificationPayload({
        recipientUid: assessment.teacherUid,
        actorUid: user.uid,
        actorName: user.name,
        type: 'assessment_result',
        title: `New submission: ${assessment.title}`,
        body: `${user.name} scored ${submission.percentage}% (${submission.score}/${submission.maxScore} pts).`,
        classroomId: assessment.classroomId,
        targetTab: 'reports',
        targetId: assessment.id,
      });
      await emitNotifications([teacherNotif]);

      return submission;
    },
    [
      user,
      workspace.assessments,
      workspace.classrooms,
      workspace.submissions,
      isDemoMode,
      updateWorkspace,
      emitNotifications,
    ]
  );

  // =========================================================================
  // Real-Time Communication, Announcements & Notification Centre Actions
  // =========================================================================

  const startDirectConversation = useCallback(
    async (classroomId: string, requestedStudentUid?: string): Promise<Conversation> => {
      if (!user) throw new Error('Authentication required.');
      const classroom = workspace.classrooms.find((c) => c.id === classroomId);
      if (!classroom) throw new Error('Classroom not found.');

      const studentUid =
        user.role === 'student' ? user.uid : (requestedStudentUid ?? '').trim();
      if (!studentUid) {
        throw new Error('Select an enrolled student to start a direct conversation.');
      }

      const studentEntry = classroom.students.find((s) => s.uid === studentUid);
      const studentName =
        user.role === 'student' ? user.name : studentEntry?.name ?? 'Student';

      const convId = buildDirectConversationId(classroom.id, studentUid);
      const existing = workspace.conversations.find((c) => c.id === convId);
      if (existing) {
        setActiveConversationId(existing.id);
        return existing;
      }

      if (!isDemoMode) {
        const created = await ensureDirectConversation({
          classroom,
          studentUid,
          studentName,
          senderUid: user.uid,
          senderName: user.name,
        });
        setActiveConversationId(created.id);
        return created;
      }

      const nowIso = new Date().toISOString();
      const created: Conversation = {
        id: convId,
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
        lastSenderUid: user.uid,
        lastSenderName: user.name,
        unreadCounts: {
          [classroom.teacherUid]: 0,
          [studentUid]: 0,
        },
        createdAt: nowIso,
      };
      updateWorkspace((prev) => ({
        ...prev,
        conversations: sortConversationsByRecent([created, ...prev.conversations]),
        messagesByConversation: {
          ...prev.messagesByConversation,
          [created.id]: prev.messagesByConversation[created.id] ?? [],
        },
      }));
      setActiveConversationId(created.id);
      return created;
    },
    [user, workspace.classrooms, workspace.conversations, isDemoMode, updateWorkspace]
  );

  const startClassroomConversation = useCallback(
    async (classroomId: string): Promise<Conversation> => {
      if (!user) throw new Error('Authentication required.');
      const classroom = workspace.classrooms.find((c) => c.id === classroomId);
      if (!classroom) throw new Error('Classroom not found.');

      const convId = buildClassroomConversationId(classroom.id);
      const existing = workspace.conversations.find((c) => c.id === convId);

      if (!isDemoMode) {
        if (user.role !== 'teacher') {
          if (existing) {
            setActiveConversationId(existing.id);
            return existing;
          }
          throw new Error(
            'Your teacher has not opened this classroom discussion channel yet. Send a direct message to your teacher instead.'
          );
        }
        const created = await ensureClassroomConversation({ classroom });
        setActiveConversationId(created.id);
        return created;
      }

      if (existing) {
        setActiveConversationId(existing.id);
        return existing;
      }

      const participantUids = Array.from(
        new Set([classroom.teacherUid, ...classroom.studentUids])
      );
      const nowIso = new Date().toISOString();
      const unreadCounts: Record<string, number> = {};
      for (const uid of participantUids) {
        unreadCounts[uid] = 0;
      }
      const created: Conversation = {
        id: convId,
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
      updateWorkspace((prev) => ({
        ...prev,
        conversations: sortConversationsByRecent([created, ...prev.conversations]),
        messagesByConversation: {
          ...prev.messagesByConversation,
          [created.id]: prev.messagesByConversation[created.id] ?? [],
        },
      }));
      setActiveConversationId(created.id);
      return created;
    },
    [user, workspace.classrooms, workspace.conversations, isDemoMode, updateWorkspace]
  );

  const sendMessage = useCallback(
    async (
      conversationId: string,
      body: string,
      material?: { id: string; title: string }
    ): Promise<ChatMessage> => {
      if (!user) throw new Error('Authentication required.');
      const validation = validateMessageBody(body);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid message.');
      }
      const conv = workspace.conversations.find((c) => c.id === conversationId);
      if (!conv) throw new Error('Conversation not found.');

      let sent: ChatMessage;
      if (!isDemoMode) {
        sent = await sendMessageToConversation({
          conversation: conv,
          sender: user,
          body: validation.clean,
          materialId: material?.id,
          materialTitle: material?.title,
        });
      } else {
        const nowIso = new Date().toISOString();
        sent = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          conversationId: conv.id,
          classroomId: conv.classroomId,
          participantUids: conv.participantUids,
          senderUid: user.uid,
          senderName: user.name,
          senderRole: user.role,
          body: validation.clean,
          materialId: material?.id,
          materialTitle: material?.title,
          readBy: { [user.uid]: nowIso },
          createdAt: nowIso,
        };
        updateWorkspace((prev) => {
          const nextConv: Conversation = {
            ...conv,
            lastMessageText: validation.clean.slice(0, 380),
            lastMessageAt: nowIso,
            lastSenderUid: user.uid,
            lastSenderName: user.name,
            unreadCounts: buildUnreadCountsOnNewMessage(
              conv.participantUids,
              conv.unreadCounts ?? {},
              user.uid
            ),
          };
          const existingMsgs = prev.messagesByConversation[conv.id] ?? [];
          return {
            ...prev,
            conversations: sortConversationsByRecent(
              prev.conversations.map((c) => (c.id === conv.id ? nextConv : c))
            ),
            messagesByConversation: {
              ...prev.messagesByConversation,
              [conv.id]: [...existingMsgs, sent],
            },
          };
        });
      }

      // Emit real notifications to other conversation participants
      const recipientUids = conv.participantUids.filter((uid) => uid !== user.uid);
      const notifType = user.role === 'teacher' ? 'teacher_message' : 'student_message';
      const notifTitle =
        conv.type === 'classroom'
          ? `${user.name} in ${conv.classroomName}`
          : `New message from ${user.name}`;
      const payloads = recipientUids.map((recipientUid) =>
        buildNotificationPayload({
          recipientUid,
          actorUid: user.uid,
          actorName: user.name,
          type: notifType,
          title: notifTitle,
          body: validation.clean,
          classroomId: conv.classroomId,
          targetTab: 'communication',
          targetId: conv.id,
        })
      );
      await emitNotifications(payloads);
      return sent;
    },
    [user, workspace.conversations, isDemoMode, updateWorkspace, emitNotifications]
  );

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      const conv = workspace.conversations.find((c) => c.id === conversationId);
      if (!conv) return;
      const msgs = workspace.messagesByConversation[conversationId] ?? [];
      const hasUnreadMsgs = msgs.some((m) => m.senderUid !== user.uid && !m.readBy?.[user.uid]);
      const hasUnreadCount = (conv.unreadCounts?.[user.uid] ?? 0) > 0;
      if (!hasUnreadMsgs && !hasUnreadCount) return;

      if (!isDemoMode) {
        await markConversationAsRead({
          conversation: conv,
          messages: msgs,
          readerUid: user.uid,
        });
        return;
      }

      const nowIso = new Date().toISOString();
      updateWorkspace((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                unreadCounts: markConversationUnreadCleared(c.unreadCounts ?? {}, user.uid),
              }
            : c
        ),
        messagesByConversation: {
          ...prev.messagesByConversation,
          [conversationId]: (prev.messagesByConversation[conversationId] ?? []).map((m) =>
            m.senderUid !== user.uid && !m.readBy?.[user.uid]
              ? { ...m, readBy: { ...(m.readBy ?? {}), [user.uid]: nowIso } }
              : m
          ),
        },
      }));
    },
    [user, workspace.conversations, workspace.messagesByConversation, isDemoMode, updateWorkspace]
  );

  const publishAnnouncement = useCallback(
    async (input: {
      classroomId: string;
      title: string;
      body: string;
      priority: 'normal' | 'important';
      materialId?: string;
    }): Promise<Announcement> => {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can publish classroom announcements.');
      }
      const check = validateAnnouncementInput({ title: input.title, body: input.body });
      if (!check.valid) {
        throw new Error(check.error || 'Invalid announcement.');
      }
      const classroom = workspace.classrooms.find((c) => c.id === input.classroomId);
      if (!classroom) throw new Error('Select a classroom first.');

      const linkedMaterial = input.materialId
        ? workspace.materials.find((m) => m.id === input.materialId)
        : undefined;

      const announcement: Announcement = {
        id: `ann_${Date.now()}`,
        classroomId: classroom.id,
        classroomName: classroom.name,
        teacherUid: user.uid,
        teacherName: user.name,
        studentUids: classroom.studentUids,
        title: input.title.trim(),
        body: input.body.trim(),
        materialId: linkedMaterial?.id,
        materialTitle: linkedMaterial?.title,
        priority: input.priority,
        acknowledgedBy: [],
        createdAt: new Date().toISOString(),
      };

      if (!isDemoMode) {
        await createAnnouncementDoc(announcement);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          announcements: sortAnnouncementsByRecent([announcement, ...prev.announcements]),
        }));
      }

      await notifyStudentsInClassroom({
        classroom,
        actor: user,
        type: 'announcement',
        title: `${input.priority === 'important' ? 'Important Announcement: ' : 'Announcement: '}${announcement.title}`,
        body: announcement.body,
        targetTab: 'communication',
        targetId: announcement.id,
      });

      return announcement;
    },
    [
      user,
      workspace.classrooms,
      workspace.materials,
      isDemoMode,
      updateWorkspace,
      notifyStudentsInClassroom,
    ]
  );

  const acknowledgeAnnouncement = useCallback(
    async (announcementId: string) => {
      if (!user) return;
      const target = workspace.announcements.find((a) => a.id === announcementId);
      if (!target || target.acknowledgedBy.includes(user.uid)) return;

      if (!isDemoMode) {
        await acknowledgeAnnouncementDoc(announcementId, user.uid);
        return;
      }
      updateWorkspace((prev) => ({
        ...prev,
        announcements: prev.announcements.map((a) =>
          a.id === announcementId
            ? { ...a, acknowledgedBy: [...a.acknowledgedBy, user.uid] }
            : a
        ),
      }));
    },
    [user, workspace.announcements, isDemoMode, updateWorkspace]
  );

  const allNotifications = useMemo(() => {
    if (!user) return [];
    const base = workspace.notifications.filter((n) => n.recipientUid === user.uid);
    if (user.role !== 'student') {
      return sortNotificationsByRecent(base);
    }
    const deadlines = deriveUpcomingDeadlineNotifications({
      assessments: workspace.assessments,
      submissions: workspace.submissions,
      classrooms: workspace.classrooms,
      studentUid: user.uid,
      readIds: readDeadlineIds,
    });
    return sortNotificationsByRecent([...base, ...deadlines]);
  }, [
    user,
    workspace.notifications,
    workspace.assessments,
    workspace.submissions,
    workspace.classrooms,
    readDeadlineIds,
  ]);

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      if (notificationId.startsWith('deadline_')) {
        setReadDeadlineIds((prev) => {
          const next = new Set(prev);
          next.add(notificationId);
          try {
            localStorage.setItem(DEADLINE_READ_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch {
            // ignore
          }
          return next;
        });
        return;
      }

      if (!isDemoMode) {
        await markNotificationReadDoc(notificationId);
        return;
      }
      updateWorkspace((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
    },
    [user, isDemoMode, updateWorkspace]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    const unreadDeadlines = allNotifications.filter((n) => n.isDerivedDeadline && !n.read);
    if (unreadDeadlines.length > 0) {
      setReadDeadlineIds((prev) => {
        const next = new Set(prev);
        for (const d of unreadDeadlines) {
          next.add(d.id);
        }
        try {
          localStorage.setItem(DEADLINE_READ_STORAGE_KEY, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
        return next;
      });
    }

    const unreadPersisted = workspace.notifications.filter(
      (n) => n.recipientUid === user.uid && !n.read
    );
    if (unreadPersisted.length === 0) return;

    if (!isDemoMode) {
      await Promise.all(
        unreadPersisted.map((n) => markNotificationReadDoc(n.id).catch(() => {}))
      );
      return;
    }

    updateWorkspace((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.recipientUid === user.uid ? { ...n, read: true } : n
      ),
    }));
  }, [user, allNotifications, workspace.notifications, isDemoMode, updateWorkspace]);

  // =========================================================================
  // Phase 4: 8 Expanded Classroom Persistence Actions
  // =========================================================================

  const recordAttendanceSession = useCallback(
    async (input: {
      classroomId: string;
      sessionDate: string;
      topic: string;
      records: Record<string, AttendanceStatus>;
    }): Promise<AttendanceSession> => {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can record classroom attendance.');
      }
      const cls = workspace.classrooms.find((c) => c.id === input.classroomId);
      if (!cls) throw new Error('Select a classroom first.');
      const cleanTopic = input.topic.trim();
      if (cleanTopic.length < 2) {
        throw new Error('Enter a session topic (minimum 2 characters).');
      }
      const studentUids = cls.studentUids;
      const sanitizedRecords: Record<string, AttendanceStatus> = {};
      let presentCount = 0;
      for (const uid of studentUids) {
        const st = input.records[uid] ?? 'present';
        sanitizedRecords[uid] = st;
        if (st === 'present' || st === 'late') {
          presentCount += 1;
        }
      }
      const session: AttendanceSession = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        classroomId: cls.id,
        classroomName: cls.name,
        teacherUid: user.uid,
        sessionDate: input.sessionDate || new Date().toISOString().slice(0, 10),
        topic: cleanTopic.slice(0, 160),
        studentUids,
        records: sanitizedRecords,
        presentCount,
        totalCount: studentUids.length,
        createdAt: new Date().toISOString(),
      };
      if (!isDemoMode) {
        await saveAttendanceSessionDoc(session);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          attendanceSessions: [session, ...prev.attendanceSessions],
        }));
      }
      return session;
    },
    [user, workspace.classrooms, isDemoMode, updateWorkspace]
  );

  const deleteAttendanceSession = useCallback(
    async (sessionId: string) => {
      if (!user || user.role !== 'teacher') return;
      if (!isDemoMode) {
        await deleteAttendanceSessionDoc(sessionId);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          attendanceSessions: prev.attendanceSessions.filter((s) => s.id !== sessionId),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const saveLessonPlan = useCallback(
    async (input: {
      classroomId: string;
      conceptId: string;
      conceptName: string;
      classMasteryPct: number;
      recommendedFocus: string;
      suggestedActivity: string;
      aiOutline?: PersistedLessonPlan['aiOutline'];
      status?: 'approved' | 'completed';
    }): Promise<PersistedLessonPlan> => {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can save lesson plans.');
      }
      const id = buildLessonPlanId(input.classroomId, input.conceptId);
      const existing = workspace.lessonPlans.find((p) => p.id === id);
      const nowIso = new Date().toISOString();
      const plan: PersistedLessonPlan = {
        id,
        classroomId: input.classroomId,
        teacherUid: user.uid,
        conceptId: input.conceptId,
        conceptName: input.conceptName.slice(0, 160),
        classMasteryPct: Math.min(Math.max(Math.round(input.classMasteryPct), 0), 100),
        recommendedFocus: input.recommendedFocus.slice(0, 600),
        suggestedActivity: input.suggestedActivity.slice(0, 600),
        aiOutline: input.aiOutline ?? existing?.aiOutline,
        status: input.status ?? 'approved',
        createdAt: existing?.createdAt ?? nowIso,
        updatedAt: nowIso,
      };
      if (!isDemoMode) {
        await saveLessonPlanDoc(plan);
      } else {
        updateWorkspace((prev) => {
          const exists = prev.lessonPlans.some((p) => p.id === plan.id);
          return {
            ...prev,
            lessonPlans: exists
              ? prev.lessonPlans.map((p) => (p.id === plan.id ? plan : p))
              : [plan, ...prev.lessonPlans],
          };
        });
      }
      return plan;
    },
    [user, workspace.lessonPlans, isDemoMode, updateWorkspace]
  );

  const deleteLessonPlan = useCallback(
    async (planId: string) => {
      if (!user || user.role !== 'teacher') return;
      if (!isDemoMode) {
        await deleteLessonPlanDoc(planId);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          lessonPlans: prev.lessonPlans.filter((p) => p.id !== planId),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const saveTutorDoubt = useCallback(
    async (input: {
      classroomId: string;
      teacherUid: string;
      materialId: string;
      materialTitle: string;
      question: string;
      answerEn: string;
      answerKn?: string;
      language: LanguageCode;
      entryType: 'doubt' | 'explanation';
    }): Promise<TutorDoubtEntry> => {
      if (!user) throw new Error('Authentication required.');
      const entry: TutorDoubtEntry = {
        id: `doubt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        classroomId: input.classroomId,
        studentUid: user.uid,
        teacherUid: input.teacherUid,
        materialId: input.materialId,
        materialTitle: input.materialTitle.slice(0, 160),
        question: input.question.slice(0, 1000),
        answerEn: input.answerEn.slice(0, 4000),
        answerKn: input.answerKn ? input.answerKn.slice(0, 4000) : undefined,
        language: input.language,
        entryType: input.entryType,
        createdAt: new Date().toISOString(),
      };
      if (!isDemoMode && user.role === 'student') {
        await saveTutorDoubtDoc(entry);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          tutorDoubts: [entry, ...prev.tutorDoubts],
        }));
      }
      return entry;
    },
    [user, isDemoMode, updateWorkspace]
  );

  const deleteTutorDoubt = useCallback(
    async (doubtId: string) => {
      if (!user) return;
      if (!isDemoMode) {
        await deleteTutorDoubtDoc(doubtId);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          tutorDoubts: prev.tutorDoubts.filter((d) => d.id !== doubtId),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const toggleRevisionTask = useCallback(
    async (input: {
      classroomId: string;
      teacherUid: string;
      conceptId: string;
      conceptName: string;
      matchedMaterialId?: string;
      matchedMaterialTitle?: string;
      reflectionNote?: string;
    }): Promise<RevisionTaskProgress> => {
      if (!user) throw new Error('Authentication required.');
      const id = buildRevisionTaskId(user.uid, input.classroomId, input.conceptId);
      const existing = workspace.revisionTasks.find((t) => t.id === id);
      const nowIso = new Date().toISOString();
      const nextStatus: 'pending' | 'completed' =
        existing?.status === 'completed' ? 'pending' : 'completed';
      const task: RevisionTaskProgress = {
        id,
        classroomId: input.classroomId,
        studentUid: user.uid,
        teacherUid: input.teacherUid,
        conceptId: input.conceptId,
        conceptName: input.conceptName.slice(0, 160),
        matchedMaterialId: input.matchedMaterialId ?? existing?.matchedMaterialId,
        matchedMaterialTitle: input.matchedMaterialTitle ?? existing?.matchedMaterialTitle,
        status: nextStatus,
        reflectionNote: input.reflectionNote !== undefined ? input.reflectionNote.slice(0, 600) : existing?.reflectionNote,
        updatedAt: nowIso,
        createdAt: existing?.createdAt ?? nowIso,
      };
      if (!isDemoMode && user.role === 'student') {
        await saveRevisionTaskDoc(task);
      } else {
        updateWorkspace((prev) => {
          const exists = prev.revisionTasks.some((t) => t.id === task.id);
          return {
            ...prev,
            revisionTasks: exists
              ? prev.revisionTasks.map((t) => (t.id === task.id ? task : t))
              : [task, ...prev.revisionTasks],
          };
        });
      }
      return task;
    },
    [user, workspace.revisionTasks, isDemoMode, updateWorkspace]
  );

  const trackMaterialEngagement = useCallback(
    async (input: {
      material: StudyMaterial;
      status: 'viewed' | 'completed';
    }): Promise<MaterialEngagement> => {
      if (!user) throw new Error('Authentication required.');
      const id = buildMaterialEngagementId(input.material.id, user.uid);
      const existing = workspace.materialEngagements.find((e) => e.id === id);
      const nowIso = new Date().toISOString();
      const engagement: MaterialEngagement = {
        id,
        materialId: input.material.id,
        classroomId: input.material.classroomId,
        teacherUid: input.material.teacherUid,
        studentUid: user.uid,
        studentName: user.name,
        status:
          existing?.status === 'completed' && input.status === 'viewed'
            ? 'completed'
            : input.status,
        viewCount: (existing?.viewCount ?? 0) + 1,
        lastViewedAt: nowIso,
        createdAt: existing?.createdAt ?? nowIso,
      };
      if (!isDemoMode && user.role === 'student') {
        await saveMaterialEngagementDoc(engagement);
      } else {
        updateWorkspace((prev) => {
          const exists = prev.materialEngagements.some((e) => e.id === engagement.id);
          return {
            ...prev,
            materialEngagements: exists
              ? prev.materialEngagements.map((e) => (e.id === engagement.id ? engagement : e))
              : [engagement, ...prev.materialEngagements],
          };
        });
      }
      return engagement;
    },
    [user, workspace.materialEngagements, isDemoMode, updateWorkspace]
  );

  const createClassroomActivity = useCallback(
    async (input: {
      classroomId: string;
      title: string;
      activityType: ClassroomActivityType;
      scheduledDate: string;
      description: string;
    }): Promise<ClassroomActivity> => {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can schedule classroom activities.');
      }
      const cls = workspace.classrooms.find((c) => c.id === input.classroomId);
      if (!cls) throw new Error('Select a classroom first.');
      const cleanTitle = input.title.trim();
      if (cleanTitle.length < 2) {
        throw new Error('Activity title must be at least 2 characters.');
      }
      const activity: ClassroomActivity = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        classroomId: cls.id,
        classroomName: cls.name,
        teacherUid: user.uid,
        studentUids: cls.studentUids,
        title: cleanTitle.slice(0, 160),
        activityType: input.activityType,
        scheduledDate: input.scheduledDate || new Date().toISOString().slice(0, 10),
        description: input.description.trim().slice(0, 1000),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      if (!isDemoMode) {
        await saveClassroomActivityDoc(activity);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          classroomActivities: [...prev.classroomActivities, activity].sort((a, b) =>
            a.scheduledDate.localeCompare(b.scheduledDate)
          ),
        }));
      }
      return activity;
    },
    [user, workspace.classrooms, isDemoMode, updateWorkspace]
  );

  const toggleClassroomActivity = useCallback(
    async (activityId: string, completed: boolean) => {
      if (!user || user.role !== 'teacher') return;
      if (!isDemoMode) {
        await toggleClassroomActivityDoc(activityId, completed);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          classroomActivities: prev.classroomActivities.map((a) =>
            a.id === activityId ? { ...a, completed } : a
          ),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const deleteClassroomActivity = useCallback(
    async (activityId: string) => {
      if (!user || user.role !== 'teacher') return;
      if (!isDemoMode) {
        await deleteClassroomActivityDoc(activityId);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          classroomActivities: prev.classroomActivities.filter((a) => a.id !== activityId),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const saveToQuestionBank = useCallback(
    async (input: { subject: string; question: Question }): Promise<QuestionBankItem> => {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can save questions to the bank.');
      }
      const item: QuestionBankItem = {
        id: `qbank_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        teacherUid: user.uid,
        subject: (input.subject || 'General').slice(0, 80),
        conceptId: input.question.conceptId,
        conceptName: input.question.conceptName,
        prompt: input.question.prompt.slice(0, 1000),
        type: input.question.type,
        options: input.question.options,
        correctAnswer: input.question.correctAnswer.slice(0, 400),
        explanation: input.question.explanation.slice(0, 1000),
        points: Math.min(Math.max(Number(input.question.points) || 2, 1), 100),
        createdAt: new Date().toISOString(),
      };
      if (!isDemoMode) {
        await saveQuestionBankItemDoc(item);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          questionBank: [item, ...prev.questionBank],
        }));
      }
      return item;
    },
    [user, isDemoMode, updateWorkspace]
  );

  const deleteFromQuestionBank = useCallback(
    async (itemId: string) => {
      if (!user || user.role !== 'teacher') return;
      if (!isDemoMode) {
        await deleteQuestionBankItemDoc(itemId);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          questionBank: prev.questionBank.filter((q) => q.id !== itemId),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const saveStudentNote = useCallback(
    async (input: {
      id?: string;
      classroomId: string;
      conceptId?: string;
      conceptName?: string;
      title: string;
      content: string;
      language: LanguageCode;
    }): Promise<StudentStudyNote> => {
      if (!user) throw new Error('Authentication required.');
      const cleanTitle = input.title.trim();
      const cleanContent = input.content.trim();
      if (cleanTitle.length < 2 || cleanContent.length < 2) {
        throw new Error('Note title and content must each be at least 2 characters.');
      }
      const existing = input.id
        ? workspace.studentNotes.find((n) => n.id === input.id)
        : undefined;
      const nowIso = new Date().toISOString();
      const note: StudentStudyNote = {
        id: existing?.id ?? `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        classroomId: input.classroomId,
        studentUid: user.uid,
        conceptId: input.conceptId || existing?.conceptId,
        conceptName: input.conceptName || existing?.conceptName,
        title: cleanTitle.slice(0, 140),
        content: cleanContent.slice(0, 4000),
        language: input.language,
        updatedAt: nowIso,
        createdAt: existing?.createdAt ?? nowIso,
      };
      if (!isDemoMode && user.role === 'student') {
        await saveStudentNoteDoc(note);
      } else {
        updateWorkspace((prev) => {
          const exists = prev.studentNotes.some((n) => n.id === note.id);
          return {
            ...prev,
            studentNotes: exists
              ? prev.studentNotes.map((n) => (n.id === note.id ? note : n))
              : [note, ...prev.studentNotes],
          };
        });
      }
      return note;
    },
    [user, workspace.studentNotes, isDemoMode, updateWorkspace]
  );

  const deleteStudentNote = useCallback(
    async (noteId: string) => {
      if (!user) return;
      if (!isDemoMode) {
        await deleteStudentNoteDoc(noteId);
      } else {
        updateWorkspace((prev) => ({
          ...prev,
          studentNotes: prev.studentNotes.filter((n) => n.id !== noteId),
        }));
      }
    },
    [user, isDemoMode, updateWorkspace]
  );

  const toggleCurriculumTopicCompleted = useCallback(
    async (topicId: string, targetStudentUid?: string): Promise<CurriculumTopicProgress> => {
      if (!user) throw new Error('Authentication required.');
      const studentUid = isDemoMode && targetStudentUid ? targetStudentUid : user.uid;
      const progressId = buildCurriculumProgressId(studentUid, DBMS_CURRICULUM_ID);
      const validIds = new Set(getAllDbmsChapters().map((c) => c.id));
      const existing = workspace.curriculumProgress.find(
        (p) => p.studentUid === studentUid && p.curriculumId === DBMS_CURRICULUM_ID
      );
      const nowIso = new Date().toISOString();
      const nextCompleted = toggleTopicIdInList(
        existing?.completedTopicIds ?? [],
        topicId,
        validIds
      );
      const updated: CurriculumTopicProgress = {
        id: existing?.id ?? progressId,
        studentUid,
        curriculumId: DBMS_CURRICULUM_ID,
        completedTopicIds: nextCompleted,
        lastViewedTopicId: topicId,
        updatedAt: nowIso,
        createdAt: existing?.createdAt ?? nowIso,
      };
      if (!isDemoMode) {
        await saveCurriculumProgressDoc(updated);
      } else {
        updateWorkspace((prev) => {
          const exists = prev.curriculumProgress.some((p) => p.id === updated.id);
          return {
            ...prev,
            curriculumProgress: exists
              ? prev.curriculumProgress.map((p) => (p.id === updated.id ? updated : p))
              : [updated, ...prev.curriculumProgress],
          };
        });
      }
      return updated;
    },
    [user, isDemoMode, workspace.curriculumProgress, updateWorkspace]
  );

  const setLastViewedCurriculumTopic = useCallback(
    async (topicId: string, targetStudentUid?: string): Promise<void> => {
      if (!user) return;
      const studentUid = isDemoMode && targetStudentUid ? targetStudentUid : user.uid;
      const existing = workspace.curriculumProgress.find(
        (p) => p.studentUid === studentUid && p.curriculumId === DBMS_CURRICULUM_ID
      );
      if (existing?.lastViewedTopicId === topicId) return;
      const nowIso = new Date().toISOString();
      const updated: CurriculumTopicProgress = {
        id: existing?.id ?? buildCurriculumProgressId(studentUid, DBMS_CURRICULUM_ID),
        studentUid,
        curriculumId: DBMS_CURRICULUM_ID,
        completedTopicIds: existing?.completedTopicIds ?? [],
        lastViewedTopicId: topicId,
        updatedAt: nowIso,
        createdAt: existing?.createdAt ?? nowIso,
      };
      if (!isDemoMode) {
        await saveCurriculumProgressDoc(updated);
      } else {
        updateWorkspace((prev) => {
          const exists = prev.curriculumProgress.some((p) => p.id === updated.id);
          return {
            ...prev,
            curriculumProgress: exists
              ? prev.curriculumProgress.map((p) => (p.id === updated.id ? updated : p))
              : [updated, ...prev.curriculumProgress],
          };
        });
      }
    },
    [user, isDemoMode, workspace.curriculumProgress, updateWorkspace]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        authLoading,
        dataLoading,
        isDemoMode,
        theme,
        toggleTheme,
        workspace,
        selectedClassroomId,
        setSelectedClassroomId,
        activeConversationId,
        setActiveConversationId,
        allNotifications,
        aiStatus,
        errorMessage,
        clearError,
        refreshWorkspace,
        signInWithGoogle,
        updateCurrentProfile,
        authorizeTeacherEmail,
        joinClassroomWithCode,
        enterDemoMode,
        switchDemoRole,
        resetDemoWorkspace,
        logout,
        createClassroom,
        regenerateClassroomCode,
        addStudentToClassroom,
        updateStudentInClassroom,
        removeStudentFromClassroom,
        uploadMaterialFile,
        createMaterialFromText,
        updateMaterialTopics,
        createAssessment,
        addQuestionsToAssessment,
        updateQuestionInAssessment,
        removeQuestionFromAssessment,
        reviewAssessmentQuestion,
        setAssessmentStatus,
        setAssessmentRetakePolicy,
        submitAssessment,
        startDirectConversation,
        startClassroomConversation,
        sendMessage,
        markConversationRead,
        publishAnnouncement,
        acknowledgeAnnouncement,
        markNotificationRead,
        markAllNotificationsRead,
        recordAttendanceSession,
        deleteAttendanceSession,
        saveLessonPlan,
        deleteLessonPlan,
        saveTutorDoubt,
        deleteTutorDoubt,
        toggleRevisionTask,
        trackMaterialEngagement,
        createClassroomActivity,
        toggleClassroomActivity,
        deleteClassroomActivity,
        saveToQuestionBank,
        deleteFromQuestionBank,
        saveStudentNote,
        deleteStudentNote,
        toggleCurriculumTopicCompleted,
        setLastViewedCurriculumTopic,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
