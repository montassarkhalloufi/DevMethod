import type { GuidePreparation } from '../../connectors';
import type { McpConnectInput } from './mcp';

export function guidedMcpInput(preparation: GuidePreparation): McpConnectInput {
  const native = preparation.nativeConnection;
  if (native?.providerId === 'notion' && native.url === 'https://mcp.notion.com/mcp')
    return { provider: 'notion' };
  if (
    native?.providerId === 'linear' &&
    ['https://mcp.linear.app/mcp', 'https://mcp.linear.app/mcp/readonly'].includes(native.url)
  )
    return { provider: 'linear', url: native.url };
  if (
    native?.providerId === 'github' &&
    ['https://api.githubcopilot.com/mcp/readonly', 'https://api.githubcopilot.com/mcp/'].includes(
      native.url,
    )
  )
    return { provider: 'github', url: native.url, auth: 'bearer' };
  throw new Error('Cette préparation ne propose pas de connexion MCP prise en charge.');
}
