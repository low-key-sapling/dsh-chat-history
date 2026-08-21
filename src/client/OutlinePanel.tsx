/**
 * OutlinePanel — the right-side question outline of the CURRENT conversation.
 *
 * Lists every user question (user/steering messages) of the active session in
 * a scrollable list; clicking one scrolls the conversation viewport to that
 * exact message and flashes it. The conversation viewport is the official
 * `[data-conversation-scroll]` scroller and each rendered message node carries
 * `data-chat-flow-key` = its event seq (the Chat node React key), so locating
 * is pure DOM work — no source changes. While the user scrolls the chat, the
 * outline highlights the question currently at the top of the viewport.
 *
 * Mounted as an independent React root (createRoot) outside the slot system,
 * because the shell has no additive right-column slot (the `details` slot is
 * single-occupant). Fixed-position on the right edge, styled with the shell's
 * design tokens.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { textOf, truncate } from './api.ts'
import { tt } from './locales.ts'

/** The conversation scroll container (official attribute). */
const SCROLL_SELECTOR = '[data-conversation-scroll]'

/** One outline entry: a user question in the current session. */
interface Question {
  /** Chat node key — equals the rendered `data-chat-flow-key` attribute. */
  key: string
  /** Event seq from the source user message. */
  seq: number
  /** Unix epoch ms from the source session event. */
  time: number
  /** Question text (text blocks joined, truncated). */
  text: string
}

/** Props for a single question row. */
interface QuestionRowProps {
  question: Question
  active: boolean
  onLocate: (question: Question) => void
}

/**
 * One question row. Self-measures whether its text is truncated (after the
 * panel expands) so the overflow tooltip is shown only for overflowing rows.
 * Measuring here (not in the parent) avoids stale refs across the
 * display:none → flex transition.
 */
function QuestionRow({ question, active, onLocate }: Omit<QuestionRowProps, 'hovered'>): JSX.Element {
  const itemRef = useRef<HTMLDivElement>(null)
  const [showTip, setShowTip] = useState(false)
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Show tooltip on hover if the text is likely truncated. A 400ms delay lets
  // the panel width transition (0.15s) settle before measuring position, so
  // the tooltip lands to the LEFT of the row instead of overlapping it. The
  // delay also avoids a flash when the mouse merely sweeps across a row.
  const handleEnter = (): void => {
    enterTimer.current = setTimeout(() => {
      const item = itemRef.current
      if (item === null) return
      const text = item.querySelector<HTMLSpanElement>('.chh-qitem-text')
      const fullText = question.text !== '' ? question.text : '…'
      // Heuristic: CJK chars count as 2, others as 1; if > ~40 units, likely
      // overflows the 220px panel.
      let units = 0
      for (const ch of fullText) {
        units += ch.charCodeAt(0) > 0x2e80 ? 2 : 1
      }
      const likelyTruncated = units > 40
      const domTruncated = text !== null && text.scrollWidth > text.clientWidth
      if (!likelyTruncated && !domTruncated) return
      const rect = item.getBoundingClientRect()
      const tipWidth = 320
      const left = Math.max(8, rect.left - tipWidth - 10)
      setTipPos({ top: rect.top + rect.height / 2, left })
      setShowTip(true)
    }, 400)
  }

  const handleLeave = (): void => {
    if (enterTimer.current !== undefined) {
      clearTimeout(enterTimer.current)
      enterTimer.current = undefined
    }
    setShowTip(false)
  }

  return (
    <div
      ref={itemRef}
      className="chh-qitem"
      data-active={active || undefined}
      role="button"
      tabIndex={0}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => onLocate(question)}
      onKeyDown={event => {
        if (event.key === 'Enter') onLocate(question)
      }}
    >
      <span className="chh-qitem-text">
        {question.text !== '' ? question.text : '…'}
      </span>
      <span className="chh-qitem-dot" aria-hidden="true" />
      {showTip && tipPos !== null && createPortal(
        <span
          className="chh-qitem-tip"
          role="tooltip"
          style={{ position: 'fixed', top: `${tipPos.top}px`, left: `${tipPos.left}px`, transform: 'translateY(-50%)', width: '320px' }}
        >
          {question.text !== '' ? question.text : '…'}
        </span>,
        document.body,
      )}
    </div>
  )
}

/** Panel props. */
export interface OutlinePanelProps {
  /** Client root context (sessions service). */
  ctx: ClientContext
}

/**
 * The outline surface: toggle tab + panel.
 * @param props - client root context.
 */
