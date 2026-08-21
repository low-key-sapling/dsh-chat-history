// E2E: create a synthetic session -> archive it -> delete it via the plugin UI
// -> verify it is GONE from session.list / workspace / sidebar (no Ungrouped ghost).
import fs from 'node:fs'
import http from 'node:http'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { zstdCompressSync, constants } from 'node:zlib'
import { pathToFileURL } from 'node:url'
const { default: WebSocket } = await import(pathToFileURL('D:/ProgramDatas/npm-global/node_modules/@deepseek-ai/dsh/node_modules/ws/index.js').href)

const DEBUG_PORT = Number(process.argv[2] || 9336)
const SESSION_ID = 'session-e2e-' + randomUUID()
const CWD = 'D:\\ai-home\\dsh-home'
const SESSIONS_ROOT = path.join(process.env.USERPROFILE, '.dsh', 'sessions', '--D-ai-home-dsh-home--')

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request(url, { method: 'POST', headers: { 'content-type': 'application/json' } }, (res) => {
      let out = ''
      res.on('data', (c) => (out += c))
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(out) }))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

// ------------------------------------------------------------- synthetic log
const now = Date.now()
const header = JSON.stringify({ type: 'session', version: 0, id: SESSION_ID, createdAt: now, cwd: CWD, delegationDepth: 0, agentPreset: 'standard' }) + '\n'
const events = [
  { type: 'permission/preset', seq: 0, time: now, data: { preset: 'danger-full-access' } },
  { type: 'sandbox/mode', seq: 1, time: now, data: { mode: 'danger-full-access' } },
  { type: 'approval/policy', seq: 2, time: now, data: { policy: 'never' } },
  { type: 'session/end-seed', seq: 3, time: now, data: {} },
  { type: 'agent/inbox/spliced', seq: 4, time: now, data: { target: 'next-turn', start: 0, inserted: [{ content: [{ type: 'text', text: 'E2E 删除测试会话' }], source: { kind: 'user', rpcId: randomUUID(), clientTimeZone: 'Asia/Shanghai' }, role: 'user', id: randomUUID() }] } },
  { type: 'turn/start', seq: 5, time: now, data: { turn: 1 } },
  { type: 'user/message', seq: 6, time: now, data: { content: [{ type: 'text', text: 'E2E 删除测试会话' }], source: { kind: 'user', rpcId: randomUUID(), clientTimeZone: 'Asia/Shanghai' }, role: 'user', id: randomUUID() }, surfaceOp: 'append' },
  { type: 'turn/end', seq: 7, time: now, data: { turn: 1 } },
]
const compress = (input) => zstdCompressSync(Buffer.from(input, 'utf8'), { params: { [constants.ZSTD_c_checksumFlag]: 1 } })
const sessionDir = path.join(SESSIONS_ROOT, SESSION_ID)
fs.mkdirSync(sessionDir, { recursive: true })
fs.writeFileSync(path.join(sessionDir, 'session.jsonl.zstd'), Buffer.concat([
  compress(header),
  compress(events.map((e) => JSON.stringify(e)).join('\n') + '\n'),
]))
console.log('CREATED synthetic session: ' + SESSION_ID)

// --------------------------------------------------------------- archive it
const arc = await postJson('http://127.0.0.1:3080/api/workspace.archiveSession', {
  type: 'client-request', rpcId: 'e2e-arc', method: 'workspace.archiveSession', payload: { sessionId: SESSION_ID },
})
console.log('ARCHIVE RPC: status=' + arc.status + ' ok=' + arc.body?.result?.ok)

// ------------------------------------------------------------ CDP: delete it
function getJson(url) { return new Promise((resolve, reject) => { http.get(url, (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => resolve(JSON.parse(d))) }).on('error', reject) }) }
async function findPageTarget() { for (let i = 0; i < 40; i++) { try { const t = await getJson(`http://127.0.0.1:${DEBUG_PORT}/json`); const p = t.find((x) => x.type === 'page'); if (p) return p } catch {} await new Promise((r) => setTimeout(r, 500)) } throw new Error('no page') }
let nextId = 1
class Cdp { constructor(ws) { this.ws = ws; this.pending = new Map(); this.errors = []; ws.on('message', (raw) => { const m = JSON.parse(raw.toString()); if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result) } else if (m.method === 'Runtime.exceptionThrown') { this.errors.push('EXC: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300)) } else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) { this.errors.push(m.params.type.toUpperCase() + ': ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300)) } }) }
  static async connect(url) { const ws = new WebSocket(url); await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej) }); return new Cdp(ws) }
  send(method, params = {}) { const id = nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) return { __exception: r.exceptionDetails.exception?.description || r.exceptionDetails.text }; return r.result?.value } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const target = await findPageTarget()
