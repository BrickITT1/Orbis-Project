defmodule PhxTest.Repo do
  use Ecto.Repo,
    otp_app: :phx_test,
    adapter: Ecto.Adapters.Postgres
end
