import { useI18n } from '../../../i18n';
import { connectorText } from '../../connectors/model/i18n';
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
  const { locale } = useI18n();
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
        {connectorText('Jeton personnel GitHub ciblé', locale)}
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
        {connectorText(
          'Limitez le jeton aux dépôts nécessaires dans GitHub. Il reste dans le stockage privé local, hors de la demande et des exports. Le questionnaire ne modifie pas ses droits.',
          locale,
        )}
      </p>
      <a
        href="https://github.com/settings/personal-access-tokens/new"
        target="_blank"
        rel="noopener noreferrer"
      >
        {connectorText('Créer un jeton ciblé sur GitHub ↗', locale)}
      </a>
      <button type="submit" className="primary" disabled={disabled || Boolean(controller.active)}>
        {connectorText('Connecter GitHub', locale)}
      </button>
      {controller.error ? (
        <p role="alert">
          {connectorText(controller.error, locale)}{' '}
          {connectorText(
            'Vérifiez l’expiration du jeton, ses permissions et les restrictions de votre organisation, puis saisissez-le à nouveau.',
            locale,
          )}
        </p>
      ) : null}
    </form>
  );
}
