import { GoogleGenAI, Type } from '@google/genai';
import {
  normalizeGeneratedDraftQuestions,
  type RawGeneratedQuestion,
} from '../utils/assessmentBuilder.ts';
import type { LanguageCode, Question, TopicNode } from '../types/learnsense.ts';

export class GeminiConfigError extends Error {
  statusCode = 503;
  configured = false;
  constructor(message: string) {
    super(message);
    this.name = 'GeminiConfigError';
  }
}

export class GeminiApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'GeminiApiError';
    this.statusCode = statusCode;
  }
}

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKey() !== null;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new GeminiConfigError(
      'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets to enable Gemini AI.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const GEMINI_MODEL = 'gemini-4-hydrogen';

export interface GenerateDraftQuestionsParams {
  materialTitle?: string;
  materialText: string;
  concepts: Array<{ conceptId: string; conceptName: string }>;
  count?: number;
  questionStyle?: 'mixed' | 'mcq' | 'short_answer';
  difficulty?: 'foundational' | 'intermediate' | 'challenging';
}

export async function generateDraftQuestionsWithGemini(
  params: GenerateDraftQuestionsParams
): Promise<Question[]> {
  const ai = getGeminiClient();

  const targetCount = Math.min(Math.max(Number(params.count) || 4, 1), 8);
  const styleInstruction =
    params.questionStyle === 'mcq'
      ? 'Generate ONLY multiple-choice ("mcq") questions, each with 4 plausible options.'
      : params.questionStyle === 'short_answer'
        ? 'Generate ONLY concise short-answer ("short_answer") questions.'
        : 'Generate a balanced mix of "mcq" (with 4 options) and "short_answer" questions.';

  const conceptLines =
    params.concepts.length > 0
      ? params.concepts.map((c) => `- ${c.conceptId}: ${c.conceptName}`).join('\n')
      : '- concept_general: Core Concept';

  const prompt = [
    `Generate ${targetCount} classroom assessment draft questions strictly grounded in the study material below.`,
    `Difficulty level: ${params.difficulty || 'intermediate'}.`,
    `Format requirement: ${styleInstruction}`,
    'Map every question to one conceptId and conceptName from this list:',
    conceptLines,
    '',
    `Study Material Title: ${params.materialTitle || 'Classroom Notes'}`,
    'Study Material Content:',
    params.materialText.slice(0, 12000),
  ].join('\n');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert university and classroom assessment author. Create clear, unambiguous assessment questions strictly grounded in the provided study material. For every "mcq" question, include exactly 4 options and ensure correctAnswer matches one option verbatim. Keep explanations concise (1-2 sentences).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: {
                type: Type.STRING,
                description: 'The question text presented to students.',
              },
              type: {
                type: Type.STRING,
                description: 'Either "mcq" or "short_answer".',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Four answer choices when type is "mcq"; empty array for "short_answer".',
              },
              correctAnswer: {
                type: Type.STRING,
                description: 'Expected answer; must match one option verbatim for mcq.',
              },
              explanation: {
                type: Type.STRING,
                description: 'Brief concept explanation for teachers and post-test feedback.',
              },
              conceptId: {
                type: Type.STRING,
                description: 'Matching conceptId from the provided concept list.',
              },
              conceptName: {
                type: Type.STRING,
                description: 'Matching conceptName from the provided concept list.',
              },
              points: {
                type: Type.INTEGER,
                description: 'Point value between 1 and 5.',
              },
            },
            required: [
              'prompt',
              'type',
              'correctAnswer',
              'explanation',
              'conceptId',
              'conceptName',
              'points',
            ],
          },
        },
      },
    });

    const rawText = (response.text ?? '[]').trim();
    const parsed = JSON.parse(rawText) as RawGeneratedQuestion[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new GeminiApiError('Gemini returned no valid draft questions.', 502);
    }

    return normalizeGeneratedDraftQuestions(parsed, params.concepts, 'gemini_ai');
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Failed to generate questions with Gemini API.';
    throw new GeminiApiError(msg, 502);
  }
}

