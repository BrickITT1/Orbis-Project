defmodule Backend.Auth.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field(:access, :string)
    field(:name, :string)
    field(:username, :string)
    field(:password, :string)
    field(:email, :string)
    field(:age, :integer)
    has_one(:preferences, Backend.Accounts.UserPreferences)

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :username, :name, :password, :age, :access])
    |> validate_required([:email, :username, :name, :password, :age, :access])
  end
end
