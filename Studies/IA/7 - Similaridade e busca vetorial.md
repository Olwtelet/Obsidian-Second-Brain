Tendo os embeddings ([[6 - Embeddings]]), buscar é achar os vetores mais próximos do vetor da pergunta.

### Força bruta

```python
import numpy as np

def buscar(consulta_vec, vetores, k=5):
    scores = vetores @ consulta_vec        # vetores normalizados -> produto interno
    indices = np.argsort(scores)[-k:][::-1]
    return indices, scores[indices]
```

Isso é **O(n)** — compara com todos. Com 10 mil vetores é instantâneo. Com 10 milhões, não.

Vale lembrar disso: pra base pequena, um array em memória e numpy resolvem. Subir um banco vetorial pra 500 documentos é overkill.

### ANN

Em escala usa-se busca **aproximada**: aceita errar de vez em quando em troca de ser ordens de magnitude mais rápida.

- **HNSW** — grafo em camadas. A busca desce de uma camada grosseira pra uma fina, "pulando" pra perto do alvo. É o mais usado; rápido e preciso, mas ocupa bastante memória
- **IVF** — divide o espaço em clusters, busca só nos mais próximos. Menos memória, precisa treinar
- **PQ** — comprime o vetor. Muito menos memória, perde precisão

O parâmetro de HNSW que interessa é o `ef_search`: maior = mais preciso e mais lento. É o botão de recall x latência.

### Onde guardar

**Dedicado** — Qdrant, Weaviate, Milvus, Pinecone. Melhor performance e filtro rico.

**Extensão de banco existente** — `pgvector` no Postgres, Atlas Vector Search no Mongo. Menos peça na infra, transação e JOIN com o dado relacional no mesmo lugar.

Como já uso Mongo ([[2 - MongoDB - documentos e collections]]), o Atlas Search me pareceu o caminho de menor atrito: o chunk, o metadado e o vetor no mesmo documento.

```javascript
db.chunks.aggregate([
  {
    $vectorSearch: {
      index: "vetor_index",
      path: "embedding",
      queryVector: vetorDaPergunta,
      numCandidates: 150,
      limit: 5,
      filter: { tenantId: "abc", idioma: "pt" }
    }
  },
  { $project: { texto: 1, fonte: 1, score: { $meta: "vectorSearchScore" } } }
]);
```

`numCandidates` bem maior que `limit` é o que dá qualidade — busca 150 aproximados e devolve os 5 melhores.

### Filtro por metadado

A parte mais subestimada. Quase toda busca real precisa de recorte: por tenant, por idioma, por data, por permissão.

E isso é **requisito de segurança**, não só de relevância: sem filtro de tenant, um cliente recebe trecho de documento de outro. Multi-tenant com vetor exige atenção — o filtro tem que ser aplicado na busca, não depois.

O detalhe técnico: filtrar **depois** da busca ANN (post-filter) pode devolver menos resultados que o pedido, ou nenhum. Filtro nativo do índice (pre-filter) é o certo.

### Busca híbrida

Vetor não é bom com termo exato, nome próprio e código ([[6 - Embeddings]]). Keyword (BM25) não entende sinônimo. Juntar os dois quase sempre bate cada um sozinho.

Combinar com **RRF** (Reciprocal Rank Fusion), que usa a posição em cada lista em vez do score:

```
score(doc) = Σ  1 / (k + posição_na_lista_i)     com k ≈ 60
```

Usar posição resolve o problema de os scores estarem em escalas diferentes — score de cosseno e score de BM25 não são comparáveis.

### Sobre o score

O valor absoluto de similaridade **não é confiável** como threshold. Depende do modelo, do domínio e do tamanho do texto. Um cosseno de 0.7 pode ser ótimo num corpus e ruim em outro.

Então: em vez de "aceito acima de 0.8", eu pego top-k e deixo o reranker decidir ([[10 - Reranking]]). Se precisar de corte, calibro com dados reais em vez de escolher um número bonito.

### Métricas

- **recall@k** — dos documentos relevantes, quantos apareceram no top-k
- **MRR** — posição do primeiro resultado relevante
- **nDCG** — leva em conta a ordem e graus de relevância

Recall@k é o que mais importa em RAG: se o chunk certo não veio na recuperação, o modelo não tem como responder direito, por melhor que o prompt seja ([[9 - RAG - o pipeline]]).
