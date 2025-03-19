defmodule ChatServiceWeb.Router do
  use Phoenix.Router
  # Для работы с путями
  # import Phoenix.VerifiedRoutes

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/api", ChatServiceWeb do
    pipe_through(:api)

    get("/chats", ChatController, :index)
    get("/chats/:chat_id/messages", ChatController, :messages)
  end

  # WebSocket endpoint
  # socket("/ws", ChatServiceWeb.UserSocket,
  #   websocket: true,
  #   longpoll: false
  # )
end
