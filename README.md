# dsh-chat-history — Archived session manager + question outline for DSH

English | [中文](#中文)

A DSH Web GUI plugin with two surfaces — no DSH source modifications, everything rides the official client SDK + a pair of loopback-only host routes.

## Capabilities

| Surface | Description |
| --- | --- |
| **Archived sessions manager** | Settings → "Archived Sessions" page: lists every archived session (hidden from the sidebar by the official UI) with title / time / status; **open** (jump to it), **unarchive** (restore to sidebar), **rename**, **delete** (permanent — archive marker + workspace accounting + session log directory; two-step confirm) |
| **Right-side question outline** | A hover-expand rail on the right edge of the conversation page, listing every user question of the current session. Click any question to smooth-scroll the chat to that exact message and flash-highlight it; as you scroll the chat, the outline highlights the question currently at the top of the viewport |

### Question outline — three states

| State | Visual | Trigger |
| --- | --- | --- |
| **Collapsed** (default) | A slim vertical line hugging the right edge + 3 short stub bars (the most recent questions); the active bar is blue, the rest grey | Page load |
| **Expanded** (hover) | Expands leftward into a white rounded card showing up to 6 question rows; scrolls (row-snap) when there are more | Mouse enters the rail |
| **Overflow tooltip** | Hovering a truncated row (text ends with `…`) shows a dark box to its left with the full question text | Hover a truncated row for 400 ms |

Row color states: **grey** (normal) → **black** (hover) → **blue** (active / located). The active row stays blue even on hover.

## Install

### From npm (recommended)

```sh
dsh plugin --profile web add @linxin666/dsh-chat-history@latest
```

### From the repository (development)

```sh
git clone git@github.com:low-key-sapling/dsh-chat-history.git
cd dsh-chat-history
npm install && npm run build
dsh plugin --profile web add link:$(pwd)
```

After installing, **restart `dsh web`** and refresh the page. The archived-sessions page appears under Settings; the question rail appears on the right edge of any conversation.

## Uninstall

```sh
dsh plugin --profile web remove @linxin666/dsh-chat-history
```

## Architecture

Dual-face plugin (same pattern as dsh-ssh / dsh-task-board):

| Face | Entry | Content |
| --- | --- | --- |
| Host | `lib/index.js` | Two loopback-only routes: `POST /api/dsh-chat-history/unarchive` (removes the archive marker via the workspace registry's own transaction chain) and `POST /api/dsh-chat-history/delete` (removes marker + workspace accounting slot + deletes the session log directory; rolls back accounting on log-delete failure) |
| Browser | `lib/client.js` | ① Registers a `settings.section` page for archived-session management; ② Mounts an independent React root (fixed-position) for the right-side question outline |

All data paths use official client services (`ctx.sessions.list / open / binding`, `ctx.connection.api.sessions.rename / history`); only unarchive / delete go through the plugin's own routes.

## Development

```sh
npm install        # esbuild only
npm run build      # produces lib/index.js (host) + lib/client.js (browser, __ModuleLoader__ contract)
```

The browser bundle must keep the `window.__ModuleLoader__.load({ id, factory })` wrapper; `id` equals the package name. `react` / `react-dom/*` / `@deepseek-ai/*` are all external, resolved by the web shell's module system.

## Security

- Both host routes are **loopback-only** (`127.0.0.1` / `localhost` + same-origin check); LAN-exposed deployments are rejected.
- Delete requires `confirm: true` (two-step) and only applies to **archived, non-running** sessions.

## Known limitations

- Delete is available only for **archived** sessions (the archived-sessions page is the sole entry); unarchived sessions cannot be deleted.
- The question outline lists the loaded chat window's questions plus full-history questions pulled via the `sessions.history` RPC (bounded paging, 6 pages × 100 messages); extremely deep history beyond that may not be reachable.

## License

Apache-2.0

---

## 中文

DSH Web GUI 的「归档会话管理 + 对话提问定位」插件——不改 DSH 源码，全部走官方客户端 SDK + 两个仅限 loopback 的宿主路由。

### 功能

| 界面 | 说明 |
| --- | --- |
| **归档会话管理** | 设置 →「归档会话」页：列出全部已归档会话（官方 UI 归档后从侧边栏消失且无入口）；可**打开**、**取消归档**（恢复到侧边栏）、**重命名**、**删除**（永久删除：归档标记 + 工作区记账 + 会话日志目录，两步确认防误删） |
| **右侧提问目录** | 对话页面右缘的悬停展开轨道，列出当前会话的每一个提问。点击任意一条，聊天区平滑滚动定位到对应消息并闪烁高亮；滚动聊天区时目录同步高亮当前视口顶部的提问 |

### 提问目录三态

| 状态 | 外观 | 触发 |
| --- | --- | --- |
| **折叠态**（默认） | 贴右边缘的细竖线 + 3 个短横杠（最近提问）；active 横杠蓝色，其余灰色 | 页面加载 |
| **展开态**（悬停） | 向左展开成白色圆角卡片，最多显示 6 行提问；超出可逐行滚动（scroll-snap） | 鼠标移入轨道 |
| **超长提示** | 悬停被截断的行（文字带 `…`）400ms 后，左侧弹出深色方框显示完整内容 | 悬停截断行 |

行配色：**灰色**（普通）→ **黑色**（悬停）→ **蓝色**（定位到的 active）。active 行悬停时保持蓝色。

### 安装

```sh
# npm 安装（推荐）
dsh plugin --profile web add @linxin666/dsh-chat-history@latest

# 从仓库安装（开发）
git clone git@github.com:low-key-sapling/dsh-chat-history.git
cd dsh-chat-history
npm install && npm run build
dsh plugin --profile web add link:$(pwd)
```

安装后**重启 dsh web 并刷新页面**。设置里出现「归档会话」页；对话页右缘出现提问轨道。

### 卸载

```sh
dsh plugin --profile web remove @linxin666/dsh-chat-history
```

### 安全

- 两个宿主路由**仅限 loopback**（`127.0.0.1` / `localhost` + 同源校验），局域网暴露的部署不受理。
- 删除需 `confirm: true`（两步确认），且只允许删除**已归档且未运行**的会话。

### 开发

```sh
npm install
npm run build      # 产出 lib/index.js（宿主）+ lib/client.js（浏览器）
```

浏览器 bundle 必须保持 `window.__ModuleLoader__.load({ id, factory })` 包装，`id` = 包名；`react` / `react-dom/*` / `@deepseek-ai/*` 全部 external。

### 许可证

Apache-2.0
