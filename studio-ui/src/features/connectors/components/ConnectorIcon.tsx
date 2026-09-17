import { connectorIconSource } from './connector-icon-sources';
import './connector-icon.css';

type ConnectorIconProps = {
  optionId: string;
  title?: string;
  size?: number;
};

const initials: Readonly<Record<string, string>> = Object.freeze({
  'diagnostic-api': 'API',
  'diagnostic-mcp': 'MCP',
  'application-api': 'API',
  'application-mcp': 'MCP',
  'existing-backend': 'BE',
  'playwright-mcp': 'PW',
  playwright: 'PW',
  'axe-core': 'AX',
  smtp: 'SMTP',
  mailpit: 'MP',
  keycloak: 'KC',
  openai: 'AI',
  slack: 'S',
  twilio: 'T',
  s3: 'S3',
});

export function ConnectorIcon({ optionId, title, size = 32 }: ConnectorIconProps) {
  const source = connectorIconSource(optionId);
  const dimension = Number.isFinite(size) ? Math.min(96, Math.max(16, size)) : 32;
  const label = title?.trim() || undefined;
  const fallback = Object.hasOwn(initials, optionId)
    ? initials[optionId]
    : optionId
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 2)
        .toUpperCase() || '?';
  return (
    <span
      className={`connector-icon${source ? '' : ' connector-icon--initials'}`}
      style={{ width: dimension, height: dimension, fontSize: dimension * 0.3 }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      translate="no"
    >
      {source ? (
        <img
          src={source}
          alt=""
          width={Math.round(dimension * 0.65)}
          height={Math.round(dimension * 0.65)}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      ) : (
        fallback
      )}
    </span>
  );
}
