import type {
  Assessment,
  AssessmentSubmission,
  ClassAnalyticsSummary,
  ConceptMasteryRecord,
  LessonRecommendation,
  MasteryStatus,
  Question,
  QuestionResponse,
  RevisionRecommendation,
  StudentPerformanceSummary,
  StudentRosterEntry,
  StudyMaterial,
  TopicNode,
} from '../types/learnsense';

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isShortAnswerCorrect(studentAnswer: string, expectedAnswer: string): boolean {
  const normStudent = normalizeAnswer(studentAnswer);
  const normExpected = normalizeAnswer(expectedAnswer);
  if (!normStudent) return false;
  if (normStudent === normExpected) return true;

  // Support keyword matching for concise short-answer rubrics separated by commas or semicolons
  const keywords = normExpected
    .split(/[;,]+/)
    .map((k) => k.trim())
    .filter((k) => k.length >= 3);

  if (keywords.length > 1) {
    const matched = keywords.filter((kw) => normStudent.includes(kw));
    return matched.length >= Math.ceil(keywords.length * 0.6);
  }

  return normExpected.length >= 4 && normStudent.includes(normExpected);
}

export function evaluateAssessmentSubmission(
  assessment: Assessment,
  studentUid: string,
  studentName: string,
  answersByQuestionId: Record<string, string>,
  submittedAt = new Date().toISOString()
): AssessmentSubmission {
  const activeQuestions = assessment.questions.filter((q) => q.approvalStatus === 'approved');
  const responses: QuestionResponse[] = [];
  let score = 0;
  let maxScore = 0;

  for (const question of activeQuestions) {
    const studentAnswer = (answersByQuestionId[question.id] ?? '').trim();
    const maxPoints = question.points > 0 ? question.points : 1;
    maxScore += maxPoints;

    let isCorrect = false;
    if (question.type === 'mcq') {
      isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(question.correctAnswer);
    } else {
      isCorrect = isShortAnswerCorrect(studentAnswer, question.correctAnswer);
    }

    const pointsEarned = isCorrect ? maxPoints : 0;
    score += pointsEarned;

    responses.push({
      questionId: question.id,
      conceptId: question.conceptId,
      conceptName: question.conceptName,
      prompt: question.prompt,
      studentAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      pointsEarned,
      maxPoints,
      mistakeNote: isCorrect
        ? undefined
        : studentAnswer
          ? `Answered "${studentAnswer}" instead of "${question.correctAnswer}". Review ${question.conceptName}.`
          : `No answer provided for ${question.conceptName}.`,
    });
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    id: `sub_${assessment.id}_${studentUid}_${Date.now()}`,
    assessmentId: assessment.id,
    classroomId: assessment.classroomId,
    teacherUid: assessment.teacherUid,
    studentUid,
    studentName,
    score,
    maxScore,
    percentage,
    responses,
    submittedAt,
  };
}

export function classifyMastery(masteryPct: number | null): MasteryStatus {
  if (masteryPct === null) return 'unassessed';
  if (masteryPct < 55) return 'needs_support';
  if (masteryPct < 80) return 'developing';
  return 'mastered';
}

export function extractKnownConcepts(
  materials: StudyMaterial[],
  assessments: Assessment[]
): Array<{ conceptId: string; conceptName: string }> {
  const map = new Map<string, string>();

  for (const material of materials) {
    for (const topic of material.topics) {
      map.set(topic.id, topic.title);
      for (const sub of topic.subtopics) {
        map.set(sub.id, sub.title);
      }
    }
  }

  for (const assessment of assessments) {
    for (const q of assessment.questions) {
      if (q.conceptId && q.conceptName && !map.has(q.conceptId)) {
        map.set(q.conceptId, q.conceptName);
      }
    }
  }

  return Array.from(map.entries()).map(([conceptId, conceptName]) => ({
    conceptId,
    conceptName,
  }));
}

