defmodule ChatServiceWeb.Plugs.Auth do
  @moduledoc """
  Plug для проверки аутентификации через JWT-токен.
  """
  import Plug.Conn
  # Импортируем функцию json/2
  import Phoenix.Controller, only: [json: 2]
  alias ChatService.AuthClient

  def init(opts), do: opts

  def call(conn, _opts) do
    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        case AuthClient.verify_token(token) do
          {:ok, user} ->
            assign(conn, :current_user, user)

          {:error, _reason} ->
            send_unauthorized(conn)
        end

      _ ->
        send_unauthorized(conn)
    end
  end

  defp send_unauthorized(conn) do
    conn
    |> put_status(:unauthorized)
    # Теперь функция json/2 доступна
    |> json(%{error: "Unauthorized"})
    |> halt()
  end
end
