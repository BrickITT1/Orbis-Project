defmodule BackendWeb.AuthJSON do
  @moduledoc """
  Представление для обработки JSON-ответов аутентификации
  """

  def render("token.json", %{token: token}) do
    %{data: %{token: token}}
  end

  def render("error.json", %{message: message}) do
    %{errors: %{detail: message}}
  end

  def render("error.json", %{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
