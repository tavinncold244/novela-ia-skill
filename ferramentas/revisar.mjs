// Baixa um clipe do RepoStore e gera o material de revisão.
// Uso: node ferramentas/revisar.mjs <projeto> <NN_vK> <download_url>
//   -> projetos/<projeto>/clipes/NN_vK.mp4, NN_vK_folha.jpg, NN_vK.json (palavras) e imprime fala + pausas
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "E:\\REPOSTORE VIDEOS";
const WHISPER_DIR = "E:\\Ferramentas\\whisper\\Release";
const [proj, nome, url] = process.argv.slice(2);
if (!proj || !nome) throw new Error("uso: revisar.mjs <projeto> <NN_vK> [download_url]");

const dir = join(RAIZ, "projetos", proj, "clipes");
mkdirSync(dir, { recursive: true });
const mp4 = join(dir, `${nome}.mp4`);
const env = { ...process.env, PATH: `${WHISPER_DIR};${process.env.PATH}` };
const run = (cmd, args) => execFileSync(cmd, args, { env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

if (url) run("curl", ["-sL", "-o", mp4, url]);
if (!existsSync(mp4)) throw new Error(`não achei ${mp4}`);

const dur = parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]));
// ~20 quadros (10 s) a ~36 (30 s+) cobrindo o clipe inteiro
const nq = Math.min(36, Math.max(20, Math.round(dur * 1.2)));
const cols = 6, rows = Math.ceil(nq / cols);
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp4, "-vf", `fps=${(nq / dur).toFixed(4)},scale=180:-1,tile=${cols}x${rows}`, "-frames:v", "1", join(dir, `${nome}_folha.jpg`)]);

// Transcrição palavra a palavra
const tmp = join(dir, `_tx_${nome}`);
mkdirSync(tmp, { recursive: true });
run(process.execPath, [join(RAIZ, "node_modules", "hyperframes", "bin", "hyperframes.mjs"), "transcribe", mp4,
  "--engine", "whisper", "--model", "medium", "--language", "pt", "--dir", tmp]);
renameSync(join(tmp, "transcript.json"), join(dir, `${nome}.json`));
const palavras = JSON.parse(readFileSync(join(dir, `${nome}.json`), "utf8")).filter((w) => w.text.trim());

// Silêncios pelo áudio (mais confiável que o whisper)
const sil = spawnSync("ffmpeg", ["-hide_banner", "-i", mp4, "-af", "silencedetect=n=-35dB:d=0.3", "-f", "null", "-"], { env, encoding: "utf8" }).stderr;

console.log(`duração ${dur.toFixed(2)}s, ${palavras.length} palavras, ${(palavras.length / dur).toFixed(1)} pal/s`);
console.log(`fala ${palavras[0]?.start.toFixed(2)}s → ${palavras.at(-1)?.end.toFixed(2)}s`);
console.log("TEXTO:", palavras.map((w) => w.text.trim()).join(" "));
const gaps = [];
for (let i = 1; i < palavras.length; i++) {
  const g = palavras[i].start - palavras[i - 1].end;
  if (g > 0.3) gaps.push(`${palavras[i - 1].end.toFixed(2)}+${g.toFixed(2)}s (antes de "${palavras[i].text.trim()}")`);
}
console.log("PAUSAS whisper >0.3s:", gaps.join(" | ") || "nenhuma");
console.log("SILÊNCIOS áudio:", [...sil.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map((m) => `${(+m[1]).toFixed(2)}+${(+m[2]).toFixed(2)}s`).join(" | ") || "nenhum");
console.log("FOLHA:", join(dir, `${nome}_folha.jpg`));
