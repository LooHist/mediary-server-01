# Налаштування системи зображень для Mediary

## Огляд

Система зображень підтримує:

- **Проксування зображень з TMDB** з кешуванням в Redis
- **Локальне збереження** популярних зображень
- **Cloudinary** для користувацьких зображень
- **Автоматичне очищення** старих зображень

## Змінні середовища

Додайте ці змінні до вашого `.env` файлу:

```env
# TMDB API
TMDB_API_KEY="your_tmdb_api_key_here"

# Redis для кешування
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# Додаток
ALLOWED_ORIGIN="http://localhost:3000"

# Cloudinary (опціонально)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## Отримання TMDB API ключа

1. Зареєструйтеся на [The Movie Database](https://www.themoviedb.org/)
2. Перейдіть в налаштування API: https://www.themoviedb.org/settings/api
3. Запросіть API ключ (безкоштовно)
4. Скопіюйте ключ в `.env` файл

## Cloudinary (безкоштовні 25GB)

1. Зареєструйтеся на [Cloudinary](https://cloudinary.com/)
2. В Dashboard знайдіть:
    - Cloud name
    - API Key
    - API Secret
3. Додайте їх до `.env`

## API Endpoints

### Глобальний пошук

```
GET /api/search?q=avengers&categories=movie,tv&page=1&limit=20
```

### Проксування зображень

```
GET /api/image/proxy?url=https://image.tmdb.org/t/p/w342/poster.jpg&w=200&h=300
```

### TMDB постери

```
GET /api/image/tmdb-poster?path=/poster.jpg&size=w342
```

### Додавання в бібліотеку

```
POST /api/search/add-to-library
{
  "externalId": 299536,
  "mediaType": "movie",
  "status": "watched",
  "rating": 8
}
```

## Варіанти зберігання зображень

### 1. Проксування + Redis кеш (Рекомендується)

- ✅ Безкоштовно
- ✅ Швидке завантаження
- ✅ Автоматичне кешування
- ❌ Залежність від зовнішніх джерел

### 2. Cloudinary

- ✅ 25GB безкоштовно
- ✅ Автоматична оптимізація
- ✅ Глобальний CDN
- ❌ Ліміти трафіку

### 3. Локальне зберігання + nginx

- ✅ Повний контроль
- ✅ Необмежений трафік
- ❌ Потребує налаштування nginx
- ❌ Займає місце на диску

## Приклад використання

```typescript
// Пошук фільмів
const results = await fetch('/api/search?q=Matrix&categories=movie')

// Отримання URL постера
const posterUrl = await fetch(
	'/api/image/tmdb-poster?path=/poster.jpg&size=w342'
)

// Додавання в бібліотеку
await fetch('/api/search/add-to-library', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		externalId: 603,
		mediaType: 'movie',
		status: 'watched',
		rating: 9
	})
})
```

## Очищення кешу

Запустіть очищення старих зображень (старших за 30 днів):

```
POST /api/image/cleanup?days=30
```

## Налаштування nginx (опціонально)

Для віддачі статичних файлів:

```nginx
location /uploads/ {
    alias /path/to/your/app/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Моніторинг

- Redis кеш: ключі з префіксом `image:*`
- Локальні файли: `uploads/images/`
- Статистика доступу зберігається в Redis

## Troubleshooting

### TMDB API не працює

- Перевірте правильність API ключа
- Переконайтеся, що ключ активований
- Перевірте ліміти запитів (40 запитів/10 секунд)

### Redis недоступний

- Перевірте з'єднання з Redis
- Система працюватиме без кешування

### Cloudinary помилки

- Перевірте налаштування API ключів
- Переконайтеся в наявності місця на акаунті
