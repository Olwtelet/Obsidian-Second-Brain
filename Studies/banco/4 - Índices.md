Sem índice, o banco faz **collection scan**: lê documento por documento pra achar o que casa. Com 100 registros ninguém percebe. Com 1 milhão, a API cai.

Índice é uma estrutura (B-tree) que mantém os valores ordenados apontando pro documento. Trocar O(n) por O(log n) — é a mesma ideia de [[8 - Eficiência assintótica de algoritmos]] aplicada em disco.

```javascript
db.usuarios.createIndex({ email: 1 });   // 1 = asc, -1 = desc
```

### explain

A ferramenta pra parar de adivinhar:

```javascript
db.pedidos.find({ status: "pago" }).explain("executionStats");
```

O que eu olho:

- `stage: "COLLSCAN"` → varreu tudo, **falta índice**
- `stage: "IXSCAN"` → usou índice
- `totalDocsExamined` vs `nReturned` → se examinou 100 mil pra devolver 10, o índice está ruim ou não existe. O ideal é os dois números serem próximos

### Índice composto e a regra ESR

A **ordem dos campos importa**.

```javascript
db.pedidos.createIndex({ usuarioId: 1, status: 1, criadoEm: -1 });
```

Esse índice serve pra:
- `{ usuarioId }`
- `{ usuarioId, status }`
- `{ usuarioId, status, criadoEm }`

E **não** serve pra `{ status }` sozinho. É o *prefixo à esquerda*: só dá pra usar a partir do começo. Como um índice remissivo ordenado por sobrenome — procurar por nome não ajuda.

A regra pra montar: **ESR**

1. **E**quality — campos de igualdade primeiro
2. **S**ort — campos de ordenação
3. **R**ange — faixa (`$gt`, `$lt`) por último

```javascript
db.pedidos.find({ usuarioId: x, status: "pago", total: { $gt: 100 } })
          .sort({ criadoEm: -1 });

// índice: { usuarioId: 1, status: 1, criadoEm: -1, total: 1 }
//            equality      equality    sort         range
```

Range antes de sort quebra o uso do índice pra ordenação, e o Mongo passa a ordenar em memória — com limite de 32MB, acima disso a query **falha** em vez de ficar lenta.

### O custo

Índice não é grátis:

- ocupa espaço em disco e idealmente em RAM
- **toda escrita** atualiza todos os índices da collection
- índice não usado é puro prejuízo

Então: índice pra query que roda muito ou é lenta. Não pra todo campo "por precaução".

`db.collection.aggregate([{ $indexStats: {} }])` mostra quantas vezes cada índice foi usado. O que está zerado há semanas pode cair.

### Tipos que valem lembrar

**Único** — garante que não repete (é o que `unique: true` do Mongoose cria, ver [[3 - Mongoose - schemas e models]]):

```javascript
db.usuarios.createIndex({ email: 1 }, { unique: true });
```

**Parcial** — indexa só parte da collection. Útil pra soft delete:

```javascript
db.usuarios.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { ativo: true } }
);
```

Assim o e-mail é único **entre os ativos**, e um usuário deletado não bloqueia recadastro.

**TTL** — apaga documento sozinho depois de N segundos. Perfeito pra sessão, token e log:

```javascript
db.sessoes.createIndex({ criadoEm: 1 }, { expireAfterSeconds: 3600 });
```

**Texto** — busca por palavra:

```javascript
db.produtos.createIndex({ nome: "text", descricao: "text" });
db.produtos.find({ $text: { $search: "teclado mecânico" } });
```

Só um índice de texto por collection. Pra busca séria (typo, relevância, facetas) isso não basta e a resposta é Atlas Search ou Elasticsearch.

**Vetorial** — Atlas tem índice pra embedding, com HNSW por baixo. É o que permite fazer RAG sem subir um banco vetorial separado ([[7 - Similaridade e busca vetorial]]).

### Em produção

Criar índice trava a collection nas versões antigas. Hoje é `background` por padrão, mas em collection grande ainda dá impacto — melhor em janela de baixo tráfego.

E `autoIndex: false` em produção. Índice deveria ser criado por migration controlada, não pela aplicação subindo.
