# Mediary Server

> Backend API для медіа-трекера Mediary - платформа для відстеження фільмів, серіалів, книг та аніме

## 📋 Опис

Mediary Server - це backend додаток побудований на NestJS, який надає RESTful API для управління медіа контентом, користувацькими бібліотеками та адміністративними функціями.

### Основні можливості:

- 🔐 Аутентифікація (Credentials + OAuth Google)
- 👥 Управління користувачами та профілями
- 🎬 CRUD операції з медіа контентом
- 📚 Персональні бібліотеки користувачів
- ⭐ Система улюблених та рейтингів
- 🔍 Глобальний пошук через TMDB та Google Books API
- 📝 Запити на додавання нового контенту
- 👨‍💼 Адміністративна панель
- 📧 Email сповіщення
- 🖼️ Завантаження зображень (Cloudinary)

## 🏗️ Архітектура

Проект використовує **модульну архітектуру** з чітким розділенням відповідальностей:

```
src/
├── api/              # Публічний API
├── admin/            # Адмін панель
├── core/             # Бізнес-логіка
├── common/           # Утиліти
├── config/           # Конфігурація
├── database/         # Prisma ORM
├── infrastructure/   # Mail, Storage
└── shared/           # Типи та константи
```

📖 **Детальна документація:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🚀 Швидкий старт

### Вимоги

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9

### Встановлення

```bash
# Клонувати репозиторій
git clone <repository-url>
cd Mediary-server

# Встановити залежності
npm install

# Налаштувати змінні середовища
cp .env.example .env
# Відредагуйте .env файл

# Запустити міграції
npx prisma migrate dev

# Seed бази даних
npm run seed
```

### Запуск

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Сервер запуститься на `http://localhost:4000`

## 🔧 Змінні середовища

Створіть файл `.env` в корені проекту:

```env
# Database
POSTGRES_URI=postgresql://user:password@localhost:5432/mediary

# Redis
REDIS_URI=redis://localhost:6379

# Session
SESSION_SECRET=your-session-secret

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# External APIs
TMDB_API_KEY=your-tmdb-api-key
GOOGLE_BOOKS_API_KEY=your-google-books-api-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ReCaptcha
GOOGLE_RECAPTCHA_SECRET_KEY=your-recaptcha-secret

# URLs
FRONTEND_URL=http://localhost:3000
APPLICATION_URL=http://localhost:4000
COOKIE_DOMAIN=localhost

# Node
NODE_ENV=development
```

## 📚 Основні технології

- **Framework:** NestJS 11
- **ORM:** Prisma 5
- **Database:** PostgreSQL
- **Cache:** Redis
- **Auth:** Argon2, express-session
- **Email:** Resend + React Email
- **File Upload:** Cloudinary
- **Validation:** class-validator, class-transformer
- **Security:** Google ReCaptcha

## 📡 API Endpoints

### Auth

- `POST /auth/register` - Реєстрація
- `POST /auth/login` - Вхід
- `POST /auth/logout` - Вихід
- `GET /auth/session/validate` - Перевірка сесії

### Users

- `GET /users/profile` - Профіль користувача
- `PATCH /users/profile` - Оновлення профілю

### Media

- `GET /media` - Список медіа
- `GET /media/:id` - Деталі медіа
- `POST /media` - Створити медіа
- `PATCH /media/:id` - Оновити медіа
- `DELETE /media/:id` - Видалити медіа

### Library

- `GET /library` - Бібліотека користувача
- `POST /library` - Додати до бібліотеки
- `PATCH /library/:id` - Оновити статус
- `DELETE /library/:id` - Видалити

### Search

- `GET /search` - Глобальний пошук

### Admin

- `POST /admin/auth/login` - Вхід адміна
- `GET /admin/dashboard` - Дашборд

**Повний список endpoints:** Дивіться [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🗄️ База даних

### Prisma Commands

```bash
# Створити міграцію
npx prisma migrate dev --name migration_name

# Застосувати міграції
npx prisma migrate deploy

# Seed
npm run seed

# Prisma Studio
npx prisma studio

# Згенерувати клієнт
npx prisma generate
```

### Головні моделі

- `User` - Користувачі
- `Media` - Медіа контент
- `UserLibrary` - Бібліотека
- `Category` - Категорії
- `UserFavorite` - Улюблене
- `MediaRequest` - Запити на додавання
- `Review` - Відгуки

## 🧪 Тестування

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Скрипти

```bash
npm run start          # Запустити сервер
npm run start:dev      # Dev режим з watch
npm run start:prod     # Production режим
npm run build          # Build проекту
npm run lint           # Запустити linter
npm run format         # Форматувати код
npm run seed           # Seed бази даних
npm run create-admin   # Створити тестового адміна
```

## 🔐 Безпека

- Паролі хешуються через Argon2
- Session-based аутентифікація через Redis
- Rate limiting для API endpoints
- CORS налаштування
- Helmet для HTTP headers
- Google ReCaptcha для форм
- Input validation через class-validator

## 📂 TypeScript Path Aliases

Проект використовує path aliases для зручності імпортів:

```typescript
import { UserService } from '@api/modules/users/user.service'
import { normalizeTitle } from '@common/utils'
import { PrismaService } from '@database/prisma'
import { MailService } from '@infrastructure/mail'
```

## 🤝 Contributing

1. Fork проект
2. Створіть feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit зміни (`git commit -m 'Add some AmazingFeature'`)
4. Push до branch (`git push origin feature/AmazingFeature`)
5. Відкрийте Pull Request

## 📝 Конвенції коду

- Використовуйте TypeScript strict mode
- Дотримуйтесь ESLint правил
- Пишіть чисті, зрозумілі імена
- Додавайте JSDoc коментарі для публічних методів
- Тестуйте новий функціонал

## 📄 Ліцензія

UNLICENSED - Приватний проект

## 🔗 Корисні посилання

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TMDB API](https://developers.themoviedb.org)
- [Google Books API](https://developers.google.com/books)

## 👨‍💻 Автор

Mediary Team

---

**Зроблено з ❤️ використовуючи NestJS**
