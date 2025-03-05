defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  # alias MyApp.Auth
  # alias MyApp.Auth.User
  use BackendWeb, :controller
  alias BackendWeb.AuthJSON
  alias Backend.Auth

  def login(conn, %{"email" => email, "password" => password}) do
    case Backend.Auth.authenticate_user(email, password) do
      {:ok, user} ->
        {:ok, token, _claims} = Guardian.encode_and_sign(user)
        render(conn, AuthJSON, "token.json", token: token)

      {:error, reason} ->
        conn
        |> put_status(:unauthorized)
        |> render(AuthJSON, "error.json", message: reason)
    end
  end

  def logout(conn, %{"email" => _email}) do
    # Логика выхода
    json(conn, "OK")
  end

  def register(conn, %{
        "email" => email,
        "username" => username,
        "display_name" => display_name,
        "password" => password,
        "birth_date" => birth_date
      }) do
    case Auth.create_user(%{
           email: email,
           username: username,
           display_name: display_name,
           password: password,
           birth_date: birth_date
         }) do
      {:ok, _user, code} ->
        IO.puts("Confirmation code: #{code}")
        json(conn, %{status: "confirmation_required", email: email})

      {:error, changeset} ->
        conn
        |> put_status(:bad_request)
        |> json(%{errors: parse_changeset_errors(changeset)})
    end
  end

  defp parse_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
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

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
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

  defp generate_token(user) do
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    token
  end
end
