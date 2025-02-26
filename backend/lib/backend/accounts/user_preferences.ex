defmodule Backend.Accounts.UserPreferences do
  use Ecto.Schema
  import Ecto.Changeset

  schema "user_preferences" do
    field(:bio, :string)
    field(:custom_status, :string)
    field(:locale, :string)
    field(:theme, :string)
    field(:privacy_settings, :map)
    field(:timezone, :string)
    belongs_to(:user, Backend.Auth.User)

    timestamps(type: :utc_datetime_usec)
  end

  def changeset(preferences, attrs) do
    preferences
    |> cast(attrs, [:bio, :custom_status, :locale, :theme, :privacy_settings, :timezone, :user_id])
    |> validate_required([:user_id])
  end
end
