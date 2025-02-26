defmodule Orbis.Repo.Migrations.CreateUserChannels do
  use Ecto.Migration

  def change do
    create table(:user_channels) do
      add(:user_id, references(:users, on_delete: :delete_all), null: false)
      add(:channel_id, references(:channels, on_delete: :delete_all), null: false)
      timestamps(type: :utc_datetime_usec)
    end

    create(unique_index(:user_channels, [:user_id, :channel_id]))
  end
end
