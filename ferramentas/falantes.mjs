// Revisão de "quem fala": para cada fala de cada clipe, tira 4 quadros de dentro da fala
// e monta uma folha com o nome de quem DEVERIA estar falando. Serve para achar voz no
// personagem errado e boca fora de sincronia.
// Uso: node ferramentas/falantes.mjs <proj> [clipe.mp4 ...]
//   sem clipes: usa os da edicao.json. Saída: projetos/<proj>/revisao_falas/<clipe>.jpg
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, basename } from "node:path";
import { alinhar } from "./alinhar.mjs";

const RAIZ = "E:\\REPOSTORE VIDEOS";
const FONTE = "C\\:/Windows/Fonts/arialbd.ttf";
const [proj, ...arqs] = process.argv.slice(2);
const pdir = join(RAIZ, "projetos", proj);
const odir = join(pdir, "revisao_falas");
mkdirSync(odir, { recursive: true });
const blocos = JSON.parse(readFileSync(join(pdir, "blocos.json"), "utf8")).blocos;
const cfg = JSON.parse(readFileSync(join(pdir, "edicao.json"), "utf8"));
const lista = arqs.length
  ? arqs.map((a) => ({ arquivo: a, bloco: basename(a).slice(0, 3) }))
  : cfg.clipes;
// JPEG sai em full-range; tudo em yuvj420p para os stacks não reclamarem
const run = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args.slice(0, -1), "-pix_fmt", "yuvj420p", args.at(-1)]);
const esc = (s) => s.replace(/[\\':%,]/g, "").replace(/[^\x20-\x7EÀ-ÿ]/g, "");

for (const c of lista) {
  const src = join(pdir, c.arquivo);
  const nome = basename(c.arquivo, ".mp4");
  const wjson = join(pdir, "clipes", `${nome}.json`);
  const b = blocos.find((x) => x.id === c.bloco);
  if (!existsSync(wjson) || !b) { console.log(`pulei ${nome} (sem transcrição ou bloco)`); continue; }
  const wh = JSON.parse(readFileSync(wjson, "utf8")).filter((w) => w.text.trim()).map((w) => ({ text: w.text.trim(), start: w.start, end: w.end }));
  const ro = b.falas.flatMap(([quem, , txt], fi) => txt.split(/\s+/).map((t) => ({ text: t, quem, fi })));
  const al = alinhar(wh, ro);
  const tmp = join(odir, `_tmp_${nome}`);
  mkdirSync(tmp, { recursive: true });
  const linhas = [];
  b.falas.forEach(([quem, , txt], fi) => {
    const ws = al.filter((w) => w.fi === fi);
    const a = ws[0].start, e = ws.at(-1).end;
    const dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" }));
    const tempos = [0.15, 0.4, 0.65, 0.9].map((f) => Math.min(dur - 0.1, a + (e - a) * f));
    const quadros = tempos.map((t, k) => {
      const q = join(tmp, `f${fi}_${k}.jpg`);
      run(["-ss", t.toFixed(2), "-i", src, "-frames:v", "1", "-vf", `scale=200:-1,drawtext=fontfile='${FONTE}':text='${t.toFixed(1)}s':x=4:y=4:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6`, q]);
      return q;
    });
    const rot = join(tmp, `r${fi}.jpg`);
    const texto = esc(`${quem}: ${txt}`).slice(0, 70);
    run(["-f", "lavfi", "-i", "color=c=black:s=800x34", "-frames:v", "1", "-vf", `drawtext=fontfile='${FONTE}':text='${texto}':x=6:y=8:fontsize=17:fontcolor=white`, rot]);
    const linha = join(tmp, `l${fi}.jpg`);
    run([...quadros.flatMap((q) => ["-i", q]), "-filter_complex", "hstack=inputs=4", linha]);
    const comRot = join(tmp, `lr${fi}.jpg`);
    run(["-i", rot, "-i", linha, "-filter_complex", "vstack=inputs=2", comRot]);
    linhas.push(comRot);
  });
  const out = join(odir, `${nome}.jpg`);
  if (linhas.length === 1) run(["-i", linhas[0], out]);
  else run([...linhas.flatMap((l) => ["-i", l]), "-filter_complex", `vstack=inputs=${linhas.length}`, out]);
  rmSync(tmp, { recursive: true, force: true });
  console.log(out);
}
