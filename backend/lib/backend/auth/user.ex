defmodule Backend.Auth.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pbkdf2

  schema "users" do
    field(:email, :string)
    field(:username, :string)
    field(:display_name, :string)
    field(:password, :string, virtual: true)
    field(:password_hash, :string)
    field(:birth_date, :date)
    field(:access, :string, default: "user")
    field(:confirmed_at, :utc_datetime)

    timestamps(type: :utc_datetime_usec)
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :username, :display_name, :password, :birth_date])
    |> validate_required([:email, :username, :display_name, :password, :birth_date])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    #     |> validate_date_format(:birth_date)
    |> unique_constraint(:email)
    |> unique_constraint(:username)
    |> put_password_hash()
  end

  def confirm_changeset(user) do
    change(user, %{confirmed_at: DateTime.utc_now()})
  end

  #  defp validate_date_format(changeset, field) do
  #    validate_change(changeset, field, fn _, value ->
  #      case Date.from_iso8601(value) do
  #        {:ok, _} -> []
  #        _ -> [{field, "must be valid date in YYYY-MM-DD format"}]
  #      end
  #    end)
  #  end

  defp put_password_hash(
         %Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset
       ) do
    change(changeset, %{password_hash: Pbkdf2.hash_pwd_salt(password)})
  end

  defp put_password_hash(changeset), do: changeset
end
