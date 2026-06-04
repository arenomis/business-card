import { buildResumePitchAnswer } from './resumePitchAi.js';

function trimEnv(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function getOllamaConfig() {
  const baseUrl = trimEnv(process.env.OLLAMA_BASE_URL) || 'http://localhost:11434';
  const model = trimEnv(process.env.OLLAMA_MODEL) || 'llama3.2:3b';
  let enabled = trimEnv(process.env.AI_USE_OLLAMA) !== 'false';
  const onRender = trimEnv(process.env.RENDER) === 'true';
  const localOllama = /localhost|127\.0\.0\.1/i.test(baseUrl);
  if (onRender && localOllama) {
    enabled = false;
  }
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

async function askGroq(question) {
  if (trimEnv(process.env.AI_USE_GROQ) === 'false') return null;

  const apiKey = trimEnv(process.env.AI_GROQ_API_KEY) || trimEnv(process.env.GROQ_API_KEY);
  if (!apiKey) return null;

  const prompt = buildPrompt(question);
  const base = (trimEnv(process.env.AI_GROQ_BASE_URL) || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  const model = trimEnv(process.env.AI_GROQ_MODEL) || 'llama-3.1-8b-instant';
  const ms = Number(process.env.AI_GROQ_TIMEOUT_MS) || 22_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 768,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Groq HTTP ${res.status} ${errBody.slice(0, 200)}`);
    }
    const data = await res.json().catch(() => ({}));
    const answer = normalizeAiAnswer(data?.choices?.[0]?.message?.content);
    if (!answer) {
      throw new Error('Groq вернул пустой ответ');
    }
    return { answer, model, provider: 'groq' };
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`Groq: нет ответа за ${ms} мс`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function askOllama(question) {
  const { enabled, baseUrl, model } = getOllamaConfig();
  if (!enabled) return null;

  const ms = Number(process.env.AI_OLLAMA_TIMEOUT_MS) || 8_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  let response;
  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(question),
        stream: false,
        options: { temperature: 0.3 },
      }),
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`Ollama: нет ответа за ${ms} мс`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const payload = await response.json();
  const answer = normalizeAiAnswer(payload?.response);
  if (!answer) {
    throw new Error('Ollama вернул пустой ответ');
  }

  return { answer, model, provider: 'ollama' };
}

export function getAiStatusSnapshot() {
  const { enabled, model } = getOllamaConfig();
  const groqKey = Boolean(trimEnv(process.env.AI_GROQ_API_KEY) || trimEnv(process.env.GROQ_API_KEY));
  const chain = [groqKey && 'groq', enabled && 'ollama', 'шаблон'].filter(Boolean).join(' → ');
  return {
    assistantReady: true,
    llmConfigured: true,
    llmProvider: chain,
    model: groqKey
      ? trimEnv(process.env.AI_GROQ_MODEL) || 'llama-3.1-8b-instant'
      : enabled
        ? model
        : 'resume-assistant',
    openaiConfigured: false,
  };
}

export async function askAiHelper(question) {
  try {
    const r = await askGroq(question);
    if (r) return r;
  } catch (err) {
    console.warn('[AI] Groq:', err.message);
  }

  try {
    const r = await askOllama(question);
    if (r) return r;
  } catch (err) {
    console.warn('[AI] Ollama:', err.message);
  }

  return {
    answer: buildResumePitchAnswer(question),
    model: 'resume-assistant',
    provider: 'resume-assistant',
  };
}
