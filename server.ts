import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { extractText } from 'unpdf';
import { extractDocumentOutline } from './src/utils/mastery.ts';
import {
  SarvamApiError,
  SarvamConfigError,
  extractJsonBlock,
  isSarvamConfigured,
  sarvamChat,
  sarvamTextToSpeech,
  sarvamTranslate,
} from './src/server/sarvam.ts';
import {
  GeminiApiError,
  GeminiConfigError,
  answerDoubtWithGemini,
  explainConceptWithGemini,
  extractConceptsWithGemini,
  generateDraftQuestionsWithGemini,
  generateLessonPlanWithGemini,
  generateStudyNotesWithGemini,
  isGeminiConfigured,
  translateTextWithGemini,
} from './src/server/gemini.ts';
import {
  getMoodleAdapterStatus,
  isMoodleConfigured,
  syncAuthorisedMoodleCourses,
} from './src/server/moodle.ts';
import type { TopicNode } from './src/types/learnsense.ts';

const PORT = Number(process.env.PORT || 3000);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '4mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function handleAiError(res: Response, error: unknown) {
  if (error instanceof GeminiConfigError || error instanceof SarvamConfigError) {
    return res.status(503).json({
      configured: false,
      error: error.message,
    });
  }
  if (error instanceof GeminiApiError || error instanceof SarvamApiError) {
    return res.status(error.statusCode).json({
      configured: true,
      error: error.message,
    });
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return res.status(500).json({ error: message });
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    geminiConfigured: isGeminiConfigured(),
    sarvamConfigured: isSarvamConfigured(),
    moodleConfigured: isMoodleConfigured(),
    pdfParserReady: true,
  });
});

app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({
    geminiConfigured: isGeminiConfigured(),
    sarvamConfigured: isSarvamConfigured(),
    moodleConfigured: isMoodleConfigured(),
    pdfParserReady: true,
    supportedLanguages: ['en', 'kn'],
  });
});

app.get('/api/integrations/moodle/status', async (_req: Request, res: Response) => {
  try {
    const status = await getMoodleAdapterStatus();
    return res.json(status);
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not inspect Moodle adapter status.',
    });
  }
});

app.post('/api/integrations/moodle/sync-courses', async (_req: Request, res: Response) => {
  try {
    const result = await syncAuthorisedMoodleCourses();
    return res.json(result);
  } catch (err) {
    return res.status(502).json({
      configured: isMoodleConfigured(),
      error: err instanceof Error ? err.message : 'Moodle Web Services sync failed.',
    });
  }
});

app.get('/api/schema/supabase', (_req: Request, res: Response) => {
  const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    return res.status(404).json({ error: 'Supabase schema file not found.' });
  }
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  return res.json({ sql });
});

app.get('/api/materials/file/:storedName', (req: Request, res: Response) => {
  const safeName = path.basename(req.params.storedName);
  const fullPath = path.join(UPLOADS_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Uploaded file not found.' });
  }
  res.download(fullPath, safeName);
});

app.post('/api/materials/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Please select a PDF or text file to upload.' });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.pdf', '.txt', '.md'].includes(ext)) {
      return res.status(400).json({
        error: 'Unsupported file format. Upload a .pdf, .txt, or .md study document.',
      });
    }

    const storedName = `${Date.now()}_${sanitizeFileName(file.originalname)}`;
    const destPath = path.join(UPLOADS_DIR, storedName);
    fs.writeFileSync(destPath, file.buffer);

    let extractedText = '';
    if (ext === '.pdf') {
      const pdfResult = await extractText(new Uint8Array(file.buffer), { mergePages: true });
      extractedText = Array.isArray(pdfResult.text)
        ? pdfResult.text.join('\n')
        : String(pdfResult.text || '');
    } else {
      extractedText = file.buffer.toString('utf8');
    }

    extractedText = extractedText.trim();
    if (!extractedText) {
      return res.status(422).json({
        error:
          'No readable text could be extracted from this file. Scanned image-only PDFs require OCR or pasted notes.',
      });
    }

    let topics: TopicNode[] = extractDocumentOutline(extractedText, file.originalname);
    let extractionSource: 'gemini_ai' | 'sarvam_ai' | 'local_pdf_parser' = 'local_pdf_parser';
    let aiWarning: string | undefined;

    if (req.body?.enhanceWithAi === 'true') {
      if (isGeminiConfigured()) {
        try {
          topics = await extractConceptsWithGemini(extractedText, file.originalname);
          extractionSource = 'gemini_ai';
        } catch (aiErr) {
          aiWarning =
            aiErr instanceof Error
              ? `Gemini concept enrichment skipped: ${aiErr.message}`
              : 'Gemini enrichment unavailable; used PDF structural parser.';
        }
      } else if (isSarvamConfigured()) {
        try {
          const aiRaw = await sarvamChat([
            {
              role: 'system',
              content:
                'You extract structured curriculum topics and subtopics from study notes. Return ONLY valid JSON array of objects: [{"id":"c_slug","title":"...","description":"...","subtopics":[{"id":"s_slug","title":"...","summary":"..."}]}]. Max 6 topics.',
            },
            {
              role: 'user',
              content: `Extract key concepts and subtopics from this classroom material (${file.originalname}):\n\n${extractedText.slice(0, 7000)}`,
            },
          ]);
          const parsed = extractJsonBlock<TopicNode[]>(aiRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            topics = parsed;
            extractionSource = 'sarvam_ai';
          }
        } catch (aiErr) {
          aiWarning =
            aiErr instanceof Error
              ? `Sarvam topic enrichment skipped: ${aiErr.message}`
              : 'Sarvam topic enrichment unavailable; used PDF structural parser.';
        }
      }
    }

    return res.json({
      fileName: file.originalname,
      fileUrl: `/api/materials/file/${encodeURIComponent(storedName)}`,
      extractedText: extractedText.slice(0, 80000),
      extractionSource,
      topics,
      aiWarning,
    });
  } catch (err) {
    console.error('Material upload error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to process uploaded material.',
    });
  }
});

