defmodule ChatServiceWeb.UserSocket do
  use Phoenix.Socket
  alias ChatServiceWeb.AuthClient

  channel("chat:*", ChatServiceWeb.ChatChannel)

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case AuthClient.verify_token(token) do
      {:ok, user} -> {:ok, assign(socket, :user, user)}
      {:error, _} -> :error
    end
  end

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user.id}"
end
