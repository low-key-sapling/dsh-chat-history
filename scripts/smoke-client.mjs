/**
 * Smoke test: materialize lib/client.js the way the web shell would —
 * window.__ModuleLoader__.load({id, factory}) then factory(require) with a
 * require that resolves through the web profile (react etc.).
 * Run: node scripts/smoke-client.mjs
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const profileRequire = createRequire('C:/Users/yuanj/.dsh/profiles/web/')

const registrations = []
globalThis.window = {
  __ModuleLoader__: {
    load(registration) { registrations.push(registration) },
  },
  __regs: registrations,
}

const code = readFileSync(join(root, 'lib/client.js'), 'utf8')
// Evaluate the bundle; the registration lands in window.__regs. Indirect eval
// runs in global scope, so read the factory back through the window object.
// eslint-disable-next-line no-eval
const factory = (0, eval)(
  `${code}\n;window.__regs.find(r => r.id === ${JSON.stringify('@linxin666/dsh-chat-history')}).factory`,
)

const module = { exports: {} }
const exports_ = module.exports
const exportsOfFactory = factory((spec) => profileRequire(spec), module, exports_)

const registered = registrations.find(r => r.id === '@linxin666/dsh-chat-history')
if (registered === undefined) {
  throw new Error('bundle did not register its id')
}
console.log('registration id OK:', registered.id)

const face = exportsOfFactory
console.log('inject:', JSON.stringify(face.inject))
console.log('apply type:', typeof face.apply)
if (!Array.isArray(face.inject) || face.inject.length === 0) throw new Error('inject missing')
if (typeof face.apply !== 'function') throw new Error('apply missing')
console.log('SMOKE OK')
