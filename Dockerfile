# Фронтенд (Node.js)
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Бэкенд (Elixir)
FROM elixir:1.15.7-slim AS backend-builder

# Установка системных зависимостей
RUN apt-get update && \
    apt-get install -y build-essential git curl make gcc libc-dev && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app/backend

# Копируем только mix-файлы для кэширования зависимостей
COPY backend/mix.exs backend/mix.lock ./

# Установка Hex и Rebar
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get --only prod && \
    mix deps.compile

# Копируем ВЕСЬ бэкенд (с исключениями через .dockerignore)
COPY backend/ .

# Копируем статику из фронтенда
COPY --from=frontend-builder /app/frontend/dist ./priv/static

ENV MIX_ENV=prod

# Сборка релиза
RUN mix compile && \
    mix phx.digest && \
    mix release --path /app/release

# Финальный образ
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl libgcc1
COPY --from=backend-builder /app/release /app
WORKDIR /app
CMD ["bin/backend", "start"]