export function computeConceptMastery(
  submissions: AssessmentSubmission[],
  assessments: Assessment[],
  knownConcepts: Array<{ conceptId: string; conceptName: string }> = [],
  studentUid?: string
): ConceptMasteryRecord[] {
  const filteredSubmissions = studentUid
    ? submissions.filter((s) => s.studentUid === studentUid)
    : submissions;

  const assessmentTitleById = new Map<string, string>(
    assessments.map((a) => [a.id, a.title])
  );

  const buckets = new Map<string, ConceptMasteryRecord>();

  for (const concept of knownConcepts) {
    buckets.set(concept.conceptId, {
      conceptId: concept.conceptId,
      conceptName: concept.conceptName,
      correctCount: 0,
      attemptedCount: 0,
      masteryPct: null,
      status: 'unassessed',
      evidence: [],
    });
  }

  for (const sub of filteredSubmissions) {
    const assessmentTitle = assessmentTitleById.get(sub.assessmentId) ?? 'Assessment';
    for (const resp of sub.responses) {
      const existing = buckets.get(resp.conceptId) ?? {
        conceptId: resp.conceptId,
        conceptName: resp.conceptName,
        correctCount: 0,
        attemptedCount: 0,
        masteryPct: null,
        status: 'unassessed' as MasteryStatus,
        evidence: [],
      };

      existing.attemptedCount += 1;
      if (resp.isCorrect) {
        existing.correctCount += 1;
      }
      existing.evidence.push({
        assessmentId: sub.assessmentId,
        assessmentTitle,
        questionId: resp.questionId,
        prompt: resp.prompt,
        studentAnswer: resp.studentAnswer,
        correctAnswer: resp.correctAnswer,
        isCorrect: resp.isCorrect,
        submittedAt: sub.submittedAt,
      });

      buckets.set(resp.conceptId, existing);
    }
  }

  const records = Array.from(buckets.values()).map((rec) => {
    if (rec.attemptedCount === 0) {
      return {
        ...rec,
        masteryPct: null,
        status: 'unassessed' as MasteryStatus,
      };
    }
    const pct = Math.round((rec.correctCount / rec.attemptedCount) * 100);
    return {
      ...rec,
      masteryPct: pct,
      status: classifyMastery(pct),
    };
  });

  // Sort assessed concepts lowest mastery first (needs support at top), then unassessed
  return records.sort((a, b) => {
    if (a.masteryPct === null && b.masteryPct === null) {
      return a.conceptName.localeCompare(b.conceptName);
    }
    if (a.masteryPct === null) return 1;
    if (b.masteryPct === null) return -1;
    if (a.masteryPct !== b.masteryPct) return a.masteryPct - b.masteryPct;
    return b.attemptedCount - a.attemptedCount;
  });
}

export function computeClassAnalytics(
  students: StudentRosterEntry[],
  assessments: Assessment[],
  submissions: AssessmentSubmission[],
  knownConcepts: Array<{ conceptId: string; conceptName: string }> = []
): ClassAnalyticsSummary {
  const studentReports: StudentPerformanceSummary[] = students.map((student) => {
    const studentSubs = submissions
      .filter((s) => s.studentUid === student.uid)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    const conceptMastery = computeConceptMastery(
      studentSubs,
      assessments,
      [],
      student.uid
    );

    const weakConcepts = conceptMastery.filter(
      (c) => c.status === 'needs_support' || c.status === 'developing'
    );

    const averagePct =
      studentSubs.length > 0
        ? Math.round(
            studentSubs.reduce((sum, s) => sum + s.percentage, 0) / studentSubs.length
          )
        : null;

    const needsSupport =
      (averagePct !== null && averagePct < 65) ||
      conceptMastery.some((c) => c.status === 'needs_support');

    return {
      studentUid: student.uid,
      studentName: student.name,
      email: student.email,
      testsCompleted: studentSubs.length,
      averagePct,
      needsSupport,
      weakConcepts,
      conceptMastery,
      recentSubmissions: studentSubs,
    };
  });

  const conceptBreakdown = computeConceptMastery(
    submissions,
    assessments,
    knownConcepts
  );

  const assessedConcepts = conceptBreakdown.filter((c) => c.masteryPct !== null);
  const mostDifficultConcepts = assessedConcepts.filter((c) => (c.masteryPct ?? 100) < 75);

  const averageClassPct =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((sum, s) => sum + s.percentage, 0) / submissions.length
        )
      : null;

  return {
    totalStudents: students.length,
    testsCompleted: submissions.length,
    studentsNeedingSupportCount: studentReports.filter((r) => r.needsSupport).length,
    averageClassPct,
    mostDifficultConcepts: mostDifficultConcepts.slice(0, 5),
    conceptBreakdown,
    studentReports: studentReports.sort((a, b) => {
      if (a.needsSupport !== b.needsSupport) return a.needsSupport ? -1 : 1;
      if (a.averagePct === null && b.averagePct === null) return a.studentName.localeCompare(b.studentName);
      if (a.averagePct === null) return 1;
      if (b.averagePct === null) return -1;
      return a.averagePct - b.averagePct;
    }),
  };
}

