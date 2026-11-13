import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeClassAnalytics,
  computeConceptMastery,
  computeStudentConceptMasteryTimeline,
  evaluateAssessmentSubmission,
  extractDocumentOutline,
  generateNextLessonRecommendations,
  generateRevisionRecommendations,
  getEvidenceStrength,
} from './mastery';
import type { Assessment, StudentRosterEntry, StudyMaterial } from '../types/learnsense';

const sampleAssessment: Assessment = {
  id: 'assess_1',
  classroomId: 'class_1',
  teacherUid: 'teacher_1',
  title: 'Forces & Motion Check',
  status: 'published',
  durationMinutes: 20,
  createdAt: '2026-11-10T10:00:00Z',
  questions: [
    {
      id: 'q1',
      prompt: 'Which law explains why passengers lurch forward when a bus brakes suddenly?',
      type: 'mcq',
      options: [
        "Newton's First Law (Inertia)",
        "Newton's Second Law",
        "Newton's Third Law",
        'Law of Gravitation',
      ],
      correctAnswer: "Newton's First Law (Inertia)",
      explanation: 'Inertia keeps the body moving forward until an external force acts.',
      conceptId: 'c_inertia',
      conceptName: 'Inertia & First Law',
      points: 2,
      source: 'manual',
      approvalStatus: 'approved',
    },
    {
      id: 'q2',
      prompt: 'If mass is 4 kg and acceleration is 3 m/s^2, what is the net force in Newtons?',
      type: 'short_answer',
      correctAnswer: '12',
      explanation: 'F = m * a = 4 * 3 = 12 N.',
      conceptId: 'c_fma',
      conceptName: 'Force, Mass & Acceleration',
      points: 2,
      source: 'manual',
      approvalStatus: 'approved',
    },
    {
      id: 'q3_draft',
      prompt: 'Unapproved AI draft question should not be scored',
      type: 'mcq',
      options: ['A', 'B'],
      correctAnswer: 'A',
      explanation: 'Draft only.',
      conceptId: 'c_inertia',
      conceptName: 'Inertia & First Law',
      points: 1,
      source: 'sarvam_ai',
      approvalStatus: 'pending_review',
    },
  ],
};

test('evaluateAssessmentSubmission only grades approved questions and tracks concept accuracy', () => {
  const submission = evaluateAssessmentSubmission(
    sampleAssessment,
    'stu_1',
    'Aarav Kulkarni',
    {
      q1: "Newton's First Law (Inertia)",
      q2: '10',
    },
    '2026-11-11T09:00:00Z'
  );

  assert.equal(submission.responses.length, 2);
  assert.equal(submission.score, 2);
  assert.equal(submission.maxScore, 4);
  assert.equal(submission.percentage, 50);
  assert.equal(submission.responses[0].isCorrect, true);
  assert.equal(submission.responses[1].isCorrect, false);
  assert.ok(submission.responses[1].mistakeNote?.includes('Force, Mass & Acceleration'));
});

test('computeConceptMastery keeps unassessed concepts strictly unassessed and links evidence', () => {
  const submission = evaluateAssessmentSubmission(
    sampleAssessment,
    'stu_1',
    'Aarav Kulkarni',
    {
      q1: "Newton's First Law (Inertia)",
      q2: '7',
    },
    '2026-11-11T09:00:00Z'
  );

  const mastery = computeConceptMastery(
    [submission],
    [sampleAssessment],
    [
      { conceptId: 'c_inertia', conceptName: 'Inertia & First Law' },
      { conceptId: 'c_fma', conceptName: 'Force, Mass & Acceleration' },
      { conceptId: 'c_friction', conceptName: 'Friction Forces' },
    ],
    'stu_1'
  );

  const fma = mastery.find((c) => c.conceptId === 'c_fma');
  const inertia = mastery.find((c) => c.conceptId === 'c_inertia');
  const friction = mastery.find((c) => c.conceptId === 'c_friction');

  assert.equal(fma?.masteryPct, 0);
  assert.equal(fma?.status, 'needs_support');
  assert.equal(fma?.evidence.length, 1);
  assert.equal(inertia?.masteryPct, 100);
  assert.equal(inertia?.status, 'mastered');
  assert.equal(friction?.masteryPct, null);
  assert.equal(friction?.status, 'unassessed');
});

