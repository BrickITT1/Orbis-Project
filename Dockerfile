# Фронтенд (Node.js)
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build  # Убедитесь, что выходная папка - dist/

# Бэкенд (Elixir)
FROM elixir:1.15 AS backend-builder
WORKDIR /app/backend

# Установка Node.js (нужен для phx.digest)
RUN apt-get update && apt-get install -y nodejs npm

# Копируем только mix-файлы для кэширования
COPY backend/mix.exs backend/mix.lock ./
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get --only prod

# Копируем весь бэкенд
COPY backend/ .

# Копируем статику из фронтенда (ПРАВИЛЬНЫЙ ПУТЬ!)
COPY --from=frontend-builder /app/frontend/dist ./priv/static

ENV MIX_ENV=prod

# Сборка релиза (включая статику)
RUN mix compile && mix phx.digest && mix release --path /app/release

# Финальный образ
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl
COPY --from=backend-builder /app/release /app
WORKDIR /app
CMD ["bin/backend", "start"]