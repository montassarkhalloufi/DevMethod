import type { ConnectorConnection, ConnectorOption } from './contracts';

export function preferredConnector(
  choices: ConnectorOption[],
  connections: ConnectorConnection[],
  checkId: string | undefined,
) {
  const compatible = choices.filter((item) => item.checkIds.includes(checkId || ''));
  for (const status of ['attested', 'configured']) {
    const match = compatible.find((item) =>
      connections.some((entry) => entry.optionId === item.id && entry.status === status),
    );
    if (match) return match;
  }
  return compatible.find((item) => item.transport === 'local') || compatible[0];
}

export function searchable(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr-FR');
}

export function compactConnectionLabel(connection: ConnectorConnection | undefined) {
  if (!connection) return 'À configurer';
  if (connection.status === 'attested') return 'Disponibilité attestée';
  if (connection.status === 'failed') return 'Connexion à revoir';
  return 'Configuré · à vérifier';
}
