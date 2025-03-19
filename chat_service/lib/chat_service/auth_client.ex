defmodule ChatService.AuthClient do
  @auth_service_url System.get_env("AUTH_SERVICE_URL") || "http://auth_service:3000"

  def verify_token(token) do
    case Req.get("#{@auth_service_url}/api/auth/verify",
           headers: [authorization: "Bearer #{token}"]
         ) do
      # Заменить на реальную логику
      {:ok, %{status: 200}} -> {:ok, %{id: "user_id_from_response"}}
      _ -> {:error, :invalid_token}
    end
  end
end
