# dsh-chat-history

DSH Web GUI 的「归档会话管理 + 对话提问定位」插件。

官方 UI 只能把会话「归档」，归档后会话从侧边栏消失，且没有任何查看 / 取消归档的入口。
本插件补齐这个缺口，并提供像 ChatGPT / DeepSeek 网页版那样的「问题目录」：

- **设置 → 归档会话**：在官方设置面板里新增一页「归档会话」，列出全部已归档会话（标题 / 时间 /
  状态），可 **打开**（跳转到该会话并关闭设置）、**取消归档**（恢复显示在官方侧边栏）、**重命名**、
  **删除**（永久删除已归档会话：归档标记 + 工作区记账 + 会话日志目录；两步确认防误删）。
- **右侧提问目录**：对话页面右缘有「提问」浮签，点开后在右侧以时间线样式（DeepSeek 网页版风格）展示
  当前会话的**每一个提问**（用户消息，带序号与时间）；点击任意一条，聊天区平滑滚动定位到对应消息并闪烁
  高亮；反向地，滚动聊天区时目录会同步高亮当前视口顶部的提问。

## 功能

### 设置页「归档会话」（`settings.section` 槽位，id `chat-history-archived`）

- 只展示已归档会话（普通侧边栏看不见的那部分）。
- 打开：`ctx.sessions.open(id)` 并关闭设置面板。
- 取消归档：走插件宿主路由 `POST /api/dsh-chat-history/unarchive`（官方 RPC 没有 unarchive，
  宿主通过 workspace registry 自身的事务链移除归档标记，恢复后侧边栏重新显示该会话）。
- 重命名：官方 `session.rename`（钉住标题，不再被自动生成覆盖）。
- 删除：走插件宿主路由 `POST /api/dsh-chat-history/delete`（需 `confirm: true`，两步确认）。
  只允许删除**已归档**且**未运行**的会话；宿主在 workspace registry 的事务链上移除归档标记与
  工作区记账槽位，再删除 `~/.dsh/sessions/<workspace>/session-<id>/` 日志目录；删除日志失败时
  自动回滚记账。会话列表的刷新依赖 `host/archived-sessions-changed` 帧，客户端也会本地即时隐藏
  已删除行。

### 右侧提问目录（独立 React root，fixed 定位）

- 数据来自官方会话快照的 Chat 视图（`snapshot.chat.order` + `nodes`），只取 `user` / `steering`
  节点，附序号、时间与文本摘要；条目以时间线样式展示（左侧圆点 + 连接线，右侧文本 + `#序号` + 时间）。
- 定位：官方渲染器在每个消息节点上输出 `data-chat-flow-key`（= Chat 节点 key，格式
  `{kind长度}:{kind}{messageId}`）与 `data-chat-flow-kind`，滚动容器是 `[data-conversation-scroll]`；
  点击条目即按 key 找到该节点 → 平滑滚动 + 闪烁高亮，全程纯 DOM 操作，不改 dsh 源码。
- 反向同步：监听滚动容器，把当前视口顶部的提问在目录中高亮（圆点与序号变为品牌色）。

## 架构

双面插件（与 dsh-ssh 等同一模式）：

| 面 | 入口 | 内容 |
|---|---|---|
| 宿主 | `exports "."` → `lib/index.js` | 注册 `POST /api/dsh-chat-history/unarchive` 与 `POST /api/dsh-chat-history/delete`（loopback 围栏）；unarchive 通过 workspace registry 事务链移除归档标记，delete 在事务链上移除归档标记 + 工作区记账槽位并删除会话日志目录 |
| 浏览器 | `exports "./client"` → `lib/client.js` | ① 注册 `settings.section` 设置页「归档会话」（打开 / 取消归档 / 重命名 / 两步确认删除）；② 以独立 React root 挂载右侧提问目录（DeepSeek 网页版风格时间线，fixed 定位，不干扰 AppFrame 对账），样式全部走 shell 设计令牌（`--dsw-alias-*`） |

数据通路全部使用官方客户端服务：`ctx.sessions.list / open / binding`、`ctx.workspaces.list`、
`ctx.connection.api.sessions.rename`，仅 unarchive / delete 走插件自己的路由。

## 安装

```sh
# 在 dsh 的 web profile 下安装（link 方式，本地开发）
dsh plugin --profile web add link:<本插件绝对路径>

# 或发布后按包名安装
dsh plugin --profile web add @linxin666/dsh-chat-history
```

`dsh plugin add` 会把包加入 `dsh.profile.bundles`，插件的 `cordis.patch.yml` 自动向配置树插入
`{ id: chat-history, name: '@linxin666/dsh-chat-history' }` 行。安装后**重启 dsh web 并刷新浏览器页面**生效。

## 开发

```sh
npm install        # 仅需 esbuild
npm run build      # 产出 lib/index.js（宿主）+ lib/client.js（浏览器，__ModuleLoader__ 契约）
node scripts/smoke-client.mjs   # 客户端 bundle 物化冒烟测试
```

客户端 bundle 必须保持「`window.__ModuleLoader__.load({id, factory})`」包装形态，`id` 等于包名；
`react` / `react-dom/*` / `@deepseek-ai/*` 全部 external，由 web shell 的模块系统解析。

## 限制

- 删除仅限**已归档**会话（归档页是唯一入口）：官方 API 无删除能力，本插件宿主路由负责记账清理 +
  日志目录删除；未归档会话不可删除。删除不可撤销，请先确认。
- unarchive / delete 路由仅限 loopback（`127.0.0.1` / `localhost`），局域网暴露的部署不受理。
- 提问目录为 fixed 定位浮动层，不参与 AppFrame 三栏布局；只列出当前已加载窗口内的提问
  （超长会话中较早的消息不在窗口内时，点击会提示无法定位）。
