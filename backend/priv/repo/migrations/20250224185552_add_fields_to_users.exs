defmodule Orbis.Repo.Migrations.AddFieldsToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add(:name, :string)
      add(:age, :integer)
      add(:access, :string)
    end
  end
end
