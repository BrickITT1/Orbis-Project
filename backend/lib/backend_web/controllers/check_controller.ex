defmodule BackendWeb.CheckController do
  use BackendWeb, :controller
  alias Backend.RedisClient
  alias Backend.Repo

  def check_email(conn, %{"email" => email}) do
    case RedisClient.get(email) do
      {:ok, nil} ->
        check_postgres_and_cache(email, :email, conn)

      {:ok, "not_found"} ->
        json(conn, "YES") |> put_status(200)

      {:ok, _username} ->
        json(conn, "NO") |> put_status(400)

      _error ->
        json(conn, "ERROR") |> put_status(500)
    end
  end

  def check_username(conn, %{"name" => username}) do
    case RedisClient.get(username) do
      {:ok, nil} ->
        check_postgres_and_cache(username, :username, conn)

      {:ok, "not_found"} ->
        json(conn, "YES") |> put_status(200)

      {:ok, _email} ->
        json(conn, "NO") |> put_status(400)

      _error ->
        json(conn, "ERROR") |> put_status(500)
    end
  end

  defp check_postgres_and_cache(value, field, conn) do
    case Repo.get_by(User, [{field, value}]) do
      nil ->
        # TTL 1 час
        RedisClient.setex("#{field}:#{value}", 3600, "not_found")
        json(conn, "YES")

      _user ->
        RedisClient.setex("#{field}:#{value}", 3600, "exists")
        json(conn, "NO")
    end
  end
end
