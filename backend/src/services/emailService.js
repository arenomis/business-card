/**
 * Отправка писем по заявке с формы.
 * Цепочка: Resend (заявка владельцу) → при необходимости SMTP (копия на любой ящик) или только SMTP.
 */
import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler.js';

function trimEnv(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function buildOwnerHtml({ name, surname, email, comment }) {
  return `
    <h2>Новая заявка с лендинга</h2>
    <p><strong>Имя:</strong> ${escapeHtml(name)}</p>
    <p><strong>Фамилия:</strong> ${escapeHtml(surname)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Комментарий:</strong></p>
    <p>${escapeHtml(comment).replace(/\n/g, '<br>')}</p>
    <hr>
    <p style="color:#666;font-size:12px">Отправлено с developer-landing</p>
  `;
}

function buildUserCopyHtml({ name, comment }) {
  return `
    <h2>Спасибо за обращение, ${escapeHtml(name)}!</h2>
    <p>Мы получили ваше сообщение и свяжемся с вами в ближайшее время.</p>
    <p><strong>Ваш комментарий:</strong></p>
    <blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#444">
      ${escapeHtml(comment).replace(/\n/g, '<br>')}
    </blockquote>
    <p style="margin-top:1.25rem"><strong>Коротко о кандидате:</strong> Алексей — fullstack Angular+.NET, 3+ года в корпоративном продукте ММК (миграции, performance и UX, mobile). Рекомендую зафиксировать слот на собеседование: <a href="mailto:ardashovaleksei@gmail.com">ardashovaleksei@gmail.com</a>, Telegram <a href="https://t.me/bebemonitea">@bebemonitea</a>.</p>
    <p>С уважением,<br>Алексей Ардашов<br>Fullstack-разработчик</p>
  `;
}

function isResendTestingRecipientError(message) {
  return /only send testing emails|verify a domain/i.test(String(message || ''));
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSmtpConfigured() {
  const host = trimEnv(process.env.SMTP_HOST);
  const user = trimEnv(process.env.SMTP_USER);
  const pass = trimEnv(process.env.SMTP_PASS);
  return Boolean(
    host &&
      user &&
      pass.length >= 8 &&
      user !== 'your-email@gmail.com' &&
      pass !== 'your-app-password'
  );
}

function createTransporter() {
  const host = trimEnv(process.env.SMTP_HOST);
  const user = trimEnv(process.env.SMTP_USER);
  const pass = trimEnv(process.env.SMTP_PASS);
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: trimEnv(process.env.SMTP_SECURE) === 'true',
    requireTLS: trimEnv(process.env.SMTP_SECURE) !== 'true',
    auth: { user, pass },
    tls: { rejectUnauthorized: true },
  });
}

/** Копия заявителю через SMTP (любой получатель), пока Resend на тестовом from. */
async function sendApplicantCopyOnlyViaSmtp(data) {
  const transporter = createTransporter();
  if (!transporter) {
    throw new AppError(
      'Чтобы копия уходила на любой email без домена в Resend, добавьте SMTP (рекомендуется Brevo: smtp-relay.brevo.com + SMTP-ключ в SMTP_USER/SMTP_PASS). Либо подтвердите домен: https://resend.com/domains',
      503
    );
  }

  const ownerEmail = trimEnv(process.env.OWNER_EMAIL) || trimEnv(process.env.SMTP_USER);
  const ownerName = trimEnv(process.env.OWNER_NAME) || 'Site Owner';
  const smtpUser = trimEnv(process.env.SMTP_USER);
  const fromRaw = trimEnv(process.env.SMTP_FROM);
  const fromAddress = fromRaw || `"${ownerName}" <${smtpUser}>`;

  try {
    await transporter.verify();
  } catch (err) {
    throw new AppError(
      `SMTP (копия заявителю): ${err.message}. Настройте Brevo SMTP или подтвердите домен в Resend.`,
      503
    );
  }

  await transporter.sendMail({
    from: fromAddress,
    to: data.email,
    subject: 'Ваше сообщение получено — Алексей Ардашов',
    html: buildUserCopyHtml(data),
    replyTo: ownerEmail,
  });
}