test('computeClassAnalytics and recommendations surface students needing support and difficult concepts', () => {
  const students: StudentRosterEntry[] = [
    { uid: 'stu_1', name: 'Aarav Kulkarni', email: 'aarav@school.edu' },
    { uid: 'stu_2', name: 'Meera Nair', email: 'meera@school.edu' },
  ];

  const sub1 = evaluateAssessmentSubmission(
    sampleAssessment,
    'stu_1',
    'Aarav Kulkarni',
    { q1: "Newton's First Law (Inertia)", q2: '5' }
  );
  const sub2 = evaluateAssessmentSubmission(
    sampleAssessment,
    'stu_2',
    'Meera Nair',
    { q1: "Newton's First Law (Inertia)", q2: '12' }
  );

  const analytics = computeClassAnalytics(
    students,
    [sampleAssessment],
    [sub1, sub2],
    [
      { conceptId: 'c_inertia', conceptName: 'Inertia & First Law' },
      { conceptId: 'c_fma', conceptName: 'Force, Mass & Acceleration' },
    ]
  );

  assert.equal(analytics.totalStudents, 2);
  assert.equal(analytics.testsCompleted, 2);
  assert.equal(analytics.studentsNeedingSupportCount, 1);
  assert.equal(analytics.mostDifficultConcepts[0].conceptId, 'c_fma');
  assert.equal(analytics.mostDifficultConcepts[0].masteryPct, 50);

  const materials: StudyMaterial[] = [
    {
      id: 'mat_1',
      classroomId: 'class_1',
      teacherUid: 'teacher_1',
      title: 'Laws of Motion Notes',
      fileName: 'laws_of_motion.pdf',
      extractedText: 'Force, Mass & Acceleration follows F = ma.',
      extractionSource: 'local_pdf_parser',
      topics: [
        {
          id: 'c_fma',
          title: 'Force, Mass & Acceleration',
          description: 'Newton second law',
          subtopics: [],
        },
      ],
      createdAt: '2026-11-10T08:00:00Z',
    },
  ];

  const studentRecs = generateRevisionRecommendations(
    analytics.studentReports[0].conceptMastery,
    materials,
    [sampleAssessment]
  );
  assert.equal(studentRecs.length, 1);
  assert.equal(studentRecs[0].matchedMaterialId, 'mat_1');

  const lessonRecs = generateNextLessonRecommendations(analytics, materials);
  assert.equal(lessonRecs.length, 1);
  assert.equal(lessonRecs[0].affectedStudentsCount, 1);
});

test('extractDocumentOutline parses headings and bullet subtopics cleanly', () => {
  const sampleText = `
1. Photosynthesis Overview
Plants convert sunlight into chemical energy inside chloroplasts.
- Light-Dependent Reactions
- Calvin Cycle Carbon Fixation

2. Cellular Respiration
Cells break down glucose to release ATP energy.
  `;

  const topics = extractDocumentOutline(sampleText, 'biology_ch3.pdf');
  assert.equal(topics.length, 2);
  assert.equal(topics[0].title, 'Photosynthesis Overview');
  assert.equal(topics[0].subtopics.length, 2);
  assert.equal(topics[1].title, 'Cellular Respiration');
});

test('getEvidenceStrength classifies attempted question counts transparently', () => {
  assert.equal(getEvidenceStrength(0).tier, 'none');
  assert.equal(getEvidenceStrength(1).tier, 'limited');
  assert.equal(getEvidenceStrength(3).tier, 'moderate');
  assert.equal(getEvidenceStrength(4).tier, 'strong');
});

test('computeStudentConceptMasteryTimeline tracks chronological cumulative mastery without fabricating data', () => {
  const emptyTimeline = computeStudentConceptMasteryTimeline([], [sampleAssessment]);
  assert.equal(emptyTimeline.totalAttempts, 0);
  assert.equal(emptyTimeline.points.length, 0);
  assert.equal(emptyTimeline.latestScorePct, null);

  const attempt1 = {
    ...evaluateAssessmentSubmission(
      sampleAssessment,
      'stu_1',
      'Aarav Kulkarni',
      { q1: "Newton's First Law (Inertia)", q2: '5' },
      '2026-11-10T10:00:00Z'
    ),
    id: 'sub_att_1',
    attemptNumber: 1,
    evaluationStatus: 'evaluated' as const,
  };

  const attempt2 = {
    ...evaluateAssessmentSubmission(
      sampleAssessment,
      'stu_1',
      'Aarav Kulkarni',
      { q1: "Newton's First Law (Inertia)", q2: '12' },
      '2026-11-12T10:00:00Z'
    ),
    id: 'sub_att_2',
    attemptNumber: 2,
    evaluationStatus: 'evaluated' as const,
  };

  const timeline = computeStudentConceptMasteryTimeline(
    [attempt2, attempt1],
    [sampleAssessment]
  );

  assert.equal(timeline.totalAttempts, 2);
  assert.equal(timeline.points[0].attemptNumber, 1);
  assert.equal(timeline.points[0].testPercentage, 50);
  assert.equal(timeline.points[0].conceptMasteryByName['Force, Mass & Acceleration'], 0);
  assert.equal(timeline.points[1].attemptNumber, 2);
  assert.equal(timeline.points[1].testPercentage, 100);
  assert.equal(timeline.points[1].conceptMasteryByName['Force, Mass & Acceleration'], 50);
  assert.equal(timeline.scoreDeltaPct, 50);

  const fmaSeries = timeline.series.find((s) => s.conceptName === 'Force, Mass & Acceleration');
  assert.equal(fmaSeries?.latestMasteryPct, 50);
  assert.equal(fmaSeries?.deltaPct, 50);
  assert.equal(fmaSeries?.attemptedCount, 2);
});

