# Aprendizados (atualizar a cada episódio — mais recente no topo)

## 2026-11-01 — ep02 (boleira/loja de noivas) — saida/ep02-boleira-noivas.mp4, 2:31, 473 palavras
- Receita do ep01 (elenco + clipes de 10 s na conversa ancorada) manteve rostos/roupas em 17/17 clipes. Clipe sem elenco no início (C06, C09, C16, C17) também saiu igual.
- **Voz no personagem errado continua o bug nº 1** (7 de 17 na 1ª passada), mesmo com "SHOT n — close-up on X". O padrão: em clipe de 2 falas, a 2ª pessoa às vezes aparece mexendo a boca na fala da 1ª. **Remédio que funcionou 5/5: clipe com UMA pessoa só na tela** ("Close-up on X ONLY for the whole clip… nobody else in the frame") — e reaproveitar a fala certa do clipe antigo com `ini`/`fim` no `edicao.json` (mesmo arquivo pode entrar 2x com trechos diferentes; criar blocos C09A/C09B etc. em blocos.json para a legenda).
- Fala curta de 1 pessoa (8 palavras) → clipe de **5 s** funciona.
- **Paralelo sem bug:** cada clipe em conversa própria (`ep02-<bloco>-ref1`) com `video_url` = clipe aprovado do mesmo personagem/cenário + `prefixo_ref`. 3 clipes prontos juntos em ~3 min, aparência igual. Usar isso para refazimentos.
- **Tarefas em segundo plano morrem quando a sessão/PC reinicia** (aconteceu 3x). `lote.sh` agora grava `criados.txt` logo após criar (dá para recuperar o link com `repostore.mjs status <id>`). Preferir gerar em primeiro plano, 1 chamada por clipe, ou paralelo em conversas separadas.
- O modelo voltou a **queimar legenda** num refazimento (C09 t2) → "ABSOLUTELY NO subtitles" em todos os prompts.
- Pose do elenco: medir com tira 6 fps dos 2,5 s iniciais (`ffmpeg -t 2.5 -vf fps=6,scale=80:-1,tile=15x1`); variou 0,2–2,0 s. b-roll da loja vazia saiu com piso diferente — ok para cobertura curta.
- `novela.mjs tudo` com 21 trechos leva >10 min → rodar em background.

## 2026-11-01 — ep01 v2: voz no personagem errado + lip sync (feedback do usuário)
- O usuário viu: **"o personagem que fala não é o que era pra estar falando"** e boca fora de sincronia. Causas achadas:
  1. O modelo às vezes coloca a voz de A enquanto mostra B mexendo a boca (5 de 17 clipes: C04, C05, C08, C09, C15). A revisão por transcrição + folha geral NÃO pega isso.
  2. **Culpa da edição:** congelar o 1º quadro (capa) por até 1 s enquanto a fala já rola = boca parada com voz → parece lip sync quebrado. NÃO congelar quadro com fala.
- Correções:
  - `ferramentas/falantes.mjs <proj> [clipes]`: folha por FALA (quem deveria falar + 4 quadros dentro da fala). Revisar TODA fala: o personagem do rótulo está na tela de boca mexendo? Em dúvida, quadros densos (fps=4) do trecho.
  - Prompt (prompt.mjs): cada fala é um "SHOT n — close-up on NOME, who says …"; "only their lips move… everyone else listens with their mouth closed".
  - Prompt: "the first 1.5 seconds are a silent establishing shot — nobody speaks" → o elenco posado cai no silêncio e o corte de silêncio o remove. Sem capa congelada.
  - Com a abertura silenciosa sobram ~8,5 s → no máximo ~30 palavras por clipe de 10 s.
  - Para gerar em paralelo sem o bug de vídeo trocado: cada clipe numa conversa própria com `video_url` = clipe aprovado cujo 1º quadro é o elenco posado (`prefixo_ref`).