app.post('/api/materials/parse-text', (req: Request, res: Response) => {
  const { text, title } = req.body as { text?: string; title?: string };
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Study note text is required.' });
  }
  const topics = extractDocumentOutline(text.trim(), title || 'Study Notes');
  return res.json({
    extractedText: text.trim().slice(0, 80000),
    extractionSource: 'local_pdf_parser',
    topics,
  });
});

app.post('/api/ai/extract-topics', async (req: Request, res: Response) => {
  try {
    const { text, title } = req.body as { text?: string; title?: string };
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Material text is required for concept extraction.' });
    }

    if (isGeminiConfigured()) {
      const topics = await extractConceptsWithGemini(text, title);
      return res.json({ topics, extractionSource: 'gemini_ai' });
    }

    if (isSarvamConfigured()) {
      const aiRaw = await sarvamChat([
        {
          role: 'system',
          content:
            'You are an educational curriculum analyst. Extract structured topics and subtopics from classroom study material. Return ONLY a JSON array: [{"id":"concept_slug","title":"...","description":"1-2 sentences","subtopics":[{"id":"sub_slug","title":"...","summary":"1 sentence"}]}].',
        },
        {
          role: 'user',
          content: `Material Title: ${title || 'Classroom Notes'}\n\nContent:\n${text.slice(0, 7500)}`,
        },
      ]);

      const topics = extractJsonBlock<TopicNode[]>(aiRaw);
      return res.json({ topics, extractionSource: 'sarvam_ai' });
    }

    return res.status(503).json({
      configured: false,
      error:
        'Neither GEMINI_API_KEY nor SARVAM_API_KEY is configured on the server. Configure an API key in Settings > Secrets to run AI concept extraction.',
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/notes', async (req: Request, res: Response) => {
  try {
    const { topic, materialText, language = 'en' } = req.body as {
      topic?: string;
      materialText?: string;
      language?: 'en' | 'kn';
    };

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic title is required to generate study notes.' });
    }

    if (isGeminiConfigured()) {
      const notes = await generateStudyNotesWithGemini({
        topic: topic.trim(),
        materialText: materialText || topic.trim(),
        language,
      });
      return res.json({ ...notes, provider: 'gemini_ai' });
    }

    if (isSarvamConfigured()) {
      const aiRaw = await sarvamChat([
        {
          role: 'system',
          content:
            'Return ONLY valid JSON: {"title":"...","summaryEn":"...","keyPoints":["..."],"workedExample":"...","commonPitfalls":["..."]}. Ground strictly in the provided material.',
        },
        {
          role: 'user',
          content: `Generate concise study notes on "${topic.trim()}".\nMaterial:\n${(materialText || '').slice(0, 6000)}`,
        },
      ]);
      const parsed = extractJsonBlock<{
        title: string;
        summaryEn: string;
        keyPoints: string[];
        workedExample: string;
        commonPitfalls: string[];
      }>(aiRaw);
      let summaryKn: string | undefined;
      if (language === 'kn' && parsed.summaryEn) {
        summaryKn = await sarvamTranslate(parsed.summaryEn, 'kn-IN', 'en-IN');
      }
      return res.json({ ...parsed, summaryKn, provider: 'sarvam_ai' });
    }

    return res.status(503).json({
      configured: false,
      error:
        'AI Study Notes generation requires GEMINI_API_KEY or SARVAM_API_KEY configured on the server.',
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/gemini-generate-questions', async (req: Request, res: Response) => {
  try {
    const {
      materialTitle,
      materialText,
      concepts = [],
      count = 4,
      questionStyle = 'mixed',
      difficulty = 'intermediate',
    } = req.body as {
      materialTitle?: string;
      materialText?: string;
      concepts?: Array<{ conceptId: string; conceptName: string }>;
      count?: number;
      questionStyle?: 'mixed' | 'mcq' | 'short_answer';
      difficulty?: 'foundational' | 'intermediate' | 'challenging';
    };

    if (!materialText || !materialText.trim()) {
      return res.status(400).json({
        error: 'Uploaded study material content is required to generate draft questions.',
      });
    }

    const questions = await generateDraftQuestionsWithGemini({
      materialTitle,
      materialText,
      concepts,
      count,
      questionStyle,
      difficulty,
    });

    return res.json({ questions, model: 'gemini-4-hydrogen' });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/generate-questions', async (req: Request, res: Response) => {
  try {
    const { materialText, concepts, count = 4 } = req.body as {
      materialText?: string;
      concepts?: Array<{ conceptId: string; conceptName: string }>;
      count?: number;
    };

    if (!materialText || !materialText.trim()) {
      return res.status(400).json({ error: 'Study material content is required to generate questions.' });
    }

    const conceptList = (concepts || [])
      .map((c) => `${c.conceptId}: ${c.conceptName}`)
      .join('\n');

    const aiRaw = await sarvamChat(
      [
        {
          role: 'system',
          content:
            'You create rigorous classroom assessment draft questions strictly from provided material. Map every question to one conceptId and conceptName from the provided list. Return ONLY a JSON array of objects with keys: prompt, type ("mcq" or "short_answer"), options (4 strings for mcq), correctAnswer (exact string matching one option for mcq), explanation, conceptId, conceptName, points (number).',
        },
        {
          role: 'user',
          content: `Generate ${Math.min(Math.max(Number(count) || 4, 1), 8)} draft questions.\n\nConcepts:\n${conceptList || 'General Topic'}\n\nMaterial:\n${materialText.slice(0, 7000)}`,
        },
      ],
      { maxTokens: 1600 }
    );

    const questions = extractJsonBlock<
      Array<{
        prompt: string;
        type: 'mcq' | 'short_answer';
        options?: string[];
        correctAnswer: string;
        explanation: string;
        conceptId: string;
        conceptName: string;
        points: number;
      }>
    >(aiRaw);

    return res.json({
      questions: questions.map((q, idx) => ({
        ...q,
        id: `ai_q_${Date.now()}_${idx}`,
        points: Number(q.points) > 0 ? Number(q.points) : 2,
        source: 'sarvam_ai',
        approvalStatus: 'pending_review',
      })),
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const { conceptName, materialContext, language = 'en', studentMistake } = req.body as {
      conceptName?: string;
      materialContext?: string;
      language?: 'en' | 'kn';
      studentMistake?: string;
    };

    if (!conceptName) {
      return res.status(400).json({ error: 'conceptName is required.' });
    }

    if (isSarvamConfigured()) {
      const englishExplanation = await sarvamChat([
        {
          role: 'system',
          content:
            'You are a patient, accurate tutor. Explain the concept clearly in plain English grounded strictly in the provided classroom material. Address any student misconception if provided. Keep under 180 words with 1 concrete example.',
        },
        {
          role: 'user',
          content: `Concept: ${conceptName}\n${studentMistake ? `Recent student mistake: ${studentMistake}\n` : ''}Classroom Material:\n${(materialContext || 'No material excerpt provided.').slice(0, 4500)}`,
        },
      ]);

      let kannadaExplanation: string | undefined;
      if (language === 'kn') {
        kannadaExplanation = await sarvamTranslate(englishExplanation, 'kn-IN', 'en-IN');
      }

      return res.json({
        conceptName,
        englishExplanation,
        kannadaExplanation,
      });
    }

    if (isGeminiConfigured()) {
      const result = await explainConceptWithGemini({
        conceptName,
        materialContext: materialContext || '',
        language,
        studentMistake,
      });
      return res.json({
        conceptName,
        ...result,
      });
    }

    return res.status(503).json({
      configured: false,
      error:
        'Configure GEMINI_API_KEY or SARVAM_API_KEY in server secrets to run bilingual concept explanations.',
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/doubt', async (req: Request, res: Response) => {
  try {
    const { question, materialContext, materialTitle, language = 'en' } = req.body as {
      question?: string;
      materialContext?: string;
      materialTitle?: string;
      language?: 'en' | 'kn';
    };

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Please enter a question for the Doubt Assistant.' });
    }

    if (isSarvamConfigured()) {
      const answerEn = await sarvamChat([
        {
          role: 'system',
          content:
            'You are LearnSense Doubt Assistant. Answer ONLY using the provided teacher-uploaded classroom material. If the material does not contain enough information to answer, state that clearly and suggest asking the teacher. Be concise and encouraging.',
        },
        {
          role: 'user',
          content: `Source Material (${materialTitle || 'Classroom Notes'}):\n${(materialContext || '').slice(0, 5500)}\n\nStudent Question: ${question.trim()}`,
        },
      ]);

      let answerKn: string | undefined;
      if (language === 'kn') {
        answerKn = await sarvamTranslate(answerEn, 'kn-IN', 'en-IN');
      }

      return res.json({
        answerEn,
        answerKn,
        groundedIn: materialTitle || 'Classroom Notes',
      });
    }

    if (isGeminiConfigured()) {
      const result = await answerDoubtWithGemini({
        question: question.trim(),
        materialContext: materialContext || '',
        materialTitle,
        language,
      });
      return res.json({
        ...result,
        groundedIn: materialTitle || 'Classroom Notes',
      });
    }

    return res.status(503).json({
      configured: false,
      error:
        'Configure GEMINI_API_KEY or SARVAM_API_KEY in server secrets to run the Doubt Assistant.',
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage = 'kn' } = req.body as {
      text?: string;
      targetLanguage?: 'kn' | 'en';
    };
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text to translate is required.' });
    }

    if (isSarvamConfigured()) {
      const targetCode = targetLanguage === 'kn' ? 'kn-IN' : 'en-IN';
      const sourceCode = targetLanguage === 'kn' ? 'en-IN' : 'kn-IN';
      const translatedText = await sarvamTranslate(text, targetCode, sourceCode);
      return res.json({ translatedText, targetLanguage });
    }

    if (isGeminiConfigured()) {
      const translatedText = await translateTextWithGemini(text, targetLanguage);
      return res.json({ translatedText, targetLanguage });
    }

    return res.status(503).json({
      configured: false,
      error: 'Configure GEMINI_API_KEY or SARVAM_API_KEY in server secrets to translate notes.',
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/tts', async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' } = req.body as {
      text?: string;
      language?: 'en' | 'kn';
    };
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }
    const targetCode = language === 'kn' ? 'kn-IN' : 'en-IN';
    const audioBase64 = await sarvamTextToSpeech(text, targetCode);
    return res.json({ audioBase64, mimeType: 'audio/wav' });
  } catch (error) {
    return handleAiError(res, error);
  }
});

app.post('/api/ai/lesson-plan', async (req: Request, res: Response) => {
  try {
    const { classroomName, difficultConcepts } = req.body as {
      classroomName?: string;
      difficultConcepts?: Array<{
        conceptName: string;
        masteryPct: number;
        correctCount: number;
        attemptedCount: number;
      }>;
    };

    if (!difficultConcepts || difficultConcepts.length === 0) {
      return res.status(400).json({
        error: 'At least one assessed weak concept is required to generate a lesson plan.',
      });
    }

    if (isGeminiConfigured()) {
      const plan = await generateLessonPlanWithGemini({
        classroomName: classroomName || 'Course',
        difficultConcepts,
      });
      return res.json({ plan });
    }

    if (isSarvamConfigured()) {
      const summaryLines = difficultConcepts
        .map(
          (c) =>
            `- ${c.conceptName}: ${c.masteryPct}% class mastery (${c.correctCount}/${c.attemptedCount} correct responses)`
        )
        .join('\n');

      const aiRaw = await sarvamChat([
        {
          role: 'system',
          content:
            'You are an instructional coach. Based strictly on the provided classroom assessment evidence, suggest a concise 30-minute next lesson plan. Return ONLY JSON: {"focusSummary":"...","warmUp":"...","reteachActivity":"...","exitCheck":"..."}.',
        },
        {
          role: 'user',
          content: `Classroom: ${classroomName || 'Class'}\nConcept Evidence:\n${summaryLines}`,
        },
      ]);

      const plan = extractJsonBlock<{
        focusSummary: string;
        warmUp: string;
        reteachActivity: string;
        exitCheck: string;
      }>(aiRaw);

      return res.json({ plan });
    }

    return res.status(503).json({
      configured: false,
      error: 'Configure GEMINI_API_KEY or SARVAM_API_KEY in server secrets to generate AI lesson plans.',
    });
  } catch (error) {
    return handleAiError(res, error);
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnSense AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
