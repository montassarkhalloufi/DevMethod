import { translate } from '../../../i18n';
export interface AgentSettings {
  version: number;
  enabled: boolean;
  access: 'chatgpt' | 'api-key' | null;
  maxJobs: number;
  maxTokens: number;
  timeoutMs: number;
}

export interface AgentStatus {
  settings: AgentSettings;
  availability: {
    available: boolean | null;
    connected: boolean;
    access: 'chatgpt' | 'api-key' | 'unknown';
    version: string | null;
    checkedAt: string | null;
    message: string;
  };
  historicalBudget: boolean;
  configuring: boolean;
  running: boolean;
  automatic: boolean;
  message?: string;
}

export interface AgentWidgetProps {
  agent: AgentStatus;
  onStatus(agent: AgentStatus): void;
}

export function accessLabel(
  access: AgentStatus['availability']['access'],
  locale: 'en' | 'fr' = 'en',
) {
  if (access === 'chatgpt')
    return translate('Abonnement ChatGPT', 'ChatGPT subscription', undefined, locale);
  if (access === 'api-key')
    return translate(
      'Clé API · facturation OpenAI Platform',
      'API key · OpenAI Platform billing',
      undefined,
      locale,
    );
  return translate('Type d’accès inconnu', 'Unknown access type', undefined, locale);
}
