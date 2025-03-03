defmodule BackendWeb.Plugs.Auth do
  import Plug.Conn
  alias Backend.Auth.Guardian

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, user, _claims} <- Guardian.resource_from_token(token) do
      assign(conn, :current_user, user)
    else
      _error -> conn |> put_status(:unauthorized) |> halt()
    end
  end
end
