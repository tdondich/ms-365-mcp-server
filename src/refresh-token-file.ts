/**
 * FellowHire fork addition: refresh-token-file mode.
 *
 * Runs the server as an unattended, headless daemon that authenticates from a
 * centrally-minted delegated refresh token stored in a 0600 file, self-refreshes
 * via a confidential client, and rewrites the rotated refresh token back to the
 * same file so the FellowHire Orchestrator can mirror it. This replaces stock
 * softeria's headless BYOT (`MS365_MCP_OAUTH_TOKEN`), which takes an access
 * token only and never refreshes.
 *
 * Enable by setting `MS365_MCP_REFRESH_TOKEN_FILE` (plus `MS365_MCP_CLIENT_ID`,
 * `MS365_MCP_CLIENT_SECRET`, `MS365_MCP_TENANT_ID`). Optionally pin the exact
 * refresh scopes with `MS365_MCP_SCOPES` so they match what was consented,
 * regardless of the tool-derived scope set.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

export function getRefreshTokenFilePath(): string | null {
  const value = process.env.MS365_MCP_REFRESH_TOKEN_FILE;
  return value && value.trim() !== '' ? value : null;
}

/**
 * Explicit refresh scopes from `MS365_MCP_SCOPES` (whitespace-separated), or
 * null to fall back to the tool-derived scopes. Pinning avoids failures when
 * the tool-derived scope strings don't match what the mailbox consented to.
 */
export function getRefreshTokenFileScopes(): string[] | null {
  const value = process.env.MS365_MCP_SCOPES;
  if (!value || value.trim() === '') {
    return null;
  }
  return value.split(/\s+/).filter((scope) => scope.length > 0);
}

export async function readRefreshTokenFile(filePath: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const token = raw.trim();
    return token !== '' ? token : null;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Atomically write the refresh token to its file with 0600 perms, matching how
 * the QuickBooks MCP server rewrites its rotating credential in place.
 */
export async function writeRefreshTokenFile(filePath: string, token: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, `${token.trim()}\n`, { mode: 0o600 });
  await fs.rename(tmp, filePath);
}
