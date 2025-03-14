defmodule ChatService.Repo.Migrations.CreateChatTables do
  use Ecto.Migration

  def change do
    # 1. Таблицу чатов
    create table(:chats, primary_key: false) do
      add(:id, :uuid, primary_key: true)
      add(:name, :string, size: 50)
      add(:type, :string, size: 12)
      add(:created_at, :utc_datetime, default: fragment("NOW()"))
      add(:updated_at, :utc_datetime, default: fragment("NOW()"))
      add(:creator_id, :uuid, null: false)
      add(:avatar_url, :string, size: 200)
    end

    # 2. Таблица сообщений
    create table(:messages, primary_key: false) do
      add(:id, :uuid, primary_key: true)
      add(:content, :text)
      add(:is_edited, :boolean, default: false)
      add(:user_id, :uuid, null: false)
      timestamps(type: :utc_datetime)
    end

    # 3. Связь messages → chats
    alter table(:messages) do
      add(:chat_id, references(:chats, type: :uuid, on_delete: :delete_all), null: false)
    end

    # 4. Таблица вложений
    create table(:attachments, primary_key: false) do
      add(:id, :uuid, primary_key: true)
      add(:file_url, :string, size: 200, null: false)
      add(:file_type, :string, size: 50, null: false)
      add(:file_size, :bigint)
      add(:message_id, references(:messages, type: :uuid, on_delete: :delete_all), null: false)
      timestamps(type: :utc_datetime)
    end

    # 5. Связь chats → messages (last_message)
    alter table(:chats) do
      add(:last_message_id, references(:messages, type: :uuid))
    end

    # 6. Индексы
    create(index(:chats, [:creator_id]))
    create(index(:chats, [:last_message_id]))
    create(index(:messages, [:chat_id]))
    create(index(:attachments, [:message_id]))
  end
end
