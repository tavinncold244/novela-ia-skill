# novela-ia — skill do Claude Code

Produz "novelas de IA" verticais (9:16) para Facebook/Reels: roteiro, clipes no RepoStore, revisão, montagem sem silêncio, legendas palavra a palavra e música.

## Instalar
1. Copie os arquivos `.md` para `<sua pasta de trabalho>/.claude/skills/novela-ia/`.
2. Copie `ferramentas/` para `<sua pasta de trabalho>/ferramentas/`.
3. Nos scripts, troque `const RAIZ = "E:\REPOSTORE VIDEOS"` pelo caminho da sua pasta (e `WHISPER_DIR` pelo seu whisper.cpp).
4. Configure o MCP `repostore-video` no Claude Code com a **sua** chave — `repostore.mjs` lê a configuração do `~/.claude.json`; nenhuma chave fica no código.

## Precisa ter
- Node.js, ffmpeg/ffprobe no PATH, whisper.cpp
- HyperFrames (`npm install hyperframes` na pasta de trabalho) para transcrição/legendas
- Música de fundo em `musica/` (não incluída)

Comece pelo `SKILL.md`.
