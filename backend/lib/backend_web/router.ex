defmodule BackendWeb.Router do
  use BackendWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_flash)
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  scope "/api", BackendWeb do
    pipe_through(:api)

    post("/login", AuthController, :login)
    post("/logout", AuthController, :logout)
    post("/register", AuthController, :register)
    post("/register/confirm", AuthController, :confirm_email)
    post("/send_code", AuthController, :send_code)
    post("/verify", AuthController, :verify_code)

    get("/check", AuthController, :check)
    get("/checkemail", CheckController, :check_email)
    get("/checkname", CheckController, :check_username)
  end

  scope "/", BackendWeb do
    pipe_through(:browser)

    # Открываем index.html по корневому пути
    get("/*path", PageController, :index)
  end
end
