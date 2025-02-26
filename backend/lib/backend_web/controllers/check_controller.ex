defmodule BackendWeb.CheckController do
  use BackendWeb, :controller
  alias Backend.RedisClient
  alias Backend.Auth
  alias Backend.Repo
  import Ecto.Query

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
    query =
      from(u in Auth.User,
        where: field(u, ^field) == ^value,
        select: %{email: u.email, username: u.username}
      )

    case Repo.one(query) do
      nil ->
        RedisClient.set(value, "not_found")
        json(conn, "YES") |> put_status(200)

      %{email: email, username: username} ->
        RedisClient.set(email, username)
        RedisClient.set(username, email)
        json(conn, "NO") |> put_status(400)
    end
  end
end
