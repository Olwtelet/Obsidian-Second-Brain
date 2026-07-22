Não dá pra gerar embedding de um PDF de 300 páginas: tem limite de contexto e, mesmo se coubesse, o vetor de um texto enorme vira uma média sem foco — não representa nada específico.

Então o documento é quebrado em pedaços. Chunking é decidir **onde cortar**, e é a etapa que mais afeta a qualidade do RAG. Mais que a escolha do modelo, na minha impressão.

### O trade-off

- **chunk pequeno** — vetor específico, recuperação precisa, mas o contexto pode faltar
- **chunk grande** — contexto completo, mas o vetor fica diluído e vem lixo junto

### Fixo com overlap

O básico:

```python
def dividir(texto, tamanho=1000, overlap=200):
    chunks = []
    inicio = 0
    while inicio < len(texto):
        chunks.append(texto[inicio:inicio + tamanho])
        inicio += tamanho - overlap
    return chunks
```

O overlap existe pra não perder informação que cai exatamente na fronteira. Custa duplicação (20% de overlap = 20% mais vetores).

Problema: corta no meio de frase, no meio de tabela, no meio de bloco de código.

### Recursivo por separador

O padrão razoável. Tenta cortar em separadores por ordem de importância:

```
["\n\n", "\n", ". ", " ", ""]
```

Tenta por parágrafo; se o pedaço ainda for grande, por linha; depois por frase; por último por caractere. Respeita a estrutura natural do texto.

### Por estrutura do documento

Melhor ainda quando o documento **tem** estrutura:

- **Markdown** — cortar por heading, e carregar o caminho dos headings como metadado. Um chunk de "## Autenticação > ### Refresh token" ganha contexto de graça
- **código** — por função ou classe, usando AST. Cortar função no meio é inútil
- **HTML** — por seção semântica
- **PDF** — o mais chato. Layout de duas colunas, cabeçalho e rodapé repetidos, tabela que vira texto embaralhado. Vale usar parser decente (Unstructured, LlamaParse) em vez de extrair texto cru

### Semântico

Quebra onde o **assunto muda**: gera embedding de cada frase e corta onde a similaridade entre frases consecutivas cai.

Mais caro (um embedding por frase antes de indexar) e nem sempre melhor que o recursivo bem configurado. Testei mentalmente o custo/benefício e acho que só compensa em corpus heterogêneo.

### Contextualizar o chunk

O truque que mais melhora resultado por esforço: **cada chunk carrega de onde veio**.

```
[Manual do Produto > Capítulo 4: Faturamento > Cancelamento]

Para cancelar a assinatura, acesse...
```

Sem isso, um chunk que começa com "Para cancelar, acesse..." não diz cancelar **o quê**. O vetor fica ambíguo e a resposta também.

Uma variação mais cara: pedir ao modelo um resumo de uma frase situando o chunk no documento e prefixar isso. Custa uma chamada por chunk na ingestão, e melhora bastante a recuperação.

### Small-to-big

Indexar pedaço pequeno (preciso pra busca) e, ao recuperar, devolver o pedaço **maior** em volta (contexto pra resposta).

Separa as duas necessidades, que são diferentes:
- busca quer **especificidade**
- geração quer **completude**

É provavelmente o padrão mais útil dessa nota inteira.

### Metadado

Guardar junto do chunk: fonte, título, seção, data, autor, permissão, número da página.

Serve pra três coisas:
1. filtrar na busca ([[7 - Similaridade e busca vetorial]])
2. **citar a fonte** na resposta, que é o que torna o resultado verificável ([[11 - Alucinação]])
3. reindexar só o que mudou

### Ponto de partida

Sem dado pra calibrar, começo com:

- ~500–800 tokens por chunk
- 10–15% de overlap
- corte recursivo respeitando estrutura
- caminho de headings prefixado
- metadado completo

E ajusto com base em avaliação de recuperação, não por intuição ([[12 - Avaliação de respostas]]). Testar chunking sem métrica é chute caro — cada mudança exige reindexar tudo.
