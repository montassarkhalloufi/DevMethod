import { useRef } from 'react';
import type { McpConnectInput } from '../model/mcp';
import type { McpConnectionsController } from '../hooks/useMcpConnections';

export function McpCredentialForm({
  input,
  controller,
  disabled = false,
}: {
  input: McpConnectInput;
  controller: McpConnectionsController;
  disabled?: boolean;
}) {
  const secret = useRef<HTMLInputElement>(null);
  return (
    <form
      className="mcp-credential-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!secret.current?.value || controller.active || disabled) return;
        const bearerToken = secret.current.value;
        secret.current.value = '';
        void controller.connect({ ...input, auth: 'bearer', bearerToken });
      }}
    >
      <label>
        Jeton personnel GitHub ciblé
        <input
          ref={secret}
          type="password"
          name="github-pat"
          autoComplete="off"
          spellCheck={false}
          required
          maxLength={8192}
          disabled={disabled || Boolean(controller.active)}
        />
      </label>
      <p className="mcp-note">
        Limitez le jeton aux dépôts nécessaires dans GitHub. Il reste dans le stockage privé local,
        hors de la demande et des exports. Le questionnaire ne modifie pas ses droits.
      </p>
      <a
        href="https://github.com/settings/personal-access-tokens/new"
        target="_blank"
        rel="noopener noreferrer"
      >
        Créer un jeton ciblé sur GitHub ↗
      </a>
      <button type="submit" className="primary" disabled={disabled || Boolean(controller.active)}>
        Connecter GitHub
      </button>
      {controller.error ? (
        <p role="alert">
          {controller.error} Vérifiez l’expiration du jeton, ses permissions et les restrictions de
          votre organisation, puis saisissez-le à nouveau.
        </p>
      ) : null}
    </form>
  );
}
