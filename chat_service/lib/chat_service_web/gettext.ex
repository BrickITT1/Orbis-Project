defmodule ChatServiceWeb.Gettext do
  use Gettext.Backend,
    otp_app: :chat_service,
    priv: "priv/gettext"
end
