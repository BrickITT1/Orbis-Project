defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  alias MyApp.Auth
  alias MyApp.Auth.User

  def login(conn, %{"email" => email, "password" => password}) do
    # Логика аутентификации
    json(conn, "OK")
  end

  def logout(conn, %{"email" => email}) do
    # Логика выхода
    json(conn, "OK")
  end

  def register(conn, %{"email" => email, "username" => username, "name" => name, "password" => password, "age" => age, "access" => access}) do
    # Логика регистрации
    json(conn, "OK")
  end

  def check(conn, _params) do
    # Логика проверки куки
    json(conn, "OK")
  end
end
