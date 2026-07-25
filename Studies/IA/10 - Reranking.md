Nota curta, mas o conceito é bonito.

A busca vetorial é rápida porque compara vetores **pré-calculados**. O documento foi embedado na ingestão, sem saber qual seria a pergunta.

Isso é o bi-encoder: dois textos, dois vetores independentes, um produto interno.

```
embedding(pergunta)  ->  [...]
embedding(documento) ->  [...]     (calculado antes)
             similaridade
```

Rápido e grosseiro.

### Cross-encoder

O reranker faz diferente: pega **os dois textos juntos** e processa como um par.

```
modelo(pergunta + documento) -> score de relevância
```

Como os dois passam pela atenção ao mesmo tempo, ele enxerga a relação de verdade — qual termo da pergunta corresponde a qual parte do documento. É bem mais preciso.

O custo é que não dá pra pré-calcular: cada par exige uma inferência. Com 1 milhão de documentos, impossível.

### A combinação

Por isso o padrão é em dois estágios:

```
busca vetorial (rápida)  -> top 50
       ↓
reranker (preciso)       -> top 5
       ↓
prompt
```

O primeiro estágio prioriza **recall** (não perder o certo). O segundo prioriza **precisão** (ordenar direito).

50 inferências de reranker é viável; 1 milhão não.

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")

pares = [(pergunta, c.texto) for c in candidatos]
scores = reranker.predict(pares)

top = [c for _, c in sorted(zip(scores, candidatos), reverse=True)][:5]
```

Também existe como API (Cohere Rerank, Jina), que evita hospedar modelo.

### Por que isso importa tanto no RAG

Duas razões:

**Ordem importa dentro do prompt.** Por causa do "lost in the middle", o que está no começo e no fim é mais aproveitado. Colocar o melhor chunk em primeiro muda a resposta ([[1 - Tokens e context window]]).

**Menos ruído.** Mandar 5 chunks bons é melhor que 20 chunks mistos. Contexto irrelevante distrai e às vezes leva a resposta errada.

Reranking permite buscar **mais** (recall alto) e mandar **menos** (precisão alta). Sem ele, tenho que escolher entre os dois.

### Quanto custa

Latência de +100–300ms típica. É o estágio mais caro do pipeline depois da geração.

Vale quando:
- a busca traz candidatos parecidos e a ordem é discutível
- o corpus é grande e heterogêneo
- a resposta depende de pegar o trecho exato

Não vale quando o corpus é pequeno e os 5 primeiros já são obviamente os certos.

### Alternativa mais barata

**RRF** entre busca vetorial e keyword ([[7 - Similaridade e busca vetorial]]) já reordena razoavelmente e custa quase nada, porque não envolve modelo.

A escala fica:

```
RRF (grátis)  <  reranker cross-encoder  <  LLM como juiz de relevância (caro e lento)
```

Uso RRF sempre; reranker quando a avaliação mostra que a ordem está ruim ([[12 - Avaliação de respostas]]).

### A generalização

O padrão "recall barato → precisão cara" aparece em muito lugar:

- índice de banco filtra, depois o predicado exato confere ([[4 - Índices]])
- ANN busca aproximado, depois reordena exato
- cache serve rápido, valida depois ([[10 - Cache HTTP e CDN]])

É funil: cada estágio é mais caro e opera sobre menos dado.
