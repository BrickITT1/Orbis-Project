defmodule Backend.Auth.Guardian do
  use Guardian, otp_app: :backend
  alias Backend.RedisClient

  @impl Guardian
  def subject_for_token(user, _claims), do: {:ok, to_string(user.id)}

  @impl Guardian
  def resource_from_claims(claims) do
    case Backend.Auth.get_user(claims["sub"]) do
      {:ok, user} -> {:ok, user}
      {:error, _} -> {:error, :resource_not_found}
    end
  end

  def generate_tokens(user) do
    {:ok, access, _} = encode_and_sign(user, %{}, token_type: "access", ttl: {15, :minutes})
    {:ok, refresh, _} = encode_and_sign(user, %{}, token_type: "refresh", ttl: {7, :days})
    {:ok, access, refresh}
  end

  @impl Guardian
  def revoke(token, opts) do
    with {:ok, claims} <- decode_and_verify(token),
         jti when is_binary(jti) <- claims["jti"],
         exp when is_integer(exp) <- claims["exp"] do
      ttl = exp - DateTime.to_unix(DateTime.utc_now())
      if ttl > 0, do: RedisClient.setex("revoked:#{jti}", ttl, "1")
      :ok
    else
      _ -> if opts[:force], do: :ok, else: {:error, :revocation_failed}
    end
  end

  def verify_token_type(token, expected_type) do
    with {:ok, claims} <- decode_and_verify(token),
         true <- claims["typ"] == expected_type do
      {:ok, claims}
    else
      _ -> {:error, :invalid_token_type}
    end
  end
end
