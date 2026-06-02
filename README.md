# Визитка / лендинг — Алексей Ардашов

Репозиторий: [github.com/arenomis/business-card](https://github.com/arenomis/business-card)

Одностраничный сайт: портфолио, кейсы, форма обратной связи (два письма: вам и копия заявителю), блок вопросов по резюме.

---

## Как запустить у себя (для проверки ТЗ)

Нужны **Node.js 20+** и **npm**. В корне репозитория:

```bash
git clone https://github.com/arenomis/business-card.git
cd business-card
npm run install:all
```

Создайте файл настроек API (секреты в репозиторий не попадают — `backend/.env` в `.gitignore`):

- скопируйте `backend/.env.example` → `backend/.env`  
  (в PowerShell: `Copy-Item backend/.env.example backend/.env`; в bash: `cp backend/.env.example backend/.env`)

Откройте `backend\.env` и заполните почту (см. раздел «Почта» ниже). Без ключей форма вернёт понятную ошибку.

**Один терминал — сразу сайт и API** (прокси Angular сам подставляет `/api` на порт 3000):

```bash
npm run dev
```

Откройте в браузере: **http://localhost:4200**  
Health API: **http://localhost:3000/api/health**

Если удобнее два окна терминала:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

Сборка только фронта: `npm run build`.

### Собрать всё в один процесс (для демо без второго порта фронта)

```bash
npm run build
set SERVE_STATIC=true
npm run start:api
```

Тогда откройте **http://localhost:3000** (раздаётся уже собранный Angular из `frontend/dist`).

---

## Почта (кратко)

1. **Resend + свой домен** — оба письма через Resend: [resend.com/domains](https://resend.com/domains), затем `RESEND_FROM` с вашего домена.
2. **Resend + SMTP** — заявка через Resend на `OWNER_EMAIL`, копия заявителю через `SMTP_*` (Gmail с паролем приложения или [Brevo](https://www.brevo.com) `smtp-relay.brevo.com`).
3. Только **SMTP** — заполните `SMTP_*` и `OWNER_EMAIL`, без `RESEND_API_KEY`.
4. Локально без отправки: `EMAIL_DEV_MOCK=true` в `backend/.env`.

Подробные переменные — в `backend/.env.example`.

---

## Что сделано вручную и что с нейросетью

**Моя основная работа:** структура проекта, Angular-лендинг (вёрстка, секции, формы, состояния), Node.js API (маршруты, валидация, ошибки), интеграция почты (Resend + SMTP, сценарии копии), сценарии и тексты на сайте, README и настройка под проверку.

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
