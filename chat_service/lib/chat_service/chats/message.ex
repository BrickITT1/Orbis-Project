defmodule ChatService.Chats.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "messages" do
    field(:content, :string)
    field(:is_edited, :boolean, default: false)
    # Ответ на сообщение
    field(:reply_to_id, Ecto.UUID)
    # Пересылка от пользователя
    field(:forward_from, Ecto.UUID)

    belongs_to(:chat, ChatService.Chats.Chat)
    # ID пользователя из основного сервиса
    belongs_to(:user, :binary_id)

    timestamps(type: :utc_datetime)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:content, :chat_id, :user_id, :reply_to_id, :forward_from])
    |> validate_required([:content, :chat_id, :user_id])
  end
end
