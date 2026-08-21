window.__ModuleLoader__.load({
	id: "@low-key-sapling/dsh-chat-history",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  ROOT_SELECTOR: () => ROOT_SELECTOR,
  SETTINGS_SECTION_ID: () => SETTINGS_SECTION_ID,
  apply: () => apply,
  inject: () => inject,
  mountOutline: () => mountOutline
});
module.exports = __toCommonJS(index_exports);
var import_client = require("react-dom/client");

// src/client/ArchivedSessionsSection.tsx
var import_react = require("react");

// src/client/api.ts
var CHAT_HISTORY_API = {
  unarchive: "/api/dsh-chat-history/unarchive",
  delete: "/api/dsh-chat-history/delete"
};
function textOf(content) {
  if (!Array.isArray(content)) return "";
  return content.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text).join("\n").trim();
}
function truncate(text, max = 160) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return normalized.slice(0, max) + "\u2026";
}
async function renameSession(ctx, sessionId, title) {
  const response = await ctx.connection.api.sessions.rename({ sessionId, title });
  const result = response.result;
  if (!result.ok) {
    throw new Error(`${result.error.code}: ${result.error.message}`);
  }
}
async function unarchiveSession(sessionId) {
  return postHost(CHAT_HISTORY_API.unarchive, { sessionId });
}
async function deleteArchivedSession(sessionId) {
  return postHost(CHAT_HISTORY_API.delete, { sessionId, confirm: true });
}
async function postHost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok || parsed === null || parsed.ok !== true) {
    throw new Error(parsed?.error ?? `HTTP ${response.status}`);
  }
  return parsed.archivedSessionIds ?? [];
}

// src/client/locales.ts
var zh = {
  "settings.nav": "\u5F52\u6863\u4F1A\u8BDD",
  "settings.empty": "\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u4F1A\u8BDD",
  "settings.count": "\u5DF2\u5F52\u6863 {count} \u4E2A\u4F1A\u8BDD",
  "settings.archivedBadge": "\u5DF2\u5F52\u6863",
  "settings.running": "\u8FD0\u884C\u4E2D",
  "settings.open": "\u6253\u5F00",
  "settings.unarchive": "\u53D6\u6D88\u5F52\u6863",
  "settings.rename": "\u91CD\u547D\u540D",
  "settings.renameSave": "\u4FDD\u5B58",
  "settings.renameCancel": "\u53D6\u6D88",
  "settings.delete": "\u5220\u9664",
  "settings.confirmDelete": "\u786E\u8BA4\u5220\u9664\uFF1F",
  "settings.toast.unarchived": "\u5DF2\u53D6\u6D88\u5F52\u6863\uFF0C\u6062\u590D\u663E\u793A\u5728\u4FA7\u8FB9\u680F",
  "settings.toast.renamed": "\u5DF2\u91CD\u547D\u540D",
  "settings.toast.renameError": "\u91CD\u547D\u540D\u5931\u8D25",
  "settings.toast.unarchiveError": "\u53D6\u6D88\u5F52\u6863\u5931\u8D25",
  "settings.toast.openError": "\u6253\u5F00\u4F1A\u8BDD\u5931\u8D25",
  "settings.toast.deleted": "\u5DF2\u5220\u9664\u8BE5\u4F1A\u8BDD",
  "settings.toast.deleteError": "\u5220\u9664\u5931\u8D25",
  "settings.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "settings.hint": "\u5F52\u6863\u7684\u4F1A\u8BDD\u4E0D\u4F1A\u51FA\u73B0\u5728\u4FA7\u8FB9\u680F\uFF0C\u53EF\u5728\u6B64\u67E5\u770B\u5E76\u6062\u590D\u3002",
  "outline.toggle": "\u63D0\u95EE",
  "outline.title": "\u672C\u4F1A\u8BDD\u63D0\u95EE",
  "outline.empty": "\u8FD8\u6CA1\u6709\u63D0\u95EE\uFF0C\u5F00\u59CB\u5BF9\u8BDD\u5427",
  "outline.close": "\u5173\u95ED",
  "outline.questions": "\u4E2A\u63D0\u95EE",
  "outline.locateFailed": "\u8BE5\u6D88\u606F\u4E0D\u5728\u5F53\u524D\u52A0\u8F7D\u7684\u7A97\u53E3\u4E2D",
  "outline.locateOlder": "\u8F83\u65E9\u7684\u63D0\u95EE\u672A\u52A0\u8F7D\uFF0C\u5148\u5728\u804A\u5929\u5E95\u90E8\u70B9\u300C\u52A0\u8F7D\u66F4\u65E9\u300D\u5373\u53EF\u5B9A\u4F4D",
  "outline.yesterday": "\u6628\u5929"
};
var en = {
  "settings.nav": "Archived Sessions",
  "settings.empty": "No archived sessions",
  "settings.count": "{count} archived session(s)",
  "settings.archivedBadge": "Archived",
  "settings.running": "Running",
  "settings.open": "Open",
  "settings.unarchive": "Unarchive",
  "settings.rename": "Rename",
  "settings.renameSave": "Save",
  "settings.renameCancel": "Cancel",
  "settings.delete": "Delete",
  "settings.confirmDelete": "Confirm delete?",
  "settings.toast.unarchived": "Unarchived \u2014 restored to the sidebar",
  "settings.toast.renamed": "Renamed",
  "settings.toast.renameError": "Rename failed",
  "settings.toast.unarchiveError": "Unarchive failed",
  "settings.toast.openError": "Failed to open session",
  "settings.toast.deleted": "Session deleted",
  "settings.toast.deleteError": "Delete failed",
  "settings.loading": "Loading\u2026",
  "settings.hint": "Archived sessions are hidden from the sidebar; manage them here.",
  "outline.toggle": "Questions",
  "outline.title": "Questions in this session",
  "outline.empty": "No questions yet \u2014 start chatting",
  "outline.close": "Close",
  "outline.questions": "question(s)",
  "outline.locateFailed": "This message is outside the loaded window",
  "outline.locateOlder": "This question is not loaded yet \u2014 tap \u201CLoad earlier\u201D at the bottom of the chat first",
  "outline.yesterday": "Yesterday"
};
function dictionary() {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "zh";
  return lang.toLowerCase().startsWith("en") ? { ...en } : { ...zh };
}
function tt(key, values) {
  const text = dictionary()[key] ?? key;
  if (values === void 0) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name) => {
    const value = values[name];
    return value === void 0 ? whole : String(value);
  });
}

