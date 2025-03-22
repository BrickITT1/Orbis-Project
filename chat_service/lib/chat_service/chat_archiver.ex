defmodule ChatService.ChatArchiver do
  use GenServer
  alias ChatService.{Repo, Message, RedisClient}
  require Logger

  # Запуск архиватора
  def start_link(_) do
    GenServer.start_link(__MODULE__, %{})
  end

  def init(state) do
    schedule_archive_check()
    {:ok, state}
  end

  def handle_info(:archive_check, state) do
    RedisClient.keys("chat:*:active")
    |> Enum.each(fn key ->
      chat_id = String.split(key, ":") |> Enum.at(1)

      case RedisClient.ttl(key) do
        ttl when ttl < 60 -> archive_chat(chat_id)
        _ -> :ok
      end
    end)

    schedule_archive_check()
    {:noreply, state}
  end

  defp extract_chat_id(key) do
    key
    |> String.split(":")
    # Извлекаем chat_id из ключа "chat:<chat_id>:active"
    |> Enum.at(1)
  end

  defp archive_chat(chat_id) do
    case RedisClient.ttl("chat:#{chat_id}:active") do
      ttl when ttl < 60 ->
        messages =
          RedisClient.lrange("chat:#{chat_id}:messages", 0, -1)
          |> Enum.map(&Jason.decode!/1)

        Repo.transaction(fn ->
          Enum.each(messages, fn msg ->
            %ChatService.Chats.Message{}
            |> ChatService.Chats.Message.changeset(msg)
            |> Repo.insert!()
          end)
        end)

        RedisClient.del(["chat:#{chat_id}:messages", "chat:#{chat_id}:active"])

      _ ->
        :ok
    end
  end

  defp insert_message(msg) do
    %ChatService.Chats.Message{}
    |> ChatService.Chats.Message.changeset(msg)
    |> Repo.insert!()
  end

  defp schedule_archive_check do
    # Каждую минуту
    Process.send_after(self(), :archive_check, 60_000)
  end
end
