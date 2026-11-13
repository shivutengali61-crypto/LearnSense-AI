import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGeneratedDraftQuestions,
  summarizeAssessmentComposition,
  validateManualQuestionInput,
} from './assessmentBuilder';
import type { Question } from '../types/learnsense';

test('validateManualQuestionInput validates MCQ options, matching answer, and points', () => {
  assert.equal(
    validateManualQuestionInput({
      prompt: 'Hi',
      type: 'short_answer',
      options: [],
      correctAnswer: 'Yes',
      explanation: '',
      conceptId: 'c1',
      conceptName: 'Force',
      points: 2,
    }).valid,
    false
  );

  assert.equal(
    validateManualQuestionInput({
      prompt: 'What is the SI unit of force?',
      type: 'mcq',
      options: ['Newton', 'Joule', 'Watt', 'Pascal'],
      correctAnswer: 'Meter',
      explanation: 'Force is measured in Newtons.',
      conceptId: 'c1',
      conceptName: 'Force',
      points: 2,
    }).valid,
    false
  );

  const ok = validateManualQuestionInput({
    prompt: 'What is the SI unit of force?',
    type: 'mcq',
    options: ['Newton', 'Joule', 'Watt', 'Pascal'],
    correctAnswer: 'Newton',
    explanation: 'Force is measured in Newtons.',
    conceptId: 'c1',
    conceptName: 'Force',
    points: 2,
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.cleanOptions?.length, 4);
});

test('normalizeGeneratedDraftQuestions maps concepts, ensures MCQ answer matches options, and sets pending_review', () => {
  const concepts = [
    { conceptId: 'c_inertia', conceptName: 'Inertia & First Law' },
    { conceptId: 'c_momentum', conceptName: 'Conservation of Momentum' },
  ];

  const normalized = normalizeGeneratedDraftQuestions(
    [
      {
        prompt: 'Why does a passenger lurch forward when a bus brakes suddenly?',
        type: 'mcq',
        options: ['Gravity', 'Friction', 'Acceleration', 'Thermal expansion'],
        correctAnswer: 'Inertia of motion',
        explanation: 'The body tends to stay in uniform motion.',
        conceptName: 'Inertia & First Law',
        points: 3,
      },
      {
        prompt: 'State the law of conservation of linear momentum.',
        type: 'short_answer',
        correctAnswer: 'Total momentum remains constant when net external force is zero.',
        conceptId: 'c_momentum',
        points: 2,
      },
    ],
    concepts,
    'gemini_ai',
    1000
  );

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].source, 'gemini_ai');
  assert.equal(normalized[0].approvalStatus, 'pending_review');
  assert.equal(normalized[0].conceptId, 'c_inertia');
  assert.equal(normalized[0].options?.includes(normalized[0].correctAnswer), true);
  assert.equal(normalized[1].type, 'short_answer');
  assert.equal(normalized[1].conceptName, 'Conservation of Momentum');
});

test('summarizeAssessmentComposition computes approved points and queue counts accurately', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      prompt: 'Q1',
      type: 'mcq',
      options: ['A', 'B'],
      correctAnswer: 'A',
      explanation: 'Exp',
      conceptId: 'c1',
      conceptName: 'Inertia',
      points: 2,
      source: 'manual',
      approvalStatus: 'approved',
    },
    {
      id: 'q2',
      prompt: 'Q2',
      type: 'short_answer',
      correctAnswer: 'Ans',
      explanation: 'Exp',
      conceptId: 'c2',
      conceptName: 'Momentum',
      points: 3,
      source: 'gemini_ai',
      approvalStatus: 'pending_review',
    },
  ];

  const summary = summarizeAssessmentComposition(questions);
  assert.equal(summary.totalQuestions, 2);
  assert.equal(summary.approvedCount, 1);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.totalApprovedPoints, 2);
  assert.equal(summary.coveredConceptsCount, 1);
});
