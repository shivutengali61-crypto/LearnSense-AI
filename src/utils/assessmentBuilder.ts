import type { Question, QuestionSource, QuestionType } from '../types/learnsense';

export interface ManualQuestionInput {
  prompt: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptId: string;
  conceptName: string;
  points: number;
}

export function validateManualQuestionInput(
  input: ManualQuestionInput
): { valid: boolean; cleanOptions?: string[]; error?: string } {
  const prompt = input.prompt.trim();
  const correctAnswer = input.correctAnswer.trim();

  if (prompt.length < 5) {
    return { valid: false, error: 'Question prompt must be at least 5 characters.' };
  }

  if (!correctAnswer) {
    return { valid: false, error: 'Correct answer is required.' };
  }

  const pts = Number(input.points);
  if (!Number.isFinite(pts) || pts < 1 || pts > 20) {
    return { valid: false, error: 'Question points must be between 1 and 20.' };
  }

  if (input.type === 'mcq') {
    const cleanOptions = input.options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      return {
        valid: false,
        error: 'Provide at least 2 answer choices for multiple-choice questions.',
      };
    }
    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      return { valid: false, error: 'Multiple-choice options must be distinct.' };
    }
    if (!cleanOptions.includes(correctAnswer)) {
      return {
        valid: false,
        error: 'For MCQ, the correct answer must exactly match one of the provided options.',
      };
    }
    return { valid: true, cleanOptions };
  }

  return { valid: true };
}

export interface RawGeneratedQuestion {
  prompt?: string;
  type?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  conceptId?: string;
  conceptName?: string;
  points?: number;
}

export function normalizeGeneratedDraftQuestions(
  rawItems: RawGeneratedQuestion[],
  concepts: Array<{ conceptId: string; conceptName: string }>,
  source: QuestionSource = 'gemini_ai',
  nowMs: number = Date.now()
): Question[] {
  const fallbackConcept = concepts[0] ?? {
    conceptId: 'concept_general',
    conceptName: 'Core Concept',
  };

  return rawItems
    .filter((item) => item && typeof item.prompt === 'string' && item.prompt.trim().length > 0)
    .map((item, idx) => {
      const type: QuestionType = item.type === 'short_answer' ? 'short_answer' : 'mcq';

      const matchedConcept =
        concepts.find(
          (c) =>
            c.conceptId === item.conceptId ||
            c.conceptName.toLowerCase() === String(item.conceptName || '').trim().toLowerCase()
        ) ?? fallbackConcept;

      let options: string[] | undefined;
      let correctAnswer = String(item.correctAnswer || '').trim();

      if (type === 'mcq') {
        const cleaned = Array.isArray(item.options)
          ? item.options.map((o) => String(o).trim()).filter(Boolean)
          : [];
        if (cleaned.length >= 2) {
          options = cleaned.slice(0, 4);
          if (!correctAnswer || !options.includes(correctAnswer)) {
            if (correctAnswer) {
              options[0] = correctAnswer;
            } else {
              correctAnswer = options[0];
            }
          }
        } else {
          options = [
            correctAnswer || 'Option A',
            'Alternative explanation',
            'None of the above',
            'Insufficient data',
          ];
          correctAnswer = options[0];
        }
      } else if (!correctAnswer) {
        correctAnswer = 'Refer to classroom study material.';
      }

      const rawPts = Number(item.points);
      const points = Number.isFinite(rawPts) && rawPts >= 1 && rawPts <= 20 ? Math.round(rawPts) : 2;

      return {
        id: `${source}_q_${nowMs}_${idx}`,
        prompt: item.prompt!.trim(),
        type,
        options,
        correctAnswer,
        explanation:
          String(item.explanation || '').trim() ||
          'Generated draft grounded in classroom material — verify before publishing.',
        conceptId: matchedConcept.conceptId,
        conceptName: matchedConcept.conceptName,
        points,
        source,
        approvalStatus: 'pending_review',
      };
    });
}

export function summarizeAssessmentComposition(questions: Question[]) {
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let totalApprovedPoints = 0;
  const conceptSet = new Set<string>();

  for (const q of questions) {
    if (q.approvalStatus === 'approved') {
      approvedCount += 1;
      totalApprovedPoints += q.points;
      conceptSet.add(q.conceptName);
    } else if (q.approvalStatus === 'pending_review') {
      pendingCount += 1;
    } else {
      rejectedCount += 1;
    }
  }

  return {
    totalQuestions: questions.length,
    approvedCount,
    pendingCount,
    rejectedCount,
    totalApprovedPoints,
    coveredConceptsCount: conceptSet.size,
  };
}
