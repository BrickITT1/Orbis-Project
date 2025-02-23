defmodule PhxTestWeb.PageController do
  use PhxTestWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :home, layout: false)
  end

  def custom(conn, _params) do
    render(conn, "custom.html")
  end
end
