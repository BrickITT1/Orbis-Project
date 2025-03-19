defmodule ChatServiceWeb.ChatChannel do
  use Phoenix.Channel
  alias ChatService.RedisClient

  def join("chat:" <> chat_id, _params, socket) do
    {:ok, assign(socket, :chat_id, chat_id)}
  end

  def handle_in("send_message", %{"content" => content}, socket) do
    %{chat_id: chat_id, user: user} = socket.assigns

    message = %{
      id: Ecto.UUID.generate(),
      content: content,
      user_id: user.id,
      timestamp: DateTime.utc_now()
    }

    RedisClient.lpush("chat:#{chat_id}:messages", Jason.encode!(message))
    broadcast!(socket, "new_message", message)

    {:noreply, socket}
  end
end