- Resultado da regeneração (10 clipes): **o "SHOT n — close-up on NOME" resolveu o falante errado em 10/10** (quando aparece outra pessoa é reação de boca fechada). MAS o modelo **ignorou** o "1.5 s silent establishing shot": a fala começa em 0 s e, com `video_url`, o elenco posado fica 0,3–1,7 s na tela enquanto alguém fala. Um clipe (C13) perdeu a última fala curta → tirei do roteiro.
- **Solução de edição para o elenco posado: cobrir com b-roll do cenário SEM pessoas** (gerar 1 clipe de 10 s "slow camera movement across the lobby, NO people, no voices"), voz por cima — recurso normal de edição, sem quebrar lip sync. No `edicao.json`: `"cobrir": {"ate": <fim da pose>, "de": "clipes/BROLL.mp4", "ini": <trecho do b-roll>}`; variar o trecho entre clipes. Medir o fim da pose com tira de 6 fps dos 2,5 s iniciais.
- **Usuário aprovou a v2 ("ficou certo")** → esta é a receita padrão: close no falante por fala + revisão `falantes.mjs` + b-roll para cobrir pose.
- Resultado final v2: 2:20, 501 palavras, 0 pausas ≥ 0,3 s, −15,6 LUFS, nenhum clipe abre com pose, falante certo em todas as falas revisadas.

## 2026-11-01 — ep01 entregue (saida/ep01-pedreiro-hotel.mp4, 2:26, 541 palavras, 0 silêncio)
- 17 clipes de 10 s; 26 gerações no total (refazimentos: 2 por aparência, 5 por bug de vídeo trocado/repetido, 2 recusas, 1 com legenda queimada, 1 com pessoa duplicada).
- O modelo às vezes **queima legenda na imagem** mesmo com "no subtitles" → reforçar "ABSOLUTELY NO subtitles, captions or any text burned into the image".
- O modelo às vezes **duplica um personagem** por 1–2 quadros (dois Joaquins) → olhar a folha com atenção.
- Clipe de cena nova (suíte) sem referência saiu com outro Joaquim; com `video_url` = clipe aprovado da suíte (C17) saiu igual.
- Recusa em cena de idosa chorando com referência do saguão; passou com "smiles with happy tears… warm hug".
- Elenco posado no início: às vezes é corte seco (detectado sozinho), às vezes a câmera sai devagar da pose (~1 s) → `capa` manual no `edicao.json`.
- Legenda: dois eventos ASS sobrepostos se misturam na tela → o editor agora corta cada evento no início do seguinte e força tempos monotônicos.
- Corte de silêncio: RMS 20 ms, vão ≥ 0,22 s, folga 0,07 s; tirou 0,7–3 s por clipe de 10 s. Loudness final −15,6 LUFS.

