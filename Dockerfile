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
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app/backend

# Установка Node.js (нужен для phx.digest)
RUN apt-get update && apt-get install -y nodejs npm

# Установка hex и rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Копируем только mix-файлы для кэширования
COPY backend/mix.exs backend/mix.lock ./
RUN mix deps.get --only prod

# Копируем ВЕСЬ бэкенд (с исключениями через .dockerignore)
COPY backend/ .

# Копируем статику из фронтенда
COPY --from=frontend-builder /app/frontend/dist ./priv/static

ENV MIX_ENV=prod
ENV PHX_ENV=prod

# Установка локали
RUN apt-get update && \
apt-get install -y locales && \
sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
locale-gen

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Сборка релиза
RUN mix compile && \
    mix phx.digest && \
    mix release --path /app/release

# Финальный образ
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && apt-get install -y postgresql-client

# Копируем собранный релиз из предыдущего этапа
COPY --from=backend-builder /app/release /app

# Устанавливаем рабочую директорию
WORKDIR /app

# Команда запуска приложения
CMD ["bin/backend", "start"]