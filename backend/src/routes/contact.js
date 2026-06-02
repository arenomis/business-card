/** POST /api/contact — заявка с лендинга, письма владельцу и копия заявителю. */
import { Router } from 'express';
import { contactSchema } from '../validators/schemas.js';
import { sendContactEmails } from '../services/emailService.js';

function buildContactMessage(result) {
  if (result.transport === 'resend' || result.transport === 'smtp') {
    if (result.applicantCopyFailed) {
      const err = result.applicantCopyError || 'ошибка SMTP';
      return `Заявка доставлена владельцу. Копия на ваш email не отправилась: ${err}. Проверьте «Спам». Владельцу сайта: с сервера часто не работает Gmail — лучше Brevo (smtp-relay.brevo.com) или свой домен в Resend.`;
    }
    return 'Сообщение отправлено. Письмо с заявкой — владельцу, копия — на указанный вами email. Проверьте «Входящие» и «Спам».';
  }
  if (result.mocked && result.transport === 'console') {
    return 'Заявка принята (режим разработки: данные только в консоли API). Для реальной доставки добавьте RESEND_API_KEY или SMTP.';
  }
  return 'Сообщение отправлено.';
}

export const contactRouter = Router();

contactRouter.post('/', async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);
    const result = await sendContactEmails(data);

    res.status(200).json({
      success: true,
      mocked: result.mocked,
      ethereal: Boolean(result.ethereal),
      transport: result.transport,
      applicantCopyFailed: Boolean(result.applicantCopyFailed),
      message: buildContactMessage(result),
    });
  } catch (err) {
    next(err);
  }
});
