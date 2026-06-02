import { Router } from 'express';
import { aiQuestionSchema } from '../validators/schemas.js';
import { askAiHelper, getAiStatusSnapshot } from '../services/aiService.js';

export const aiRouter = Router();

aiRouter.get('/status', (_req, res) => {
  res.json({
    success: true,
    ...getAiStatusSnapshot(),
  });
});

aiRouter.post('/ask', async (req, res, next) => {
  try {
    const { question } = aiQuestionSchema.parse(req.body);
    const result = await askAiHelper(question);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});
