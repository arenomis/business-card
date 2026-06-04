/**
 * Моки Resend (fetch) + nodemailer.
 * Цепочка: письмо владельцу → копия заявителю (Resend, при ошибке — SMTP в том же запросе).
 */
import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';

const origCreateTransport = nodemailer.createTransport.bind(nodemailer);
const origFetch = globalThis.fetch;

function installMailMocks({ smtpFail = false, resendApplicantFail = false } = {}) {
  let resendN = 0;
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

  globalThis.fetch = async (url) => {
    if (String(url).includes('api.resend.com')) {
      resendN++;
      if (resendN === 1) {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      if (resendApplicantFail) {
        return {
          ok: false,
          status: 403,
          json: async () => ({ message: 'can only send testing emails to your own email address' }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    }
    return origFetch(url);
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
  delete process.env.APPLICANT_COPY_FORCE_SMTP;
}

describe('sendContactEmails (Resend + копия)', () => {
  test('копия вторым запросом Resend, без SMTP', async () => {
    installMailMocks({ resendApplicantFail: false });
    baseEnv();

    const { sendContactEmails } = await import('../src/services/emailService.js');
    const result = await sendContactEmails({
      name: 'Иван',
      surname: 'Петров',
      email: 'guest@example.com',
      comment: '1234567890комментарий',
    });

    assert.equal(result.transport, 'resend');
    assert.ok(!result.applicantCopyFailed);
  });

  test('Resend копия не прошла — fallback SMTP OK', async () => {
    installMailMocks({ resendApplicantFail: true, smtpFail: false });
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
  });

  test('Resend копия не прошла — SMTP тоже падает', async () => {
    installMailMocks({ resendApplicantFail: true, smtpFail: true });
    baseEnv();
    process.env.SMTP_HOST = 'smtp.gmail.com';

    const { sendContactEmails } = await import('../src/services/emailService.js');
    const result = await sendContactEmails({
      name: 'Иван',
      surname: 'Петров',
      email: 'guest@example.com',
      comment: '1234567890комментарий',
    });

    assert.equal(result.applicantCopyFailed, true);
    assert.match(String(result.applicantCopyError || ''), /Заявка доставлена владельцу|копия/i);
  });

  test('APPLICANT_COPY_FORCE_SMTP: один Resend, копия через SMTP', async () => {
    let resendN = 0;
    nodemailer.createTransport = () => ({
      sendMail: async () => ({ messageId: 'smtp-mid' }),
    });
    globalThis.fetch = async (url) => {
      if (String(url).includes('api.resend.com')) {
        resendN++;
        return { ok: true, status: 200, json: async () => ({}) };
      }
      return origFetch(url);
    };

    baseEnv();
    process.env.APPLICANT_COPY_FORCE_SMTP = 'true';

    const { sendContactEmails } = await import('../src/services/emailService.js');
    const result = await sendContactEmails({
      name: 'Иван',
      surname: 'Петров',
      email: 'guest@example.com',
      comment: '1234567890комментарий',
    });

    assert.equal(resendN, 1, 'второй Resend на заявителя не вызывается');
    assert.equal(result.transport, 'resend');
    assert.ok(!result.applicantCopyFailed);
  });
});

describe('Render + smtp.gmail.com', () => {
  test('вторая попытка Resend падает → SMTP skip на Render', async () => {
    let sendMailCalls = 0;
    nodemailer.createTransport = () => ({
      sendMail: async () => {
        sendMailCalls++;
        return { messageId: 'x' };
      },
    });
    let resendN = 0;
    globalThis.fetch = async (url) => {
      if (String(url).includes('api.resend.com')) {
        resendN++;
        if (resendN === 1) return { ok: true, status: 200, json: async () => ({}) };
        return {
          ok: false,
          status: 403,
          json: async () => ({ message: 'can only send testing emails to your own email address' }),
        };
      }
      return origFetch(url);
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
      assert.match(String(result.applicantCopyError || ''), /Заявка доставлена владельцу|хостинг|Gmail/i);
    } finally {
      delete process.env.RENDER;
      restoreMailMocks();
      installMailMocks({ smtpFail: false });
    }
  });
});
