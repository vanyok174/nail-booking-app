# Nail Booking Mini App

Telegram Mini App для записи на маникюр.

## Структура

```
nail-booking-app/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Node.js + Express + SQLite
└── README.md
```

## Возможности

### Клиент
- Выбор мастера
- Выбор услуги
- Выбор даты и времени
- Подтверждение записи

### Админ
- Управление мастерами (CRUD)
- Управление услугами и ценами
- Загрузка портфолио
- Управление слотами (создание, бронирование, отмена, завершение)
- Аналитика (загруженность, выручка, отмены)

## Запуск локально

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend запустится на `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend запустится на `http://localhost:5173`

## Добавление админа

После запуска добавьте свой Telegram ID в админы:

```bash
curl -X POST http://localhost:3001/api/admins \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "YOUR_TELEGRAM_ID"}'
```

## Деплой на VPS

### 1. Сборка фронтенда

```bash
cd frontend
npm run build
```

### 2. Nginx конфиг

```nginx
location /nail-app/ {
    alias /path/to/nail-booking-app/frontend/dist/;
    try_files $uri $uri/ /nail-app/index.html;
}

location /nail-app/api/ {
    rewrite ^/nail-app/api/(.*)$ /api/$1 break;
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /nail-app/uploads/ {
    alias /path/to/nail-booking-app/backend/uploads/;
}
```

### 3. PM2 для бэкенда

```bash
cd backend
npm install
npm run build
pm2 start dist/index.js --name nail-booking-api
```

## API Endpoints

### Masters
- `GET /api/masters` - список мастеров
- `POST /api/masters` - создать мастера
- `PUT /api/masters/:id` - обновить
- `DELETE /api/masters/:id` - удалить

### Services
- `GET /api/services?master_id=` - услуги мастера
- `POST /api/services` - создать услугу
- `PUT /api/services/:id` - обновить
- `DELETE /api/services/:id` - удалить

### Slots
- `GET /api/slots?master_id=&date=&status=` - слоты
- `POST /api/slots` - создать слот
- `POST /api/slots/bulk` - создать много слотов
- `PUT /api/slots/:id/book` - забронировать
- `PUT /api/slots/:id/cancel` - отменить
- `PUT /api/slots/:id/complete` - завершить
- `PUT /api/slots/:id/free` - освободить

### Portfolio
- `GET /api/portfolio?master_id=` - фото
- `POST /api/portfolio` - загрузить (multipart/form-data)
- `DELETE /api/portfolio/:id` - удалить

### Analytics
- `GET /api/analytics/summary?start_date=&end_date=` - сводка
- `GET /api/analytics/daily?start_date=&end_date=` - по дням
- `GET /api/analytics/workload?start_date=&end_date=` - загруженность

### Admins
- `GET /api/admins/check/:telegramId` - проверка админа
- `POST /api/admins` - добавить админа
- `DELETE /api/admins/:telegramId` - удалить админа