export function generateRevisionRecommendations(
  conceptMastery: ConceptMasteryRecord[],
  materials: StudyMaterial[],
  assessments: Assessment[]
): RevisionRecommendation[] {
  const weak = conceptMastery.filter(
    (c) => c.masteryPct !== null && c.masteryPct < 80
  );

  return weak.map((concept) => {
    const matchedMaterial = materials.find(
      (m) =>
        m.topics.some(
          (t) =>
            t.id === concept.conceptId ||
            t.title.toLowerCase() === concept.conceptName.toLowerCase() ||
            t.subtopics.some(
              (sub) =>
                sub.id === concept.conceptId ||
                sub.title.toLowerCase() === concept.conceptName.toLowerCase()
            )
        ) ||
        m.extractedText.toLowerCase().includes(concept.conceptName.toLowerCase())
    );

    const practiceQuestionsCount = assessments.reduce((count, a) => {
      return (
        count +
        a.questions.filter(
          (q) =>
            q.approvalStatus === 'approved' &&
            (q.conceptId === concept.conceptId ||
              q.conceptName.toLowerCase() === concept.conceptName.toLowerCase())
        ).length
      );
    }, 0);

    const missed = concept.attemptedCount - concept.correctCount;
    return {
      conceptId: concept.conceptId,
      conceptName: concept.conceptName,
      masteryPct: concept.masteryPct ?? 0,
      reason: `Missed ${missed} of ${concept.attemptedCount} evaluated question${concept.attemptedCount === 1 ? '' : 's'} (${concept.masteryPct}% mastery).`,
      matchedMaterialId: matchedMaterial?.id,
      matchedMaterialTitle: matchedMaterial?.title,
      suggestedAction: matchedMaterial
        ? `Review "${matchedMaterial.title}" and request a bilingual English/Kannada walkthrough for ${concept.conceptName}.`
        : `Ask the Doubt Assistant for a step-by-step explanation of ${concept.conceptName}.`,
      practiceQuestionsCount,
    };
  });
}

export function generateNextLessonRecommendations(
  analytics: ClassAnalyticsSummary,
  materials: StudyMaterial[]
): LessonRecommendation[] {
  const difficult = analytics.conceptBreakdown.filter(
    (c) => c.masteryPct !== null && c.masteryPct < 75
  );

  return difficult.slice(0, 4).map((concept, idx) => {
    const affectedStudentsCount = analytics.studentReports.filter((student) =>
      student.conceptMastery.some(
        (c) => c.conceptId === concept.conceptId && (c.masteryPct ?? 100) < 70
      )
    ).length;

    const matchedMaterial = materials.find((m) =>
      m.topics.some(
        (t) =>
          t.id === concept.conceptId ||
          t.title.toLowerCase() === concept.conceptName.toLowerCase() ||
          t.subtopics.some((s) => s.id === concept.conceptId)
      )
    );

    const pct = concept.masteryPct ?? 0;
    return {
      id: `lesson_rec_${concept.conceptId}_${idx}`,
      conceptId: concept.conceptId,
      conceptName: concept.conceptName,
      classMasteryPct: pct,
      affectedStudentsCount,
      recommendedFocus:
        pct < 55
          ? `Reteach foundational principles of ${concept.conceptName} with worked examples (${concept.correctCount}/${concept.attemptedCount} class accuracy).`
          : `Run targeted guided practice on ${concept.conceptName} to close recurring errors (${concept.correctCount}/${concept.attemptedCount} class accuracy).`,
      suggestedActivity: matchedMaterial
        ? `15-min concept recap from "${matchedMaterial.title}" followed by a 3-question exit check.`
        : `15-min small-group walkthrough on ${concept.conceptName} with a short diagnostic check.`,
      approvalStatus: 'pending_review',
    };
  });
}

