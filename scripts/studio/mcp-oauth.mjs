import { createHash } from 'node:crypto';
import { mcpRequire } from './mcp-contract.mjs';
import { mcpTarget } from './mcp-network.mjs';

export function createMcpOAuth({ entry, operation, callbackURL, saveSecret, assertCurrent, now }) {
  const update = (change) => {
    assertCurrent();
    entry.secret = { ...entry.secret, ...change };
    saveSecret(entry.secret);
  };
  return {
    get redirectUrl() {
      return callbackURL;
    },
    get clientMetadata() {
      return {
        client_name: 'DevMethod Studio',
        redirect_uris: [callbackURL],
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        token_endpoint_auth_method: 'none',
      };
    },
    state: () => operation.state,
    clientInformation() {
      if (entry.secret.client && !entry.secret.client.redirect_uris?.includes(callbackURL))
        update({ client: undefined, tokens: undefined, expiresAt: undefined });
      return entry.secret.client;
    },
    saveClientInformation(client) {
      mcpRequire(
        JSON.stringify(client).length <= 32768 && client.redirect_uris?.includes(callbackURL),
        'Enregistrement OAuth incompatible.',
        400,
        'oauth-registration',
      );
      update({ client });
    },
    tokens: () => entry.secret.tokens,
    saveTokens(tokens) {
      mcpRequire(
        typeof tokens.access_token === 'string' &&
          tokens.access_token.length <= 8192 &&
          /^bearer$/i.test(tokens.token_type) &&
          JSON.stringify(tokens).length <= 32768 &&
          (tokens.expires_in === undefined ||
            (Number.isFinite(tokens.expires_in) && tokens.expires_in > 0)),
        'Réponse OAuth incompatible.',
        400,
        'oauth-token',
      );
      update({
        tokens: { ...entry.secret.tokens, ...tokens },
        expiresAt: tokens.expires_in ? now() + tokens.expires_in * 1000 : undefined,
      });
    },
    saveCodeVerifier(verifier) {
      assertCurrent();
      mcpRequire(/^[A-Za-z0-9._~-]{43,128}$/.test(verifier), 'Vérificateur OAuth invalide.');
      operation.verifier = verifier;
    },
    codeVerifier() {
      assertCurrent();
      mcpRequire(operation.verifier, 'Autorisation OAuth expirée.', 400, 'oauth-expired');
      return operation.verifier;
    },
    async redirectToAuthorization(url) {
      assertCurrent();
      await mcpTarget(url, entry.url);
      assertCurrent();
      const expected = new URL(
        entry.secret.discovery.authorizationServerMetadata.authorization_endpoint,
      );
      const challenge = createHash('sha256').update(operation.verifier).digest('base64url');
      mcpRequire(
        url.origin === expected.origin &&
          url.pathname === expected.pathname &&
          url.searchParams.get('state') === operation.state &&
          url.searchParams.get('redirect_uri') === callbackURL &&
          url.searchParams.get('code_challenge_method') === 'S256' &&
          url.searchParams.get('code_challenge') === challenge &&
          url.searchParams.get('response_type') === 'code',
        'Redirection OAuth refusée.',
        400,
        'oauth-redirect',
      );
      operation.authorizationUrl = url.href;
    },
    discoveryState: () => entry.secret.discovery,
    async saveDiscoveryState(discovery) {
      const metadata = discovery.authorizationServerMetadata;
      mcpRequire(
        metadata &&
          metadata.issuer &&
          metadata.authorization_endpoint &&
          metadata.token_endpoint &&
          metadata.code_challenge_methods_supported?.includes('S256'),
        'Serveur OAuth sans métadonnées PKCE compatibles.',
        400,
        'oauth-metadata',
      );
      const issuer = new URL(metadata.issuer),
        expected = new URL(discovery.authorizationServerUrl);
      mcpRequire(
        issuer.href.replace(/\/$/, '') === expected.href.replace(/\/$/, ''),
        'Émetteur OAuth incohérent.',
        400,
        'oauth-issuer',
      );
      for (const url of [
        metadata.issuer,
        metadata.authorization_endpoint,
        metadata.token_endpoint,
        metadata.registration_endpoint,
      ].filter(Boolean))
        await mcpTarget(url, entry.url);
      if (
        entry.secret.discovery?.authorizationServerUrl &&
        entry.secret.discovery.authorizationServerUrl !== discovery.authorizationServerUrl
      )
        update({ tokens: undefined, client: undefined, expiresAt: undefined });
      update({ discovery });
    },
    invalidateCredentials(scope) {
      assertCurrent();
      if (scope === 'all' || scope === 'tokens')
        update({ tokens: undefined, expiresAt: undefined });
      if (scope === 'all' || scope === 'client') update({ client: undefined });
      if (scope === 'all' || scope === 'discovery') update({ discovery: undefined });
      if (scope === 'all' || scope === 'verifier') operation.verifier = undefined;
    },
  };
}
