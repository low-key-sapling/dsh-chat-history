/**
 * dsh-chat-history — host half.
 *
 * Mounts the two routes the official API lacks:
 * - POST /api/dsh-chat-history/unarchive — removes a session from the
 *   workspace registry's registry-global archive set;
 * - POST /api/dsh-chat-history/delete — permanently deletes an ARCHIVED
 *   session: removes its archive marker and workspace accounting slot, then
 *   deletes the session log directory from disk.
 *
 * The official UI can archive sessions but has no viewing, unarchive, or
 * delete surface for them; the browser half of this plugin (./client) renders
 * the right-side history panel and the archived-sessions settings page and
 * calls these routes to restore/remove them. Everything else the panel does
 * (list, history preview, rename, archive, jump) rides official RPCs from the
 * browser — no dsh source changes.
 *
 * Both writes go through the WorkspaceRegistry's own operation chain
 * (enqueueOperation) and state setter (setState), so the registry's in-memory
 * cache, the durable domain global, and the host stream's
 * `host/archived-sessions-changed` frame all stay consistent. The unarchive
 * write touches only the global archive set; the delete write also rewrites
 * the owning workspace record's `sessionIds` through the registry's table.
 * These methods are private on the concrete class today (the official surface
 * only exposes archiveSession), so this file reaches them through a
 * structural cast.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { rmSync } from 'node:fs'
import { dirname } from 'node:path'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-persistence'
import { isLoopbackRequest } from './loopback.ts'

/** Stable cordis plugin name. */
export const name = 'chat-history'

/** Services required before the routes can mount. */
export const inject = ['webServer', 'workspaceRegistry', 'sessions', 'sessionPersistence']

/** Route family paths (shared spelling with the browser half). */
export const CHAT_HISTORY_API = {
  unarchive: '/api/dsh-chat-history/unarchive',
  delete: '/api/dsh-chat-history/delete',
} as const

/** Cap on JSON request bodies (a session id is tiny). */
const MAX_JSON_BODY_BYTES = 64 * 1024

/** Durable shape of one workspace record (see @deepseek-ai/dsh-workspace). */
interface WorkspaceRecordLike {
  path: string
  title: string
  sessionIds: readonly string[]
  createdAt: string
  updatedAt: string
}

/**
 * The private WorkspaceRegistry face the delete/unarchive writes need. Public
 * surface only exposes `archiveSession`; the structural contract below is
 * what `enqueueOperation` / `requireState` / `setState` / `requireTable`
 * actually are on the concrete class, so these writes follow the exact same
 * chain as the official archive path.
 */
interface WorkspaceRegistryLike {
  /** Read the registry-global archive set (getter on the service). */
  readonly archivedSessionIds: readonly string[]
  /** Serialize one mutation on the registry's operation chain. */
  enqueueOperation<T>(operation: () => Promise<T>): Promise<T>
  /** Current durable global state (throws before the registry started). */
  requireState(): { archivedSessionIds: readonly string[]; workspaceIds: readonly string[] }
  /** Write the next global state durably and update the registry cache. */
  setState(state: { archivedSessionIds: readonly string[]; workspaceIds: readonly string[] }): Promise<void>
  /** The workspace table handle (records keyed by workspace id). */
  requireTable(): {
    get(key: string): WorkspaceRecordLike | undefined
    put(key: string, value: WorkspaceRecordLike): Promise<void>
  }
}

/** One JSON response. */
function writeJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'referrer-policy': 'no-referrer',
  })
  res.end(payload)
}

/** Read a JSON request body (undefined when too large or unparseable). */
async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown> | undefined> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > MAX_JSON_BODY_BYTES) return undefined
    chunks.push(buffer)
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