export function extractDocumentOutline(rawText: string, fileName: string): TopicNode[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const topics: TopicNode[] = [];
  let currentTopic: TopicNode | null = null;

  const slugify = (s: string, index: number) =>
    `concept_${s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 32) || `topic_${index}`}_${index}`;

  const headingPattern = /^(?:\d+(?:\.\d+)?[.)]?\s+|#{1,3}\s+|chapter\s+\d+[:.\s-]+|unit\s+\d+[:.\s-]+|topic\s+\d+[:.\s-]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanLine = line.replace(/^#{1,3}\s+/, '').trim();

    const looksLikeHeading =
      headingPattern.test(line) ||
      (cleanLine.length >= 4 &&
        cleanLine.length <= 72 &&
        !/[.!?]$/.test(cleanLine) &&
        /^[A-Z]/.test(cleanLine) &&
        cleanLine.split(/\s+/).length <= 9);

    if (looksLikeHeading) {
      const isSubtopic = /^\d+\.\d+/.test(line) || /^[-*•]\s+/.test(line);
      if (isSubtopic && currentTopic && currentTopic.subtopics.length < 6) {
        currentTopic.subtopics.push({
          id: slugify(cleanLine, topics.length * 10 + currentTopic.subtopics.length + 1),
          title: cleanLine.replace(/^\d+\.\d+[.)]?\s+/, ''),
          summary: lines[i + 1] ? lines[i + 1].slice(0, 180) : `Key concept covered in ${fileName}.`,
        });
      } else if (topics.length < 8) {
        currentTopic = {
          id: slugify(cleanLine, topics.length + 1),
          title: cleanLine.replace(/^\d+[.)]?\s+/, ''),
          description:
            lines[i + 1] && lines[i + 1].length > 20
              ? lines[i + 1].slice(0, 220)
              : `Extracted section from ${fileName}.`,
          subtopics: [],
        };
        topics.push(currentTopic);
      }
    } else if (currentTopic && /^[-*•]\s+/.test(line) && currentTopic.subtopics.length < 6) {
      const subTitle = line.replace(/^[-*•]\s+/, '').slice(0, 72);
      currentTopic.subtopics.push({
        id: slugify(subTitle, topics.length * 10 + currentTopic.subtopics.length + 1),
        title: subTitle,
        summary: subTitle,
      });
    }
  }

  if (topics.length === 0 && lines.length > 0) {
    const fallbackTitle = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    topics.push({
      id: slugify(fallbackTitle, 1),
      title: fallbackTitle || 'Uploaded Study Notes',
      description: lines.slice(0, 3).join(' ').slice(0, 220),
      subtopics: [
        {
          id: slugify(`${fallbackTitle}_core`, 2),
          title: 'Core Definitions & Summary',
          summary: lines.slice(0, 2).join(' ').slice(0, 180),
        },
      ],
    });
  }

  return topics;
}

export function getApprovedQuestions(assessment: Assessment): Question[] {
  return assessment.questions.filter((q) => q.approvalStatus === 'approved');
}

export type EvidenceStrengthTier = 'none' | 'limited' | 'moderate' | 'strong';

export function getEvidenceStrength(attemptedCount: number): {
  tier: EvidenceStrengthTier;
  label: string;
} {
  if (attemptedCount <= 0) {
    return { tier: 'none', label: 'No Evidence (0 Qs)' };
  }
  if (attemptedCount === 1) {
    return { tier: 'limited', label: 'Initial Evidence (1 Q)' };
  }
  if (attemptedCount <= 3) {
    return { tier: 'moderate', label: `Moderate Evidence (${attemptedCount} Qs)` };
  }
  return { tier: 'strong', label: `Strong Evidence (${attemptedCount} Qs)` };
}

const TIMELINE_SERIES_COLORS = [
  '#047857', // Emerald
  '#0284c7', // Sky
  '#4f46e5', // Indigo
  '#d97706', // Amber
  '#0d9488', // Teal
  '#be123c', // Rose
  '#7c3aed', // Violet
] as const;

