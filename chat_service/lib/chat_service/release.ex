defmodule ChatService.Release do
  @app :chat_service

  def migrate do
    load_app()

    for repo <- Application.get_env(@app, :ecto_repos) do
      {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
    end
  end

  defp load_app, do: Application.load(@app)
end
