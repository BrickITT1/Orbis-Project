defmodule BackendWeb.Plugs.Auth do
  import Plug.Conn
  import Phoenix.Controller
  alias Backend.Auth.Guardian
  alias Backend.RedisClient

  def init(opts), do: opts

  def call(conn, _opts) do
    conn = fetch_cookies(conn)

    case get_req_header(conn, "authorization") do
      ["Bearer " <> token] ->
        case Guardian.verify_token_type(token, "access") do
          {:ok, claims} ->
            case RedisClient.get("revoked:#{claims["jti"]}") do
              {:ok, nil} ->
                case Guardian.resource_from_claims(claims) do
                  {:ok, user} ->
                    assign(conn, :current_user, user)

                  _ ->
                    # Добавляем проверку refresh-токена
                    check_refresh_token(conn)
                end

              _ ->
                check_refresh_token(conn)
            end

          _ ->
            check_refresh_token(conn)
        end

      _ ->
        check_refresh_token(conn)
    end
  end

  defp check_refresh_token(conn) do
    case conn.cookies["refresh_token"] do
      nil ->
        auth_error(conn)

      refresh_token ->
        with {:ok, claims} <- Guardian.verify_token_type(refresh_token, "refresh"),
             {:ok, user} <- Guardian.resource_from_claims(claims),
             {:ok, stored} <- RedisClient.get("refresh_token:#{user.id}"),
             true <- refresh_token == stored do
          assign(conn, :current_user, user)
        else
          _ -> auth_error(conn)
        end
    end
  end

  defp auth_error(conn) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: "Unauthorized"})
    |> halt()
  end
end
