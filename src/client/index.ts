/**
 * Browser-half entry for the dsh-chat-history plugin — runs inside the dsh
 * web GUI.
 *
 * Two surfaces:
 * - a settings page (`settings.section` slot, id `chat-history-archived`)
 *   managing archived conversations — the official UI has no viewing or
 *   unarchive surface for archived sessions, so this page lists them and
 *   offers open / unarchive / rename;
 * - a right-side question outline of the current conversation (independent
 *   React root appended to the shell, fixed-position), where every user
 *   question is listed and clickable to locate the exact message in the chat.
 *
 * Failure policy: mounting problems are logged, never thrown — an external
 * plugin must not take the GUI down.
 *
 * Export discipline (packages/client rule): the /client surface carries what
 * cordis loading needs plus types only — all value exports stay internal.
 */
import { createRoot, type Root } from 'react-dom/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the connection service's Context merge (ctx.connection).
import type {} from '@deepseek-ai/dsh-client-connection/client'
// Type-only: pulls the settings section slot type (settings.section).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { ArchivedSessionsSection } from './ArchivedSessionsSection.tsx'
import { OutlinePanel } from './OutlinePanel.tsx'
import { tt } from './locales.ts'
import { PANEL_CSS } from './style.ts'

/** Stable data attribute of the injected root container. */
export const ROOT_SELECTOR = '[data-dsh-chat-history-root]'

/** Stylesheet tag attribute, so re-apply and disposal are idempotent. */
const STYLE_TAG = 'data-plugin-chat-history-css'

/** Settings nav id of the archived-sessions page. */
export const SETTINGS_SECTION_ID = 'chat-history-archived'

/** Required services (fiber inject waiting — runtime + connection + slots first). */
export const inject = ['slots', 'connection', 'sessions', 'workspaces']

/**
 * Inject the stylesheet once.
 * @returns disposer removing the style tag when the plugin unmounts.
 */
function injectStyles(): () => void {
  const existing = document.querySelector(`style[${STYLE_TAG}]`)
  if (existing !== undefined && existing !== null) return () => undefined
  const style = document.createElement('style')
  style.setAttribute(STYLE_TAG, '')
  style.textContent = PANEL_CSS
  document.head.appendChild(style)
  return () => {
    style.remove()
  }
}

/**
 * Mount the question outline and its toggle, waiting for the shell to render.
 * @param ctx - client root context (sessions service).
 * @returns disposer unmounting the tree.
 */
export function mountOutline(ctx: ClientContext): () => void {
  let root: Root | undefined
  let container: HTMLDivElement | undefined

  const ensure = (): void => {
    if (container !== undefined) {
      if (container.isConnected) return
      // The shell replaced the app root; drop the stale tree and remount.
      root?.unmount()
      root = undefined
      container.remove()
      container = undefined
    }
    const host = document.body
    if (host === null) return
    container = document.createElement('div')
    container.dataset.dshChatHistoryRoot = ''
    container.dataset.dshPlugin = 'chat-history'
    host.appendChild(container)
    root = createRoot(container)
    root.render(<OutlinePanel ctx={ctx} />)
  }

  // The frame mounts after boot settlement; watch for the body's arrival.
  const waitObserver = new MutationObserver(() => { ensure() })
  waitObserver.observe(document.documentElement, { childList: true, subtree: true })
  ensure()

  return () => {
    waitObserver.disconnect()
    root?.unmount()
    root = undefined
    container?.remove()
    container = undefined
  }
}

/**
 * Mount the plugin surfaces.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  try {
    const disposeStyles = injectStyles()

    // Archived-conversation manager as a Settings page.
    ctx.slots.inject('settings.section', () => ctx.slots.register({
      name: 'settings.section',
      id: SETTINGS_SECTION_ID,
      order: 90,
      label: () => tt('settings.nav'),
      inject: () => ({ ctx }),
    }, ArchivedSessionsSection))

    // Right-side question outline of the current conversation.
    const disposeOutline = mountOutline(ctx)

    ctx.effect(() => () => {
      disposeOutline()
      disposeStyles()
    }, 'chat-history: surfaces')
  } catch (error) {
    // Surface failures degrade the plugin, never the GUI.
    console.warn('[dsh-chat-history] mount failed:', error)
  }
}
