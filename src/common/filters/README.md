# Exception Filters

Filters для централізованої обробки помилок у Mediary проекті.

## 📁 Доступні Filters

### 1. AllExceptionsFilter

Глобальний filter для обробки всіх типів виключень.

**Використання:** Автоматично застосовується глобально в `main.ts`

**Функції:**

- Ловить всі необроблені помилки
- Логує критичні помилки (5xx) та попередження (4xx)
- Повертає stack trace тільки в development режимі
- Форматує відповідь у стандартизований JSON

**Формат відповіді:**

```json
{
	"statusCode": 500,
	"timestamp": "2025-10-26T20:00:00.000Z",
	"path": "/api/endpoint",
	"method": "POST",
	"message": "Error message",
	"stack": "..." // Тільки в development
}
```

---

### 2. HttpExceptionFilter

Filter для стандартних HTTP виключень NestJS.

**Використання:** Автоматично застосовується через AllExceptionsFilter

**Функції:**

- Обробляє всі HttpException типи
- Логує всі помилки з контекстом запиту
- Форматує повідомлення помилки

**Приклад:**

```typescript
throw new BadRequestException('Invalid input data')
```

**Відповідь:**

```json
{
	"statusCode": 400,
	"timestamp": "2025-10-26T20:00:00.000Z",
	"path": "/api/users",
	"method": "POST",
	"message": "Invalid input data"
}
```

---

### 3. PrismaExceptionFilter

Спеціалізований filter для помилок Prisma ORM.

**Використання:** Автоматично застосовується глобально в `main.ts`

**Функції:**

- Перетворює Prisma помилки в user-friendly повідомлення
- Обробляє унікальні constraint violations (P2002)
- Обробляє "record not found" (P2025)
- Обробляє foreign key violations (P2003)

**Приклад коду помилок Prisma:**

| Код   | Опис               | HTTP Status     | Повідомлення                            |
| ----- | ------------------ | --------------- | --------------------------------------- |
| P2002 | Unique constraint  | 409 Conflict    | "Duplicate entry: field already exists" |
| P2025 | Record not found   | 404 Not Found   | "Record not found"                      |
| P2003 | Foreign key failed | 400 Bad Request | "Related record not found"              |
| P2014 | Required relation  | 400 Bad Request | "Required relation violation"           |

**Відповідь:**

```json
{
	"statusCode": 409,
	"message": "Duplicate entry: email already exists",
	"timestamp": "2025-10-26T20:00:00.000Z",
	"details": "...", // Тільки в development
	"code": "P2002" // Тільки в development
}
```

---

### 4. ValidationExceptionFilter

Filter для помилок валідації з class-validator.

**Використання:** Автоматично обробляє BadRequestException з валідаційними помилками

**Функції:**

- Форматує помилки валідації в масив
- Зручний для фронтенду формат

**Приклад:**

```typescript
// DTO з валідацією
class CreateUserDto {
	@IsEmail()
	email: string

	@MinLength(6)
	password: string
}
```

**Відповідь при помилках:**

```json
{
	"statusCode": 400,
	"timestamp": "2025-10-26T20:00:00.000Z",
	"message": "Validation failed",
	"errors": [
		"email must be a valid email",
		"password must be longer than or equal to 6 characters"
	]
}
```

---

## 🚀 Використання

### Глобальне використання (вже налаштовано)

В `main.ts` filters застосовані глобально:

```typescript
import { AllExceptionsFilter, PrismaExceptionFilter } from '@common/filters'

app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter())
```

### Локальне використання в контролері

```typescript
import { PrismaExceptionFilter } from '@common/filters'
import { Controller, UseFilters } from '@nestjs/common'

@Controller('media')
@UseFilters(PrismaExceptionFilter)
export class MediaController {
	// Тільки для цього контролера
}
```

### Локальне використання в методі

```typescript
import { Get, UseFilters } from '@nestjs/common'
import { HttpExceptionFilter } from '@common/filters'

@Get(':id')
@UseFilters(HttpExceptionFilter)
async findOne(@Param('id') id: string) {
  // Тільки для цього методу
}
```

---

## 📊 Приклади відповідей

### ✅ Успішна відповідь (для порівняння)

```json
{
	"id": "123",
	"title": "Movie Title",
	"year": 2024
}
```

### ❌ Помилка валідації

```json
{
	"statusCode": 400,
	"timestamp": "2025-10-26T20:00:00.000Z",
	"message": "Validation failed",
	"errors": ["title should not be empty", "year must be a number"]
}
```

### ❌ Record не знайдено

```json
{
	"statusCode": 404,
	"timestamp": "2025-10-26T20:00:00.000Z",
	"path": "/media/123",
	"method": "GET",
	"message": "Record not found"
}
```

### ❌ Duplicate entry (Prisma)

```json
{
	"statusCode": 409,
	"message": "Duplicate entry: email already exists",
	"timestamp": "2025-10-26T20:00:00.000Z"
}
```

### ❌ Internal Server Error

```json
{
	"statusCode": 500,
	"timestamp": "2025-10-26T20:00:00.000Z",
	"path": "/api/endpoint",
	"method": "POST",
	"message": "Internal server error"
}
```

---

## 🧪 Тестування

Для тестування filters:

```typescript
// В ваших e2e тестах
it('should return 404 for non-existent record', async () => {
	const response = await request(app.getHttpServer())
		.get('/media/non-existent-id')
		.expect(404)

	expect(response.body).toHaveProperty('statusCode', 404)
	expect(response.body).toHaveProperty('message', 'Record not found')
	expect(response.body).toHaveProperty('timestamp')
})
```

---

## 📝 Best Practices

1. ✅ **Завжди логуйте помилки** - filters автоматично логують
2. ✅ **Приховуйте чутливу інформацію** - stack traces тільки в dev
3. ✅ **Стандартизуйте формат** - всі відповіді мають однаковий формат
4. ✅ **Використовуйте правильні HTTP коди** - filters автоматично встановлюють
5. ✅ **Додавайте контекст** - timestamp, path, method для debugging

---

## 🔗 Посилання

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