// src/client/ArchivedSessionsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function timeLabel(ts, now) {
  const date = new Date(ts);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (ts >= today.getTime()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  if (ts >= today.getTime() - 864e5) return tt("outline.yesterday");
  const year = date.getFullYear();
  const prefix = year === new Date(now).getFullYear() ? "" : `${year}/`;
  return `${prefix}${date.getMonth() + 1}/${date.getDate()}`;
}
var IconOpen = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6.5 3.5H3.8A1.3 1.3 0 0 0 2.5 4.8v7.4a1.3 1.3 0 0 0 1.3 1.3h7.4a1.3 1.3 0 0 0 1.3-1.3V9.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9.5 2.5H13.5V6.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M13 3L8 8" })
] });
var IconUnarchive = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.5 5.5h11v8h-11z" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2 2.5h12v3H2z" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 13V9.5M6.2 11L8 9.2 9.8 11" })
] });
var IconPencil = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M11.5 2.5l2 2L6 12l-2.8.8L4 10z" }) });
var IconTrash = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "13", height: "13", fill: "none", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.5 4.5h11M6 4.5V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 4.5l.6 8.2a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6.5 7.5v3.5M9.5 7.5v3.5" })
] });
var IconClock = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", fill: "none", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 4.8V8l2.2 1.4" })
] });
var IconArchive = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", fill: "none", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.5 5.5h11v8h-11z" }),
  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2 2.5h12v3H2z" })
] });
function ArchivedSessionsSection({ close, ctx }) {
  const [now, setNow] = (0, import_react.useState)(() => Date.now());
  const [renaming, setRenaming] = (0, import_react.useState)(null);
  const [renameDraft, setRenameDraft] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)({});
  const [deleteArmed, setDeleteArmed] = (0, import_react.useState)(null);
  const [deletedIds, setDeletedIds] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
  const [toast, setToast] = (0, import_react.useState)(null);
  const toastTimer = (0, import_react.useRef)(void 0);
  const deleteTimer = (0, import_react.useRef)(void 0);
  useEffectMinute(setNow);
  const sessionsSnapshot = (0, import_react.useSyncExternalStore)(
    (0, import_react.useCallback)((listener) => ctx.sessions.list.subscribe(listener), [ctx]),
    (0, import_react.useCallback)(() => ctx.sessions.list.getSnapshot(), [ctx])
  );
  const workspacesSnapshot = (0, import_react.useSyncExternalStore)(
    (0, import_react.useCallback)((listener) => ctx.workspaces.list.subscribe(listener), [ctx]),
    (0, import_react.useCallback)(() => ctx.workspaces.list.getSnapshot(), [ctx])
  );
  const rows = (0, import_react.useMemo)(() => {
    const archived = new Set(workspacesSnapshot.archivedSessionIds);
    return sessionsSnapshot.ids.map((id) => sessionsSnapshot.byId[id]).filter((summary) => summary !== void 0 && archived.has(summary.id) && !deletedIds.has(summary.id) && summary.origin !== "subagent").map((summary) => ({
      id: summary.id,
      title: summary.displayTitle.trim() !== "" ? summary.displayTitle : summary.id,
      updatedAt: summary.updatedAt,
      running: summary.running
    })).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessionsSnapshot, workspacesSnapshot, deletedIds]);
  const showToast = (text, kind = "info") => {
    if (toastTimer.current !== void 0) clearTimeout(toastTimer.current);
    setToast({ text, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  const markBusy = (id, value) => {
    setBusy((previous) => ({ ...previous, [id]: value }));
  };
  const disarmDelete = () => {
    if (deleteTimer.current !== void 0) clearTimeout(deleteTimer.current);
    setDeleteArmed(null);
  };
  const onDeleteClick = (id) => {
    if (deleteArmed !== id) {
      if (deleteTimer.current !== void 0) clearTimeout(deleteTimer.current);
      setDeleteArmed(id);
      deleteTimer.current = setTimeout(() => setDeleteArmed(null), 3500);
      return;
    }
    if (deleteTimer.current !== void 0) clearTimeout(deleteTimer.current);
    setDeleteArmed(null);
    void doDelete(id);
  };
  const doDelete = async (id) => {
    markBusy(id, true);
    try {
      await deleteArchivedSession(id);
      setDeletedIds((previous) => new Set(previous).add(id));
      if (renaming === id) setRenaming(null);
      try {
        await ctx.sessions.refresh();
      } catch {
      }
      showToast(tt("settings.toast.deleted"));
    } catch (error) {
      showToast(tt("settings.toast.deleteError") + (error instanceof Error ? `: ${error.message}` : ""), "error");
    } finally {
      markBusy(id, false);
    }
  };
  const openSession = (id) => {
    disarmDelete();
    try {
      ctx.sessions.open(id);
      close();
    } catch (error) {
      showToast(tt("settings.toast.openError") + (error instanceof Error ? `: ${error.message}` : ""), "error");
    }
  };
  const doUnarchive = async (id) => {
    disarmDelete();
    markBusy(id, true);
    try {
      await unarchiveSession(id);
      if (renaming === id) setRenaming(null);
      showToast(tt("settings.toast.unarchived"));
    } catch (error) {
      showToast(tt("settings.toast.unarchiveError") + (error instanceof Error ? `: ${error.message}` : ""), "error");
    } finally {
      markBusy(id, false);
    }
  };
  const startRename = (id, currentTitle) => {
    disarmDelete();
    setRenaming(id);
    setRenameDraft(currentTitle);
  };
  const saveRename = async (id) => {
    const title = renameDraft.trim();
    if (title === "" || renaming !== id) return;
    markBusy(id, true);
    try {
      await renameSession(ctx, id, title);
      setRenaming(null);
      showToast(tt("settings.toast.renamed"));
    } catch (error) {
      showToast(tt("settings.toast.renameError") + (error instanceof Error ? `: ${error.message}` : ""), "error");
    } finally {
      markBusy(id, false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "chh-settings", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "chh-settings-hint", children: tt("settings.hint") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "chh-settings-count", children: tt("settings.count", { count: rows.length }) }),
    rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "chh-empty", children: tt("settings.empty") }) : rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "chh-settings-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "chh-settings-row-main", children: [
        renaming === row.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "chh-settings-rename", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              type: "text",
              value: renameDraft,
              autoFocus: true,
              onChange: (event) => setRenameDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter") void saveRename(row.id);
                if (event.key === "Escape") setRenaming(null);
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => void saveRename(row.id), disabled: busy[row.id] === true, children: tt("settings.renameSave") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: () => setRenaming(null), children: tt("settings.renameCancel") })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chh-settings-row-title", title: row.title, children: row.title }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "chh-settings-row-meta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "chh-meta-time", title: new Date(row.updatedAt).toLocaleString(), children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconClock, {}),
            timeLabel(row.updatedAt, now)
          ] }),
          row.running && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "chh-status", "data-kind": "running", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "chh-dot" }),
            tt("settings.running")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "chh-status", "data-kind": "archived", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconArchive, {}),
            tt("settings.archivedBadge")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "chh-settings-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "chh-action", "data-primary": "true", title: tt("settings.open"), onClick: () => openSession(row.id), children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconOpen, {}),
          " ",
          tt("settings.open")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "chh-action", title: tt("settings.unarchive"), onClick: () => void doUnarchive(row.id), disabled: busy[row.id] === true, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconUnarchive, {}),
          " ",
          tt("settings.unarchive")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "chh-action", title: tt("settings.rename"), onClick: () => startRename(row.id, row.title), disabled: busy[row.id] === true, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconPencil, {}),
          " ",
          tt("settings.rename")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: "chh-action",
            "data-danger": deleteArmed === row.id || void 0,
            title: tt("settings.delete"),
            onClick: () => onDeleteClick(row.id),
            disabled: busy[row.id] === true,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconTrash, {}),
              " ",
              deleteArmed === row.id ? tt("settings.confirmDelete") : tt("settings.delete")
            ]
          }
        )
      ] })
    ] }, row.id)),
    toast !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "chh-toast", "data-kind": toast.kind, role: "status", children: toast.text })
  ] });
}
function useEffectMinute(setNow) {
  (0, import_react.useEffect)(() => {
    const timer = setInterval(() => setNow(Date.now()), 6e4);
    return () => clearInterval(timer);
  }, [setNow]);
}

