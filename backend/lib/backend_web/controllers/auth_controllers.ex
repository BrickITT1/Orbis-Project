defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  # alias MyApp.Auth
  # alias MyApp.Auth.User
  alias Backend.RedisClient
  alias Backend.Auth.Guardian, as: Guardian
  alias BackendWeb.AuthJSON
  alias Backend.Auth

  def send_code(conn, %{"email" => email}) do
    code = generate_confirmation_code()
    RedisClient.set("email_confirmation:#{email}", code)
    # В реальном приложении здесь отправка email
    IO.puts("Confirmation code for #{email}: #{code}")
    json(conn, %{status: "ok"})
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
        {:ok, token, _} = Guardian.encode_and_sign(user)
        json(conn, %{token: token})

      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "invalid_credentials"})
    end
  end

  def logout(conn, %{"email" => _email}) do
    # Логика выхода
    json(conn, "OK")
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
      RedisClient.del("verified_email:#{code}")
      RedisClient.del("email_confirmation:#{email}")
      {:ok, token, _} = Guardian.encode_and_sign(user)
      json(conn, %{token: token})
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
    :crypto.strong_rand_bytes(3)
    |> Base.url_encode64(padding: false)
    |> String.slice(0..5)
    |> String.upcase()
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
