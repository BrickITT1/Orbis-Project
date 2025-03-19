defmodule ChatService.ChatArchiver do
  use GenServer
  alias ChatService.{Repo, Message, RedisClient}

  # Запуск архиватора
  def start_link(_) do
    GenServer.start_link(__MODULE__, %{})
  end

  def init(state) do
    schedule_archive_check()
    {:ok, state}
  end

  def handle_info(:archive_check, state) do
    # Поиск чатов для архивации
    active_chats = RedisClient.keys("chat:*:active")

    Enum.each(active_chats, fn key ->
      chat_id = String.replace(key, ~r/chat:|\:active/, "")

      if RedisClient.ttl(key) < 60 do
        archive_chat(chat_id)
      end
    end)

    schedule_archive_check()
    {:noreply, state}
  end

  defp archive_chat(chat_id) do
    messages =
      RedisClient.lrange("chat:#{chat_id}:messages", 0, -1)
      |> Enum.map(&Jason.decode!/1)

    Repo.transaction(fn ->
      Enum.each(messages, fn msg ->
        # Явно указываем модуль ChatService.Chats.Message
        %ChatService.Chats.Message{}
        |> ChatService.Chats.Message.changeset(msg)
        |> Repo.insert!()
      end)
    end)

    # Очистка Redis
    RedisClient.del("chat:#{chat_id}:messages")
    RedisClient.del("chat:#{chat_id}:active")
  end

  defp schedule_archive_check do
    # Каждую минуту
    Process.send_after(self(), :archive_check, 60_000)
  end
end
