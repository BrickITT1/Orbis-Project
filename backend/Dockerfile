# Используем официальный образ Elixir
FROM elixir:1.15

# Устанавливаем Node.js и npm
RUN apt-get update && apt-get install -y nodejs npm

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем зависимости
COPY mix.exs mix.lock ./
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get

# Копируем код
COPY . .

# Устанавливаем переменные окружения для production
ENV MIX_ENV=prod

# Собираем релиз
RUN mix compile && mix release

# Указываем команду для запуска
CMD ["_build/prod/rel/backend/bin/backend", "start"]