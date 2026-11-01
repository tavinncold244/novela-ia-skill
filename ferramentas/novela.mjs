// Edição de novela de IA: corta silêncios, transcreve, alinha com o roteiro,
// gera legenda palavra a palavra (ASS) e renderiza com música em ducking.
//
// projetos/<proj>/edicao.json:
//   { "clipes": [ { "arquivo": "clipes/B1_t1.mp4", "bloco": "B1", "ini": 0, "fim": 30 }, ... ],
//     "musica": "musica/triste_piano_chuva.mp3", "volume_musica": 0.12 }
//   "bloco" liga o clipe às falas de blocos.json (texto certo da legenda).
//
// Uso: node ferramentas/novela.mjs <proj> [cortar|transcrever|legendas|render|tudo]
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { alinhar } from "./alinhar.mjs";

const RAIZ = "E:\\REPOSTORE VIDEOS";
const WHISPER_DIR = "E:\\Ferramentas\\whisper\\Release";
const env = { ...process.env, PATH: `${WHISPER_DIR};${process.env.PATH}` };
const W = 1080, H = 1920, FPS = 30;
const VCODEC = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FPS)];
const ACODEC = ["-c:a", "aac", "-b:a", "192k", "-ar", "48000"];

const [proj, etapa = "tudo"] = process.argv.slice(2);
const pdir = join(RAIZ, "projetos", proj);
const edir = join(pdir, "edicao");
mkdirSync(edir, { recursive: true });
const cfg = JSON.parse(readFileSync(join(pdir, "edicao.json"), "utf8"));
const blocos = existsSync(join(pdir, "blocos.json")) ? JSON.parse(readFileSync(join(pdir, "blocos.json"), "utf8")).blocos : [];

const run = (cmd, args, opt = {}) => execFileSync(cmd, args, { env, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"], ...opt });
const dur = (f) => parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

// ---------- 1. cortar: mantém só os trechos com fala ----------
// RMS a cada 20 ms; fala = acima de (piso + 12 dB). Vãos >= MIN_GAP viram cortes.
const JAN = 0.02, MIN_GAP = 0.22, PAD = 0.07;
function trechosDeFala(arq, ini, fim) {
  const out = spawnSync("ffmpeg", ["-hide_banner", "-ss", String(ini), "-to", String(fim), "-i", arq, "-af",
    `aresample=48000,asetnsamples=${48000 * JAN},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-`,
    "-f", "null", "-"], { env, encoding: "utf8", maxBuffer: 1 << 28 }).stdout;
  const rms = [...out.matchAll(/RMS_level=(-?[\d.inf]+)/g)].map((m) => (m[1].includes("inf") ? -120 : +m[1]));
  const ord = [...rms].sort((a, b) => a - b);
  const piso = ord[Math.floor(ord.length * 0.1)];
  const lim = Math.max(-45, piso + 12);
  const segs = [];
  let a = null, ultimo = 0;
  rms.forEach((v, i) => {
    const t = i * JAN;
    if (v > lim) { if (a === null) a = t; ultimo = t + JAN; }
    else if (a !== null && t - ultimo >= MIN_GAP) { segs.push([a, ultimo]); a = null; }
  });
  if (a !== null) segs.push([a, ultimo]);
  const total = fim - ini;
  return segs.filter(([s, e]) => e - s >= 0.12)
    .map(([s, e]) => [Math.max(0, s - PAD), Math.min(total, e + PAD)])
    .reduce((acc, s) => { const l = acc.at(-1); if (l && s[0] <= l[1]) l[1] = s[1]; else acc.push([...s]); return acc; }, [])
    .map(([s, e]) => [+(ini + s).toFixed(3), +(ini + e).toFixed(3)]);
}

// Clipes ancorados começam com o elenco posado enquanto a fala já rola. Nunca congelar
// (boca parada com voz = lip sync quebrado): cobrir com um trecho de b-roll sem pessoas.
//   "cobrir": { "ate": 1.4, "de": "clipes/BROLL.mp4", "ini": 2.0 }

function cortar() {
  const enq = `scale=${W}:${H}:force_original_aspect_ratio=increase:flags=lanczos,crop=${W}:${H},setsar=1,fps=${FPS}`;
  let zoom = false;
  const relatorio = [];
  cfg.clipes.forEach((c, n) => {
    const src = join(pdir, c.arquivo);
    const ini = c.ini ?? 0, fim = c.fim ?? dur(src);
    const segs = trechosDeFala(src, ini, fim);
    const cob = c.cobrir;
    const entradas = ["-i", src, ...(cob ? ["-i", join(pdir, cob.de)] : [])];
    const ramos = `split=${segs.length}${segs.map((_, i) => `[s${i}]`).join("")};`;
    let f = cob
      ? `[1:v]trim=${cob.ini}:${cob.ini + cob.ate},setpts=PTS-STARTPTS,${enq}[cb];[0:v]trim=start=${cob.ate},setpts=PTS-STARTPTS,${enq}[cm];[cb][cm]concat=n=2:v=1:a=0,${ramos}`
      : `[0:v]${enq},${ramos}`;
    segs.forEach(([a, b], i) => {
      // alterna punch-in 1.08x a cada corte para disfarçar o jump-cut
      const z = zoom ? `,crop=iw/1.08:ih/1.08,scale=${W}:${H}:flags=lanczos,setsar=1` : "";
      zoom = !zoom;
      f += `[s${i}]trim=${a}:${b},setpts=PTS-STARTPTS${z}[v${i}];`;
      f += `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:d=0.015,afade=t=out:st=${Math.max(0, b - a - 0.015).toFixed(3)}:d=0.015[a${i}];`;
    });
    f += segs.map((_, i) => `[v${i}][a${i}]`).join("") + `concat=n=${segs.length}:v=1:a=1[v][a]`;
    const out = join(edir, `c${String(n + 1).padStart(2, "0")}.mp4`);
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...entradas, "-filter_complex", f, "-map", "[v]", "-map", "[a]", ...VCODEC, ...ACODEC, out]);
    const d = dur(out);
    relatorio.push(`${c.arquivo}: ${(fim - ini).toFixed(1)}s -> ${d.toFixed(1)}s (${segs.length} trechos${cob ? `, b-roll ${cob.ate}s` : ""})`);
  });
  writeFileSync(join(edir, "cortes.txt"), relatorio.join("\n"));
  console.log(relatorio.join("\n"));
}

