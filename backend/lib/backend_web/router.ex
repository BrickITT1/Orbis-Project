defmodule BackendWeb.Router do
  use BackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  scope "/api", BackendWeb do
    pipe_through :api

    post "/login", AuthController, :login
    post "/logout", AuthController, :logout
    post "/register", AuthController, :register
    get "/check", AuthController, :check
  end

  scope "/", BackendWeb do
    pipe_through :browser

    # Открываем index.html по корневому пути
    get "/*path", PageController, :index
  end

end
