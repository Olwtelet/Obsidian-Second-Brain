Embedding é transformar texto num **vetor de números** que representa o significado.

```
"cachorro"  -> [0.21, -0.45, 0.88, ..., 0.03]   (1536 dimensões)
```

O ponto: textos com sentido parecido ficam **perto** nesse espaço, mesmo sem compartilhar nenhuma palavra.

```
"como cancelo minha assinatura"
"quero encerrar meu plano"
```

Zero palavras em comum. Busca por palavra-chave não acha. Busca por embedding acha, porque os vetores são próximos.

### Por que isso funciona

O modelo de embedding foi treinado pra colocar perto o que aparece em contextos parecidos. É a hipótese distribucional: "você conhece uma palavra pela companhia que ela tem".

O resultado é um espaço onde direção tem significado. O exemplo clássico:

```
vetor("rei") - vetor("homem") + vetor("mulher") ≈ vetor("rainha")
```

Na prática com embedding de sentença isso é menos limpo do que o exemplo sugere, mas a intuição serve.

### Gerar

```python
from openai import OpenAI
cliente = OpenAI()

resp = cliente.embeddings.create(
    model="text-embedding-3-small",
    input=["como cancelo minha assinatura", "quero encerrar meu plano"]
)
vetores = [d.embedding for d in resp.data]
```

Mandar em **batch** é bem mais barato e rápido que um por vez.

### Coisas que eu não sabia

**O modelo importa e não dá pra misturar.** Vetor gerado pelo modelo A não é comparável com vetor do modelo B. Trocar de modelo = **reindexar tudo**. Vale anotar qual modelo gerou cada índice.

**Dimensão é trade-off.** 1536 dimensões custa mais memória e busca mais lenta que 384. Alguns modelos suportam reduzir a dimensão na geração (Matryoshka) sem perder muito — economia real com pouca perda.

**Assimetria.** Pergunta e documento têm formatos diferentes. Alguns modelos pedem prefixo (`"query: ..."` / `"passage: ..."`) e usar errado degrada bastante o resultado.

**Contexto limitado.** Embedding tem limite de tokens (512–8192 conforme o modelo). Texto maior precisa ser dividido — por isso chunking existe ([[8 - Chunking]]).

**Não é só texto.** Existe embedding de imagem, áudio e código. Modelo multimodal coloca imagem e texto no **mesmo** espaço, o que permite buscar imagem por descrição.

### Distância

**Cosseno** é o padrão: mede o ângulo entre os vetores, ignorando magnitude.

```python
import numpy as np

def cosseno(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

Varia de -1 a 1; na prática, com embeddings modernos, quase tudo cai entre 0 e 1.

Se os vetores estão normalizados (norma 1), cosseno e produto interno dão o mesmo resultado, e o produto interno é mais rápido. A maioria dos modelos já devolve normalizado.

Mais sobre isso e sobre como buscar em escala em [[7 - Similaridade e busca vetorial]].

### O que embedding não faz

- **não entende negação.** "gosto de café" e "não gosto de café" ficam **próximos**. Isso quebra expectativa
- **não é bom com nome próprio, código e número.** Buscar por "erro 4021" ou por SKU falha; keyword search ganha nisso
- **não raciocina.** É similaridade, não inferência
- **não tem noção de recência ou autoridade.** O chunk mais parecido pode ser de um documento obsoleto — por isso metadado e filtro importam

Esses limites são o motivo de busca híbrida (vetor + keyword) quase sempre ganhar de vetor puro.

### Onde uso

- busca semântica e RAG ([[9 - RAG - o pipeline]])
- deduplicação (dois textos quase iguais têm vetores quase iguais)
- clustering de temas
- classificação: gerar embedding e comparar com centroides de cada classe — barato e sem treinar modelo
- recomendação por conteúdo
