defmodule Backend.AuthTest do
  use Backend.DataCase

  alias Backend.Auth

  describe "users" do
    alias Backend.Auth.User

    import Backend.AuthFixtures

    @invalid_attrs %{access: nil, name: nil, username: nil, password: nil, email: nil, age: nil}

    test "list_users/0 returns all users" do
      user = user_fixture()
      assert Auth.list_users() == [user]
    end

    test "get_user!/1 returns the user with given id" do
      user = user_fixture()
      assert Auth.get_user!(user.id) == user
    end

    test "create_user/1 with valid data creates a user" do
      valid_attrs = %{access: "some access", name: "some name", username: "some username", password: "some password", email: "some email", age: 42}

      assert {:ok, %User{} = user} = Auth.create_user(valid_attrs)
      assert user.access == "some access"
      assert user.name == "some name"
      assert user.username == "some username"
      assert user.password == "some password"
      assert user.email == "some email"
      assert user.age == 42
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Auth.create_user(@invalid_attrs)
    end

    test "update_user/2 with valid data updates the user" do
      user = user_fixture()
      update_attrs = %{access: "some updated access", name: "some updated name", username: "some updated username", password: "some updated password", email: "some updated email", age: 43}

      assert {:ok, %User{} = user} = Auth.update_user(user, update_attrs)
      assert user.access == "some updated access"
      assert user.name == "some updated name"
      assert user.username == "some updated username"
      assert user.password == "some updated password"
      assert user.email == "some updated email"
      assert user.age == 43
    end

    test "update_user/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Auth.update_user(user, @invalid_attrs)
      assert user == Auth.get_user!(user.id)
    end

    test "delete_user/1 deletes the user" do
      user = user_fixture()
      assert {:ok, %User{}} = Auth.delete_user(user)
      assert_raise Ecto.NoResultsError, fn -> Auth.get_user!(user.id) end
    end

    test "change_user/1 returns a user changeset" do
      user = user_fixture()
      assert %Ecto.Changeset{} = Auth.change_user(user)
    end
  end
end
