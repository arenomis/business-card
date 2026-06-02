/**
 * Точка входа API: форма обратной связи, ассистент по резюме, health.
 * Статику Angular отдаём только если SERVE_STATIC=true (после npm run build во frontend).
 */
import dotenv from 'dotenv';
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
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, methods: ['GET', 'POST'] }));
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

if (process.env.SERVE_STATIC === 'true') {
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
