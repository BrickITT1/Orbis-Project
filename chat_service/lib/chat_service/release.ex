# chat_service/lib/chat_service/release.ex
defmodule ChatService.Release do
  @app :chat_service

  def migrate do
    IO.puts("Running chat service migrations...")
    load_app()

    for repo <- repos() do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  defp repos do
    Application.fetch_env!(@app, :ecto_repos)
  end

  defp load_app do
    Application.load(@app)
  end
end
