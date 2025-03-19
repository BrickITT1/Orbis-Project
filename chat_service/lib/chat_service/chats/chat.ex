defmodule ChatService.Chats.Chat do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "chats" do
    field(:name, :string)
    # "ls", "group", "channel"
    field(:type, :string)
    field(:avatar_url, :string)

    # Связи
    # ID пользователя из основного сервиса
    belongs_to(:creator, :binary_id)
    has_many(:messages, ChatService.Chats.Message)

    timestamps(type: :utc_datetime)
  end
end
