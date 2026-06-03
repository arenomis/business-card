/**
 * Моки Resend (fetch) + nodemailer: проверяем, что цепочка «владелец → копия SMTP» завершается и API отвечает 200.
 * Запуск: npm test --prefix backend
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import nodemailer from 'nodemailer';

const origCreateTransport = nodemailer.createTransport.bind(nodemailer);
const origFetch = globalThis.fetch;

function installMailMocks({ smtpFail = false } = {}) {
  nodemailer.createTransport = () => ({
    sendMail: async () => {
      if (smtpFail) {
        const e = new Error('Connection timeout');
        e.code = 'ETIMEDOUT';
        throw e;
      }
      return { messageId: 'mock-mid' };
    },
  });

  globalThis.fetch = async (url, init) => {
    if (String(url).includes('api.resend.com')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    }
    return origFetch(url, init);
  };
}

function restoreMailMocks() {
  nodemailer.createTransport = origCreateTransport;
  globalThis.fetch = origFetch;
}

after(() => {
  restoreMailMocks();
});

function baseEnv() {
  process.env.RESEND_API_KEY = 're_test_mock_key_for_ci';
  process.env.RESEND_FROM = 'Test <onboarding@resend.dev>';
  process.env.OWNER_EMAIL = 'owner@example.com';
  process.env.SMTP_HOST = 'smtp.mock-relay.example';
  process.env.SMTP_USER = 'smtp-login';
  process.env.SMTP_PASS = 'smtp-secret12';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_SECURE = 'false';
  delete process.env.SMTP_FROM;
  delete process.env.RENDER;
}

describe('sendContactEmails (Resend + SMTP applicant)', () => {
  test('копия заявителю уходит через SMTP, applicantCopyFailed=false', async () => {
    installMailMocks({ smtpFail: false });
    baseEnv();

    const { sendContactEmails } = await import('../src/services/emailService.js');
    const result = await sendContactEmails({
      name: 'Иван',
      surname: 'Петров',
      email: 'guest@example.com',
      comment: '1234567890комментарий',
    });

    assert.equal(result.transport, 'resend');
    assert.equal(result.applicantCopyFailed, false);
    assert.equal(result.applicantCopyError, '');
  });

  test('при падении SMTP — успех заявки, applicantCopyFailed=true и текст для клиента', async () => {
    installMailMocks({ smtpFail: true });
    baseEnv();
    process.env.SMTP_HOST = 'smtp.gmail.com';

    const { sendContactEmails } = await import('../src/services/emailService.js');
    const result = await sendContactEmails({
      name: 'Иван',
      surname: 'Петров',
      email: 'guest@example.com',
      comment: '1234567890комментарий',
    });

    assert.equal(result.transport, 'resend');
    assert.equal(result.applicantCopyFailed, true);
    assert.match(String(result.applicantCopyError || ''), /Gmail|Brevo|smtp-relay/i);
  });
});

describe('Render + smtp.gmail.com', () => {
  test('не вызывает sendMail — сразу SKIP и applicantCopyFailed', async () => {
    let sendMailCalls = 0;
    nodemailer.createTransport = () => ({
      sendMail: async () => {
        sendMailCalls++;
        return { messageId: 'x' };
      },
    });
    globalThis.fetch = async (url, init) => {
      if (String(url).includes('api.resend.com')) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      return origFetch(url, init);
    };

    try {
      process.env.RESEND_API_KEY = 're_test_mock_key_for_ci';
      process.env.RESEND_FROM = 'Test <onboarding@resend.dev>';
      process.env.OWNER_EMAIL = 'owner@example.com';
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_USER = 'u@gmail.com';
      process.env.SMTP_PASS = '1234567890';
      process.env.SMTP_PORT = '587';
      process.env.RENDER = 'true';
      delete process.env.SMTP_ALLOW_GMAIL_ON_RENDER;

      const { sendContactEmails } = await import('../src/services/emailService.js');
      const result = await sendContactEmails({
        name: 'Иван',
        surname: 'Петров',
        email: 'guest@example.com',
        comment: '1234567890комментарий',
      });

      assert.equal(sendMailCalls, 0);
      assert.equal(result.applicantCopyFailed, true);
      assert.match(String(result.applicantCopyError || ''), /Render|Brevo|smtp-relay/i);
    } finally {
      delete process.env.RENDER;
      restoreMailMocks();
      installMailMocks({ smtpFail: false });
    }
  });
});

describe('POST /api/contact', () => {
  test('200 JSON и нет зависания при успешных моках', async () => {
    installMailMocks({ smtpFail: false });
    baseEnv();

    const { contactRouter } = await import('../src/routes/contact.js');
    const { errorHandler } = await import('../src/middleware/errorHandler.js');

    const app = express();
    app.use(express.json({ limit: '16kb' }));
    // Роутер объявлен как post('/'); при mount '/api/contact' надёжнее вешать на корень тестового app.
    app.use('/', contactRouter);
    app.use(errorHandler);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Иван',
          surname: 'Петров',
          email: 'guest@example.com',
          comment: '1234567890комментарий',
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.applicantCopyFailed, false);
      assert.match(body.message, /отправлено|доставлена/i);
    } finally {
      await new Promise((r) => server.close(r));
    }
  });
});
