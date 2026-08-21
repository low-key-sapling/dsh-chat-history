/**
 * Build script for dsh-chat-history.
 *
 * Produces the dual-face artifacts:
 * - lib/index.js   host half (plain ESM, Node runtime; @deepseek-ai/* stay
 *                  external and resolve from the dsh installation);
 * - lib/client.js  browser half wrapped in the web shell's lazy module
 *                  contract: window.__ModuleLoader__.load({ id, factory })
 *                  where factory(require) materializes the bundle; react and
 *                  the official @deepseek-ai client packages stay external
 *                  and resolve through the shell's module system.
 *
 * The wrapper mirrors the artifact shape every official client package ships
 * (see @deepseek-ai/dsh-client-modules). The bundle id MUST equal the package
 * name — the graph row key the client module system resolves require()s by.
 */
import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const pkgName = '@linxin666/dsh-chat-history'
const externalClient = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  '@deepseek-ai/*',
]

mkdirSync(join(root, 'lib'), { recursive: true })

// ------------------------------------------------------------ host half
await build({
  entryPoints: [join(root, 'src/index.ts')],
  outfile: join(root, 'lib/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['@deepseek-ai/*'],
  sourcemap: false,
  logLevel: 'info',
})

// --------------------------------------------------------- client half
const result = await build({
  entryPoints: [join(root, 'src/client/index.ts')],
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  jsx: 'automatic',
  loader: { '.ts': 'tsx', '.tsx': 'tsx' },
  external: externalClient,
  sourcemap: false,
  write: false,
  logLevel: 'info',
})

const body = result.outputFiles[0].text
const wrapped = `window.__ModuleLoader__.load({
	id: ${JSON.stringify(pkgName)},
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
${body}
		return module.exports;
	}
});
`
writeFileSync(join(root, 'lib/client.js'), wrapped)
console.log('wrote lib/client.js (%d bytes)', wrapped.length)
