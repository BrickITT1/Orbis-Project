defmodule Backend.Auth do
  @moduledoc """
  The Auth context.
  """

  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Auth.User
  alias Backend.RedisClient
  alias Pbkdf2

  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Gets a single user.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> get_user!(123)
      %User{}

      iex> get_user!(456)
      ** (Ecto.NoResultsError)

  """
  def get_user!(id), do: Repo.get!(User, id)

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """

  def create_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, user} ->
        code = generate_confirmation_code()
        RedisClient.set("confirmation:#{user.email}", code)
        # {:ok, user, code}
        {:ok, user}

      error ->
        error
    end
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a user.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> change_user(user)
      %Ecto.Changeset{data: %User{}}

  """

  def authenticate_user(email, password) do
    user = Repo.get_by(User, email: email)

    case check_password(user, password) do
      true -> {:ok, user}
      false -> {:error, "Invalid credentials"}
    end
  end

  defp check_password(user, password) do
    case user do
      nil -> Pbkdf2.no_user_verify()
      # Используем password_hash
      _ -> Pbkdf2.verify_pass(password, user.password_hash)
    end
  end

  def confirm_email(email, code) do
    stored_code = get_stored_code(email)

    with {:ok, ^code} <- {:ok, stored_code},
         user <- Repo.get_by(User, email: email),
         {:ok, user} <- update_confirmation(user) do
      RedisClient.del("confirmation:#{email}")
      {:ok, user}
    else
      _ -> {:error, :invalid_code}
    end
  end

  defp generate_confirmation_code do
    case Application.get_env(:backend, :environment) do
      :prod -> generate_random_code()
      _ -> "12345"
    end
  end

  defp generate_random_code do
    :crypto.strong_rand_bytes(4)
    |> Base.url_encode64(padding: false)
    |> String.slice(0..4)
    |> String.upcase()
  end

  defp get_stored_code(email) do
    case Application.get_env(:backend, :environment) do
      :prod -> RedisClient.get("confirmation:#{email}")
      _ -> "12345"
    end
  end

  defp update_confirmation(user) do
    user
    |> User.confirm_changeset()
    |> Repo.update()
  end
end
