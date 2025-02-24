defmodule BackendWeb.PageController do
  use BackendWeb, :controller

  def index(conn, _params) do
    # Отправляем index.html
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, "priv/static/index.html")
  end
end
