defmodule Orbis.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add(:username, :string, size: 30, null: false)
      add(:display_name, :string, size: 20, null: false)
      add(:avatar_url, :string)
      add(:birth_date, :date, null: false)
      add(:email, :string, size: 100, null: false)
      add(:password_hash, :string, size: 255, null: false)
      add(:status, :integer, default: 0)
      add(:phone, :string)

      timestamps(type: :utc_datetime_usec)
    end

    create(unique_index(:users, [:email]))
    create(unique_index(:users, [:username]))
  end
end