const cdp = await Cdp.connect(target.webSocketDebuggerUrl)
await cdp.send('Runtime.enable'); await cdp.send('Log.enable'); await cdp.send('Page.enable')
await cdp.send('Page.navigate', { url: 'http://127.0.0.1:3080/' })
await sleep(14000)
// sidebar -> settings -> archived
await cdp.eval(`(() => { const b = document.querySelector('button[aria-label="打开侧边栏"]'); if (b) b.click(); return true })()`)
await sleep(3000)
await cdp.eval(`(() => { const els = [...document.querySelectorAll('[data-pane="sidebar"] button')]; const s = els.find(e => /^设置$/.test(e.textContent.trim())); if (s) s.click(); return true })()`)
await sleep(3000)
await cdp.eval(`(() => { const els = [...document.querySelectorAll('button')]; const s = els.find(e => /归档会话/.test(e.textContent)); if (s) s.click(); return true })()`)
await sleep(4000)
const rowsBefore = await cdp.eval(`(() => [...document.querySelectorAll('.chh-settings-row')].map(r => r.textContent.trim().slice(0, 60)))()`)
console.log('ARCHIVED ROWS BEFORE DELETE: ' + JSON.stringify(rowsBefore))
// find the synthetic row (title falls back to cwd basename "dsh-home",
// distinct from the real archived rows titled "DSH相关话题") and delete it
const del = await cdp.eval(`(() => {
  const rows = [...document.querySelectorAll('.chh-settings-row')]
  const row = rows.find(r => !r.textContent.includes('DSH相关话题'))
  if (!row) return { found: false, rows: rows.length, titles: rows.map(r => r.querySelector('.chh-settings-row-title')?.textContent) }
  const delBtn = [...row.querySelectorAll('.chh-action')].find(b => /删除|Delete/.test(b.textContent))
  delBtn.click()
  return { found: true, title: row.querySelector('.chh-settings-row-title')?.textContent }
})()`)
console.log('DELETE CLICK 1: ' + JSON.stringify(del))
await sleep(400)
const del2 = await cdp.eval(`(() => {
  const btn = [...document.querySelectorAll('.chh-action')].find(b => /确认删除|Confirm delete/.test(b.textContent))
  if (btn) { btn.click(); return { clicked: true } }
  return { clicked: false }
})()`)
console.log('DELETE CLICK 2: ' + JSON.stringify(del2))
await sleep(6000)
const after = await cdp.eval(`(() => {
  const rows = [...document.querySelectorAll('.chh-settings-row')].map(r => r.textContent.trim().slice(0, 60))
  const sidebar = document.querySelector('[data-pane="sidebar"]')
  return {
    rows,
    hasE2E: rows.some(r => r.includes('E2E')),
    hasUngrouped: /未分组|Ungrouped/.test(sidebar?.textContent || ''),
    sidebarHasE2E: (sidebar?.textContent || '').includes('E2E'),
    toast: document.querySelector('.chh-toast')?.textContent || null,
  }
})()`)
console.log('AFTER DELETE: ' + JSON.stringify(after, null, 2))
console.log('CONSOLE ERRORS: ' + JSON.stringify(cdp.errors))

// ------------------------------------------------ host-side final verification
const sl = await postJson('http://127.0.0.1:3080/api/session.list', { type: 'client-request', rpcId: 'e2e-v1', method: 'session.list', payload: {} })
const inList = sl.body?.result?.value?.items?.some((i) => i.sessionId === SESSION_ID) ?? false
console.log('session.list still contains E2E: ' + inList)
const dirExists = fs.existsSync(path.join(sessionDir, 'session.jsonl.zstd'))
console.log('session dir still exists: ' + dirExists)

cdp.ws.close()
process.exit(0)