export function computeStudentConceptMasteryTimeline(
  submissions: AssessmentSubmission[],
  assessments: Array<Pick<Assessment, 'id' | 'title'>>
): import('../types/learnsense').StudentPerformanceTimeline {
  const evaluatedSubs = [...submissions]
    .filter((s) => (s.evaluationStatus ?? 'evaluated') === 'evaluated' && s.responses.length > 0)
    .sort((a, b) => {
      const timeCmp = a.submittedAt.localeCompare(b.submittedAt);
      if (timeCmp !== 0) return timeCmp;
      return (a.attemptNumber ?? 1) - (b.attemptNumber ?? 1);
    });

  if (evaluatedSubs.length === 0) {
    return {
      points: [],
      series: [],
      totalAttempts: 0,
      latestScorePct: null,
      averageScorePct: null,
      bestScorePct: null,
      scoreDeltaPct: null,
    };
  }

  const titleById = new Map(assessments.map((a) => [a.id, a.title]));
  const cumulativeByConcept = new Map<
    string,
    { conceptId: string; conceptName: string; correct: number; attempted: number; history: number[] }
  >();

  let runningPointsEarned = 0;
  let runningMaxPoints = 0;

  const points: import('../types/learnsense').StudentTimelinePoint[] = evaluatedSubs.map((sub, idx) => {
    runningPointsEarned += sub.score;
    runningMaxPoints += sub.maxScore;

    for (const resp of sub.responses) {
      const key = resp.conceptId || resp.conceptName;
      const entry = cumulativeByConcept.get(key) ?? {
        conceptId: resp.conceptId || key,
        conceptName: resp.conceptName,
        correct: 0,
        attempted: 0,
        history: [],
      };
      entry.attempted += 1;
      if (resp.isCorrect) entry.correct += 1;
      cumulativeByConcept.set(key, entry);
    }

    const conceptMasteryByName: Record<string, number> = {};
    const conceptEvidenceByName: Record<string, { correct: number; attempted: number }> = {};

    for (const entry of cumulativeByConcept.values()) {
      const pct = Math.round((entry.correct / entry.attempted) * 100);
      conceptMasteryByName[entry.conceptName] = pct;
      conceptEvidenceByName[entry.conceptName] = {
        correct: entry.correct,
        attempted: entry.attempted,
      };
      // Track latest point for delta calculation when updated during this submission
      if (sub.responses.some((r) => r.conceptName === entry.conceptName)) {
        entry.history.push(pct);
      }
    }

    const dateObj = new Date(sub.submittedAt);
    const dateLabel = Number.isNaN(dateObj.getTime())
      ? `Test ${idx + 1}`
      : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const attemptNumber = sub.attemptNumber ?? 1;
    const baseTitle = titleById.get(sub.assessmentId) ?? 'Assessment';

    return {
      attemptKey: `${sub.id}`,
      attemptIndex: idx + 1,
      attemptNumber,
      assessmentId: sub.assessmentId,
      assessmentTitle: attemptNumber > 1 ? `${baseTitle} (Attempt ${attemptNumber})` : baseTitle,
      submittedAt: sub.submittedAt,
      dateLabel: `${dateLabel} · #${idx + 1}`,
      testPercentage: sub.percentage,
      overallCumulativePct:
        runningMaxPoints > 0 ? Math.round((runningPointsEarned / runningMaxPoints) * 100) : sub.percentage,
      score: sub.score,
      maxScore: sub.maxScore,
      conceptMasteryByName,
      conceptEvidenceByName,
    };
  });

  const series: import('../types/learnsense').ConceptSeriesMeta[] = Array.from(
    cumulativeByConcept.values()
  ).map((entry, idx) => {
    const latestPct = entry.attempted > 0 ? Math.round((entry.correct / entry.attempted) * 100) : null;
    const firstPct = entry.history.length > 0 ? entry.history[0] : latestPct;
    const deltaPct =
      entry.history.length > 1 && latestPct !== null && firstPct !== null
        ? latestPct - firstPct
        : null;

    return {
      conceptId: entry.conceptId,
      conceptName: entry.conceptName,
      color: TIMELINE_SERIES_COLORS[idx % TIMELINE_SERIES_COLORS.length],
      latestMasteryPct: latestPct,
      deltaPct,
      correctCount: entry.correct,
      attemptedCount: entry.attempted,
      status: classifyMastery(latestPct),
    };
  });

  const latestScorePct = evaluatedSubs[evaluatedSubs.length - 1].percentage;
  const firstScorePct = evaluatedSubs[0].percentage;
  const averageScorePct = Math.round(
    evaluatedSubs.reduce((sum, s) => sum + s.percentage, 0) / evaluatedSubs.length
  );
  const bestScorePct = Math.max(...evaluatedSubs.map((s) => s.percentage));
  const scoreDeltaPct = evaluatedSubs.length > 1 ? latestScorePct - firstScorePct : null;

  return {
    points,
    series,
    totalAttempts: evaluatedSubs.length,
    latestScorePct,
    averageScorePct,
    bestScorePct,
    scoreDeltaPct,
  };
}

