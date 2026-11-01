// Alinha palavras do whisper (com tempo) às palavras do roteiro (texto certo).
// Usado por novela.mjs (legendas) e falantes.mjs (revisão de quem fala).
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
export function alinhar(wh, ro) {
  // Needleman-Wunsch entre palavras do whisper (com tempo) e do roteiro (texto certo).
  const n = wh.length, m = ro.length, G = -1;
  const sim = (a, b) => { const x = norm(a), y = norm(b); if (x === y) return 2; if (x && y && (x.startsWith(y) || y.startsWith(x) || lev(x, y) <= Math.max(1, Math.floor(Math.max(x.length, y.length) / 3)))) return 1; return -1; };
  const S = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j * G : j === 0 ? i * G : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    S[i][j] = Math.max(S[i - 1][j - 1] + sim(wh[i - 1].text, ro[j - 1].text), S[i - 1][j] + G, S[i][j - 1] + G);
  const par = Array(m).fill(null);
  for (let i = n, j = m; i > 0 && j > 0;) {
    if (S[i][j] === S[i - 1][j - 1] + sim(wh[i - 1].text, ro[j - 1].text)) { par[j - 1] = wh[i - 1]; i--; j--; }
    else if (S[i][j] === S[i - 1][j] + G) i--;
    else j--;
  }
  // palavras do roteiro sem par: interpola entre vizinhas
  const out = ro.map((r, j) => ({ ...r, start: par[j]?.start, end: par[j]?.end }));
  for (let j = 0; j < out.length; j++) if (out[j].start == null) {
    let k = j; while (k < out.length && out[k].start == null) k++;
    const t0 = j > 0 ? out[j - 1].end : (wh[0]?.start ?? 0), t1 = k < out.length ? out[k].start : (wh.at(-1)?.end ?? t0 + 0.3 * (k - j));
    const passo = (t1 - t0) / (k - j);
    for (let q = j; q < k; q++) { out[q].start = t0 + passo * (q - j); out[q].end = t0 + passo * (q - j + 1); }
  }
  return out;
}
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
