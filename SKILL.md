---
name: novela-ia
description: Produz "novelas de IA" verticais (9:16) estilo IA Poluída para Facebook/Reels — roteiro de justiça/humilhação→revelação, prompts por clipe no RepoStore (create_video), revisão de cada clipe contra bugs e troca de aparência, montagem sem silêncio, legendas sincronizadas palavra a palavra e música de fundo. Use sempre que o usuário pedir uma novela, história, roteiro, clipe ou vídeo de IA neste projeto (E:\REPOSTORE VIDEOS), ou pedir para refazer/ajustar um episódio.
---

# Novela de IA — pipeline completo

Leia também, conforme a etapa:
- `arquetipos.md` — os 6 tipos de história que passam de 1 mi no perfil (loja, traição, milagre/Jesus, trabalhador, inveja, coragem), recursos de roteiro (coro, ligação, oração, salto de tempo, Jesus no final) e **regras de variedade**. **Ler antes de escrever qualquer roteiro.**
- `historico.md` — episódios já feitos (arquétipo, cenário, vilão). **Nunca repetir o arquétipo do episódio anterior**; registrar cada entrega.
- `formula.md` — detalhe do arquétipo A (loja) + ritmo, público e CTA comuns a todos.
- `prompts.md` — modelo de prompt por clipe e bíblia de personagens.
- `aprendizados.md` — o que já deu certo/errado com o RepoStore. **Ler sempre; atualizar ao fim de cada episódio.**
- Para a edição: skills `hyperframes`, `hyperframes-cli`, `media-use` (legendas, mix de áudio).

## Regras que nunca mudam
1. **Zero silêncio.** Nenhum vão > 0,3 s entre falas no corte final. Referência: 4 palavras/s, 0 pausas > 0,35 s.
2. **Personagens idênticos do primeiro ao último clipe** (rosto, cabelo, roupa, acessórios, cenário, letreiros). Mudou qualquer coisa → refaz o clipe.
3. **Nenhum bug aceito**: mãos/dedos deformados, boca fora de sincronia, fala em outro idioma, palavras trocadas, texto aleatório na tela, objetos que somem, gente duplicada, corte no meio da palavra. Saldo é ilimitado — refaça quantas vezes precisar.
4. **9:16, 1080x1920**, look "filmado no celular", ultra-realista, Brasil.
5. **Legenda sincronizada** com a fala (palavra a palavra / blocos curtos), nunca o texto todo de uma vez.
6. Música de fundo do usuário (pasta `musica/`), baixa, com ducking sob a voz.

## Receita que funcionou (ep01, 01/11/2026) — seguir esta
1. `roteiro.md` + `blocos.json` (clipes de **10 s**, ~30–35 palavras cada; `prefixo` = instrução de usar a imagem de elenco). `node ferramentas/prompt.mjs <proj> todos` gera `prompts/`.
2. `create_image` 9:16 do **elenco inteiro lado a lado** no cenário, com `conversation_id` = `<proj>-elenco`. Conferir a imagem.
3. Gerar os clipes nessa MESMA conversa: `node ferramentas/repostore.mjs criar prompts/CNN.txt 10 <proj>-elenco` — **um de cada vez** (pedidos simultâneos na mesma conversa voltam com vídeo trocado/repetido).
   - Se a conversa "travar" devolvendo sempre o mesmo clipe, ou para cenas novas (ex.: outro cômodo): conversa nova + `video_url` de um clipe aprovado que mostre os personagens (o link `media.repostorevideo.shop/...?download=1` do `status`), com "Do NOT repeat the reference video's dialogue".
4. `node ferramentas/repostore.mjs esperar <id>` → `node ferramentas/revisar.mjs <proj> CNN_tK <url>`; conferir TEXTO (fala certa? é o clipe pedido?), `md5sum` (duplicado?) e a folha (rostos/roupas/texto queimado/pessoa duplicada). Registrar em `revisao.md`.
5. `edicao.json` (`ancorado: true`, lista de clipes aprovados, `capa` manual quando o elenco posado do início some em transição suave) → `node ferramentas/novela.mjs <proj> tudo` (cortar → transcrever → legendas → render). Saída em `saida/<proj>.mp4`.
5b. **Revisão de quem fala (obrigatória):** `node ferramentas/falantes.mjs <proj>` → uma folha por clipe com cada fala e 4 quadros dentro dela. A pessoa do rótulo tem de estar na tela mexendo a boca (ou ser reação de outro de boca FECHADA). Voz de A na boca de B = refazer. Nunca congelar quadro durante fala; elenco posado no início → `cobrir` com b-roll sem pessoas.
6. Revisão final: `silencedetect` no `edicao/montado.mp4` (0 vãos ≥ 0,3 s), 1º quadro de cada `edicao/cNN.mp4` (sem elenco posado), recortes da legenda em vários tempos.

## Thumbnail (toda entrega leva thumb) — ver `thumbnail.md`
Gerar no ChatGPT pelo Chrome do usuário (autorizado, já logado), com quadros reais do episódio como referência. Salvar em `thumbs/<proj>/thumb.png` e entregar junto com o vídeo.

## Fluxo de um episódio (detalhado)
Pasta: `projetos/<slug>/` com `roteiro.md`, `personagens.md`, `clipes/`, `revisao.md`, `edicao/`.

