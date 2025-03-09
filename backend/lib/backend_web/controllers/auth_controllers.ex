defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  # alias MyApp.Auth
  # alias MyApp.Auth.User
  alias Backend.RedisClient
  alias Backend.Auth.Guardian, as: Guardian
  alias BackendWeb.AuthJSON
  alias Backend.Auth

  def send_code(conn, %{"email" => email}) do
    case Auth.get_user_by_email(email) do
      {:ok, _user} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: "email_already_registered"})

      {:error, :not_found} ->
        # Генерируем и сохраняем код
        code = generate_confirmation_code()
        RedisClient.set("email_confirmation:#{email}", code)

        # В продакшене здесь отправка email
        IO.puts("Confirmation code for #{email}: #{code}")

        json(conn, %{status: "ok"})

      error ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "server_error"})
    end
  end

  def verify_code(conn, %{"email" => email, "code" => code}) do
    case RedisClient.get("email_confirmation:#{email}") do
      {:ok, ^code} ->
        RedisClient.set("verified_email:#{code}", email)
        # Удаляем использованный код
        RedisClient.del("email_confirmation:#{email}")
        json(conn, %{status: "ok"})

      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_code"})
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    case Auth.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, access_token, refresh_token} = Guardian.generate_tokens(user)

        RedisClient.set("refresh_token:#{user.id}", refresh_token, ttl: 7 * 24 * 3600)

        conn
        |> put_resp_cookie("refresh_token", refresh_token,
          http_only: true,
          secure: false,
          same_site: "Lax",
          max_age: 7 * 24 * 3600
        )
        |> json(%{access_token: access_token})

      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_credentials"})
    end
  end

  def refresh(conn, _params) do
    conn = fetch_cookies(conn)

    case conn.cookies["refresh_token"] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Missing refresh token"})

      refresh_token ->
        with {:ok, claims} <- Guardian.verify_token_type(refresh_token, "refresh"),
             {:ok, user} <- Guardian.resource_from_claims(claims),
             {:ok, stored} <- RedisClient.get("refresh_token:#{user.id}"),
             true <- refresh_token == stored do
          {:ok, new_access_token, new_refresh_token} = Guardian.generate_tokens(user)
          RedisClient.set("refresh_token:#{user.id}", new_refresh_token)

          conn
          |> put_resp_cookie("refresh_token", new_refresh_token,
            http_only: true,
            secure: false,
            max_age: 7 * 24 * 3600,
            same_site: "Lax"
          )
          |> json(%{access_token: new_access_token})
        else
          {:error, :invalid_token_type} ->
            conn
            |> put_status(:unauthorized)
            |> json(%{error: "Invalid token type"})

          _ ->
            conn
            |> put_status(:unauthorized)
            |> json(%{error: "Invalid refresh token"})
        end
    end
  end

  def logout(conn, _params) do
    conn = fetch_cookies(conn)

    with %{"refresh_token" => refresh_token} <- conn.cookies,
         {:ok, claims} <- Guardian.verify_token_type(refresh_token, "refresh"),
         {:ok, user} <- Guardian.resource_from_claims(claims) do
      # Отзыв токенов
      Guardian.revoke(refresh_token)
      RedisClient.del("refresh_token:#{user.id}")

      conn
      |> delete_resp_cookie("refresh_token")
      |> json(%{status: "logged_out"})
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Not authenticated"})
    end
  end

  def register(
        conn,
        %{
          "code" => code,
          "username" => username,
          "display_name" => display_name,
          "password" => password,
          "birth_date" => birth_date_str
        }
      ) do
    with {:ok, email} <- RedisClient.get("verified_email:#{code}"),
         {:ok, birth_date} <- Date.from_iso8601(birth_date_str),
         {:ok, user} <-
           Auth.create_user(%{
             email: email,
             username: username,
             display_name: display_name,
             password: password,
             birth_date: birth_date
           }) do
      {:ok, access_token, refresh_token} = Guardian.generate_tokens(user)

      case RedisClient.set("refresh_token:#{user.id}", refresh_token, ttl: 7 * 24 * 3600) do
        {:ok, "OK"} -> :ok
        error -> IO.puts("Redis error: #{inspect(error)}")
      end

      conn
      |> put_resp_cookie("refresh_token", refresh_token,
        http_only: true,
        secure: false,
        same_site: "Lax",
        max_age: 7 * 24 * 3600
      )
      |> json(%{access_token: access_token})
    else
      {:error, :invalid_date} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid date format. Use YYYY-MM-DD"})

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: parse_errors(changeset)})

      error ->
        IO.puts("Unexpected error: #{inspect(error)}")

        conn
        |> put_status(:bad_request)
        |> json(%{error: "registration_failed"})
    end
  end

  defp parse_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  defp generate_confirmation_code do
    :crypto.strong_rand_bytes(4)
    |> Base.url_encode64(padding: false)
    |> String.slice(0..5)

    # |> String.upcase()
  end

  def confirm_email(conn, %{"email" => email, "code" => code}) do
    case Auth.confirm_email(email, code) do
      {:ok, user} ->
        {:ok, token, _} = Guardian.encode_and_sign(user)
        json(conn, %{status: "confirmed", token: token})

      {:error, _reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid confirmation code"})
    end
  end

  def check(conn, _params) do
    # Логика проверки куки
    json(conn, "OK")
  end

  def confirm(conn, %{"email" => email}, %{"email" => email}) do
    # Логика проверки куки
    json(conn, "OK")
  end

  def show(conn, _params) do
    user = conn.assigns.current_user
    render(conn, "show.json", user: user)
  end
end
