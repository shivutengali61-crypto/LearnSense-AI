export type UserRole = 'teacher' | 'student' | 'admin';
export type LanguageCode = 'en' | 'kn';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  preferredLanguage?: LanguageCode;
  createdAt: string;
  isDemo?: boolean;
}

export interface StudentRosterEntry {
  uid: string;
  name: string;
  email: string;
  rollNumber?: string;
}

export interface Classroom {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  courseCode?: string;
  semester?: string;
  credits?: number;
  joinCode: string;
  teacherUid: string;
  teacherName: string;
  studentUids: string[];
  students: StudentRosterEntry[];
  createdAt: string;
}

export interface SubtopicNode {
  id: string;
  title: string;
  summary: string;
}

export interface TopicNode {
  id: string;
  title: string;
  description: string;
  subtopics: SubtopicNode[];
}

export type ExtractionSource = 'gemini_ai' | 'sarvam_ai' | 'local_pdf_parser' | 'manual';

export interface StudyMaterial {
  id: string;
  classroomId: string;
  teacherUid: string;
  title: string;
  fileName: string;
  fileUrl?: string;
  extractedText: string;
  extractionSource: ExtractionSource;
  topics: TopicNode[];
  createdAt: string;
}

export type QuestionType = 'mcq' | 'short_answer';
export type QuestionApprovalStatus = 'approved' | 'pending_review' | 'rejected';
export type QuestionSource = 'manual' | 'gemini_ai' | 'sarvam_ai';

export interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  conceptId: string;
  conceptName: string;
  points: number;
  source: QuestionSource;
  approvalStatus: QuestionApprovalStatus;
}

export interface PublicQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  conceptId: string;
  conceptName: string;
  points: number;
}

export type AssessmentStatus = 'draft' | 'published' | 'closed';

export interface Assessment {
  id: string;
  classroomId: string;
  teacherUid: string;
  title: string;
  description?: string;
  status: AssessmentStatus;
  dueDate?: string;
  durationMinutes: number;
  allowRetakes?: boolean;
  questions: Question[];
  createdAt: string;
}

export interface PublishedAssessment {
  id: string;
  classroomId: string;
  teacherUid: string;
  studentUids: string[];
  title: string;
  description?: string;
  status: 'published' | 'closed';
  dueDate?: string;
  durationMinutes: number;
  allowRetakes: boolean;
  questions: PublicQuestion[];
  createdAt: string;
}

export interface AnswerKeyItem {
  questionId: string;
  type: QuestionType;
  correctAnswer: string;
  explanation: string;
  conceptId: string;
  conceptName: string;
  points: number;
}

export interface AssessmentAnswerKey {
  id: string;
  assessmentId: string;
  classroomId: string;
  teacherUid: string;
  allowRetakes: boolean;
  answers: AnswerKeyItem[];
  createdAt: string;
}

export interface SubmissionLock {
  id: string;
  assessmentId: string;
  classroomId: string;
  teacherUid: string;
  studentUid: string;
  attemptNumber: number;
  answers: Record<string, string>;
  lockedAt: string;
}

export interface ClassroomInvite {
  joinCode: string;
  classroomId: string;
  classroomName: string;
  subject: string;
  gradeLevel: string;
  teacherUid: string;
  teacherName: string;
  active: boolean;
  createdAt: string;
}

export interface QuestionResponse {
  questionId: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  mistakeNote?: string;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  classroomId: string;
  teacherUid: string;
  studentUid: string;
  studentName: string;
  attemptNumber?: number;
  evaluationStatus?: 'evaluated' | 'pending';
  score: number;
  maxScore: number;
  percentage: number;
  elapsedSeconds?: number;
  timedOut?: boolean;
  responses: QuestionResponse[];
  submittedAt: string;
}

export type MasteryStatus = 'mastered' | 'developing' | 'needs_support' | 'unassessed';

