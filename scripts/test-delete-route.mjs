// Standalone harness test for the host delete route (src/index.ts / lib/index.js).
// Loads the built host half, captures the registered web routes, and runs the
// delete handler against a mock ctx (fake registry + persistence + sessions),
// verifying guards, accounting, dir deletion, and responses.
import assert from 'node:assert'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { apply, CHAT_HISTORY_API } = await import('../lib/index.js')

// ---------------------------------------------------------------- mock ctx
const SESSION_ID = 'session-test-delete-1234'
const WORKSPACE_ID = 'ws-1'

let nextBody = null
const handlers = new Map()

const mockCtx = {
  effect: (fn) => fn(),
  webServer: {
    register(entry) {
      handlers.set(entry.path, entry.handler)
    },
  },
  workspaceRegistry: {
    get archivedSessionIds() { return mockState.global.archivedSessionIds },
    enqueueOperation: (op) => op(),
    requireState: () => mockState.global,
    setState: async (state) => { mockState.global = state },
    requireTable: () => ({
      get: (id) => mockState.tables.workspaces[id],
      put: async (id, record) => { mockState.tables.workspaces[id] = record },
    }),
  },
  sessionPersistence: {
    list: async () => [{ id: SESSION_ID, cwd: 'D:\\scratch' }],
    locate: () => ({ kind: 'jsonl', path: join(sessionDir, 'session.jsonl.zstd') }),
  },
  sessions: { get: () => undefined },
}

// ------------------------------------------------------------- mock helpers
const root = mkdtempSync(join(tmpdir(), 'chh-delete-test-'))
const sessionDir = join(root, 'session-0')
mkdirSync(sessionDir, { recursive: true })
writeFileSync(join(sessionDir, 'session.jsonl.zstd'), 'HEADER\nEVENT\n')

const mockState = {
  global: {
    initialized: true,
    workspaceIds: [WORKSPACE_ID],
    archivedSessionIds: [SESSION_ID],
  },
  tables: {
    workspaces: {
      [WORKSPACE_ID]: {
        path: 'D:\\scratch',
        title: 'scratch',
        sessionIds: [SESSION_ID, 'session-other'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  },
}

// -------------------------------------------------------------- route runner
function runHandler(path, body, method = 'POST') {
  const req = {
    method,
    socket: { remoteAddress: '127.0.0.1' },
    headers: { host: '127.0.0.1:3080', 'sec-fetch-site': 'same-origin' },
    [Symbol.asyncIterator]() {
      const payload = Buffer.from(JSON.stringify(body ?? {}))
      let done = false
      return {
        next: () => Promise.resolve(done ? { done: true, value: undefined } : ((done = true), { done: false, value: payload })),
      }
    },
  }
  let status = 0
  let json = null
  const res = {
    writeHead: (s) => { status = s },
    end: (payload) => { json = JSON.parse(payload) },
  }
  return handlers.get(path)(req, res).then(() => ({ status, json }))
}

// -------------------------------------------------------------------- tests
apply(mockCtx)

assert.ok(handlers.has(CHAT_HISTORY_API.delete), 'delete route registered')
assert.ok(handlers.has(CHAT_HISTORY_API.unarchive), 'unarchive route still registered')

// 1) missing confirm -> 400
{
  const r = await runHandler(CHAT_HISTORY_API.delete, { sessionId: SESSION_ID })
  assert.equal(r.status, 400, 'missing confirm -> 400, got ' + r.status)
}

// 2) not archived -> 409
{
  mockState.global.archivedSessionIds = []
  const r = await runHandler(CHAT_HISTORY_API.delete, { sessionId: SESSION_ID, confirm: true })
  assert.equal(r.status, 409, 'not archived -> 409, got ' + r.status)
  mockState.global.archivedSessionIds = [SESSION_ID]
}

// 3) live session -> 409
{
  mockCtx.sessions.get = () => ({ id: SESSION_ID })
  const r = await runHandler(CHAT_HISTORY_API.delete, { sessionId: SESSION_ID, confirm: true })
  assert.equal(r.status, 409, 'live -> 409, got ' + r.status)
  mockCtx.sessions.get = () => undefined
}

// 4) log already gone (dir absent) -> 200 with accounting cleaned (idempotent)
{
  const originalList = mockCtx.sessionPersistence.list
  mockCtx.sessionPersistence.list = async () => [{ id: 'session-other', cwd: 'D:\\scratch' }]
  const r = await runHandler(CHAT_HISTORY_API.delete, { sessionId: SESSION_ID, confirm: true })
  assert.equal(r.status, 200, 'absent log -> 200 (idempotent), got ' + r.status + ' ' + JSON.stringify(r.json))
  assert.ok(!mockState.global.archivedSessionIds.includes(SESSION_ID), 'archive marker removed even without a log')
  const record = mockState.tables.workspaces[WORKSPACE_ID]
  assert.ok(!record.sessionIds.includes(SESSION_ID), 'workspace slot removed even without a log')
  mockCtx.sessionPersistence.list = originalList
  // re-seed state for the remaining tests
  mockState.global.archivedSessionIds = [SESSION_ID]
  mockState.tables.workspaces[WORKSPACE_ID].sessionIds = [SESSION_ID, 'session-other']
}

// 5) happy path: archive marker removed, workspace slot removed, dir deleted
{
  assert.ok(existsSync(sessionDir), 'session dir exists before delete')
  const r = await runHandler(CHAT_HISTORY_API.delete, { sessionId: SESSION_ID, confirm: true })
  assert.equal(r.status, 200, 'delete -> 200, got ' + r.status + ' ' + JSON.stringify(r.json))
  assert.ok(r.json.ok === true)
  assert.ok(!mockState.global.archivedSessionIds.includes(SESSION_ID), 'archive marker removed')
  const record = mockState.tables.workspaces[WORKSPACE_ID]
  assert.ok(!record.sessionIds.includes(SESSION_ID), 'workspace accounting slot removed')
  assert.ok(record.sessionIds.includes('session-other'), 'other sessions untouched')
  assert.ok(!existsSync(sessionDir), 'session dir deleted')
}

// 6) rm failure -> 500 + rollback
{
  // re-seed state + make the session dir path invalid so rmSync throws even
  // with force:true (Windows rejects ':' in path segments with EINVAL).
  mockState.global.archivedSessionIds = [SESSION_ID]
  mockState.tables.workspaces[WORKSPACE_ID].sessionIds = [SESSION_ID, 'session-other']
  const originalLocate = mockCtx.sessionPersistence.locate
  // sessionDir becomes the process cwd itself, which Windows refuses to
  // delete (EPERM: directory in use) even with force:true.
  mockCtx.sessionPersistence.locate = () => ({ kind: 'jsonl', path: join(process.cwd(), 'session.jsonl.zstd') })
  const r = await runHandler(CHAT_HISTORY_API.delete, { sessionId: SESSION_ID, confirm: true })
  assert.equal(r.status, 500, 'rm failure -> 500, got ' + r.status)
  assert.ok(mockState.global.archivedSessionIds.includes(SESSION_ID), 'rollback restores archive marker')
  const record = mockState.tables.workspaces[WORKSPACE_ID]
  assert.ok(record.sessionIds.includes(SESSION_ID), 'rollback restores accounting slot')
  mockCtx.sessionPersistence.locate = originalLocate
}

rmSync(root, { recursive: true, force: true })
console.log('DELETE ROUTE TESTS: ALL PASS')
