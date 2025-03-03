# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Backend.Repo.insert!(%Backend.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.
alias Backend.Repo
alias Backend.Auth.User

Repo.insert!(%User{
  email: "test@example.com",
  username: "test_user",
  display_name: "Test User",
  password_hash: Pbkdf2.hash_pwd_salt("secret123"),
  birth_date: ~D[2000-01-01],
  access: "user"
})
