/**
 * Stylesheet for the dsh-chat-history surfaces. Plain CSS injected as one
 * <style> tag (no CSS-module tooling in the standalone build). Every color
 * rides the shell's design tokens (--dsw-alias-*), so light/dark theme and
 * skin changes apply automatically; class names are prefixed with chh-.
 */
export const PANEL_CSS = `
[data-dsh-chat-history-root] {
  --chh-panel-width: 280px;
  font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
}

/* ==================================================== right-side outline */

/* -------------------------------------------------------------- panel */
/* Right-edge, vertically-centered hover-expand surface.
   Collapsed (default): a vertical line hugging the right edge with one stub
   bar per question (grey, the active one blue) — a compact list affordance.
   On hover it expands LEFT (right edge stays put so the pointer never leaves
   the hit area → no flicker) into a white rounded card listing the questions:
   each row is [truncated text] + [small dot], color-coded grey→dark(hover)
   →blue(active). No horizontal scroll; list caps ~3 rows then scrolls. */
.chh-panel {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 91;
  display: flex;
  flex-direction: column;
  width: 28px;
  max-height: calc(100vh - 32px);
  padding: 8px 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: width .15s cubic-bezier(.4,0,.2,1),
              background .15s ease,
              border-color .15s ease,
              box-shadow .15s ease,
              padding .15s ease;
}
.chh-panel[data-hover] {
  /* right stays 0 — expand leftward so the pointer never exits the box. */
  width: var(--chh-panel-width);
  padding: 8px;
  border-radius: 14px;
  background: var(--dsw-alias-bg-base, #fff);
  border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.12));
  box-shadow: var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,.10));
}

/* ------------------------------------------------------ collapsed rail */
/* The vertical line + stub bars shown only when collapsed. */
.chh-rail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  padding-right: 2px;
}
.chh-rail-line {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: 2px;
  background: var(--dsw-alias-border-l2, rgba(128,128,128,.30));
}
.chh-rail-bar {
  position: relative;
  z-index: 1;
  width: 16px;
  height: 3px;
  border-radius: 999px;
  background: var(--dsw-alias-border-l2, rgba(128,128,128,.45));
}
.chh-rail-bar[data-active="true"] {
  width: 20px;
  background: var(--dsw-alias-brand-primary, #4d6bfe);
}
.chh-panel[data-hover] .chh-rail { display: none; }

/* -------------------------------------------------------------- list */
.chh-outline-list {
  display: none;
  flex-direction: column;
  gap: 2px;
  /* Cap the list to ~6 rows (~34px each + gaps); scroll vertically beyond. */
  max-height: 216px;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
  /* Snap scrolling to rows so a single wheel notch advances one row, not
     several — prevents skipping past questions. */
  scroll-snap-type: y proximity;
}
.chh-panel[data-hover] .chh-outline-list { display: flex; }
.chh-outline-list::-webkit-scrollbar { width: 6px; }
.chh-outline-list::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-border-l2, rgba(128,128,128,.3));
  border-radius: 3px;
}
.chh-empty {
  padding: 16px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--dsw-alias-label-dimmed, #999);
  line-height: 1.6;
}

/* --------------------------------------------------------------- item */
/* A question row: left = truncated text, right = small dot. Color codes the
   state: grey (normal) → black (hover, clearly readable) → blue (active).
   The dot tracks the text color. Hardcoded colors (not CSS vars) so they
   resolve regardless of theme-token scope on the detached root. */
.chh-qitem {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 12px;
  border-radius: 8px;
  color: #999;
  cursor: pointer;
  transition: color .12s ease;
  /* Snap each row to the top of the scroll viewport so wheel scrolling
     advances one row at a time instead of skipping several. */
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
/* Normal row → black on hover for readability. */
.chh-qitem:hover {
  color: #2c2c2e;
}
/* Active (located) row → blue, and STAYS blue even on hover. Declared after
   the plain :hover so its specificity wins. */
.chh-qitem[data-active="true"],
.chh-qitem[data-active="true"]:hover {
  color: #4d6bfe;
}
.chh-qitem:focus-visible {
  outline: 2px solid #4d6bfe;
  outline-offset: 2px;
}
.chh-qitem-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  line-height: 22px;
  color: inherit;
  /* Crisp text rendering — the panel sits on a translateY(-50%) transform
     which can trigger subpixel rendering; force integer alignment. */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
/* Right dot indicator — a small capsule that tracks the row's text color. */
.chh-qitem-dot {
  flex: none;
  width: 14px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  opacity: .7;
}
.chh-qitem[data-active="true"] .chh-qitem-dot { opacity: 1; }

/* --------------------------------------------- overflow content tooltip */
/* A dark box shown to the LEFT of a truncated row on hover, revealing the
   full question text. Position is set inline (position:fixed) by JS on hover
   so no ancestor overflow can clip it. Only rendered for truncated rows. */
.chh-qitem-tip {
  width: 320px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #2c2c2e;
  color: #fff;
  font-size: 13px;
  line-height: 20px;
  white-space: normal;
  word-break: break-word;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,.18);
  z-index: 9999;
}

/* ------------------------------------------------------ locate flash */
.chh-locate-flash {
  animation: chh-flash 1.8s ease;
}
@keyframes chh-flash {
  0% { box-shadow: 0 0 0 3px var(--dsw-alias-brand-primary, #4d6bfe); border-radius: 12px; }
  70% { box-shadow: 0 0 0 3px transparent; border-radius: 12px; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* ============================================ settings archived section */
.chh-settings { padding: 4px 0 16px; }
.chh-settings-hint {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary, #555);
  margin: 0 0 12px;
}
.chh-settings-count {
  font-size: 12px;
  color: var(--dsw-alias-label-dimmed, #999);
  margin: 0 0 8px;
}
.chh-settings-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,.15));
  border-radius: 10px;
  margin-bottom: 6px;
  transition: background .12s ease, border-color .12s ease;
}
.chh-settings-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.06)); }
.chh-settings-row-main { flex: 1; min-width: 0; }
.chh-settings-row-title {
  font-size: 13px;
  line-height: 18px;
  color: var(--dsw-alias-label-primary, #111);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chh-settings-row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  font-size: 11px;
  color: var(--dsw-alias-label-dimmed, #999);
}
.chh-meta-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.chh-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  line-height: 15px;
  font-weight: 500;
}
.chh-status[data-kind="running"] {
  background: var(--dsw-alias-state-success-secondary, rgba(46,160,67,.12));
  color: var(--dsw-alias-state-success-primary, #2ea043);
}
.chh-status[data-kind="archived"] {
  background: var(--dsw-alias-state-warn-secondary, rgba(219,157,8,.13));
  color: var(--dsw-alias-state-warn-primary, #b17d06);
}
.chh-dot {
  flex: none;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: .85;
}
.chh-settings-actions { display: flex; align-items: center; gap: 4px; flex: none; }
.chh-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #555);
  font: inherit;
  font-size: 11px;
  padding: 4px 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: background .12s ease, color .12s ease;
}
.chh-action:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,.12)); color: var(--dsw-alias-label-primary, #111); }
.chh-action[data-primary="true"] { color: var(--dsw-alias-brand-primary, #4d6bfe); }
.chh-action[data-primary="true"]:hover { background: var(--dsw-alias-brand-primary-soft, rgba(77,107,254,.1)); }
.chh-action[data-danger="true"] {
  color: var(--dsw-alias-state-error-primary, #ff4d4f);
  background: var(--dsw-alias-state-error-secondary, rgba(255,77,79,.1));
}
.chh-action[data-danger="true"]:hover { background: var(--dsw-alias-state-error-primary, #ff4d4f); color: var(--dsw-alias-label-primary-inverted, #fff); }
.chh-action:disabled { opacity: .5; cursor: default; }
.chh-settings-rename {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.chh-settings-rename input {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l3, rgba(128,128,128,.4));
  border-radius: 7px;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #111);
  font: inherit;
  font-size: 12px;
  outline: none;
}
.chh-settings-rename input:focus { border-color: var(--dsw-alias-brand-primary, #4d6bfe); }
.chh-settings-rename button {
  height: 26px;
  padding: 0 8px;
  border: none;
  border-radius: 7px;
  background: var(--dsw-alias-button-floating-fill, rgba(128,128,128,.1));
  color: var(--dsw-alias-label-primary, #111);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
.chh-settings-rename button:hover { background: var(--dsw-alias-button-floating-hover, rgba(128,128,128,.18)); }

/* ------------------------------------------------------------ toast */
.chh-toast {
  position: fixed;
  bottom: 20px;
  right: calc(var(--chh-panel-width) + 16px);
  z-index: 95;
  max-width: 320px;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--dsw-alias-toast-bg, #333);
  color: var(--dsw-alias-label-primary-inverted, #fff);
  font-size: 12px;
  line-height: 18px;
  box-shadow: var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,.2));
  animation: chh-toast-in .15s ease;
}
.chh-toast[data-kind="error"] { background: var(--dsw-alias-state-error-primary, #ff4d4f); }
@keyframes chh-toast-in {
  from { transform: translateY(6px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
`
