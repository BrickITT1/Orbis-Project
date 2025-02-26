defmodule Orbis.Repo.Migrations.CreateChannels do
  use Ecto.Migration

  def change do
    create table(:channels) do
      add(:name, :string, null: false)
      add(:created_id, references(:users, on_delete: :delete_all), null: false)
      timestamps(type: :utc_datetime_usec)
    end

    create(index(:channels, [:created_id]))
  end
end
