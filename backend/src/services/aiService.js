import { buildResumePitchAnswer } from './resumePitchAi.js';

function trimEnv(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function getOllamaConfig() {
  const enabled = trimEnv(process.env.AI_USE_OLLAMA) !== 'false';
  const baseUrl = trimEnv(process.env.OLLAMA_BASE_URL) || 'http://localhost:11434';
  const model = trimEnv(process.env.OLLAMA_MODEL) || 'llama3.2:3b';
  return { enabled, baseUrl, model };
}

function buildPrompt(question) {
  return [
    'Ты AI-ассистент по резюме Алексея Ардашова.',
    'Правила:',
    '- Отвечай только по теме резюме и вакансии.',
    '- Если вопрос не по теме работы, мягко верни пользователя к теме резюме.',
    '- Не обсуждай политику, развлечения и посторонние темы.',
    '- Пиши кратко и по делу на русском языке.',
    '- Учитывай конкретику вопроса и подстраивай ответ под него.',
    '- Завершай ответ уверенной рекомендацией пригласить кандидата на следующий этап.',
    '- Если есть расхождения с вакансией, акцентируй переносимые навыки и скорость адаптации.',
    '',
    'Опорные данные резюме:',
    '- Fullstack: Angular + .NET',
    '- Опыт: 3+ года в корпоративном продукте ММК (20k+ пользователей)',
    '- Миграции: Angular 11 -> 20, ASP.NET 4.7 -> .NET 8',
    '- Кейсы: оптимизация UX и производительности, mobile-first модуль ремонта техники, REST, SQL',
    '- Контакты: ardashovaleksei@gmail.com, Telegram @bebemonitea',
    '',
    `Вопрос пользователя: ${question}`,
    '',
    'Сформируй ответ в 3-6 предложениях.',
  ].join('\n');
}

function normalizeAiAnswer(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function askPollinations(question) {
  if (trimEnv(process.env.AI_USE_POLLINATIONS) === 'false') return null;

  const prompt = buildPrompt(question);
  const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Pollinations HTTP ${response.status}`);
  }
  const rawText = await response.text();
  const answer = normalizeAiAnswer(rawText);
  if (!answer) {
    throw new Error('Pollinations вернул пустой ответ');
  }
  return {
    answer,
    model: 'pollinations-text',
    provider: 'pollinations',
  };
}

async function askOllama(question) {
  const { enabled, baseUrl, model } = getOllamaConfig();
  if (!enabled) return null;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(question),
      stream: false,
      options: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const payload = await response.json();
  const answer = normalizeAiAnswer(payload?.response);
  if (!answer) {
    throw new Error('Ollama вернул пустой ответ');
  }

  return {
    answer,
    model,
    provider: 'ollama',
  };
}

/**
 * Статус для фронта: приоритетно Ollama (бесплатно и локально), fallback — локальный rule-based ассистент.
 */
export function getAiStatusSnapshot() {
  const { enabled, model } = getOllamaConfig();
  const pollinationsEnabled = trimEnv(process.env.AI_USE_POLLINATIONS) !== 'false';
  return {
    assistantReady: true,
    llmConfigured: true,
    llmProvider: pollinationsEnabled
      ? 'pollinations+ollama+fallback'
      : enabled
      ? 'ollama+fallback'
      : 'resume-assistant',
    model: pollinationsEnabled ? 'pollinations-text' : enabled ? model : 'resume-assistant',
    openaiConfigured: false,
  };
}

/**
 * Ответ по резюме через доступные AI-провайдеры с fallback.
 */
export async function askAiHelper(question) {
  try {
    const llmResult = await askPollinations(question);
    if (llmResult) return llmResult;
  } catch (err) {
    console.warn('[AI] Pollinations fallback:', err.message);
  }

  try {
    const llmResult = await askOllama(question);
    if (llmResult) return llmResult;
  } catch (err) {
    console.warn('[AI] Ollama fallback:', err.message);
  }

  const answer = buildResumePitchAnswer(question);
  return {
    answer,
    model: 'resume-assistant',
    provider: 'resume-assistant',
  };
}
