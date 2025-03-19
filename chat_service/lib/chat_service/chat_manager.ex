defmodule ChatService.ChatManager do
  alias ChatService.{Chat, Message, Repo}
  import Ecto.Query

  def list_user_chats(user_id) do
    Repo.all(from(c in Chat, where: c.creator_id == ^user_id))
  end

  def get_chat_messages(chat_id, limit) do
    # Исправленный запрос
    query =
      from(m in Message,
        where: m.chat_id == ^chat_id,
        order_by: [desc: m.inserted_at],
        limit: ^limit
      )

    Repo.all(query)
  end

  def activate_chat(chat_id) do
    messages =
      Repo.all(
        from(m in Message,
          where: m.chat_id == ^chat_id,
          limit: 20,
          order_by: [desc: m.inserted_at]
        )
      )

    RedisClient.setex("chat:#{chat_id}:messages", 300, Jason.encode!(messages))
    RedisClient.setex("chat:#{chat_id}:active", 300, "true")
    messages
  end
end
