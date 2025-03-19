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
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Настройка времени ожидания и повторов для Hex
ENV HEX_HTTP_TIMEOUT=20
ENV HEX_UNSAFE_HTTPS=1

# Альтернативная установка Hex через GitHub
RUN mix archive.install github hexpm/hex branch latest --force

# Установка Rebar3
RUN mix local.rebar --force

WORKDIR /app/backend

# Копируем только mix-файлы для кэширования
COPY backend/mix.exs backend/mix.lock ./

# Установка зависимостей
RUN mix deps.get --only prod

# Копируем ВЕСЬ бэкенд (с исключениями через .dockerignore)
COPY backend/ .

# Копируем статику из фронтенда
COPY --from=frontend-builder /app/frontend/dist ./priv/static

ENV MIX_ENV=prod
ENV PHX_ENV=prod

# Установка локали
RUN apt-get update && \
    apt-get install -y locales build-essential git curl && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
ENV ELIXIR_ERL_OPTIONS="+fnu"

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