defmodule Orbis.Repo.Migrations.CreateUserPreferences do
  use Ecto.Migration

  def change do
    create table(:user_preferences) do
      add(:bio, :text)
      add(:custom_status, :string)
      add(:locale, :string, default: "en-US")
      add(:theme, :string, default: "system")
      add(:privacy_settings, :jsonb, default: fragment("'{}'::jsonb"))
      add(:timezone, :string, default: "UTC")
      add(:user_id, references(:users, on_delete: :delete_all), null: false)

      timestamps(type: :utc_datetime_usec)
    end

    create(unique_index(:user_preferences, [:user_id]))
  end
end