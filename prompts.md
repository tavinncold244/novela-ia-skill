# Prompts por clipe

## Bíblia de personagens (`projetos/<slug>/personagens.md`)
Um bloco fixo por personagem, em inglês (os modelos de vídeo obedecem melhor), copiado **palavra por palavra** em todo prompt onde ele aparece:

```
ANTÔNIO — 72-year-old Black Brazilian man, short white stubble beard, deep wrinkles,
dark-brown flat cap, faded beige polo shirt with thin brown horizontal stripes, dusty
brown work trousers, worn leather belt, rubber boots, cloth sack over right shoulder.
Voice: slow, warm, rural Brazilian accent.
```
Inclua: idade, etnia, cabelo, barba, cada peça de roupa com cor, acessório-assinatura, crachá/logo, voz.
Cenário também tem bloco fixo (nome da loja no letreiro, cores, produtos, luz).

## Modelo de prompt (1 clipe)
```
Fictional Brazilian telenovela scene performed by professional actors.
Vertical 9:16 smartphone vlog footage, ultra-realistic, handheld camera, natural
[daylight / bright store lighting], shot in Brazil. Same characters and location as the
previous clips of this story.
LOCATION: <bloco do cenário>
CHARACTERS IN THIS SHOT:
<bloco literal de cada personagem presente>
SHOT: <close-up de quem fala / plano médio dos dois / over-the-shoulder>, expressive
faces, continuous action from previous clip: <onde cada um está, o que segura>.
DIALOGUE (Brazilian Portuguese, fast, emotional, no pauses between lines, perfect
lip sync, every word spoken exactly as written):
NOME (emoção, gesto): "fala"
NOME (emoção, gesto): "fala"
No subtitles, no on-screen text, no music, no narrator. Background signs show only
generic store names, never character names.
```
Emoções: usar stern / arrogant / mocking smile / worried / teary / moved. Evitar
furious / shouting / screaming / violence — dispara recusa (ver aprendizados.md).
Nomes: escolher nomes de pronúncia única (Agnaldo virou "Aguinaldo").

## Regras de divisão
- 1 clipe = 1 cena contínua no mesmo lugar, com os mesmos figurinos.
- Encaixar falas pela duração: a IA fala ≈3,7 palavras/s (medido). Encher o clipe
  (10 s ≈ 30–35 palavras, 30 s ≈ 90–100) — falta de fala vira silêncio/olhar parado.
- Terminar cada clipe numa fala completa (nunca cortar frase entre clipes).
- Anotar no roteiro qual objeto/posição cada personagem tem no fim do clipe, para
  descrever a continuidade no próximo.
- Mesmo `conversation_id` (= slug) em todos os clipes do episódio.
