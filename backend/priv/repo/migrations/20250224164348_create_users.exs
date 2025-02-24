defmodule Backend.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :email, :string
      add :username, :string
      add :name, :string
      add :password, :string
      add :age, :integer
      add :access, :string

      timestamps(type: :utc_datetime)
    end
  end
end
