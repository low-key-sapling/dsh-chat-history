/**
 * Browser-side data access for the dsh-chat-history surfaces. Two paths:
 * - official RPCs through `ctx.connection.api` (rename) and the client
 *   services (ctx.sessions / ctx.workspaces);
 * - the host routes the official API lacks: /api/dsh-chat-history/unarchive
 *   and /api/dsh-chat-history/delete (plain same-origin fetch, loopback-fenced
 *   on the host).
 */

import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'

/** Route family paths, mirrored from the host half. */
export const CHAT_HISTORY_API = {
  unarchive: '/api/dsh-chat-history/unarchive',
  delete: '/api/dsh-chat-history/delete',
} as const

/** Text content of a ContentBlock[] (text blocks only), joined and trimmed. */
export function textOf(content: readonly { type: string; text?: string }[] | undefined): string {
  if (!Array.isArray(content)) return ''
  return content
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => (block as { text: string }).text)
    .join('\n')
    .trim()
}

/** Shorten one message to a cap, appending an ellipsis when cut. */
export function truncate(text: string, max = 160): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return normalized.slice(0, max) + '…'
}

/**
 * Rename a session through the official RPC (pins the title against
 * automatic regeneration).
 * @param ctx - client root context.
 * @param sessionId - target session.
 * @param title - the new display title.
 */
export async function renameSession(ctx: ClientContext, sessionId: SessionId, title: string): Promise<void> {
  const response = await ctx.connection.api.sessions.rename({ sessionId, title })
  const result = response.result
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`)
  }
}

/**
 * Remove a session from the registry-global archive set through the host
 * route (the official API has no unarchive RPC).
 * @param sessionId - target session.
 * @returns the updated archive set.
 */
export async function unarchiveSession(sessionId: SessionId): Promise<readonly string[]> {
  return postHost(CHAT_HISTORY_API.unarchive, { sessionId })
}

/**
 * Permanently delete an archived session through the host route: archive
 * marker + workspace accounting + the session log directory. Only archived
 * sessions are accepted; the host refuses live sessions.
 * @param sessionId - target (archived) session.
 * @returns the updated archive set.
 */
export async function deleteArchivedSession(sessionId: SessionId): Promise<readonly string[]> {
  return postHost(CHAT_HISTORY_API.delete, { sessionId, confirm: true })
}

/** One POST to a plugin host route with a JSON body, returning the archive set. */
async function postHost(path: string, body: Record<string, unknown>): Promise<readonly string[]> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  let parsed: { ok?: boolean; error?: string; archivedSessionIds?: readonly string[] } | null = null
  try {
    parsed = await response.json() as typeof parsed
  } catch {
    parsed = null
  }
  if (!response.ok || parsed === null || parsed.ok !== true) {
    throw new Error(parsed?.error ?? `HTTP ${response.status}`)
  }
  return parsed.archivedSessionIds ?? []
}