## 2026-11-01 — ep01 (pedreiro/hotel), consistência entre clipes
- **A SOLUÇÃO DE CONSISTÊNCIA: imagem de elenco na mesma conversa.** 1) `create_image` (9:16) com todos os personagens lado a lado, de frente, corpo inteiro, no cenário, com o `conversation_id` do episódio; 2) cada `create_video` no MESMO `conversation_id`, com o prefixo "use the character reference image generated earlier in this conversation… EXACTLY like in that image". O serviço usa a imagem como 1º quadro (aparece ~0,5 s do elenco posado no início → cortar/cobrir na edição) e os rostos/roupas batem. Em 30 s o 3º segmento ainda deriva (Renata trocou, Marcos duplicado) → usar **clipes de 10 s**, todos ancorados na imagem.
- **BUG do RepoStore: vários pedidos simultâneos na MESMA conversa podem voltar com o MESMO vídeo** (links diferentes, arquivo idêntico: C12=C11, C15=C16=C14). Sempre `md5sum` nos clipes baixados e comparar a transcrição com a fala esperada; refazer os duplicados. Lote de 8 (C01–C08) saiu ok; o problema apareceu no 2º lote e de novo nos refazimentos (C12 veio = C17). **Regra: na conversa ancorada, UM pedido por vez** (esperar terminar antes do próximo). Para paralelizar, usar várias conversas, cada uma com a SUA chamada de imagem? Não — a imagem sairia diferente. Então: sequencial, ~1–4 min por clipe de 10 s.
- Testes reprovados (30 s só com texto, 2 versões de B1–B4): em TODAS algum personagem troca de rosto/etnia entre segmentos; uma versão voltou com 10 s em vez de 30; outra pulou uma fala inteira. Sempre conferir duração e texto.
- **Clipes de 30 s = 3 segmentos de 10 s costurados pelo serviço** (dá pra ver a troca a cada ~10 s). Dentro de cada segmento tudo bate; entre segmentos os coadjuvantes com descrição vaga mudam (Renata "blonde" virou morena/loira). Protagonista com traços fortes (Joaquim) e careca de óculos (Marcos) se mantiveram. → Descrever cada personagem com 3–4 traços inconfundíveis (pele muito clara + platinada + coque alto + argolas).
- Fila: máximo **8 pedidos simultâneos** por conta. 30 s demora ~3 min.
- `ferramentas/prompt.mjs <proj> todos` gera os prompts a partir de `blocos.json` (descrições literais); `ferramentas/repostore.mjs criar|status|esperar` fala direto com o MCP sem despejar o prompt no contexto.
- Revisão automática: `node ferramentas/revisar.mjs <projeto> <NN_vK> <download_url>` (baixa, folha de contato, transcrição, pausas).
- C01 (10 s) saiu perfeito: 37 palavras, 0 silêncio, letreiros só "HOTEL/RECEPÇÃO" (a instrução de letreiro funciona).
- **Clipes de 10 s gerados separadamente NÃO mantêm os personagens**, mesmo com o bloco de descrição idêntico:
  - sem referência: Joaquim virou "estátua cinza" (coberto de pó), Renata outro rosto → reprovado.
  - com `video_url` = clipe anterior: melhor (mesmo tipo de cenário), mas balcão mudou de madeira p/ mármore, Renata mudou de rosto, camiseta ganhou estampa "TRA…". Também demorou 4 min (vs 1 min).
- "cement dust on his face" → a IA exagera e pinta a pessoa de cinza. Sujeira só na roupa.
- Roupa lisa precisa de "plain … with no print", senão aparece texto.
- Fala termina colada no fim do clipe (10,00 s) com 37 palavras → risco de cortar a última palavra. Deixar ~10% de folga (10 s ≈ 32 palavras).

## 2026-11-01 — testes iniciais do RepoStore
- **Saldo ilimitado** (plano do usuário). O número 4100 não desce. Refazer à vontade.
- **Saída**: MP4 H.264 720x1280, 24 fps, AAC, com voz gerada pelo próprio modelo. Duração exata pedida (10,0 s). Gera em ~1 min. Link expira em 24 h → baixar na hora.
- **Fala**: português BR correto, lábios sincronizados, falou todas as falas do prompt na ordem. Ritmo real ≈ **3,7 palavras/s** (37 palavras em 10 s). Ou seja: 10 s ≈ 30–35 palavras; 30 s ≈ 90–100.
- **Recusa de segurança**: prompt com "furious", "shouting", humilhação explícita de idosa → `failed` ("couldn't generate that video as described"). **Funcionou** ao: começar com "Fictional Brazilian telenovela scene performed by professional actors", trocar por "stern / arrogant / worried", tirar exclamações agressivas. A humilhação tem de estar NAS FALAS, mas descrita com emoções moderadas. Usar `conversation_id` novo depois de uma recusa (o contexto pode carregar a recusa).
- **Bugs vistos no teste 02**:
  - Pausa de 0,77 s entre falas de personagens diferentes → resolver na edição (cortar silêncio).
  - Nome "Agnaldo" pronunciado "Aguinaldo" → escolher nomes de pronúncia inequívoca ou escrever como se fala.
  - O modelo **escreveu o nome da personagem num letreiro** ao fundo ("DONA CREU…") → acrescentar ao prompt: "background signs show only generic store names, never character names". Revisar letreiros em toda folha de contato.
- Visual sai igual ao das referências: close-ups, câmera de celular, cenário brasileiro cheio. Os modelos escolhem os enquadramentos sozinhos (alternou close-ups como pedido).
- Upscale para 1080x1920 na edição final (lanczos) ou entregar 720x1280 como as referências.
