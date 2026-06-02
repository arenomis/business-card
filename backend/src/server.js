/**
 * Точка входа API: форма обратной связи, ассистент по резюме, health.
 * Статику Angular отдаём только если SERVE_STATIC=true (после npm run build во frontend).
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { contactRouter } from './routes/contact.js';
import { aiRouter } from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
// Локально: .env перезаписывает пустые переменные из окружения (иначе пустой RESEND_* в системе блокирует ключ из файла).
// На хостинге файла .env обычно нет — остаются только переменные из панели.
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
const serveStatic = process.env.SERVE_STATIC === 'true';

// За reverse proxy (Render, Railway, nginx) — корректный IP и rate-limit.
if (serveStatic || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// В проде Angular отдаётся с этого же Express — дефолтный CSP Helmet ломает стили/обработчики SPA.
if (serveStatic) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
} else {
  app.use(helmet());
}
// Один процесс (Angular + API): браузер и так на том же origin — отражаем Origin.
// Dev (4200 → 3000): нужен явный CORS_ORIGIN.
app.use(
  cors({
    origin: serveStatic ? true : CORS_ORIGIN,
    methods: ['GET', 'POST'],
  }),
);
app.use(express.json({ limit: '16kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Слишком много запросов. Попробуйте позже.' },
});

app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/contact', contactRouter);
app.use('/api/ai', aiRouter);

if (serveStatic) {
  const staticPath = path.resolve(__dirname, '../../frontend/dist/frontend/browser');
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
