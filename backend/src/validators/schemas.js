import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя слишком длинное'),
  surname: z
    .string()
    .trim()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .max(100, 'Фамилия слишком длинная'),
  email: z
    .string()
    .trim()
    .email('Укажите корректный email')
    .max(254, 'Email слишком длинный'),
  comment: z
    .string()
    .trim()
    .min(10, 'Комментарий должен содержать минимум 10 символов')
    .max(2000, 'Комментарий слишком длинный'),
});

export const aiQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(5, 'Вопрос слишком короткий')
    .max(500, 'Вопрос слишком длинный'),
});
