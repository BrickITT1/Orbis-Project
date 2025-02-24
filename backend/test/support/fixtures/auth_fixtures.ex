defmodule Backend.AuthFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Backend.Auth` context.
  """

  @doc """
  Generate a user.
  """
  def user_fixture(attrs \\ %{}) do
    {:ok, user} =
      attrs
      |> Enum.into(%{
        access: "some access",
        age: 42,
        email: "some email",
        name: "some name",
        password: "some password",
        username: "some username"
      })
      |> Backend.Auth.create_user()

    user
  end
end