/** Отправка через Resend — один API-ключ, без SMTP-пароля почты (удобно для Gmail). */
async function sendViaResend(data) {
  const apiKey = trimEnv(process.env.RESEND_API_KEY);
  if (!apiKey) return null;

  const from =
    trimEnv(process.env.RESEND_FROM) || 'Developer Landing <onboarding@resend.dev>';
  const ownerEmail = trimEnv(process.env.OWNER_EMAIL) || trimEnv(process.env.SMTP_USER);
  if (!ownerEmail) {
    throw new AppError('Укажите OWNER_EMAIL в backend/.env для Resend.', 503);
  }

  const sendOne = async (to, subject, html, replyTo) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo
          ? {
              reply_to:
                typeof replyTo === 'string' ? [replyTo] : Array.isArray(replyTo) ? replyTo : [String(replyTo)],
            }
          : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || body.name || `Resend HTTP ${res.status}`);
    }
    return body;
  };

  await sendOne(
    ownerEmail,
    `[Лендинг] Новая заявка от ${data.name}`,
    buildOwnerHtml(data),
    data.email
  );

  const applicant = trimEnv(data.email).toLowerCase();
  if (applicant === ownerEmail.toLowerCase()) {
    await sendOne(
      data.email,
      'Ваше сообщение получено — Алексей Ардашов',
      buildUserCopyHtml(data),
      ownerEmail
    );
    return { mocked: false, transport: 'resend' };
  }

  // Копию заявителю надёжнее слать через SMTP (Gmail/Brevo): Resend с тестового from не шлёт на чужие ящики.
  if (isSmtpConfigured()) {
    await sendApplicantCopyOnlyViaSmtp(data);
    return { mocked: false, transport: 'resend' };
  }

  try {
    await sendOne(
      data.email,
      'Ваше сообщение получено — Алексей Ардашов',
      buildUserCopyHtml(data),
      ownerEmail
    );
  } catch (err) {
    if (isResendTestingRecipientError(err.message) && isSmtpConfigured()) {
      await sendApplicantCopyOnlyViaSmtp(data);
      return { mocked: false, transport: 'resend' };
    }
    if (isResendTestingRecipientError(err.message)) {
      throw new AppError(
        'Resend в тестовом режиме не шлёт на чужие адреса. Выберите один вариант: 1) подтвердите домен https://resend.com/domains и укажите RESEND_FROM с этого домена; 2) добавьте SMTP от Brevo (smtp-relay.brevo.com) в .env — тогда копия заявителю уйдёт автоматически через SMTP.',
        503
      );
    }
    throw err;
  }

  return { mocked: false, transport: 'resend' };
}

async function sendViaSmtp(data) {
  const transporter = createTransporter();
  if (!transporter) {
    throw new AppError('SMTP не сконфигурирован', 503);
  }

  const ownerEmail = trimEnv(process.env.OWNER_EMAIL) || trimEnv(process.env.SMTP_USER);
  const ownerName = trimEnv(process.env.OWNER_NAME) || 'Site Owner';
  const smtpUser = trimEnv(process.env.SMTP_USER);
  const fromRaw = trimEnv(process.env.SMTP_FROM);
  const fromAddress = fromRaw || `"${ownerName}" <${smtpUser}>`;

  try {
    await transporter.verify();
  } catch (err) {
    console.error('SMTP verify failed:', err.message);
    throw new AppError(
      `SMTP: не удалось подключиться (${err.message}). Проверьте логин/пароль и хост (например Brevo: smtp-relay.brevo.com) или используйте Resend (RESEND_API_KEY).`,
      503
    );
  }

  const ownerMail = {
    from: fromAddress,
    to: ownerEmail,
    subject: `[Лендинг] Новая заявка от ${data.name}`,
    html: buildOwnerHtml(data),
    replyTo: data.email,
  };

  const userMail = {
    from: fromAddress,
    to: data.email,
    subject: 'Ваше сообщение получено — Алексей Ардашов',
    html: buildUserCopyHtml(data),
  };

  await Promise.all([transporter.sendMail(ownerMail), transporter.sendMail(userMail)]);

  return { mocked: false, transport: 'smtp' };
}

async function sendDevMockConsole(data) {
  const ownerEmail = trimEnv(process.env.OWNER_EMAIL) || 'owner@localhost';
  console.log('\n--- [EMAIL_DEV_MOCK] только консоль ---');
  console.log(`Владелец: ${ownerEmail} | Копия: ${data.email}`);
  console.log(JSON.stringify(data, null, 2));
  return { mocked: true, transport: 'console' };
}

/**
 * Доставка: 1) Resend (API-ключ), 2) SMTP, 3) консоль при EMAIL_DEV_MOCK=true.
 */
export async function sendContactEmails(data) {
  if (trimEnv(process.env.RESEND_API_KEY)) {
    try {
      return await sendViaResend(data);
    } catch (e) {
      console.warn('[Resend]', e.message);
      if (e instanceof AppError) {
        throw e;
      }
      throw new AppError(
        `Resend: ${e.message}. Проверьте RESEND_API_KEY и RESEND_FROM. Для произвольных получателей: https://resend.com/domains или добавьте SMTP (Brevo) для копии заявителю.`,
        503
      );
    }
  }

  if (isSmtpConfigured()) {
    return sendViaSmtp(data);
  }

  if (trimEnv(process.env.EMAIL_DEV_MOCK) === 'true') {
    return sendDevMockConsole(data);
  }

  throw new AppError(
    'Почта не настроена: добавьте RESEND_API_KEY в backend/.env (рекомендуется) или укажите SMTP_HOST, SMTP_USER и SMTP_PASS. Для отладки: EMAIL_DEV_MOCK=true.',
    503
  );
}
