defmodule Orbis.Repo.Migrations.CreateFriends do
  use Ecto.Migration

  def change do
    create table(:friends) do
      add :user_id, references(:users, on_delete: :nothing)
      add :friend_id, references(:users, on_delete: :nothing)

      timestamps(type: :utc_datetime)
    end

    create index(:friends, [:user_id])
    create index(:friends, [:friend_id])
  end
end
