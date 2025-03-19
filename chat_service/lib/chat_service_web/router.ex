defmodule ChatServiceWeb.Router do
  use ChatServiceWeb, :router
  import Phoenix.Router
  alias ChatService.AuthClient

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/api", ChatServiceWeb do
    pipe_through(:api)
    get("/chats", ChatController, :index)
    get("/chats/:chat_id/messages", ChatController, :messages)
  end

  socket("/ws", ChatServiceWeb.UserSocket,
    websocket: true,
    longpoll: false
  )
end