1. **Roteiro** (`roteiro.md`) — escolher o arquétipo em `arquetipos.md` conforme `historico.md` (diferente do último; mudar protagonista, vilão, cenário e recompensa), usar ≥ 2 recursos (coro de vizinhos, ligação, oração, salto de tempo, Jesus no final) e 2–4 locações. 140–180 s no total, ~600 palavras, só diálogo (o CTA final pode ser falado por Jesus para a câmera). Cada fala com nome do personagem e emoção. Falas de coro/ligação/oração são de 1 pessoa só → ótimas para clipes de 1 personagem na tela (o que evita voz na boca errada).
2. **Bíblia de personagens** (`personagens.md`) — descrição fixa de cada um, copiada *literalmente* em todo prompt. Gerar 1 imagem de referência por personagem com `create_image` (9:16) e guardar o link.
3. **Dividir em clipes** — ver `prompts.md`. Cada clipe tem 1 cena contínua, falas que enchem o tempo (a IA fala ≈3,7 palavras/s: 10 s ≈ 30–35 palavras). 10 s já foi testado e ficou bom (`aprendizados.md`); testar 20–30 s antes de adotar.
4. **Gerar** — `create_video` com `aspect_ratio: "9:16"`, mesmo `conversation_id` = slug do episódio para todos os clipes (mantém contexto). Pode disparar vários em paralelo; depois `wait_for_video` em cada um (repetir até `done`). Baixar com `curl` para `clipes/NN_vK.mp4` (K = tentativa).
5. **Revisar CADA clipe** (obrigatório, antes de seguir):
   - `ffmpeg -vf fps=2,scale=270:-1,tile=6x...` → folha de contato; olhar rostos, mãos, roupas, cenário vs. bíblia e vs. clipe anterior.
   - Transcrever o clipe (`hyperframes transcribe --engine whisper --model medium --language pt`) e comparar com o roteiro: falou tudo, na ordem, em português, sem palavra inventada?
   - Ver se a boca acompanha a fala (frames nos inícios de palavra).
   - Registrar em `revisao.md`: clipe, tentativa, OK/refazer, motivo. Refazer → ajustar o prompt (ser mais explícito no que quebrou) e gerar de novo.
6. **Montagem** — juntar só as tentativas aprovadas, na ordem; cortar todo silêncio/respiro (RMS por 0,1 s; manter só fala) e as caudas/entradas mortas de cada clipe; pequenos punch-ins (zoom 1,1x) para disfarçar jump-cuts. Loudnorm −16 LUFS na voz.
7. **Legendas** — transcrever o vídeo montado (por clipe, o whisper deriva em arquivos longos) → corrigir o texto com o roteiro → blocos de 2–4 palavras, palavra ativa destacada. Estilo: fonte bold sans (Montserrat/Poppins ExtraBold), branca com contorno preto grosso, palavra ativa amarela, centralizada no terço inferior acima da UI do Reels (~y 62–70%). Renderizar com HyperFrames.
8. **Música** — escolher pelo CLIMA do episódio (ver `musica/catalogo.md`):
   - Antes de colocar, classificar o roteiro: triste/emocional (humilhação, choro, superação, Deus) → `musica/triste_piano_chuva.mp3` (a música do usuário; serve para a maioria das novelas da fórmula).
   - Outro tema (comédia, suspense, ação, romance leve, festa) → buscar no **Pixabay Music** (pixabay.com/music, licença livre) uma faixa que combine, sem vocal, ≥ duração do vídeo; o usuário autorizou baixar de lá para isso. Salvar em `musica/<clima>_<nome>.mp3` e registrar no catálogo.
   - Se o episódio muda de clima (ex.: tenso → emocionante na revelação), pode trocar de faixa no ponto da virada com crossfade de 1 s.
   - Mix: música bem baixa (a faixa triste está a −11 LUFS → ~−18 dB), ducking sob a voz (sidechaincompress), fade in 0,5 s, fade out nos últimos 2 s. A voz tem de ser 100% inteligível.
9. **Revisão final** — assistir em folha de contato + checar `silencedetect` (nenhum vão > 0,3 s), sincronia da legenda em 5 pontos, nível de áudio. Só então entregar em `saida/<slug>.mp4`.
10. **Atualizar `aprendizados.md`** com tudo que se descobriu e **registrar o episódio em `historico.md`**.

## Baixar mais referências do perfil
`E:\Ferramentas\uv\programa\uvx.exe yt-dlp -f "best[ext=mp4]/best" -o "referencias/novos/<nome>.%(ext)s" "https://www.facebook.com/reel/<id>"` (funciona sem login). IDs e views: aba Reels do perfil no Chrome, rolar até o fim e ler os links `/reel/<id>`; título = legenda na página do reel.

## Ferramentas locais
- ffmpeg/ffprobe: `E:\Ferramentas\ffmpeg\ffmpeg-9.0.2-full_build\bin` (já no PATH do Git Bash).
- whisper.cpp: `E:\Ferramentas\whisper\Release` — fora do PATH; fazer `export PATH="/e/Ferramentas/whisper/Release:$PATH"` antes do `hyperframes transcribe`.
- HyperFrames: `node node_modules/hyperframes/bin/hyperframes.mjs` a partir de `E:\REPOSTORE VIDEOS` (npx quebra no espaço do caminho).
- Sem Python. Scripts em Node.
