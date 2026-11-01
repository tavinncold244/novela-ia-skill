# Thumbnail do episódio (ChatGPT pelo Chrome)

O usuário autorizou abrir o Chrome dele (Claude in Chrome) e criar a thumb no ChatGPT (já logado).

## 1. Referências (do próprio episódio)
Em `thumbs/<proj>/`, com ffmpeg, a partir dos clipes aprovados:
- `ref_<protagonista>.jpg` — close do humilde (ex.: Joaquim).
- `ref_<vilao>_choque.jpg` — o vilão com cara de choque (a revelação vende o clique).
- `ref_<outro>.jpg` — coadjuvante relevante.
Escolher quadros nítidos, rosto de frente, boca fechada ou expressão forte. Conferir com Read antes de subir.

## 2. No ChatGPT
1. `tabs_context_mcp` → navegar a aba do grupo para https://chatgpt.com/.
2. `find` "file input for attaching images" → `file_upload` (até 3 imagens, < 10 MB) no botão "Anexar fotos".
3. Clicar no composer, digitar o prompt, Enter. A geração leva ~1–2 min (esperar com `computer wait` e screenshot).

Modelo de prompt:
```
Crie uma THUMBNAIL vertical 9:16 (1080x1920) para um Reels de novela de IA no Facebook.
Use EXATAMENTE os personagens das fotos anexadas (mesmos rostos, roupas e cenário): <lista>.
Estilo foto ultra-realista, <cenário>. Composição: <humilde> em primeiro plano, sério e digno,
olhando para a câmera; atrás, <vilões> em CHOQUE, boca aberta. Iluminação dramática, cores
vivas, contraste alto. Texto grande em português, bold, branco com contorno preto grosso, em
cima: "<GANCHO 1>" e abaixo em amarelo: "<GANCHO 2 = a virada>". Nada mais escrito.
Deixe o último quinto de baixo sem texto importante.
```
Texto: 2 linhas, ≤ 4 palavras cada, a humilhação + a virada ("HUMILHARAM O PEDREIRO / MAS ELE ERA O DONO").

## 3. Baixar e conferir
- Clicar na imagem gerada para abrir o visualizador e usar o botão de download dele (download disparado por script não funciona). O arquivo cai em `C:\Downloads`.
- Mover para `thumbs/<proj>/thumb.png`, conferir com Read: rostos batem com o vídeo? texto escrito CERTO (o gerador erra letras — se errar, pedir "corrija só o texto para …")? sem texto extra? 9:16?
- Fechar a aba criada ao terminar.
