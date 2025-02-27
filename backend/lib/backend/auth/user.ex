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

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :username, :password])
    |> validate_required([:email, :username, :password])
    |> put_password_hash()
  end

  defp put_password_hash(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
        put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(password))

      _ ->
        changeset
    end
  end
end