export async function extractConceptsWithGemini(
  text: string,
  title?: string
): Promise<TopicNode[]> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Material Title: ${title || 'Classroom Notes'}\n\nContent:\n${text.slice(0, 12000)}`,
      config: {
        systemInstruction:
          'You are a university curriculum architect. Extract up to 6 structured curriculum topics and concise subtopics directly from the provided study notes.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              subtopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'summary'],
                },
              },
            },
            required: ['id', 'title', 'description', 'subtopics'],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '[]').trim()) as TopicNode[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new GeminiApiError('Gemini did not extract any structured topics.', 502);
    }
    return parsed.slice(0, 6);
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) throw err;
    throw new GeminiApiError(
      err instanceof Error ? err.message : 'Failed to extract concepts with Gemini.',
      502
    );
  }
}

export interface GeneratedStudyNotesPayload {
  title: string;
  summaryEn: string;
  summaryKn?: string;
  keyPoints: string[];
  workedExample: string;
  commonPitfalls: string[];
}

export async function generateStudyNotesWithGemini(params: {
  topic: string;
  materialText: string;
  language: LanguageCode;
}): Promise<GeneratedStudyNotesPayload> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        `Topic / Concept: ${params.topic}`,
        `Requested Bilingual Support: ${params.language === 'kn' ? 'English + Kannada (kn)' : 'English'}`,
        '',
        'Source Study Material:',
        params.materialText.slice(0, 12000),
      ].join('\n'),
      config: {
        systemInstruction:
          'Generate clear, university-level structured revision study notes strictly grounded in the source material. Include key points, a concrete worked example (e.g., SQL/schema/formula where applicable), and common exam pitfalls. If Requested Bilingual Support is Kannada, also provide an accurate natural Kannada translation in summaryKn.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summaryEn: { type: Type.STRING },
            summaryKn: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            workedExample: { type: Type.STRING },
            commonPitfalls: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'summaryEn', 'keyPoints', 'workedExample', 'commonPitfalls'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as GeneratedStudyNotesPayload;
    if (!parsed.summaryEn) {
      throw new GeminiApiError('Gemini returned incomplete study notes.', 502);
    }
    return parsed;
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) throw err;
    throw new GeminiApiError(
      err instanceof Error ? err.message : 'Failed to generate AI study notes.',
      502
    );
  }
}

export async function explainConceptWithGemini(params: {
  conceptName: string;
  materialContext: string;
  language: LanguageCode;
  studentMistake?: string;
}): Promise<{ englishExplanation: string; kannadaExplanation?: string }> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        `Concept: ${params.conceptName}`,
        params.studentMistake ? `Recent Student Mistake: ${params.studentMistake}` : '',
        `Include Kannada Translation: ${params.language === 'kn' ? 'Yes' : 'No'}`,
        '',
        'Classroom Material:',
        (params.materialContext || 'General university syllabus reference').slice(0, 8000),
      ]
        .filter(Boolean)
        .join('\n'),
      config: {
        systemInstruction:
          'You are a patient, precise university tutor. Explain the requested concept clearly in plain English grounded in the classroom material, address any student mistake, and provide 1 concrete example (under 180 words). When Include Kannada Translation is Yes, provide an accurate Kannada translation in kannadaExplanation.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishExplanation: { type: Type.STRING },
            kannadaExplanation: { type: Type.STRING },
          },
          required: ['englishExplanation'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      englishExplanation: string;
      kannadaExplanation?: string;
    };
    if (!parsed.englishExplanation) {
      throw new GeminiApiError('Gemini did not return an explanation.', 502);
    }
    return parsed;
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) throw err;
    throw new GeminiApiError(
      err instanceof Error ? err.message : 'Failed to explain concept with Gemini.',
      502
    );
  }
}

export async function answerDoubtWithGemini(params: {
  question: string;
  materialContext: string;
  materialTitle?: string;
  language: LanguageCode;
}): Promise<{ answerEn: string; answerKn?: string }> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        `Source Material (${params.materialTitle || 'Course Notes'}):`,
        (params.materialContext || '').slice(0, 9000),
        '',
        `Student Question: ${params.question}`,
        `Include Kannada Translation: ${params.language === 'kn' ? 'Yes' : 'No'}`,
      ].join('\n'),
      config: {
        systemInstruction:
          'You are the LearnSense AI Doubt Assistant. Answer ONLY using the provided course study material. If the material lacks sufficient context, state that honestly and advise asking the instructor. When Include Kannada Translation is Yes, include answerKn in natural Kannada.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answerEn: { type: Type.STRING },
            answerKn: { type: Type.STRING },
          },
          required: ['answerEn'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      answerEn: string;
      answerKn?: string;
    };
    if (!parsed.answerEn) {
      throw new GeminiApiError('Gemini returned an empty doubt answer.', 502);
    }
    return parsed;
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) throw err;
    throw new GeminiApiError(
      err instanceof Error ? err.message : 'Failed to answer student doubt with Gemini.',
      502
    );
  }
}

export async function translateTextWithGemini(
  text: string,
  targetLanguage: LanguageCode
): Promise<string> {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Translate the following educational text into ${
        targetLanguage === 'kn' ? 'natural academic Kannada (ಕನ್ನಡ)' : 'clear academic English'
      }, preserving technical database/science terms accurately:\n\n${text.slice(0, 5000)}`,
    });
    const out = (response.text ?? '').trim();
    if (!out) {
      throw new GeminiApiError('Gemini returned an empty translation.', 502);
    }
    return out;
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) throw err;
    throw new GeminiApiError(
      err instanceof Error ? err.message : 'Failed to translate text with Gemini.',
      502
    );
  }
}

export async function generateLessonPlanWithGemini(params: {
  classroomName: string;
  difficultConcepts: Array<{
    conceptName: string;
    masteryPct: number;
    correctCount: number;
    attemptedCount: number;
  }>;
}): Promise<{
  focusSummary: string;
  warmUp: string;
  reteachActivity: string;
  exitCheck: string;
}> {
  const ai = getGeminiClient();
  const summaryLines = params.difficultConcepts
    .map(
      (c) =>
        `- ${c.conceptName}: ${c.masteryPct}% class mastery (${c.correctCount}/${c.attemptedCount} correct responses)`
    )
    .join('\n');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Course / Classroom: ${params.classroomName}\nAssessment Mastery Evidence:\n${summaryLines}`,
      config: {
        systemInstruction:
          'You are an instructional coach. Based strictly on the provided assessment evidence, design a focused 30-minute next lecture/clinic plan.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusSummary: { type: Type.STRING },
            warmUp: { type: Type.STRING },
            reteachActivity: { type: Type.STRING },
            exitCheck: { type: Type.STRING },
          },
          required: ['focusSummary', 'warmUp', 'reteachActivity', 'exitCheck'],
        },
      },
    });
    const parsed = JSON.parse((response.text ?? '{}').trim()) as {
      focusSummary: string;
      warmUp: string;
      reteachActivity: string;
      exitCheck: string;
    };
    if (!parsed.focusSummary) {
      throw new GeminiApiError('Gemini returned an incomplete lesson plan.', 502);
    }
    return parsed;
  } catch (err) {
    if (err instanceof GeminiConfigError || err instanceof GeminiApiError) throw err;
    throw new GeminiApiError(
      err instanceof Error ? err.message : 'Failed to generate lesson plan with Gemini.',
      502
    );
  }
}
