FROM elixir:1.15.7-slim AS builder

# Устанавливаем переменные среды для production
ENV MIX_ENV=prod
ENV PHX_ENV=prod

WORKDIR /app

RUN apt-get update && \
    apt-get install -y build-essential git && \
    mix local.hex --force && \
    mix local.rebar --force

# Копируем зависимости и устанавливаем только prod
COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV

# Копируем конфигурацию и исходный код
COPY config config
COPY lib lib
COPY priv priv

# Компилируем проект
RUN mix compile

# Установка локали
    RUN apt-get update && \
    apt-get install -y locales && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8


# Если есть фронтенд-ассеты, раскомментируйте:
# COPY assets assets
# RUN mix assets.deploy

# Собираем релиз
RUN mix release

# Финальный образ
FROM debian:bookworm-slim
RUN apt-get update && \
    # Postgresql-client
    apt-get install -y openssl postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/_build/prod/rel/chat_service .

CMD ["./bin/chat_service", "start"]