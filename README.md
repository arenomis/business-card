# Визитка / лендинг — Алексей Ардашов

Репозиторий: [github.com/arenomis/business-card](https://github.com/arenomis/business-card)

Одностраничный сайт: портфолио, кейсы, форма обратной связи (два письма: вам и копия заявителю), блок вопросов по резюме.

---

## Как запустить у себя

Нужны **Node.js 20+** и **npm**. В корне репозитория:

```bash
git clone https://github.com/arenomis/business-card.git
cd business-card
npm run install:all
```

Создайте `backend/.env` из примера:

- `cp backend/.env.example backend/.env` (Windows: `Copy-Item backend/.env.example backend/.env`)
- откройте `backend/.env` и заполните почту по комментариям в файле

**Один терминал — сайт и API:**

```bash
npm run dev
```

**Если терминал в Cursor не запускает команды:** дважды щёлкните **`start-dev.bat`** в корне репозитория (откроется окно cmd) или в PowerShell:

```powershell
cd D:\jobProj\testJob
npm run dev
```

(В старом PowerShell не используйте `&&` — только `;` или две строки.)

Откройте **http://localhost:4200** · Health API: **http://localhost:3000/api/health**

Два терминала: `npm run dev:api` и `npm run dev:web`.

Сборка фронта: `npm run build`.

Проверка API (моки Resend + SMTP, без реальной почты): `npm run test:api`.

### Один порт (как на хостинге)

```bash
npm run build
# Windows: set SERVE_STATIC=true
# macOS/Linux: export SERVE_STATIC=true
npm run start:api
```

Сайт: **http://localhost:3000**

---

## Деплой на Render

1. Репозиторий: [github.com/arenomis/business-card](https://github.com/arenomis/business-card) → Render → **New Web Service** (или **Blueprint** из `render.yaml`).
2. **Build Command:** `npm run build:render`  
   **Start Command:** `npm run start:render`  
   В **Environment** обязательно: `SERVE_STATIC=true`, `CORS_ORIGIN=https://ваш-сервис.onrender.com`, `RESEND_API_KEY`, `OWNER_EMAIL`, `SMTP_*` (лучше Brevo на проде).
3. Каждый `git push` в `master` запускает автодеплой, если включён **Auto-Deploy**.

Прод-пример: **https://business-card-vedq.onrender.com**

---

## Почта (кратко)

1. **Resend + домен** — [resend.com/domains](https://resend.com/domains), затем `RESEND_FROM` с вашего домена.
2. **Resend + SMTP** — заявка через Resend, копия заявителю через `SMTP_*`. Gmail с домашнего ПК часто работает; **с IP облака (Render и т.д.) Google часто режет SMTP** — для хостинга надёжнее [Brevo](https://www.brevo.com) (`smtp-relay.brevo.com`) или свой домен в Resend и отправка копии тоже через Resend.
3. Только **SMTP** — без Resend, поля в `backend/.env.example`.
4. Отладка без отправки: `EMAIL_DEV_MOCK=true` в `backend/.env`.

Подробные переменные — в `backend/.env.example`.

**Форма / копия заявителю:** при Resend + тестовом `onboarding@resend.dev` копия уходит через **SMTP в том же запросе**, что и ответ API (с таймаутом, чтобы форма не висела бесконечно). На проде для копии стабильнее **Brevo** или **подтверждённый домен в Resend**. Для проверки ящика без смены поля в форме: **`APPLICANT_COPY_OVERRIDE_EMAIL`** в `backend/.env` (см. `.env.example`).

---

## Что сделано вручную и что с нейросетью

**Моя основная работа:** структура проекта, Angular-лендинг (вёрстка, секции, формы, состояния), Node.js API (маршруты, валидация, ошибки), интеграция почты (Resend + SMTP), сценарии и тексты на сайте, README.

**Нейросеть (Cursor / ассистент):** ускоряла типовые правки, подсказки по коду и рефакторинг, черновики формулировок, разбор ошибок сборки и почты. Архитектуру, требования к ТЗ, финальные формулировки и ответственность за результат — **автор**, не модель.

---

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | Angular 20, TypeScript, SCSS, Reactive Forms |
| Backend | Node.js, Express, Zod, Nodemailer, fetch (Resend) |

---

## Автор

**Алексей Сергеевич Ардашов**  
ardashovaleksei@gmail.com · [@bebemonitea](https://t.me/bebemonitea) · +7 (912) 477-81-94
