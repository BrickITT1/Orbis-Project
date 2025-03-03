defmodule Backend.Auth.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pbkdf2

  schema "users" do
    field(:username, :string)
    field(:display_name, :string)
    field(:avatar_url, :string)
    field(:birth_date, :date)
    field(:email, :string)
    field(:password, :string, virtual: true)
    field(:password_hash, :string)
    field(:status, :integer)
    field(:phone, :string)
    field(:access, :string)
    has_one(:preferences, Backend.Accounts.UserPreferences)

    timestamps(type: :utc_datetime)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password])
    |> validate_required([:email, :password])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> unique_constraint(:email)
    |> put_password_hash()
  end

  defp put_password_hash(
         %Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset
       ) do
    change(changeset, %{password_hash: Pbkdf2.hash_pwd_salt(password)})
  end

  defp put_password_hash(changeset), do: changeset

  # defp put_password_hash(changeset) do
  #   case changeset do
  #     %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
  #       put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(password))
  #
  #     _ ->
  #      changeset
  #   end
  # end
end
