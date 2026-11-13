const SARVAM_BASE_URL = 'https://api.sarvam.ai';

export class SarvamConfigError extends Error {
  statusCode = 503;
  configured = false;
  constructor(message: string) {
    super(message);
    this.name = 'SarvamConfigError';
  }
}

export class SarvamApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'SarvamApiError';
    this.statusCode = statusCode;
  }
}

export function getSarvamApiKey(): string | null {
  const key = process.env.SARVAM_API_KEY?.trim();
  if (!key || key === 'MY_SARVAM_API_KEY') {
    return null;
  }
  return key;
}

export function isSarvamConfigured(): boolean {
  return getSarvamApiKey() !== null;
}

function requireSarvamKey(): string {
  const key = getSarvamApiKey();
  if (!key) {
    throw new SarvamConfigError(
      'SARVAM_API_KEY is not configured on the server. Add SARVAM_API_KEY in the Secrets panel to enable Sarvam AI generation, translation, and speech.'
    );
  }
  return key;
}

export interface SarvamChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function sarvamChat(
  messages: SarvamChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = requireSarvamKey();

  const response = await fetch(`${SARVAM_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      model: 'sarvam-m',
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1200,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new SarvamApiError(
      `Sarvam Chat API returned ${response.status}: ${errText || response.statusText}`,
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new SarvamApiError('Sarvam Chat API returned an empty response.', 502);
  }
  return content;
}

export async function sarvamTranslate(
  input: string,
  targetLanguageCode: 'kn-IN' | 'en-IN',
  sourceLanguageCode: 'en-IN' | 'kn-IN' = 'en-IN'
): Promise<string> {
  const apiKey = requireSarvamKey();

  const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      input: input.slice(0, 1800),
      source_language_code: sourceLanguageCode,
      target_language_code: targetLanguageCode,
      model: 'mayura:v1',
      mode: 'formal',
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new SarvamApiError(
      `Sarvam Translate API returned ${response.status}: ${errText || response.statusText}`,
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
  }

  const data = (await response.json()) as { translated_text?: string };
  if (!data.translated_text) {
    throw new SarvamApiError('Sarvam Translate API returned no translated text.', 502);
  }
  return data.translated_text;
}

export async function sarvamTextToSpeech(
  text: string,
  targetLanguageCode: 'kn-IN' | 'en-IN'
): Promise<string> {
  const apiKey = requireSarvamKey();

  const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      inputs: [text.slice(0, 480)],
      target_language_code: targetLanguageCode,
      speaker: 'anushka',
      model: 'bulbul:v2',
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new SarvamApiError(
      `Sarvam TTS API returned ${response.status}: ${errText || response.statusText}`,
      response.status >= 400 && response.status < 500 ? response.status : 502
    );
  }

  const data = (await response.json()) as { audios?: string[] };
  const audioBase64 = data.audios?.[0];
  if (!audioBase64) {
    throw new SarvamApiError('Sarvam TTS API returned no audio data.', 502);
  }
  return audioBase64;
}

export function extractJsonBlock<T>(rawText: string): T {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : rawText.trim();
  const firstBrace = candidate.search(/[\[{]/);
  const lastBrace = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
  const jsonSlice =
    firstBrace >= 0 && lastBrace > firstBrace
      ? candidate.slice(firstBrace, lastBrace + 1)
      : candidate;
  return JSON.parse(jsonSlice) as T;
}
