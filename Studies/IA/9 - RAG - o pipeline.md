RAG = Retrieval Augmented Generation. A ideia em uma frase: **buscar o contexto relevante e colocar no prompt** antes de perguntar.

Resolve três limitações de uma vez:
- o modelo não conhece meus dados privados
- o conhecimento dele tem data de corte
- sem fonte, não dá pra verificar a resposta ([[11 - Alucinação]])

E resolve sem treinar nada.

### Os dois momentos

**Ingestão** (offline, roda quando o conteúdo muda):

```
documento -> parse -> chunking -> embedding -> índice vetorial
```

**Consulta** (online, a cada pergunta):

```
pergunta -> embedding -> busca -> [rerank] -> monta prompt -> modelo -> resposta + fontes
```

### Versão mínima

```python
# ingestão
chunks = dividir(documento)
vetores = embedar(chunks)
indice.inserir(chunks, vetores)

# consulta
def responder(pergunta):
    vec = embedar([pergunta])[0]
    trechos = indice.buscar(vec, k=5)

    contexto = "\n\n---\n\n".join(
        f"[Fonte: {t.fonte}]\n{t.texto}" for t in trechos
    )

    prompt = f"""Responda usando APENAS o contexto abaixo.
Se a resposta não estiver ali, diga que não encontrou.
Cite a fonte de cada afirmação.

<contexto>
{contexto}
</contexto>

Pergunta: {pergunta}"""

    return modelo.gerar(prompt, temperature=0)
```

É basicamente isso. O resto é qualidade.

### Onde quebra

Na prática o problema quase nunca é a geração. É a **recuperação**.

Se o chunk certo não veio, não existe prompt que salve. Por isso a métrica que mais importa é recall da busca ([[7 - Similaridade e busca vetorial]]).

Os problemas mais comuns:

**Pergunta e documento não se parecem.** O usuário escreve "meu boleto não chegou", o documento diz "reemissão de segunda via". Embedding ajuda, mas nem sempre basta.

**Pergunta curta demais.** "e o prazo?" não tem informação suficiente pra buscar nada. Numa conversa, preciso reescrever a pergunta com o contexto anterior antes de buscar.

**Termo exato.** Código de erro, SKU, nome próprio. Busca vetorial é ruim nisso — daí a híbrida.

**Pergunta agregativa.** "quantos clientes cancelaram em maio?" não se responde recuperando trecho. Isso é query em banco, não RAG. Reconhecer isso e rotear pra outra ferramenta é melhor que forçar ([[5 - Function calling]]).

### Melhorias, em ordem de custo-benefício

1. **chunk contextualizado** — prefixar título e seção. Barato e o que mais rende ([[8 - Chunking]])
2. **busca híbrida** — vetor + BM25 com RRF
3. **reranking** do top-30 pro top-5 ([[10 - Reranking]])
4. **query rewriting** — reescrever a pergunta com o histórico
5. **multi-query** — gerar 3 variações da pergunta, buscar as três, unir. Cobre vocabulário diferente
6. **small-to-big** — indexar pequeno, devolver grande
7. **HyDE** — gerar uma resposta hipotética e buscar por **ela**. Como resposta se parece mais com documento do que pergunta se parece, às vezes recupera melhor

Não faço tudo de uma vez. Cada uma custa latência e complexidade — a ordem acima é a que eu tentaria.

### Citação

Devolver a fonte junto não é enfeite. É o que:
- deixa o usuário verificar
- permite detectar quando o modelo respondeu do próprio conhecimento em vez do contexto
- dá caminho pra corrigir o documento errado

Peço ao modelo id do trecho, e **valido** que o id existe. Modelo inventa citação também.

### RAG x fine-tuning

Confundi isso no começo:

- **RAG** — dar **conhecimento**. Dado que muda, precisa de fonte, é específico
- **fine-tuning** — ensinar **comportamento**. Formato, tom, estilo, tarefa muito específica

Pra "responder sobre a documentação da empresa", RAG. Fine-tuning ali significa retreinar toda vez que um documento muda.

Dá pra combinar: fine-tuning pro formato, RAG pro conteúdo.

### Contexto grande não substitui

Com 1M de contexto, por que não jogar tudo? Porque:

- custo por token, em **toda** chamada ([[1 - Tokens e context window]])
- latência
- "lost in the middle" — informação no meio de um contexto enorme é ignorada
- meus dados podem ser maiores que qualquer contexto

RAG é seleção. Contexto grande é capacidade. São complementares: contexto grande permite mandar 20 chunks em vez de 5, não permite parar de selecionar.
