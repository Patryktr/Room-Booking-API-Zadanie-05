# Room Booking API - Zadanie 05

[![CI](https://github.com/Patryktr/Room-Booking-API-Zadanie-05/actions/workflows/ci.yml/badge.svg)](https://github.com/Patryktr/Room-Booking-API-Zadanie-05/actions/workflows/ci.yml)

REST API do rezerwowania sal, z JWT, rolami USER/ADMIN, PostgreSQL, testami, audit logiem, Docker Compose i CI.

## Uruchomienie od zera

Wymagane są Git i Docker Desktop. Node.js nie jest potrzebny do uruchomienia aplikacji.

```powershell
git clone https://github.com/Patryktr/Room-Booking-API-Zadanie-05.git
cd Room-Booking-API-Zadanie-05
Copy-Item .env.example .env
# Ustaw w .env własne hasła oraz JWT_SECRET (minimum 32 znaki)
docker compose up --build -d --wait
docker compose exec api npx knex seed:run
```

Swagger UI: http://localhost:3000/api/docs

Zatrzymanie środowiska bez kasowania danych:

```powershell
docker compose down
```

## Testy

Testy jednostkowe używają repozytoriów in-memory i nie łączą się z PostgreSQL. Testy integracyjne wymagają osobnej, pustej bazy wskazanej przez `DATABASE_URL`.

```powershell
npm ci
npm run test:unit
npm run test:integration
npm test
```

Zestaw zawiera 18 testów jednostkowych reguł rezerwacji i event busa oraz 8 testów integracyjnych API. Sprawdzane są m.in. nakładanie przedziałów, pojemność, czas trwania, anulowanie, ownership, kody HTTP, nagłówek Location i paginacja.

## Architektura

- `src/modules` - moduły domenowe, kontrolery, serwisy i repozytoria,
- `src/events` - event bus oparty o `EventEmitter` i izolowane listenery,
- `src/db/migrations` - migracje PostgreSQL, w tym tabela `audit_log`,
- `tests/unit` - testy bez bazy danych,
- `tests/integration` - testy Supertest z osobną bazą PostgreSQL,
- `.github/workflows/ci.yml` - testy i budowa obrazu Docker dla push do `main` oraz pull requestów.

Serwis rezerwacji publikuje `reservation.created` i `reservation.cancelled` dopiero po zatwierdzeniu transakcji. Listener zapisuje payload w `audit_log`. Błąd pojedynczego listenera jest logowany i nie zmienia odpowiedzi API. Endpoint `GET /api/admin/audit-log` jest dostępny wyłącznie dla administratora, obsługuje paginację i filtr `eventType`.

## Najważniejsze endpointy

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET, POST /api/reservations`
- `GET /api/reservations/:id`
- `PATCH /api/reservations/:id/cancel`
- `GET /api/admin/audit-log?eventType=reservation.created`
- `GET /api/docs`

Sekrety są przekazywane przez `.env`, który jest wykluczony z Git. Repozytorium zawiera wyłącznie `.env.example`.
