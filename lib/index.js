// src/index.ts
import { rmSync } from "node:fs";
import { dirname } from "node:path";

// src/loopback.ts
function isIPv4Loopback(v4) {
  const parts = v4.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function isLoopbackAddress(address) {
  if (address === void 0) return false;
  const normalized = address.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("::ffff:")) return isIPv4Loopback(normalized.slice("::ffff:".length));
  return isIPv4Loopback(normalized);
}
function isLoopbackHostname(hostname) {
  if (hostname === "localhost" || hostname === "[::1]") return true;
  return isIPv4Loopback(hostname);
}
function isLoopbackRequest(request) {
  if (!isLoopbackAddress(request.socket.remoteAddress)) return false;
  const host = request.headers.host;
  if (typeof host !== "string") return false;
  let hostUrl;
  try {
    hostUrl = new URL("http://" + host);
  } catch {
    return false;
  }
  if (!isLoopbackHostname(hostUrl.hostname)) return false;
  if (request.headers["sec-fetch-site"] === "cross-site") return false;
  const origin = request.headers.origin;
  if (origin === void 0) return true;
  try {
    return new URL(origin).host === hostUrl.host;
  } catch {
    return false;
  }
}

// src/index.ts
var name = "chat-history";
var inject = ["webServer", "workspaceRegistry", "sessions", "sessionPersistence"];
var CHAT_HISTORY_API = {
  unarchive: "/api/dsh-chat-history/unarchive",
  delete: "/api/dsh-chat-history/delete"
};
var MAX_JSON_BODY_BYTES = 64 * 1024;
function writeJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "referrer-policy": "no-referrer"
  });
  res.end(payload);
}
async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = chunk;
    size += buffer.length;
    if (size > MAX_JSON_BODY_BYTES) return void 0;
    chunks.push(buffer);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function apply(ctx) {
  ctx.effect(() => {
    const registry = ctx.workspaceRegistry;
    ctx.webServer.register({
      kind: "exact",
      path: CHAT_HISTORY_API.unarchive,
      handler: async (req, res) => {
        if (!isLoopbackRequest(req) || req.method !== "POST") {
          writeJson(res, 403, { error: "forbidden: loopback-only" });
          return;
        }
        const body = await readJsonBody(req);
        const sessionId = typeof body?.sessionId === "string" && body.sessionId !== "" ? body.sessionId : void 0;
        if (sessionId === void 0) {
          writeJson(res, 400, { error: "sessionId is required" });
          return;
        }
        try {
          await registry.enqueueOperation(async () => {
            const state = registry.requireState();
            if (!state.archivedSessionIds.includes(sessionId)) return;
            await registry.setState({
              ...state,
              archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
            });
          });
          writeJson(res, 200, {
            ok: true,
            archivedSessionIds: [...registry.archivedSessionIds]
          });
        } catch (error) {
          writeJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    }, "chat-history: unarchive route");
    ctx.webServer.register({
      kind: "exact",
      path: CHAT_HISTORY_API.delete,
      handler: async (req, res) => {
        if (!isLoopbackRequest(req) || req.method !== "POST") {
          writeJson(res, 403, { error: "forbidden: loopback-only" });
          return;
        }
        const body = await readJsonBody(req);
        const sessionId = typeof body?.sessionId === "string" && body.sessionId !== "" ? body.sessionId : void 0;
        if (sessionId === void 0) {
          writeJson(res, 400, { error: "sessionId is required" });
          return;
        }
        if (body?.confirm !== true) {
          writeJson(res, 400, { error: "confirm:true is required" });
          return;
        }
        if (!registry.archivedSessionIds.includes(sessionId)) {
          writeJson(res, 409, { error: "only archived sessions can be deleted" });
          return;
        }
        if (ctx.sessions.get(sessionId) !== void 0) {
          writeJson(res, 409, { error: "a running session cannot be deleted" });
          return;
        }
        let sessionDir;
        try {
          const headers = await ctx.sessionPersistence.list();
          const header = headers.find((candidate) => candidate.id === sessionId);
          if (header !== void 0) {
            const location = ctx.sessionPersistence.locate(header);
            if (location !== void 0) sessionDir = dirname(location.path);
          }
        } catch (error) {
          writeJson(res, 500, { error: `cannot resolve session location: ${error instanceof Error ? error.message : String(error)}` });
          return;
        }
        let ownedWorkspaceId;
        try {
          await registry.enqueueOperation(async () => {
            const state = registry.requireState();
            const nextArchived = state.archivedSessionIds.filter((id) => id !== sessionId);
            await registry.setState({
              ...state,
              archivedSessionIds: nextArchived
            });
            const table = registry.requireTable();
            for (const workspaceId of state.workspaceIds) {
              const record = table.get(workspaceId);
              if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
              ownedWorkspaceId = workspaceId;
              await table.put(workspaceId, {
                ...record,
                sessionIds: record.sessionIds.filter((id) => id !== sessionId),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              });
              break;
            }
          });
        } catch (error) {
          writeJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
          return;
        }
        if (sessionDir !== void 0) {
          try {
            rmSync(sessionDir, { recursive: true, force: true });
          } catch (error) {
            try {
              await registry.enqueueOperation(async () => {
                const state = registry.requireState();
                if (!state.archivedSessionIds.includes(sessionId)) {
                  await registry.setState({
                    ...state,
                    archivedSessionIds: [...state.archivedSessionIds, sessionId]
                  });
                }
                if (ownedWorkspaceId !== void 0) {
                  const table = registry.requireTable();
                  const record = table.get(ownedWorkspaceId);
                  if (record !== void 0 && !record.sessionIds.includes(sessionId)) {
                    await table.put(ownedWorkspaceId, {
                      ...record,
                      sessionIds: [...record.sessionIds, sessionId],
                      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
                    });
                  }
                }
              });
            } catch {
            }
            writeJson(res, 500, { error: `failed to delete session log: ${error instanceof Error ? error.message : String(error)}` });
            return;
          }
        }
        writeJson(res, 200, {
          ok: true,
          archivedSessionIds: [...registry.archivedSessionIds]
        });
      }
    }, "chat-history: delete route");
    return () => void 0;
  }, "chat-history: routes");
}
export {
  CHAT_HISTORY_API,
  apply,
  inject,
  name
};
