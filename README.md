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

**Сайт и API вместе:** `npm run dev` · при необходимости вместо терминала IDE: **`start-dev.bat`** в корне репозитория.

- Сайт: **http://localhost:4200**
- API: **http://localhost:3000/api/health**

Отдельно: `npm run dev:api` и `npm run dev:web`. Сборка фронта: `npm run build`. Один порт (как на хостинге): после `npm run build` задайте `SERVE_STATIC=true` и выполните `npm run start:api` — сайт на **http://localhost:3000**.

Проверка API без отправки почты: `npm run test:api`.

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

---

**Алексей Сергеевич Ардашов** — ardashovaleksei@gmail.com · [@bebemonitea](https://t.me/bebemonitea) · +7 (912) 477-81-94
