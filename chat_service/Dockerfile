FROM elixir:1.15.7-slim AS builder

ENV MIX_ENV=prod
ENV PHX_ENV=prod

# Добавляем необходимые системные зависимости
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
RUN apt-get update && apt-get install -y openssl

COPY --from=builder /app/release /app
WORKDIR /app
CMD ["bin/chat_service", "start"]