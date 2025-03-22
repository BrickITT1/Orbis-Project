defmodule ChatService.RedisClient do
  @redis_url System.get_env("REDIS_URL") || "redis://redis:6379"
  require Logger

  # Создаем постоянное соединение
  def child_spec(_args) do
    %{
      id: __MODULE__,
      start: {Redix, :start_link, [@redis_url, [name: :redix]]}
    }
  end

  def command(cmd) do
    case Redix.command(:redix, cmd) do
      {:ok, result} ->
        result

      {:error, reason} ->
        Logger.error("Redis error: #{inspect(reason)}")
        raise "Redis command failed"
    end
  end

  def keys(pattern) do
    command(["KEYS", pattern])
  end
end
