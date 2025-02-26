defmodule Backend.RedisClient do
  @redis_url System.get_env("REDIS_URL") || "redis://redis:6379"
  # 24 часа - время кэширования
  @ttl 86_400

  defp get_connection do
    {:ok, conn} = Redix.start_link(@redis_url)
    conn
  end

  def get(key) do
    conn = get_connection()
    Redix.command(conn, ["GET", key])
  end

  def set(key, value) do
    conn = get_connection()
    Redix.command(conn, ["SET", key, value, "EX", @ttl])
  end
end
