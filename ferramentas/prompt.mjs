// Monta o prompt de um bloco a partir de projetos/<projeto>/blocos.json, com as
// descrições de personagens/cenário copiadas literalmente.
// Uso: node ferramentas/prompt.mjs <projeto> <bloco|todos> [--ref]
//   --ref: usa ep.prefixo_ref (vídeo de referência em conversa nova) e grava prompts/<bloco>_ref.txt
// Cada fala vira uma tomada em close de quem fala (os outros de boca fechada) e o clipe
// abre com 1,5 s sem fala — o corte de silêncio remove a abertura (e o elenco posado).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "E:\\REPOSTORE VIDEOS";
const [proj, alvo, modo] = process.argv.slice(2);
const ref = modo === "--ref";
const pdir = join(RAIZ, "projetos", proj);
const ep = JSON.parse(readFileSync(join(pdir, "blocos.json"), "utf8"));
// ep.rotulos: nome mostrado no SHOT quando a chave é uma variante (ex.: DAVI_TERNO → DAVI)
const nomeDe = (n) => ep.rotulos?.[n] ?? n.replace(/_/g, " ");

function montar(b) {
  const nomes = [...new Set(b.falas.map((f) => f[0]).concat(b.personagens || []))].filter((n) => ep.personagens[n]);
  const prefixo = ref ? ep.prefixo_ref : ep.prefixo;
  return [
    ...(prefixo ? [prefixo] : []),
    "Fictional Brazilian telenovela scene performed by professional actors. Vertical 9:16 smartphone vlog footage, ultra-realistic, handheld camera, shot in Brazil. One continuous scene in one location; every actor keeps exactly the same face, hair and clothes in every shot.",
    `LOCATION: ${ep.cenarios[b.cenario]}`,
    "CHARACTERS:",
    ...nomes.map((n) => ep.personagens[n]),
    `ACTION: ${b.acao} Very expressive faces.`,
    "TIMING: the first 1.5 seconds are a silent establishing shot — nobody speaks. Then the dialogue starts and the lines follow each other immediately with no pauses.",
    "SHOTS AND DIALOGUE (Brazilian Portuguese, fast, emotional, every word spoken exactly as written, in this order). The person speaking is ALWAYS the one in close-up and ONLY their lips move, perfectly synced to their own voice; everyone else listens with their mouth closed:",
    ...b.falas.map(([n, emo, txt], i) => `SHOT ${i + 1} — close-up on ${nomeDe(n)}, who says (${emo}): "${txt}"`),
    "No subtitles, no captions, no on-screen text burned into the image, no music, no narrator. Background signs show only generic words, never character names.",
  ].join("\n");
}

const blocos = alvo === "todos" ? ep.blocos : ep.blocos.filter((b) => alvo.split(",").includes(b.id));
if (!blocos.length) throw new Error(`bloco ${alvo} não existe`);
mkdirSync(join(pdir, "prompts"), { recursive: true });
for (const b of blocos) {
  const p = montar(b);
  writeFileSync(join(pdir, "prompts", `${b.id}${ref ? "_ref" : ""}.txt`), p);
  const palavras = b.falas.map((f) => f[2]).join(" ").split(/\s+/).length;
  console.log(`=== ${b.id} (${b.duracao}s, ${palavras} palavras, ${p.length} chars)\n${p}\n`);
}
