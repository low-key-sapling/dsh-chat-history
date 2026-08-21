/**
 * ArchivedSessionsSection — the archived-conversation manager inside the
 * official Settings panel (registered into the `settings.section` slot, so it
 * appears as its own nav page, e.g. 「归档会话」).
 *
 * Lists every archived session (hidden from the official sidebar) with its
 * title, date and status, and offers: open (jump to the conversation and
 * close settings), unarchive (restores it to the sidebar — via the plugin's
 * host route, since the official API has no unarchive), and rename (official
 * session.rename RPC).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the settings section slot type (settings.section).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { deleteArchivedSession, renameSession, unarchiveSession } from './api.ts'
import { tt } from './locales.ts'

/** One archived session row. */
interface ArchivedRow {
  id: SessionId
  title: string
  updatedAt: number
  running: boolean
}

/** Compact time label (same convention as the outline). */
function timeLabel(ts: number, now: number): string {
  const date = new Date(ts)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  if (ts >= today.getTime()) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  if (ts >= today.getTime() - 86_400_000) return tt('outline.yesterday')
  const year = date.getFullYear()
  const prefix = year === new Date(now).getFullYear() ? '' : `${year}/`
  return `${prefix}${date.getMonth() + 1}/${date.getDate()}`
}

/** Inline icons (14px, currentColor). */
const IconOpen = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 3.5H3.8A1.3 1.3 0 0 0 2.5 4.8v7.4a1.3 1.3 0 0 0 1.3 1.3h7.4a1.3 1.3 0 0 0 1.3-1.3V9.5" />
    <path d="M9.5 2.5H13.5V6.5" />
    <path d="M13 3L8 8" />
  </svg>
)
const IconUnarchive = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 5.5h11v8h-11z" />
    <path d="M2 2.5h12v3H2z" />
    <path d="M8 13V9.5M6.2 11L8 9.2 9.8 11" />
  </svg>
)
const IconPencil = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11.5 2.5l2 2L6 12l-2.8.8L4 10z" />
  </svg>
)
const IconTrash = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
    <path d="M4 4.5l.6 8.2a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4.5" />
    <path d="M6.5 7.5v3.5M9.5 7.5v3.5" />
  </svg>
)
const IconClock = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 4.8V8l2.2 1.4" />
  </svg>
)
const IconArchive = (): JSX.Element => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 5.5h11v8h-11z" />
    <path d="M2 2.5h12v3H2z" />
  </svg>
)

/** Section props: the settings shell's owner share plus the injected ctx. */
export interface ArchivedSessionsSectionProps {
  /** Close the settings panel (shell affordance for flows that leave settings). */
  close: () => void
  /** Client root context, injected at registration. */
  ctx: ClientContext
}

/**
 * The archived-sessions settings page.
 * @param props - owner share + client context.
 */
