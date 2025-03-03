defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  # alias MyApp.Auth
  # alias MyApp.Auth.User
  alias BackendWeb.AuthJSON

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
        "name" => name,
        "password" => password,
        "age" => age,
        "access" => access
      }) do
    user_params = %{
      email: email,
      username: username,
      name: name,
      password: password,
      age: age,
      access: access
    }

    case Backend.Auth.create_user(user_params) do
      {:ok, user} ->
        conn
        |> put_session(:user_id, user.id)
        |> redirect(to: ~p"/")

      {:error, changeset} ->
        conn
        |> put_flash(:error, "Registration failed")
        |> redirect(to: ~p"/register")
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

  defp generate_token(user) do
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    token
  end
end
