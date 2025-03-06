defmodule Backend.Auth.User do
  use Ecto.Schema
  import Ecto.Changeset
  alias Pbkdf2

  @account_statuses ~w(active restricted deleted)

  schema "users" do
    field(:email, :string)
    field(:username, :string)
    field(:display_name, :string)
    field(:password, :string, virtual: true)
    field(:password_hash, :string)
    field(:birth_date, :date)
    field(:account_status, :string, default: "active")
    field(:confirmed_at, :utc_datetime)

    timestamps(type: :utc_datetime_usec)
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :username, :display_name, :password, :birth_date])
    |> validate_required([:email, :username, :display_name, :password, :birth_date])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> validate_inclusion(:account_status, @account_statuses)
    |> unique_constraint(:email)
    |> unique_constraint(:username)
    |> put_change(:confirmed_at, DateTime.truncate(DateTime.utc_now(), :second))
    |> put_password_hash()
  end

  def confirm_changeset(user) do
    change(user, %{confirmed_at: DateTime.truncate(DateTime.utc_now(), :second)})
  end

  defp put_password_hash(
         %Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset
       ) do
    change(changeset, Pbkdf2.add_hash(password))
  end

  defp put_password_hash(changeset), do: changeset
end
