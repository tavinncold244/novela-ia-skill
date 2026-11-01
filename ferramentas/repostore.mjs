// Cliente mínimo do MCP do RepoStore (HTTP), para checar status sem despejar o prompt.
// Uso:
//   node ferramentas/repostore.mjs status <id> [<id>...]     -> id status link/erro
//   node ferramentas/repostore.mjs esperar <id> [<id>...]    -> repete até todos terminarem
//   node ferramentas/repostore.mjs criar <arquivo_prompt> <segundos> <conversation_id> [video_url]
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const cfg = JSON.parse(readFileSync(join(homedir(), ".claude.json"), "utf8"));
const srv = Object.values(cfg.projects || {}).map((p) => p.mcpServers?.["repostore-video"]).find(Boolean);
if (!srv) throw new Error("repostore-video não configurado em ~/.claude.json");

let sessao = null, seq = 0;
async function rpc(method, params) {
  const headers = { ...srv.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (sessao) headers["Mcp-Session-Id"] = sessao;
  const r = await fetch(srv.url, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: ++seq, method, params }) });
  sessao = r.headers.get("mcp-session-id") || sessao;
  const txt = await r.text();
  const json = txt.trim().startsWith("{") ? JSON.parse(txt) : JSON.parse(txt.split("\n").filter((l) => l.startsWith("data:")).at(-1).slice(5));
  if (json.error) throw new Error(JSON.stringify(json.error));
  return json.result;
}
async function init() {
  await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "novela-ia", version: "1" } });
  const h = { ...srv.headers, "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
  if (sessao) h["Mcp-Session-Id"] = sessao;
  await fetch(srv.url, { method: "POST", headers: h, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) });
}
async function tool(name, args) {
  const r = await rpc("tools/call", { name, arguments: args });
  const t = r.content?.find((c) => c.type === "text")?.text ?? "{}";
  try { return JSON.parse(t); } catch { return { raw: t }; }
}
const linha = (v) => `${v.id} ${v.status} ${v.status === "done" ? v.download_url : v.error ? "ERRO: " + v.error.slice(0, 160) : ""}`;

const [cmd, ...args] = process.argv.slice(2);
await init();
if (cmd === "status") {
  for (const id of args) console.log(linha(await tool("get_video", { id })));
} else if (cmd === "esperar") {
  const pend = new Set(args);
  while (pend.size) {
    for (const id of [...pend]) {
      const v = await tool("get_video", { id });
      if (v.status === "done" || v.status === "failed") { console.log(linha(v)); pend.delete(id); }
    }
    if (pend.size) await new Promise((r) => setTimeout(r, 15000));
  }
} else if (cmd === "criar") {
  const [arq, seg, conv, ref] = args;
  const a = { prompt: readFileSync(arq, "utf8"), aspect_ratio: "9:16", duration_seconds: +seg, conversation_id: conv };
  if (ref) a.video_url = ref;
  const v = await tool("create_video", a);
  // sem id (ex.: "Você já tem 8 pedidos na fila") → erro, para o lote não esperar um id inválido
  if (!v.id) { console.error(JSON.stringify(v)); process.exit(1); }
  console.log(v.id);
} else throw new Error("comando: status | esperar | criar");
