/**
 * Surface copy for dsh-chat-history. Two surfaces: the settings page for
 * archived-conversation management, and the right-side question outline of
 * the current conversation. Copy is document-language driven (same precedent
 * as dsh-ssh / task-board).
 */

/** Translation values accepted by the interpolator. */
export type TranslateValues = Record<string, string | number>

/** Key dictionary of the chat-history surfaces. */
export type ChatHistoryKey =
  // settings section (archived sessions manager)
  | 'settings.nav'
  | 'settings.empty'
  | 'settings.count'
  | 'settings.archivedBadge'
  | 'settings.running'
  | 'settings.open'
  | 'settings.unarchive'
  | 'settings.rename'
  | 'settings.renameSave'
  | 'settings.renameCancel'
  | 'settings.delete'
  | 'settings.confirmDelete'
  | 'settings.toast.unarchived'
  | 'settings.toast.renamed'
  | 'settings.toast.renameError'
  | 'settings.toast.unarchiveError'
  | 'settings.toast.openError'
  | 'settings.toast.deleted'
  | 'settings.toast.deleteError'
  | 'settings.loading'
  | 'settings.hint'
  // right-side question outline
  | 'outline.toggle'
  | 'outline.title'
  | 'outline.empty'
  | 'outline.close'
  | 'outline.questions'
  | 'outline.locateFailed'
  | 'outline.locateOlder'
  | 'outline.yesterday'

/** Simplified Chinese dictionary. */
export const zh: Record<ChatHistoryKey, string> = {
  'settings.nav': '归档会话',
  'settings.empty': '没有已归档的会话',
  'settings.count': '已归档 {count} 个会话',
  'settings.archivedBadge': '已归档',
  'settings.running': '运行中',
  'settings.open': '打开',
  'settings.unarchive': '取消归档',
  'settings.rename': '重命名',
  'settings.renameSave': '保存',
  'settings.renameCancel': '取消',
  'settings.delete': '删除',
  'settings.confirmDelete': '确认删除？',
  'settings.toast.unarchived': '已取消归档，恢复显示在侧边栏',
  'settings.toast.renamed': '已重命名',
  'settings.toast.renameError': '重命名失败',
  'settings.toast.unarchiveError': '取消归档失败',
  'settings.toast.openError': '打开会话失败',
  'settings.toast.deleted': '已删除该会话',
  'settings.toast.deleteError': '删除失败',
  'settings.loading': '加载中…',
  'settings.hint': '归档的会话不会出现在侧边栏，可在此查看并恢复。',
  'outline.toggle': '提问',
  'outline.title': '本会话提问',
  'outline.empty': '还没有提问，开始对话吧',
  'outline.close': '关闭',
  'outline.questions': '个提问',
  'outline.locateFailed': '该消息不在当前加载的窗口中',
  'outline.locateOlder': '较早的提问未加载，先在聊天底部点「加载更早」即可定位',
  'outline.yesterday': '昨天',
}

/** English dictionary (fallback for non-Chinese documents). */
export const en: Record<ChatHistoryKey, string> = {
  'settings.nav': 'Archived Sessions',
  'settings.empty': 'No archived sessions',
  'settings.count': '{count} archived session(s)',
  'settings.archivedBadge': 'Archived',
  'settings.running': 'Running',
  'settings.open': 'Open',
  'settings.unarchive': 'Unarchive',
  'settings.rename': 'Rename',
  'settings.renameSave': 'Save',
  'settings.renameCancel': 'Cancel',
  'settings.delete': 'Delete',
  'settings.confirmDelete': 'Confirm delete?',
  'settings.toast.unarchived': 'Unarchived — restored to the sidebar',
  'settings.toast.renamed': 'Renamed',
  'settings.toast.renameError': 'Rename failed',
  'settings.toast.unarchiveError': 'Unarchive failed',
  'settings.toast.openError': 'Failed to open session',
  'settings.toast.deleted': 'Session deleted',
  'settings.toast.deleteError': 'Delete failed',
  'settings.loading': 'Loading…',
  'settings.hint': 'Archived sessions are hidden from the sidebar; manage them here.',
  'outline.toggle': 'Questions',
  'outline.title': 'Questions in this session',
  'outline.empty': 'No questions yet — start chatting',
  'outline.close': 'Close',
  'outline.questions': 'question(s)',
  'outline.locateFailed': 'This message is outside the loaded window',
  'outline.locateOlder': 'This question is not loaded yet — tap “Load earlier” at the bottom of the chat first',
  'outline.yesterday': 'Yesterday',
}

/** Active dictionary, picked by the document language at call time. */
export function dictionary(): Record<ChatHistoryKey, string> {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'zh'
  return lang.toLowerCase().startsWith('en') ? { ...en } : { ...zh }
}

/** Translate a key with optional {name} template params (current language). */
export function tt(key: ChatHistoryKey, values?: TranslateValues): string {
  const text = dictionary()[key] ?? key
  if (values === undefined) return text
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = values[name]
    return value === undefined ? whole : String(value)
  })
}