export interface MasteryEvidenceItem {
  assessmentId: string;
  assessmentTitle: string;
  questionId: string;
  prompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface ConceptMasteryRecord {
  conceptId: string;
  conceptName: string;
  correctCount: number;
  attemptedCount: number;
  masteryPct: number | null;
  status: MasteryStatus;
  evidence: MasteryEvidenceItem[];
}

export interface StudentPerformanceSummary {
  studentUid: string;
  studentName: string;
  email: string;
  testsCompleted: number;
  averagePct: number | null;
  needsSupport: boolean;
  weakConcepts: ConceptMasteryRecord[];
  conceptMastery: ConceptMasteryRecord[];
  recentSubmissions: AssessmentSubmission[];
}

export interface ClassAnalyticsSummary {
  totalStudents: number;
  testsCompleted: number;
  studentsNeedingSupportCount: number;
  averageClassPct: number | null;
  mostDifficultConcepts: ConceptMasteryRecord[];
  conceptBreakdown: ConceptMasteryRecord[];
  studentReports: StudentPerformanceSummary[];
}

export interface RevisionRecommendation {
  conceptId: string;
  conceptName: string;
  masteryPct: number;
  reason: string;
  matchedMaterialId?: string;
  matchedMaterialTitle?: string;
  suggestedAction: string;
  practiceQuestionsCount: number;
}

export interface LessonRecommendation {
  id: string;
  conceptId: string;
  conceptName: string;
  classMasteryPct: number;
  affectedStudentsCount: number;
  recommendedFocus: string;
  suggestedActivity: string;
  approvalStatus: 'pending_review' | 'approved';
}

export interface StudentTimelinePoint {
  attemptKey: string;
  attemptIndex: number;
  attemptNumber: number;
  assessmentId: string;
  assessmentTitle: string;
  submittedAt: string;
  dateLabel: string;
  testPercentage: number;
  overallCumulativePct: number;
  score: number;
  maxScore: number;
  conceptMasteryByName: Record<string, number>;
  conceptEvidenceByName: Record<string, { correct: number; attempted: number }>;
}

export interface ConceptSeriesMeta {
  conceptId: string;
  conceptName: string;
  color: string;
  latestMasteryPct: number | null;
  deltaPct: number | null;
  correctCount: number;
  attemptedCount: number;
  status: MasteryStatus;
}

export interface StudentPerformanceTimeline {
  points: StudentTimelinePoint[];
  series: ConceptSeriesMeta[];
  totalAttempts: number;
  latestScorePct: number | null;
  averageScorePct: number | null;
  bestScorePct: number | null;
  scoreDeltaPct: number | null;
}

export type ThemeMode = 'light' | 'dark';

export interface ClassroomEnrollment {
  id: string;
  classroomId: string;
  teacherUid: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  joinCode: string;
  status: 'active';
  enrolledAt: string;
}

export type ConversationType = 'direct' | 'classroom';

export interface Conversation {
  id: string;
  type: ConversationType;
  classroomId: string;
  classroomName: string;
  teacherUid: string;
  teacherName: string;
  studentUid?: string;
  studentName?: string;
  participantUids: string[];
  title: string;
  lastMessageText: string;
  lastMessageAt: string;
  lastSenderUid: string;
  lastSenderName: string;
  unreadCounts: Record<string, number>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  classroomId: string;
  participantUids: string[];
  senderUid: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  materialId?: string;
  materialTitle?: string;
  readBy: Record<string, string>;
  createdAt: string;
}

export interface Announcement {
  id: string;
  classroomId: string;
  classroomName: string;
  teacherUid: string;
  teacherName: string;
  studentUids: string[];
  title: string;
  body: string;
  materialId?: string;
  materialTitle?: string;
  priority: 'normal' | 'important';
  acknowledgedBy: string[];
  createdAt: string;
}

export type NotificationType =
  | 'teacher_message'
  | 'student_message'
  | 'announcement'
  | 'material_published'
  | 'assessment_published'
  | 'assessment_deadline'
  | 'assessment_result';

export interface AppNotification {
  id: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
  type: NotificationType;
  title: string;
  body: string;
  classroomId: string;
  targetTab: string;
  targetId: string;
  read: boolean;
  createdAt: string;
  isDerivedDeadline?: boolean;
}

export interface WorkspaceSearchResult {
  id: string;
  kind: 'classroom' | 'student' | 'material' | 'assessment' | 'announcement' | 'conversation';
  title: string;
  subtitle: string;
  classroomId?: string;
  targetTab: string;
  targetId: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceSession {
  id: string;
  classroomId: string;
  classroomName: string;
  teacherUid: string;
  sessionDate: string;
  topic: string;
  studentUids: string[];
  records: Record<string, AttendanceStatus>;
  presentCount: number;
  totalCount: number;
  createdAt: string;
}

export interface PersistedLessonPlan {
  id: string;
  classroomId: string;
  teacherUid: string;
  conceptId: string;
  conceptName: string;
  classMasteryPct: number;
  recommendedFocus: string;
  suggestedActivity: string;
  aiOutline?: {
    focusSummary: string;
    warmUp: string;
    reteachActivity: string;
    exitCheck: string;
  };
  status: 'approved' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface TutorDoubtEntry {
  id: string;
  classroomId: string;
  studentUid: string;
  teacherUid: string;
  materialId: string;
  materialTitle: string;
  question: string;
  answerEn: string;
  answerKn?: string;
  language: LanguageCode;
  entryType: 'doubt' | 'explanation';
  createdAt: string;
}

export interface RevisionTaskProgress {
  id: string;
  classroomId: string;
  studentUid: string;
  teacherUid: string;
  conceptId: string;
  conceptName: string;
  matchedMaterialId?: string;
  matchedMaterialTitle?: string;
  status: 'pending' | 'completed';
  reflectionNote?: string;
  updatedAt: string;
  createdAt: string;
}

export interface MaterialEngagement {
  id: string;
  materialId: string;
  classroomId: string;
  teacherUid: string;
  studentUid: string;
  studentName: string;
  status: 'viewed' | 'completed';
  viewCount: number;
  lastViewedAt: string;
  createdAt: string;
}

export type ClassroomActivityType = 'lab' | 'revision_clinic' | 'discussion' | 'assignment';

export interface ClassroomActivity {
  id: string;
  classroomId: string;
  classroomName: string;
  teacherUid: string;
  studentUids: string[];
  title: string;
  activityType: ClassroomActivityType;
  scheduledDate: string;
  description: string;
  completed: boolean;
  createdAt: string;
}

export interface QuestionBankItem {
  id: string;
  teacherUid: string;
  subject: string;
  conceptId: string;
  conceptName: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  createdAt: string;
}

export interface StudentStudyNote {
  id: string;
  classroomId: string;
  studentUid: string;
  conceptId?: string;
  conceptName?: string;
  title: string;
  content: string;
  language: LanguageCode;
  updatedAt: string;
  createdAt: string;
}

export interface TeacherDashboardOverview {
  totalClassrooms: number;
  totalStudents: number;
  activeAssessmentsCount: number;
  averageClassPerformancePct: number | null;
  attendanceRecorded: boolean;
  attendancePct: number | null;
  attendanceSessionsCount: number;
  recentSubmissions: AssessmentSubmission[];
  studentsNeedingSupport: StudentPerformanceSummary[];
  upcomingAssessments: Assessment[];
  upcomingActivities: ClassroomActivity[];
  recentAnnouncements: Announcement[];
  recentConversations: Conversation[];
  unreadMessagesCount: number;
}

export interface StudentDashboardOverview {
  enrolledClassroomsCount: number;
  availableMaterialsCount: number;
  pendingAssessments: Assessment[];
  completedAssessmentsCount: number;
  averageScorePct: number | null;
  attendanceRecorded: boolean;
  attendancePct: number | null;
  weakConcepts: ConceptMasteryRecord[];
  recentAnnouncements: Announcement[];
  recentConversations: Conversation[];
  upcomingDeadlines: Assessment[];
  upcomingActivities: ClassroomActivity[];
  unreadMessagesCount: number;
}

export interface CurriculumTopicProgress {
  id: string;
  studentUid: string;
  curriculumId: string;
  completedTopicIds: string[];
  lastViewedTopicId?: string;
  updatedAt: string;
  createdAt: string;
}