// src/client/OutlinePanel.tsx
var import_react2 = require("react");
var import_react_dom = require("react-dom");
var import_jsx_runtime2 = require("react/jsx-runtime");
var SCROLL_SELECTOR = "[data-conversation-scroll]";
function QuestionRow({ question, active, onLocate }) {
  const itemRef = (0, import_react2.useRef)(null);
  const [showTip, setShowTip] = (0, import_react2.useState)(false);
  const [tipPos, setTipPos] = (0, import_react2.useState)(null);
  const enterTimer = (0, import_react2.useRef)(void 0);
  const handleEnter = () => {
    enterTimer.current = setTimeout(() => {
      const item = itemRef.current;
      if (item === null) return;
      const text = item.querySelector(".chh-qitem-text");
      const fullText = question.text !== "" ? question.text : "\u2026";
      let units = 0;
      for (const ch of fullText) {
        units += ch.charCodeAt(0) > 11904 ? 2 : 1;
      }
      const likelyTruncated = units > 40;
      const domTruncated = text !== null && text.scrollWidth > text.clientWidth;
      if (!likelyTruncated && !domTruncated) return;
      const rect = item.getBoundingClientRect();
      const tipWidth = 320;
      const left = Math.max(8, rect.left - tipWidth - 10);
      setTipPos({ top: rect.top + rect.height / 2, left });
      setShowTip(true);
    }, 400);
  };
  const handleLeave = () => {
    if (enterTimer.current !== void 0) {
      clearTimeout(enterTimer.current);
      enterTimer.current = void 0;
    }
    setShowTip(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      ref: itemRef,
      className: "chh-qitem",
      "data-active": active || void 0,
      role: "button",
      tabIndex: 0,
      onMouseEnter: handleEnter,
      onMouseLeave: handleLeave,
      onClick: () => onLocate(question),
      onKeyDown: (event) => {
        if (event.key === "Enter") onLocate(question);
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chh-qitem-text", children: question.text !== "" ? question.text : "\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chh-qitem-dot", "aria-hidden": "true" }),
        showTip && tipPos !== null && (0, import_react_dom.createPortal)(
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "span",
            {
              className: "chh-qitem-tip",
              role: "tooltip",
              style: { position: "fixed", top: `${tipPos.top}px`, left: `${tipPos.left}px`, transform: "translateY(-50%)", width: "320px" },
              children: question.text !== "" ? question.text : "\u2026"
            }
          ),
          document.body
        )
      ]
    }
  );
}
function OutlinePanel({ ctx }) {
  const [activeKey, setActiveKey] = (0, import_react2.useState)(null);
  const [hovered, setHovered] = (0, import_react2.useState)(false);
  const listRef = (0, import_react2.useRef)(null);
  const [toast, setToast] = (0, import_react2.useState)(null);
  const toastTimer = (0, import_react2.useRef)(void 0);
  const sessionsSnapshot = (0, import_react2.useSyncExternalStore)(
    (0, import_react2.useCallback)((listener) => ctx.sessions.list.subscribe(listener), [ctx]),
    (0, import_react2.useCallback)(() => ctx.sessions.list.getSnapshot(), [ctx])
  );
  const currentId = sessionsSnapshot.current;
  const binding = (0, import_react2.useMemo)(
    () => currentId !== void 0 ? ctx.sessions.binding(currentId) : void 0,
    [ctx, currentId]
  );
  const conversation = (0, import_react2.useSyncExternalStore)(
    (0, import_react2.useCallback)(
      (listener) => binding !== void 0 ? binding.session.subscribe(listener) : () => void 0,
      [binding]
    ),
    (0, import_react2.useCallback)(
      () => binding !== void 0 ? binding.session.getSnapshot() : void 0,
      [binding]
    )
  );
  const [historyQuestions, setHistoryQuestions] = (0, import_react2.useState)([]);
  (0, import_react2.useEffect)(() => {
    if (currentId === void 0) return;
    let cancelled = false;
    void (async () => {
      const collected = [];
      let beforeSeq;
      for (let page = 0; page < 6; page++) {
        try {
          const response = await ctx.connection.api.sessions.history({
            sessionId: currentId,
            beforeSeq,
            maxMessages: 100
          });
          const result = response.result;
          if (!result.ok) break;
          const { events, hasMore } = result.value;
          if (events.length === 0) break;
          for (const entry of events) {
            const event = entry.event;
            if (event.type !== "user/message") continue;
            const data = event.data;
            if (data.source?.kind !== "user") continue;
            collected.push({
              key: `history:${event.seq}`,
              seq: event.seq,
              time: event.time,
              text: truncate(textOf(data.content), 160)
            });
          }
          if (!hasMore) break;
          beforeSeq = events[0].event.seq;
        } catch {
          break;
        }
      }
      if (!cancelled) setHistoryQuestions(collected);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId, ctx]);
  const questions = (0, import_react2.useMemo)(() => {
    const bySeq = /* @__PURE__ */ new Map();
    if (conversation !== void 0) {
      const chat = conversation.chat;
      for (const key of chat.order) {
        const node = chat.nodes.get(key);
        if (node === void 0) continue;
        if (node.kind !== "user" && node.kind !== "steering") continue;
        const state = node.data;
        if (typeof state.seq !== "number" || typeof state.time !== "number") continue;
        bySeq.set(state.seq, { key, seq: state.seq, time: state.time, text: truncate(textOf(state.content), 160) });
      }
    }
    for (const question of historyQuestions) {
      if (!bySeq.has(question.seq)) bySeq.set(question.seq, question);
    }
    return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
  }, [conversation, historyQuestions]);
  const showToast = (text) => {
    if (toastTimer.current !== void 0) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };
  const locate = (key) => {
    const selector = `[data-chat-flow-key="${CSS.escape(key)}"]`;
    const el = document.querySelector(selector);
    if (el === null) {
      showToast(tt("outline.locateFailed"));
      return;
    }
    const scroller = el.closest(SCROLL_SELECTOR);
    if (scroller !== null) {
      const scrollerRect = scroller.getBoundingClientRect();
      const top = scroller.scrollTop + el.getBoundingClientRect().top - scrollerRect.top - 16;
      scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    el.classList.add("chh-locate-flash");
    setTimeout(() => el.classList.remove("chh-locate-flash"), 1900);
  };
  const [pendingLocateSeq, setPendingLocateSeq] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
    if (pendingLocateSeq === null) return;
    const question = questions.find((candidate) => candidate.seq === pendingLocateSeq);
    if (question !== void 0 && !question.key.startsWith("history:")) {
      setPendingLocateSeq(null);
      locate(question.key);
    }
  }, [questions, pendingLocateSeq]);
  const windowContainsSeq = (seq) => {
    const snapshot = binding?.session.getSnapshot();
    if (snapshot === void 0) return false;
    const chat = snapshot.chat;
    for (const key of chat.order) {
      const node = chat.nodes.get(key);
      const data = node?.data;
      if (data?.seq === seq) return true;
    }
    return false;
  };
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const locateQuestion = async (question) => {
    if (!question.key.startsWith("history:")) {
      locate(question.key);
      return;
    }
    if (binding === void 0 || windowContainsSeq(question.seq)) {
      locate(question.key);
      return;
    }
    setPendingLocateSeq(question.seq);
    for (let page = 0; page < 40; page++) {
      const snapshot = binding.session.getSnapshot();
      if (snapshot === void 0) break;
      if (windowContainsSeq(question.seq)) return;
      if (!snapshot.hasMore) break;
      await binding.session.loadOlder();
      await nextFrame();
    }
    if (!windowContainsSeq(question.seq)) {
      setPendingLocateSeq(null);
      showToast(tt("outline.locateOlder"));
    }
  };
  (0, import_react2.useEffect)(() => {
    const scroller = document.querySelector(SCROLL_SELECTOR);
    if (scroller === null || questions.length === 0) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = scroller.getBoundingClientRect();
      const threshold = rect.top + 96;
      let active = null;
      for (const q of questions) {
        const el = document.querySelector(`[data-chat-flow-key="${CSS.escape(q.key)}"]`);
        if (el !== null && el.getBoundingClientRect().top <= threshold) active = q.key;
      }
      if (active === null) active = questions[questions.length - 1].key;
      setActiveKey(active);
    };
    const onScroll = () => {
      if (raf === 0) raf = requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, [questions, hovered]);
  (0, import_react2.useEffect)(() => {
    if (questions.length === 0) return;
    if (activeKey === null || !questions.some((q) => q.key === activeKey)) {
      setActiveKey(questions[questions.length - 1].key);
    }
  }, [questions, activeKey]);
  (0, import_react2.useEffect)(() => {
    if (!hovered) return;
    const el = listRef.current;
    if (el === null) return;
    el.scrollTop = el.scrollHeight;
  }, [hovered, questions]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { "data-dsh-chat-history-root": true, children: [
    currentId !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "section",
      {
        className: "chh-panel",
        "data-hover": hovered || void 0,
        "aria-label": tt("outline.title"),
        role: "complementary",
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "chh-rail", "aria-hidden": "true", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chh-rail-line" }),
            questions.slice(-3).map((question) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "span",
              {
                className: "chh-rail-bar",
                "data-active": activeKey === question.key || void 0
              },
              question.key
            ))
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chh-outline-list", ref: listRef, children: questions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chh-empty", children: tt("outline.empty") }) : questions.map((question) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            QuestionRow,
            {
              question,
              active: activeKey === question.key,
              onLocate: (q) => void locateQuestion(q)
            },
            question.key
          )) })
        ]
      }
    ),
    toast !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "chh-toast", "data-kind": "info", role: "status", children: toast })
  ] });
}

