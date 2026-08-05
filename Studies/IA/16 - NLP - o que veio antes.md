Comecei por LLM e fui pra trás. Muita coisa que parece "resolvida pelo modelo" tem uma versão clássica que ainda é útil — e mais barata.

### Pré-processamento

O pipeline tradicional:

1. **normalização** — minúsculas, tirar acento, unificar espaço
2. **tokenização** — quebrar em palavras
3. **remoção de stopwords** — "de", "a", "o", "para"
4. **stemming** — cortar sufixo: "correndo" → "corr". Rápido e grosseiro
5. **lematização** — reduzir à forma canônica: "correndo" → "correr". Precisa de dicionário

Nada disso se faz antes de mandar pro LLM — ele lida com texto cru e tirar stopword só piora. Mas continua valendo pra:

- busca por keyword (BM25), que é metade da busca híbrida ([[7 - Similaridade e busca vetorial]])
- deduplicação
- normalizar antes de indexar

Em português, lematização é mais necessária que em inglês por causa da flexão verbal.

### Representações, em ordem histórica

**Bag of Words** — conta ocorrência. Perde ordem completamente.

**TF-IDF** — pondera pela raridade: termo frequente no documento e raro no corpus pesa mais. Ainda é bom baseline.

**BM25** — TF-IDF melhorado, com saturação de frequência e normalização por tamanho. **Continua sendo estado da arte pra busca lexical** e é o que roda no Elasticsearch.

**Word2Vec / GloVe** — primeiro embedding denso. Um vetor por palavra, fixo. Problema: "banco" tem um vetor só, sem distinguir banco de sentar de banco de dinheiro.

**Contextual (BERT em diante)** — o vetor depende da frase. É o que existe hoje ([[6 - Embeddings]]).

Entender essa progressão ajudou a ver que embedding não surgiu do nada — é a resposta ao limite anterior.

### Tarefas clássicas

- **classificação** — sentimento, spam, categoria
- **NER** — extrair entidade (pessoa, lugar, valor, data)
- **POS tagging** — classe gramatical
- **similaridade** — quanto dois textos se parecem
- **sumarização** — extrativa (seleciona frases) ou abstrativa (reescreve)
- **information retrieval** — busca

LLM faz todas com prompt e zero treino. A questão é se **deve**.

### Quando o clássico ganha

Classificar 10 milhões de textos:

| | LLM | classificador treinado |
|---|---|---|
| custo | alto por item | quase zero |
| latência | ~1s | ~1ms |
| determinismo | não | sim |
| explicabilidade | baixa | alta |
| setup | prompt | precisa de dados rotulados |

Pra volume alto e tarefa fixa, um modelo pequeno (ou até regressão logística sobre TF-IDF) ganha em tudo menos no setup inicial.

O caminho que faz sentido: usar LLM pra **rotular** alguns milhares de exemplos, treinar um classificador pequeno com isso, e rodar o pequeno em produção. Destilação.

E pra extrair CPF, CEP ou data em formato conhecido, **regex** continua sendo a resposta certa. Não é retrocesso — é usar a ferramenta determinística onde ela é exata e barata.

### Métricas

Precisão e recall são a base, e a distinção importa:

- **precisão** — dos que marquei como positivo, quantos eram? (evita falso positivo)
- **recall** — dos positivos reais, quantos achei? (evita falso negativo)
- **F1** — média harmônica

Qual otimizar depende do custo do erro. Filtro de spam prioriza **precisão** (marcar e-mail legítimo como spam é pior). Triagem médica prioriza **recall** (deixar passar é pior).

Isso é a mesma lógica dos dois estágios de busca: recall primeiro, precisão depois ([[10 - Reranking]]).

### O que me ficou

LLM é um martelo muito bom, e por isso é fácil tratar tudo como prego.

Boa parte do que eu faria com LLM se resolve com: regex, BM25, um classificador pequeno, ou uma query no banco. Mais barato, mais rápido, determinístico e testável.

O LLM entra onde realmente precisa de compreensão de linguagem aberta — não em toda etapa do pipeline.
