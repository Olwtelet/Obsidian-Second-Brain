O modelo não vê letra nem palavra. Vê **token**: pedaços de texto que viraram números.

```
"Desenvolvimento de software"
->  ["Desenvol", "vimento", " de", " software"]
->  [15234, 8891, 337, 4285]
```

Regra de bolso: em inglês, ~4 caracteres por token, ~0,75 palavra por token. **Em português rende pior** — acento e palavra longa quebram em mais pedaços. O mesmo texto traduzido custa uns 20–30% mais tokens.

Isso tem efeito direto em preço e em quanto cabe no contexto. Vale medir em vez de estimar.

### Por que subpalavra

Se fosse por palavra, o vocabulário seria infinito e qualquer palavra nova viraria `<unk>`. Se fosse por caractere, as sequências ficariam longuíssimas.

BPE (byte pair encoding) resolve: começa por byte e vai juntando os pares mais frequentes. Palavra comum vira um token; palavra rara se decompõe.

Efeitos colaterais que explicam comportamento estranho:

- contar letra é difícil pro modelo. "Quantos R tem em morango" — ele não enxerga as letras separadas
- matemática com número grande falha porque o número é fatiado de forma arbitrária
- espaço antes da palavra faz parte do token: `" gato"` e `"gato"` são tokens **diferentes**

### Context window

É o limite de tokens que cabe numa chamada: **entrada + saída**.

Não é memória. O modelo não "lembra" de nada entre chamadas. Numa conversa, o histórico inteiro é reenviado toda vez — é isso que faz a conversa parecer contínua e é isso que faz o custo crescer.

```
turno 1:  sistema + pergunta                              ->  500 tokens
turno 2:  sistema + pergunta + resposta + pergunta2       -> 1200 tokens
turno 3:  ... tudo de novo + mais                         -> 2100 tokens
```

Crescimento quadrático no total gasto ao longo da conversa.

### Quando estoura

Opções, todas com perda:
- **truncar** — cortar as mensagens mais antigas. Simples e perde contexto
- **resumir** — pedir ao modelo um resumo do que passou e substituir. Perde detalhe
- **recuperar** — buscar só os trechos relevantes em vez de mandar tudo. Isso é RAG ([[9 - RAG - o pipeline]])

### Contexto grande não é grátis

Modelo com 1M de contexto não significa que usar 1M é boa ideia:

- **custo** é por token, e cresce linear
- **latência** também
- **qualidade cai**: o efeito "lost in the middle" — o modelo presta mais atenção no começo e no fim do contexto, e informação enterrada no meio é ignorada

Por isso um prompt curto e bem selecionado ganha de um prompt enorme com tudo dentro. Encher o contexto "por segurança" piora o resultado.

### Custo

Entrada e saída têm preços diferentes — saída costuma ser 3–5x mais cara.

Duas coisas que mudam a conta de verdade:
- **prompt caching** — reusar prefixo idêntico (system prompt grande, documento fixo) sai muito mais barato. Vale ordenar o prompt com o que é estável no começo e o que varia no fim
- **batch** — processamento assíncrono com desconto, quando não precisa de resposta na hora

### Saída e streaming

`max_tokens` limita a saída. Se estourar, o texto é **cortado no meio** — o `finish_reason` diz `length` em vez de `stop`. Vale checar, principalmente com JSON estruturado, onde o corte gera JSON inválido ([[4 - Structured output]]).

E como o modelo gera token a token, dá pra transmitir conforme sai. É o que faz o texto aparecer aos poucos: um stream ([[6 - Streams]]). A resposta não fica mais rápida, mas o tempo até o primeiro token cai muito, e isso muda a percepção.

### Contar antes de mandar

```python
import tiktoken

enc = tiktoken.encoding_for_model("gpt-4o")
print(len(enc.encode("Desenvolvimento de software")))
```

Cada família de modelo tem seu tokenizer, então o número varia entre provedores. Serve pra estimar custo e pra saber quantos chunks cabem antes de montar o prompt.