/**
 * Mount the unarchive + delete routes.
 * @param ctx - host plugin context carrying webServer and workspaceRegistry.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const registry = ctx.workspaceRegistry as unknown as WorkspaceRegistryLike

    ctx.webServer.register({
      kind: 'exact',
      path: CHAT_HISTORY_API.unarchive,
      handler: async (req, res) => {
        if (!isLoopbackRequest(req) || req.method !== 'POST') {
          writeJson(res, 403, { error: 'forbidden: loopback-only' })
          return
        }
        const body = await readJsonBody(req)
        const sessionId = typeof body?.sessionId === 'string' && body.sessionId !== '' ? body.sessionId : undefined
        if (sessionId === undefined) {
          writeJson(res, 400, { error: 'sessionId is required' })
          return
        }
        try {
          await registry.enqueueOperation(async () => {
            const state = registry.requireState()
            // Idempotent no-op: an id outside the archive set is already unarchived.
            if (!state.archivedSessionIds.includes(sessionId)) return
            await registry.setState({
              ...state,
              archivedSessionIds: state.archivedSessionIds.filter(id => id !== sessionId),
            })
          })
          writeJson(res, 200, {
            ok: true,
            archivedSessionIds: [...registry.archivedSessionIds],
          })
        } catch (error) {
          writeJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
        }
      },
    }, 'chat-history: unarchive route')

    ctx.webServer.register({
      kind: 'exact',
      path: CHAT_HISTORY_API.delete,
      handler: async (req, res) => {
        if (!isLoopbackRequest(req) || req.method !== 'POST') {
          writeJson(res, 403, { error: 'forbidden: loopback-only' })
          return
        }
        const body = await readJsonBody(req)
        const sessionId = typeof body?.sessionId === 'string' && body.sessionId !== '' ? body.sessionId : undefined
        if (sessionId === undefined) {
          writeJson(res, 400, { error: 'sessionId is required' })
          return
        }
        // The client always sends confirm:true — a belt-and-braces guard so a
        // forged or accidental bare request cannot destroy a conversation.
        if (body?.confirm !== true) {
          writeJson(res, 400, { error: 'confirm:true is required' })
          return
        }

        // Only ARCHIVED sessions may be deleted (the only surface that offers
        // deletion), and a live/running session must never be removed.
        if (!registry.archivedSessionIds.includes(sessionId)) {
          writeJson(res, 409, { error: 'only archived sessions can be deleted' })
          return
        }
        if (ctx.sessions.get(sessionId) !== undefined) {
          writeJson(res, 409, { error: 'a running session cannot be deleted' })
          return
        }

        // Resolve the session's log directory through the persistence backend
        // (the same location source the registry uses for its header index).
        // A session whose log is ALREADY gone (an earlier partial delete or a
        // manually removed directory) is still deleted thoroughly: the
        // accounting cleanup below proceeds and the route succeeds.
        let sessionDir: string | undefined
        try {
          const headers = await ctx.sessionPersistence.list()
          const header = headers.find(candidate => candidate.id === sessionId)
          if (header !== undefined) {
            const location = ctx.sessionPersistence.locate(header)
            if (location !== undefined) sessionDir = dirname(location.path)
          }
        } catch (error) {
          writeJson(res, 500, { error: `cannot resolve session location: ${error instanceof Error ? error.message : String(error)}` })
          return
        }

        // 1) Durable accounting: drop the archive marker and the workspace
        //    membership slot. setState fires host/archived-sessions-changed,
        //    and the table put fires host/workspace-changed, so the browser
        //    surfaces update immediately.
        let ownedWorkspaceId: string | undefined
        try {
          await registry.enqueueOperation(async () => {
            const state = registry.requireState()
            const nextArchived = state.archivedSessionIds.filter(id => id !== sessionId)
            await registry.setState({
              ...state,
              archivedSessionIds: nextArchived,
            })
            const table = registry.requireTable()
            for (const workspaceId of state.workspaceIds) {
              const record = table.get(workspaceId)
              if (record === undefined || !record.sessionIds.includes(sessionId)) continue
              ownedWorkspaceId = workspaceId
              await table.put(workspaceId, {
                ...record,
                sessionIds: record.sessionIds.filter(id => id !== sessionId),
                updatedAt: new Date().toISOString(),
              })
              break
            }
          })
        } catch (error) {
          writeJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
          return
        }

        // 2) Delete the log directory — the irreversible step, performed last.
        //    Absent (already gone) is success. On failure the accounting is
        //    rolled back so the session remains archived and intact for a retry.
        if (sessionDir !== undefined) {
          try {
            rmSync(sessionDir, { recursive: true, force: true })
          } catch (error) {
            try {
              await registry.enqueueOperation(async () => {
                const state = registry.requireState()
                if (!state.archivedSessionIds.includes(sessionId)) {
                  await registry.setState({
                    ...state,
                    archivedSessionIds: [...state.archivedSessionIds, sessionId],
                  })
                }
                if (ownedWorkspaceId !== undefined) {
                  const table = registry.requireTable()
                  const record = table.get(ownedWorkspaceId)
                  if (record !== undefined && !record.sessionIds.includes(sessionId)) {
                    await table.put(ownedWorkspaceId, {
                      ...record,
                      sessionIds: [...record.sessionIds, sessionId],
                      updatedAt: new Date().toISOString(),
                    })
                  }
                }
              })
            } catch {
              // Rollback is best-effort; the primary error is reported below.
            }
            writeJson(res, 500, { error: `failed to delete session log: ${error instanceof Error ? error.message : String(error)}` })
            return
          }
        }

        writeJson(res, 200, {
          ok: true,
          archivedSessionIds: [...registry.archivedSessionIds],
        })
      },
    }, 'chat-history: delete route')

    return () => undefined
  }, 'chat-history: routes')
}
