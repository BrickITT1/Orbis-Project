FROM elixir:1.15.7-slim AS builder

ENV MIX_ENV=prod
ENV PHX_ENV=prod

RUN apt-get update && \
    apt-get install -y locales && \
    sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

# Установка зависимостей для сборки
RUN apt-get update && \
    apt-get install -y build-essential git curl && \
    mix local.hex --force && \
    mix local.rebar --force

WORKDIR /app

COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV && \
    mix deps.compile

COPY . .
RUN mix compile && \
    mix phx.digest && \
    mix release --path /app/release

FROM debian:bookworm-slim

# Установка runtime-зависимостей
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    postgresql-client \
    locales && \
    sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/release /app
WORKDIR /app
CMD ["bin/chat_service", "start"]
CMD ["bin/chat_service", "start_iex"]  # Запуск в интерактивном режиме