defmodule Orbis.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add(:email, :string, null: false)
      add(:username, :string)
      add(:display_name, :string)
      add(:password_hash, :string)
      add(:birth_date, :date)
      # active | restricted | deleted
      add(:account_status, :string, default: "active")
      add(:confirmed_at, :utc_datetime_usec)

      timestamps(type: :utc_datetime_usec)
    end

    create(unique_index(:users, [:email]))
    create(unique_index(:users, [:username]))
  end
end
