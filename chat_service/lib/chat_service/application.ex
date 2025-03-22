defmodule ChatService.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      ChatService.Repo,
      ChatServiceWeb.Endpoint,
      {Phoenix.PubSub, name: ChatService.PubSub},
      # Добавьте эту строку
      ChatService.RedisClient,
      ChatService.ChatArchiver
    ]

    Supervisor.start_link(children, strategy: :one_for_one)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    ChatServiceWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