export function OutlinePanel({ ctx }: OutlinePanelProps): JSX.Element {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Live session list (current id + title).
  const sessionsSnapshot = useSyncExternalStore(
    useCallback((listener: () => void) => ctx.sessions.list.subscribe(listener), [ctx]),
    useCallback(() => ctx.sessions.list.getSnapshot(), [ctx]),
  )
  const currentId = sessionsSnapshot.current

  // Live conversation snapshot of the current session (undefined when none).
  const binding = useMemo(
    () => (currentId !== undefined ? ctx.sessions.binding(currentId) : undefined),
    [ctx, currentId],
  )
  const conversation = useSyncExternalStore(
    useCallback(
      (listener: () => void) => (binding !== undefined ? binding.session.subscribe(listener) : () => undefined),
      [binding],
    ),
    useCallback(
      () => (binding !== undefined ? binding.session.getSnapshot() : undefined),
      [binding],
    ),
  )

  // Full-history questions pulled from the official session.history RPC. The
  // chat window only materializes the latest turns, so older user questions
  // would otherwise never appear — DeepSeek-web-style, the outline lists the
  // WHOLE conversation. Bounded paging; failures degrade to window-only.
  const [historyQuestions, setHistoryQuestions] = useState<Question[]>([])
  useEffect(() => {
    if (currentId === undefined) return
    let cancelled = false
    void (async () => {
      const collected: Question[] = []
      let beforeSeq: number | undefined
      for (let page = 0; page < 6; page++) {
        try {
          const response = await ctx.connection.api.sessions.history({
            sessionId: currentId,
            beforeSeq,
            maxMessages: 100,
          })
          const result = response.result
          if (!result.ok) break
          const { events, hasMore } = result.value
          if (events.length === 0) break
          for (const entry of events) {
            const event = entry.event
            if (event.type !== 'user/message') continue
            const data = event.data as { source?: { kind?: string }; content?: readonly { type: string; text?: string }[] }
            if (data.source?.kind !== 'user') continue
            collected.push({
              key: `history:${event.seq}`,
              seq: event.seq,
              time: event.time,
              text: truncate(textOf(data.content), 160),
            })
          }
          if (!hasMore) break
          beforeSeq = events[0].event.seq
        } catch {
          break
        }
      }
      if (!cancelled) setHistoryQuestions(collected)
    })()
    return () => {
      cancelled = true
    }
  }, [currentId, ctx])

  // Questions = user + steering messages of the loaded window (keyed by their
  // chat node keys, so locating is exact DOM work) MERGED with the
  // full-history questions (older turns) — deduped by event seq, oldest first.
  const questions = useMemo<Question[]>(() => {
    const bySeq = new Map<number, Question>()
    if (conversation !== undefined) {
      const chat = conversation.chat
      for (const key of chat.order) {
        const node = chat.nodes.get(key)
        if (node === undefined) continue
        if (node.kind !== 'user' && node.kind !== 'steering') continue
        const state = node.data as { seq?: number; time?: number; content?: readonly { type: string; text?: string }[] }
        if (typeof state.seq !== 'number' || typeof state.time !== 'number') continue
        bySeq.set(state.seq, { key, seq: state.seq, time: state.time, text: truncate(textOf(state.content), 160) })
      }
    }
    for (const question of historyQuestions) {
      if (!bySeq.has(question.seq)) bySeq.set(question.seq, question)
    }
    return [...bySeq.values()].sort((a, b) => a.seq - b.seq)
  }, [conversation, historyQuestions])

  const showToast = (text: string): void => {
    if (toastTimer.current !== undefined) clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = setTimeout(() => setToast(null), 2400)
  }

  /**
   * Scroll the conversation to the message with the given chat node key and
   * flash it.
   * @param key - the question's chat node key (`data-chat-flow-key`).
   */
  const locate = (key: string): void => {
    const selector = `[data-chat-flow-key="${CSS.escape(key)}"]`
    const el = document.querySelector<HTMLElement>(selector)
    if (el === null) {
      showToast(tt('outline.locateFailed'))
      return
    }
    const scroller = el.closest<HTMLElement>(SCROLL_SELECTOR)
    if (scroller !== null) {
      const scrollerRect = scroller.getBoundingClientRect()
      const top = scroller.scrollTop + el.getBoundingClientRect().top - scrollerRect.top - 16
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    el.classList.add('chh-locate-flash')
    setTimeout(() => el.classList.remove('chh-locate-flash'), 1900)
  }

  // Pending locate target whose message is older than the loaded window: we
  // page up (loadOlder) until it materializes, then jump to it. Tracks the
  // target by event seq — once the questions memo gains a real chat key for
  // that seq (it entered the window), the effect below fires the locate.
  const [pendingLocateSeq, setPendingLocateSeq] = useState<number | null>(null)
  useEffect(() => {
    if (pendingLocateSeq === null) return
    const question = questions.find(candidate => candidate.seq === pendingLocateSeq)
    if (question !== undefined && !question.key.startsWith('history:')) {
      setPendingLocateSeq(null)
      locate(question.key)
    }
  }, [questions, pendingLocateSeq])

  /** Whether the given event seq is inside the current chat window. */
  const windowContainsSeq = (seq: number): boolean => {
    const snapshot = binding?.session.getSnapshot()
    if (snapshot === undefined) return false
    const chat = snapshot.chat
    for (const key of chat.order) {
      const node = chat.nodes.get(key)
      const data = node?.data as { seq?: number } | undefined
      if (data?.seq === seq) return true
    }
    return false
  }

  /** Resolve after the next animation frame (the chat view folds prepends on a frame). */
  const nextFrame = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => resolve()))

  /**
   * Locate a question, loading older history pages first when its message is
   * outside the current window (DeepSeek-web behavior: any question is
   * reachable, not only the ones in the loaded window).
   * @param question - the outline entry the user clicked.
   */
  const locateQuestion = async (question: Question): Promise<void> => {
    if (!question.key.startsWith('history:')) {
      locate(question.key)
      return
    }
    if (binding === undefined || windowContainsSeq(question.seq)) {
      locate(question.key)
      return
    }
    setPendingLocateSeq(question.seq)
    for (let page = 0; page < 40; page++) {
      const snapshot = binding.session.getSnapshot()
      if (snapshot === undefined) break
      if (windowContainsSeq(question.seq)) return // the effect will locate
      if (!snapshot.hasMore) break
      await binding.session.loadOlder()
      await nextFrame() // let the chat view fold the prepended events
    }
    if (!windowContainsSeq(question.seq)) {
      // Could not reach it (extremely deep history); fall back to the
      // guidance toast and clear the pending target.
      setPendingLocateSeq(null)
      showToast(tt('outline.locateOlder'))
    }
  }

  // Keep the outline's active item in sync with the conversation scroll.
  // The active question is the last one whose message top has scrolled past
  // the viewport threshold; if none has, fall back to the LAST (most recent)
  // question. Re-runs on hover so the highlight is correct on expand.
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(SCROLL_SELECTOR)
    if (scroller === null || questions.length === 0) return
    let raf = 0
    const update = (): void => {
      raf = 0
      const rect = scroller.getBoundingClientRect()
      const threshold = rect.top + 96
      let active: string | null = null
      for (const q of questions) {
        const el = document.querySelector(`[data-chat-flow-key="${CSS.escape(q.key)}"]`)
        if (el !== null && el.getBoundingClientRect().top <= threshold) active = q.key
      }
      // Fallback: nothing scrolled past threshold → highlight the LAST question
      // (the most recent one the user is likely working on).
      if (active === null) active = questions[questions.length - 1].key
      setActiveKey(active)
    }
    const onScroll = (): void => {
      if (raf === 0) raf = requestAnimationFrame(update)
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (raf !== 0) cancelAnimationFrame(raf)
    }
  }, [questions, hovered])

  // Ensure activeKey always points to a valid question: if it's null or stale
  // (not in the current list), default to the last question.
  useEffect(() => {
    if (questions.length === 0) return
    if (activeKey === null || !questions.some(q => q.key === activeKey)) {
      setActiveKey(questions[questions.length - 1].key)
    }
  }, [questions, activeKey])

  // When the panel expands, scroll the list to the bottom so the most recent
  // (active) question is visible — questions are oldest→newest, the default
  // active is the last one, and it would otherwise sit below the fold.
  useEffect(() => {
    if (!hovered) return
    const el = listRef.current
    if (el === null) return
    el.scrollTop = el.scrollHeight
  }, [hovered, questions])

  return (
    <div data-dsh-chat-history-root>
      {currentId !== undefined && (
        <section
          className="chh-panel"
          data-hover={hovered || undefined}
          aria-label={tt('outline.title')}
          role="complementary"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Collapsed rail: a vertical line + up to 3 stub bars (the most
              recent questions). The active bar is blue, the rest grey.
              Hidden once expanded; pure affordance to invite the hover. */}
          <div className="chh-rail" aria-hidden="true">
            <span className="chh-rail-line" />
            {questions.slice(-3).map(question => (
              <span
                key={question.key}
                className="chh-rail-bar"
                data-active={activeKey === question.key || undefined}
              />
            ))}
          </div>

          <div className="chh-outline-list" ref={listRef}>
            {questions.length === 0 ? (
              <div className="chh-empty">
                {tt('outline.empty')}
              </div>
            ) : (
              questions.map(question => (
                <QuestionRow
                  key={question.key}
                  question={question}
                  active={activeKey === question.key}
                  onLocate={q => void locateQuestion(q)}
                />
              ))
            )}
          </div>
        </section>
      )}

      {toast !== null && (
        <div className="chh-toast" data-kind="info" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
