defmodule ChatServiceWeb.ChatController do
  use ChatServiceWeb, :controller
  alias ChatService.{ChatManager, AuthClient}

  plug(:verify_token when action in [:index, :messages])

  def index(conn, _params) do
    user_id = conn.assigns.current_user.id
    chats = ChatManager.list_user_chats(user_id)
    render(conn, "index.json", chats: chats)
  end

  def messages(conn, %{"chat_id" => chat_id}) do
    case ChatManager.get_chat_messages(chat_id, 30) do
      {:ok, messages} -> render(conn, "messages.json", messages: messages)
      {:error, _} -> send_resp(conn, 404, "Chat not found")
    end
  end

  defp verify_token(conn, _opts) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        case AuthClient.verify_token(token) do
          {:ok, user} ->
            assign(conn, :current_user, user)

          {:error, _} ->
            send_unauthorized(conn)
        end

      _ ->
        send_unauthorized(conn)
    end
  end

  defp send_unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "Unauthorized"})
    |> halt()
  end
end
