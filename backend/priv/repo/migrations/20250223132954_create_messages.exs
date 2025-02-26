defmodule Orbis.Repo.Migrations.CreateMessages do
  use Ecto.Migration

  def change do
    create table(:messages) do
      add(:content, :text)
      add(:file_url, :string)
      add(:user_id, references(:users, on_delete: :delete_all), null: false)
      add(:channel_id, references(:channels, on_delete: :delete_all), null: false)
      timestamps(type: :utc_datetime_usec)
    end

    create(index(:messages, [:user_id]))
    create(index(:messages, [:channel_id]))
  end
end