export function ArchivedSessionsSection({ close, ctx }: ArchivedSessionsSectionProps): JSX.Element {
  const [now, setNow] = useState(() => Date.now())
  const [renaming, setRenaming] = useState<SessionId | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [deleteArmed, setDeleteArmed] = useState<SessionId | null>(null)
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<SessionId>>(() => new Set())
  const [toast, setToast] = useState<{ text: string; kind: 'info' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffectMinute(setNow)

  const sessionsSnapshot = useSyncExternalStore(
    useCallback((listener: () => void) => ctx.sessions.list.subscribe(listener), [ctx]),
    useCallback(() => ctx.sessions.list.getSnapshot(), [ctx]),
  )
  const workspacesSnapshot = useSyncExternalStore(
    useCallback((listener: () => void) => ctx.workspaces.list.subscribe(listener), [ctx]),
    useCallback(() => ctx.workspaces.list.getSnapshot(), [ctx]),
  )

  const rows = useMemo<ArchivedRow[]>(() => {
    const archived = new Set(workspacesSnapshot.archivedSessionIds)
    return sessionsSnapshot.ids
      .map(id => sessionsSnapshot.byId[id])
      .filter((summary): summary is NonNullable<typeof summary> =>
        summary !== undefined
        && archived.has(summary.id)
        && !deletedIds.has(summary.id)
        && summary.origin !== 'subagent')
      .map(summary => ({
        id: summary.id,
        title: summary.displayTitle.trim() !== '' ? summary.displayTitle : summary.id,
        updatedAt: summary.updatedAt,
        running: summary.running,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [sessionsSnapshot, workspacesSnapshot, deletedIds])

  const showToast = (text: string, kind: 'info' | 'error' = 'info'): void => {
    if (toastTimer.current !== undefined) clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  const markBusy = (id: SessionId, value: boolean): void => {
    setBusy(previous => ({ ...previous, [id]: value }))
  }

  /** Cancel any pending delete confirmation (other row actions win). */
  const disarmDelete = (): void => {
    if (deleteTimer.current !== undefined) clearTimeout(deleteTimer.current)
    setDeleteArmed(null)
  }

  /** Arm or fire the two-step delete: first click arms, second click deletes. */
  const onDeleteClick = (id: SessionId): void => {
    if (deleteArmed !== id) {
      if (deleteTimer.current !== undefined) clearTimeout(deleteTimer.current)
      setDeleteArmed(id)
      deleteTimer.current = setTimeout(() => setDeleteArmed(null), 3500)
      return
    }
    if (deleteTimer.current !== undefined) clearTimeout(deleteTimer.current)
    setDeleteArmed(null)
    void doDelete(id)
  }

  const doDelete = async (id: SessionId): Promise<void> => {
    markBusy(id, true)
    try {
      await deleteArchivedSession(id)
      setDeletedIds(previous => new Set(previous).add(id))
      if (renaming === id) setRenaming(null)
      // Re-baseline the session list so the deleted row leaves the client's
      // list store (and never lingers in the sidebar's Ungrouped section).
      try {
        await ctx.sessions.refresh()
      } catch {
        // Refresh is best-effort; the row is hidden locally either way.
      }
      showToast(tt('settings.toast.deleted'))
    } catch (error) {
      showToast(tt('settings.toast.deleteError') + (error instanceof Error ? `: ${error.message}` : ''), 'error')
    } finally {
      markBusy(id, false)
    }
  }

  const openSession = (id: SessionId): void => {
    disarmDelete()
    try {
      ctx.sessions.open(id)
      close()
    } catch (error) {
      showToast(tt('settings.toast.openError') + (error instanceof Error ? `: ${error.message}` : ''), 'error')
    }
  }

  const doUnarchive = async (id: SessionId): Promise<void> => {
    disarmDelete()
    markBusy(id, true)
    try {
      await unarchiveSession(id)
      if (renaming === id) setRenaming(null)
      showToast(tt('settings.toast.unarchived'))
    } catch (error) {
      showToast(tt('settings.toast.unarchiveError') + (error instanceof Error ? `: ${error.message}` : ''), 'error')
    } finally {
      markBusy(id, false)
    }
  }

  const startRename = (id: SessionId, currentTitle: string): void => {
    disarmDelete()
    setRenaming(id)
    setRenameDraft(currentTitle)
  }

  const saveRename = async (id: SessionId): Promise<void> => {
    const title = renameDraft.trim()
    if (title === '' || renaming !== id) return
    markBusy(id, true)
    try {
      await renameSession(ctx, id, title)
      setRenaming(null)
      showToast(tt('settings.toast.renamed'))
    } catch (error) {
      showToast(tt('settings.toast.renameError') + (error instanceof Error ? `: ${error.message}` : ''), 'error')
    } finally {
      markBusy(id, false)
    }
  }

  return (
    <div className="chh-settings">
      <p className="chh-settings-hint">{tt('settings.hint')}</p>
      <p className="chh-settings-count">{tt('settings.count', { count: rows.length })}</p>

      {rows.length === 0 ? (
        <p className="chh-empty">{tt('settings.empty')}</p>
      ) : (
        rows.map(row => (
          <div className="chh-settings-row" key={row.id}>
            <div className="chh-settings-row-main">
              {renaming === row.id ? (
                <div className="chh-settings-rename">
                  <input
                    type="text"
                    value={renameDraft}
                    autoFocus
                    onChange={event => setRenameDraft(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') void saveRename(row.id)
                      if (event.key === 'Escape') setRenaming(null)
                    }}
                  />
                  <button type="button" onClick={() => void saveRename(row.id)} disabled={busy[row.id] === true}>
                    {tt('settings.renameSave')}
                  </button>
                  <button type="button" onClick={() => setRenaming(null)}>
                    {tt('settings.renameCancel')}
                  </button>
                </div>
              ) : (
                <div className="chh-settings-row-title" title={row.title}>{row.title}</div>
              )}
              <div className="chh-settings-row-meta">
                <span className="chh-meta-time" title={new Date(row.updatedAt).toLocaleString()}>
                  <IconClock />
                  {timeLabel(row.updatedAt, now)}
                </span>
                {row.running && (
                  <span className="chh-status" data-kind="running">
                    <span className="chh-dot" />
                    {tt('settings.running')}
                  </span>
                )}
                <span className="chh-status" data-kind="archived">
                  <IconArchive />
                  {tt('settings.archivedBadge')}
                </span>
              </div>
            </div>

            <div className="chh-settings-actions">
              <button type="button" className="chh-action" data-primary="true" title={tt('settings.open')} onClick={() => openSession(row.id)}>
                <IconOpen /> {tt('settings.open')}
              </button>
              <button type="button" className="chh-action" title={tt('settings.unarchive')} onClick={() => void doUnarchive(row.id)} disabled={busy[row.id] === true}>
                <IconUnarchive /> {tt('settings.unarchive')}
              </button>
              <button type="button" className="chh-action" title={tt('settings.rename')} onClick={() => startRename(row.id, row.title)} disabled={busy[row.id] === true}>
                <IconPencil /> {tt('settings.rename')}
              </button>
              <button
                type="button"
                className="chh-action"
                data-danger={deleteArmed === row.id || undefined}
                title={tt('settings.delete')}
                onClick={() => onDeleteClick(row.id)}
                disabled={busy[row.id] === true}
              >
                <IconTrash /> {deleteArmed === row.id ? tt('settings.confirmDelete') : tt('settings.delete')}
              </button>
            </div>
          </div>
        ))
      )}

      {toast !== null && (
        <div className="chh-toast" data-kind={toast.kind} role="status">
          {toast.text}
        </div>
      )}
    </div>
  )
}

/** Re-export the effect helper locally (keeps the hook list tidy above). */
function useEffectMinute(setNow: (ts: number) => void): void {
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [setNow])
}
