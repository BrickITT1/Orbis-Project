defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  # alias MyApp.Auth
  # alias MyApp.Auth.User

  def login(conn, %{"email" => email, "password" => password}) do
    case Backend.Auth.authenticate_user(email, password) do
      {:ok, user} ->
        conn
        |> put_session(:user_id, user.id)
        |> redirect(to: ~p"/")

      {:error, _reason} ->
        conn
        |> put_flash(:error, "Invalid credentials")
        |> redirect(to: ~p"/login")
    end
  end

  def logout(conn, %{"email" => email}) do
    # Логика выхода
    json(conn, "OK")
  end

  def register(conn, %{
        "email" => email,
        "username" => username,
        "name" => name,
        "password" => password,
        "age" => age,
        "access" => _access
      }) do
    user_params = %{
      email: email,
      username: username,
      name: name,
      password: password,
      age: age,
      access: _access
    }

    case Backend.Auth.register_user(user_params) do
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
end
