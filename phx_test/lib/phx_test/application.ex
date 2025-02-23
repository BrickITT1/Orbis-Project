defmodule PhxTest.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      PhxTestWeb.Telemetry,
      PhxTest.Repo,
      {DNSCluster, query: Application.get_env(:phx_test, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: PhxTest.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: PhxTest.Finch},
      # Start a worker by calling: PhxTest.Worker.start_link(arg)
      # {PhxTest.Worker, arg},
      # Start to serve requests, typically the last entry
      PhxTestWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: PhxTest.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    PhxTestWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
