defmodule ChatService.RedisClient do
  @redis_url System.get_env("REDIS_URL") || "redis://localhost:6379"

  def command(conn, cmd) do
    Redix.command(conn, cmd)
  end

  def get(key) do
    {:ok, conn} = Redix.start_link(@redis_url)
    Redix.command(conn, ["GET", key])
  end
end