// ---------- 2. transcrever cada clipe cortado e alinhar ao roteiro ----------

function transcrever() {
  const hf = join(RAIZ, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  let off = 0;
  const todas = [];
  cfg.clipes.forEach((c, n) => {
    const nome = `c${String(n + 1).padStart(2, "0")}`;
    const mp4 = join(edir, `${nome}.mp4`);
    const tmp = join(edir, `_tx_${nome}`);
    mkdirSync(tmp, { recursive: true });
    run(process.execPath, [hf, "transcribe", mp4, "--engine", "whisper", "--model", "medium", "--language", "pt", "--dir", tmp]);
    const wh = JSON.parse(readFileSync(join(tmp, "transcript.json"), "utf8")).filter((w) => w.text.trim());
    let palavras = wh.map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
    const b = blocos.find((x) => x.id === c.bloco);
    if (b) {
      // só as falas que este clipe cobre (c.falas = [i0, i1] opcional)
      const falas = c.falas ? b.falas.slice(c.falas[0], c.falas[1]) : b.falas;
      const ro = falas.flatMap(([quem, , txt], fi) => txt.split(/\s+/).map((t, k, arr) => ({ text: t, quem, fimFala: k === arr.length - 1 })));
      palavras = alinhar(wh.map((w) => ({ text: w.text.trim(), start: w.start, end: w.end })), ro);
    }
    palavras.forEach((p) => todas.push({ ...p, start: +(p.start + off).toFixed(3), end: +(p.end + off).toFixed(3) }));
    off += dur(mp4);
  });
  writeFileSync(join(edir, "palavras.json"), JSON.stringify(todas, null, 1));
  console.log(`${todas.length} palavras, ${off.toFixed(1)}s`);
}

// ---------- 3. legendas ASS palavra a palavra ----------
const ass_t = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = (t % 60).toFixed(2).padStart(5, "0"); return `${h}:${String(m).padStart(2, "0")}:${s}`; };
function legendas() {
  const pal = JSON.parse(readFileSync(join(edir, "palavras.json"), "utf8"));
  // tempos monotônicos: o alinhamento/whisper às vezes devolve palavra começando antes da anterior
  pal.forEach((p, i) => {
    if (i) p.start = Math.max(p.start, pal[i - 1].start + 0.04);
    p.end = Math.max(p.end, p.start + 0.06);
  });
  const MAXW = 3;
  const grupos = [];
  let g = [];
  pal.forEach((p, i) => {
    g.push(p);
    const prox = pal[i + 1];
    const quebra = !prox || g.length >= MAXW || p.fimFala || /[.!?,;:]$/.test(p.text) || prox.start - p.end >= 0.15 || (prox.quem && prox.quem !== p.quem);
    if (quebra) { grupos.push(g); g = []; }
  });
  const ev = [];
  grupos.forEach((gr, gi) => {
    const fimG = Math.min(gr.at(-1).end + 0.12, grupos[gi + 1]?.[0].start ?? Infinity);
    gr.forEach((w, wi) => {
      const a = wi === 0 ? Math.max(0, w.start - 0.05) : w.start;
      const b = wi < gr.length - 1 ? gr[wi + 1].start : fimG;
      if (b <= a) return;
      const txt = gr.map((x, k) => {
        const t = x.text.toUpperCase().replace(/[{}]/g, "");
        return k === wi ? `{\\c&H00E5FF&\\fscx112\\fscy112\\t(0,90,\\fscx100\\fscy100)}${t}{\\c&HFFFFFF&\\fscx100\\fscy100}` : t;
      }).join(" ");
      ev.push({ a, b, txt });
    });
  });
  // Nunca dois eventos ao mesmo tempo (o libass empilharia/sobreporia o texto).
  ev.sort((x, y) => x.a - y.a);
  for (let i = 0; i < ev.length - 1; i++) ev[i].b = Math.min(ev[i].b, ev[i + 1].a);
  const linhas = ev.filter((e) => e.b - e.a >= 0.02).map((e) => `Dialogue: 0,${ass_t(e.a)},${ass_t(e.b)},Leg,,0,0,0,,${e.txt}`);
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Arial Black,86,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,7,3,2,90,90,560,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${linhas.join("\n")}
`;
  writeFileSync(join(edir, "legendas.ass"), ass);
  console.log(`${grupos.length} grupos, ${linhas.length} eventos`);
}

// ---------- 4. render final ----------
function render() {
  const lista = cfg.clipes.map((_, n) => `file 'c${String(n + 1).padStart(2, "0")}.mp4'`).join("\n");
  writeFileSync(join(edir, "lista.txt"), lista);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", "lista.txt", "-c", "copy", "montado.mp4"], { cwd: edir });
  const D = dur(join(edir, "montado.mp4"));
  const vol = cfg.volume_musica ?? 0.12;
  const musica = join(RAIZ, cfg.musica);
  const f = [
    `[0:v]subtitles=legendas.ass:fontsdir=C\\\\:/Windows/Fonts[v]`,
    `[0:a]loudnorm=I=-16:TP=-1.5:LRA=11,asplit=2[voz][sc]`,
    `[1:a]aresample=48000,volume=${vol},afade=t=in:d=0.5,afade=t=out:st=${(D - 2).toFixed(2)}:d=2[m]`,
    `[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[md]`,
    `[voz][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]`,
  ].join(";");
  const out = join(RAIZ, "saida", `${proj}.mp4`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", "montado.mp4", "-stream_loop", "-1", "-i", musica,
    "-filter_complex", f, "-map", "[v]", "-map", "[a]", "-t", D.toFixed(3), ...VCODEC, ...ACODEC, "-movflags", "+faststart", out], { cwd: edir });
  console.log(`OK -> ${out} (${D.toFixed(1)}s)`);
}

const etapas = { cortar, transcrever, legendas, render };
if (etapa === "tudo") { cortar(); transcrever(); legendas(); render(); }
else etapas[etapa]();