// src/client/style.ts
var PANEL_CSS = `
[data-dsh-chat-history-root] {
  --chh-panel-width: 280px;
  font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif);
}

/* ==================================================== right-side outline */

/* -------------------------------------------------------------- panel */
/* Right-edge, vertically-centered hover-expand surface.
   Collapsed (default): a vertical line hugging the right edge with one stub
   bar per question (grey, the active one blue) \u2014 a compact list affordance.
   On hover it expands LEFT (right edge stays put so the pointer never leaves
   the hit area \u2192 no flicker) into a white rounded card listing the questions:
   each row is [truncated text] + [small dot], color-coded grey\u2192dark(hover)
   \u2192blue(active). No horizontal scroll; list caps ~3 rows then scrolls. */
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
  /* right stays 0 \u2014 expand leftward so the pointer never exits the box. */
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
     several \u2014 prevents skipping past questions. */
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
   state: grey (normal) \u2192 black (hover, clearly readable) \u2192 blue (active).
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
/* Normal row \u2192 black on hover for readability. */
.chh-qitem:hover {
  color: #2c2c2e;
}
/* Active (located) row \u2192 blue, and STAYS blue even on hover. Declared after
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
  /* Crisp text rendering \u2014 the panel sits on a translateY(-50%) transform
     which can trigger subpixel rendering; force integer alignment. */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
/* Right dot indicator \u2014 a small capsule that tracks the row's text color. */
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
  font-size: 11.5px;
  color: #666;
}
.chh-meta-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  color: #666;
}
.chh-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  line-height: 15px;
  font-weight: 600;
}
.chh-status[data-kind="running"] {
  background: rgba(46,160,67,.14);
  color: #1a7f37;
}
.chh-status[data-kind="archived"] {
  background: rgba(219,157,8,.16);
  color: #946300;
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
`;

