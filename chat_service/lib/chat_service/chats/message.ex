defmodule ChatService.Chats.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "messages" do
    field(:content, :string)
    field(:is_edited, :boolean, default: false)
    belongs_to(:chat, ChatService.Chats.Chat, type: :binary_id)
    belongs_to(:user, :binary_id)
    field(:reply_to_id, :binary_id)
    field(:forward_from, :binary_id)

    timestamps(type: :utc_datetime)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:content, :chat_id, :user_id, :reply_to_id, :forward_from])
    |> validate_required([:content, :chat_id, :user_id])
  end
end
