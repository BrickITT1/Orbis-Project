defmodule PhxTest.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users) do
      add :name, :string
      add :age, :float
      add :location, :string

      timestamps(type: :utc_datetime)
    end
  end
end
