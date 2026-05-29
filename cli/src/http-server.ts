// http-server — REST/JSON wrapper around the MCP tool dispatcher.
//
// Goal: enable third-party bot platforms (especially 字节 Coze) to call
// gaokao-pro tools as HTTP endpoints without learning the MCP protocol.
//
// Surface (zero-deps native Node http server):
//   GET  /                                — health + version + tool count
//   GET  /api/tools                       — OpenAI-style tool list (for Coze
//                                            plugin manifest auto-import)
//   GET  /openapi.json                    — OpenAPI 3.0 spec for Coze import
//   POST /api/tools/{tool_name}           — call any MCP tool; body = JSON args
//
// Example:
//   curl -X POST http://localhost:3000/api/tools/recommend \
//        -H 'Content-Type: application/json' \
//        -d '{"score": 590, "province": 43, "subjects": ["物理","化学","生物"]}'
//
// CORS open by default (host this behind a reverse proxy if you need auth).
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import { TOOLS, dispatch } from "./mcp.js";
import { VERSION } from "./version.js";

type ToolDef = (typeof TOOLS)[number];

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Length": Buffer.byteLength(payload).toString(),
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

// Build an OpenAPI 3.0 spec from the MCP tool definitions. Coze plugin import
// accepts this directly — paste the URL or upload the JSON.
function buildOpenApiSpec(baseUrl: string): unknown {
  const paths: Record<string, unknown> = {};
  for (const t of TOOLS as ToolDef[]) {
    const tool = t as unknown as { name: string; description: string; inputSchema: { properties?: Record<string, unknown>; required?: string[] } };
    const pathKey = `/api/tools/${tool.name}`;
    paths[pathKey] = {
      post: {
        operationId: tool.name,
        summary: tool.description,
        description: tool.description,
        requestBody: {
          required: (tool.inputSchema?.required?.length ?? 0) > 0,
          content: {
            "application/json": {
              schema: tool.inputSchema ?? { type: "object" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
        },
      },
    };
  }
  return {
    openapi: "3.0.1",
    info: {
      title: "gaokao-pro",
      version: VERSION,
      description: "中国高考志愿规划 — 招生计划 / 投档线 / 滑档风险 / 综评提前批 / 一分一段 (Coze 插件可用)",
      contact: { name: "HA7CH", url: "https://github.com/HA7CH/gaokao-pro" },
    },
    servers: [{ url: baseUrl }],
    paths,
  };
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, baseUrl: string): Promise<void> {
  // Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }
  const url = new URL(req.url ?? "/", baseUrl);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  // GET /
  if (req.method === "GET" && path === "/") {
    sendJson(res, 200, {
      service: "gaokao-pro",
      version: VERSION,
      tools_count: TOOLS.length,
      endpoints: {
        tools_list: "GET /api/tools",
        tools_call: "POST /api/tools/{tool_name}",
        openapi_spec: "GET /openapi.json",
      },
      docs: "https://github.com/HA7CH/gaokao-pro/tree/main/cli#readme",
    });
    return;
  }

  // GET /api/tools — list available tools (compact)
  if (req.method === "GET" && path === "/api/tools") {
    const list = (TOOLS as ToolDef[]).map((t) => {
      const tool = t as unknown as { name: string; description: string; inputSchema: unknown };
      return { name: tool.name, description: tool.description, input_schema: tool.inputSchema };
    });
    sendJson(res, 200, { ok: true, count: list.length, tools: list });
    return;
  }

  // GET /openapi.json — for Coze / dev tool import
  if (req.method === "GET" && (path === "/openapi.json" || path === "/api/openapi.json")) {
    sendJson(res, 200, buildOpenApiSpec(baseUrl));
    return;
  }

  // POST /api/tools/{name}
  const match = /^\/api\/tools\/([a-z_][a-z0-9_]*)$/i.exec(path);
  if (req.method === "POST" && match) {
    const toolName = match[1];
    let args: Record<string, unknown> = {};
    const raw = await readBody(req);
    if (raw.trim().length > 0) {
      try {
        args = JSON.parse(raw) as Record<string, unknown>;
      } catch (e) {
        sendJson(res, 400, { ok: false, error: `请求体不是合法 JSON：${e instanceof Error ? e.message : String(e)}` });
        return;
      }
    }
    try {
      const result = await dispatch(toolName, args);
      sendJson(res, 200, result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      sendJson(res, 400, { ok: false, error: msg });
    }
    return;
  }

  // 404
  sendJson(res, 404, {
    ok: false,
    error: `未知端点 ${req.method} ${path}`,
    hint: "GET / | GET /api/tools | GET /openapi.json | POST /api/tools/{name}",
  });
}

export async function runHttpServer(port: number = 3000, host: string = "127.0.0.1"): Promise<void> {
  const baseUrl = `http://${host}:${port}`;
  const server = createServer((req, res) => {
    handleRequest(req, res, baseUrl).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      sendJson(res, 500, { ok: false, error: `服务内部错误：${msg}` });
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      process.stderr.write(`gaokao-pro HTTP server v${VERSION} listening on ${baseUrl}\n`);
      process.stderr.write(`  GET  ${baseUrl}/                  — 健康检查\n`);
      process.stderr.write(`  GET  ${baseUrl}/api/tools          — 工具列表 (${TOOLS.length} 个)\n`);
      process.stderr.write(`  GET  ${baseUrl}/openapi.json       — Coze 插件 OpenAPI 3.0 spec\n`);
      process.stderr.write(`  POST ${baseUrl}/api/tools/{name}    — 调工具\n`);
      resolve();
    });
  });
}
