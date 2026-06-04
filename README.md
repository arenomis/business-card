# Визитка / лендинг — Алексей Ардашов

Репозиторий: [github.com/arenomis/business-card](https://github.com/arenomis/business-card)

Одностраничный сайт: портфолио, кейсы, форма обратной связи, блок вопросов по резюме.

---

## Запуск

Нужны **Node.js 20+** и **npm**. В корне репозитория:

```bash
git clone https://github.com/arenomis/business-card.git
cd business-card
npm run install:all
```

Создайте `backend/.env` из `backend/.env.example` и заполните переменные.

**Сайт и API вместе:** `npm run dev` в корне репозитория.

- Сайт: **http://localhost:4200**
- API: **http://localhost:3000/api/health**

Отдельно: `npm run dev:api` и `npm run dev:web`. Сборка фронта: `npm run build`. Один порт (как на хостинге): после `npm run build` задайте `SERVE_STATIC=true` и выполните `npm run start:api` — сайт на **http://localhost:3000**.

Проверка API без отправки почты: `npm run test:api`.

### Копия заявителю не приходит

1. **Brevo:** `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_USER` и `SMTP_PASS` из **SMTP & API** (в пароль — **SMTP-ключ**, не пароль от сайта Brevo). В **Senders** должен быть подтверждён адрес из поля «От» (часто совпадает с `OWNER_EMAIL`); при необходимости задайте **`SMTP_FROM`** с подтверждённого ящика.
2. Если в логах API нет строки **`[mail] applicant copy SMTP OK`**, смотрите **`[mail] applicant copy SMTP FAIL`** — в ответе формы будет короткий текст ошибки.
3. Не держите **`APPLICANT_COPY_OVERRIDE_EMAIL`**, если не тестируете: иначе копия уходит на override, а не на email из формы.
4. Чтобы **всегда** слать копию через SMTP (минуя второй вызов Resend): **`APPLICANT_COPY_FORCE_SMTP=true`** в `.env` / на Render.
5. Сообщение **«SMTP: таймаут 25000 мс»** — с хостинга не успевает установиться сессия с `smtp-relay.brevo.com`. Попробуйте **`SMTP_FORCE_IPV4=true`**, увеличьте **`SMTP_APPLICANT_COPY_TIMEOUT_MS=45000`**. С машины, где крутится API, проверьте: `openssl s_client -connect smtp-relay.brevo.com:587 -starttls smtp` (должен быстро показать приветствие сервера). Если Postfix с relay на Brevo стоит **на том же сервере**, что и Node — в приложении укажите **`SMTP_HOST=127.0.0.1`** и порт вашего Postfix (часто **25** или **587**), а не внешний Brevo.

---

## Стек

| Часть    | Технологии                                      |
| -------- | ----------------------------------------------- |
| Frontend | Angular 20, TypeScript, SCSS, Reactive Forms   |
| Backend  | Node.js, Express, Zod, Nodemailer, fetch (Resend) |

---

## Роль ИИ

**Автор:** структура проекта, Angular-лендинг, Node.js API, интеграции, тексты, требования, финальные формулировки и ответственность за результат.

**Нейросеть (Cursor и т.п.):** ускорение типовых правок, подсказки по коду, рефакторинг, черновики формулировок, разбор ошибок сборки.

**Ассистент на странице:** **Groq** (ключ `AI_GROQ_API_KEY` в `backend/.env` или `backend/.env.local`) → при недоступности **Ollama** → шаблон. См. `backend/.env.example`.

---

**Алексей Сергеевич Ардашов** — ardashovaleksei@gmail.com · [@bebemonitea](https://t.me/bebemonitea) · +7 (912) 477-81-94
