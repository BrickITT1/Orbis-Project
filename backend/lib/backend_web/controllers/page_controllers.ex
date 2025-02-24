defmodule BackendWeb.PageController do
  use BackendWeb, :controller

  def index(conn, _params) do
    # Отправляем index.html
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, "/app/lib/backend-0.1.0/priv/static/index.html")
  end
end