// src/client/index.ts
var import_jsx_runtime3 = require("react/jsx-runtime");
var ROOT_SELECTOR = "[data-dsh-chat-history-root]";
var STYLE_TAG = "data-plugin-chat-history-css";
var SETTINGS_SECTION_ID = "chat-history-archived";
var inject = ["slots", "connection", "sessions", "workspaces"];
function injectStyles() {
  const existing = document.querySelector(`style[${STYLE_TAG}]`);
  if (existing !== void 0 && existing !== null) return () => void 0;
  const style = document.createElement("style");
  style.setAttribute(STYLE_TAG, "");
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}
function mountOutline(ctx) {
  let root;
  let container;
  const ensure = () => {
    if (container !== void 0) {
      if (container.isConnected) return;
      root?.unmount();
      root = void 0;
      container.remove();
      container = void 0;
    }
    const host = document.body;
    if (host === null) return;
    container = document.createElement("div");
    container.dataset.dshChatHistoryRoot = "";
    container.dataset.dshPlugin = "chat-history";
    host.appendChild(container);
    root = (0, import_client.createRoot)(container);
    root.render(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OutlinePanel, { ctx }));
  };
  const waitObserver = new MutationObserver(() => {
    ensure();
  });
  waitObserver.observe(document.documentElement, { childList: true, subtree: true });
  ensure();
  return () => {
    waitObserver.disconnect();
    root?.unmount();
    root = void 0;
    container?.remove();
    container = void 0;
  };
}
function apply(ctx) {
  try {
    const disposeStyles = injectStyles();
    ctx.slots.inject("settings.section", () => ctx.slots.register({
      name: "settings.section",
      id: SETTINGS_SECTION_ID,
      order: 90,
      label: () => tt("settings.nav"),
      inject: () => ({ ctx })
    }, ArchivedSessionsSection));
    const disposeOutline = mountOutline(ctx);
    ctx.effect(() => () => {
      disposeOutline();
      disposeStyles();
    }, "chat-history: surfaces");
  } catch (error) {
    console.warn("[dsh-chat-history] mount failed:", error);
  }
}

		return module.exports;
	}
});
