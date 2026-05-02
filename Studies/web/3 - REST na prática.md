REST é um estilo de arquitetura, não um protocolo. Na prática quase todo mundo (eu incluso) chama de REST qualquer API JSON sobre HTTP — o que tecnicamente é "HTTP API". Mas as ideias por trás são úteis.

### Recurso, não ação

A unidade é o **substantivo**. O verbo já está no método HTTP.

```
GET    /usuarios          lista
POST   /usuarios          cria
GET    /usuarios/42       busca um
PUT    /usuarios/42       substitui inteiro
PATCH  /usuarios/42       altera parcial
DELETE /usuarios/42       remove
```

Errado:

```
POST /criarUsuario
POST /getUsuarioPorId
GET  /usuarios/42/deletar
```

O último é o pior, porque quebra a garantia de que GET não muda estado ([[1 - Anatomia de uma requisição HTTP]]).

Sub-recurso pra relação:

```
GET  /usuarios/42/pedidos
POST /usuarios/42/pedidos
GET  /pedidos/7/itens
```

Regra que eu sigo: se passou de dois níveis, provavelmente vale expor o recurso na raiz e filtrar por query.

### Query string pro que não é identidade

```
GET /pedidos?status=pago&pagina=2&limite=20&ordenar=-criadoEm
```

Filtro, paginação e ordenação vão em query. Nunca em segmento de caminho.

### Paginação

Duas formas, e a escolha importa:

**Offset** — `?pagina=3&limite=20`. Simples, permite pular pra página N. Fica lento em tabela grande (o banco tem que contar e descartar) e **duplica ou pula item** se algo for inserido enquanto o usuário navega.

**Cursor** — `?depois=eyJpZCI6NDJ9&limite=20`. Consistente e rápido em qualquer profundidade, mas só dá pra ir pra frente/trás, não pra "página 57".

Feed infinito → cursor. Tabela administrativa com numeração → offset.

### O que devolver

Consistência importa mais que perfeição. Escolho um envelope e uso em tudo:

```json
{
  "dados": [ ... ],
  "meta": { "total": 137, "pagina": 2, "limite": 20 }
}
```

Erro no mesmo formato sempre:

```json
{
  "erro": {
    "codigo": "SALDO_INSUFICIENTE",
    "mensagem": "Saldo insuficiente para concluir o pedido",
    "campos": { "itens": "valor total excede o saldo" }
  }
}
```

O `codigo` é pro cliente tratar programaticamente; a `mensagem` é pra humano. Se só tiver mensagem, o front acaba comparando string — e aí traduzir a API quebra o front.

### Versionar

`/v1/usuarios` no caminho. Existe abordagem por header (`Accept: application/vnd.api.v2+json`), mais "correta" em teoria e mais chata na prática — não dá pra testar no navegador nem colar num `curl` simples.

Versiono quando a mudança **quebra** cliente existente: remover campo, renomear, mudar tipo, tornar obrigatório. Adicionar campo opcional não quebra ninguém e não precisa de versão nova ([[7 - Semantic versioning e tags]]).

### Idempotência em POST

POST não é idempotente, mas às vezes precisa ser — o usuário clica duas vezes em "pagar" e não pode gerar dois pagamentos.

A solução é a chave de idempotência:

```
POST /pagamentos
Idempotency-Key: 9f8b7c6d-...
```

O servidor guarda a chave e a resposta. Se a mesma chave chegar de novo, devolve a resposta salva sem processar. É o que Stripe faz.

### HATEOAS

O nível mais alto do modelo de maturidade de Richardson: a resposta trazer os links das próximas ações possíveis.

```json
{
  "id": 7,
  "status": "pendente",
  "_links": { "cancelar": "/pedidos/7/cancelamento" }
}
```

Na prática quase ninguém usa. Anoto porque cai em prova e porque a ideia é boa (o cliente descobre o que pode fazer em vez de assumir), mesmo que o custo raramente compense.

### Quando REST não é a melhor escolha

- muitos relacionamentos e cliente que precisa de recortes diferentes → GraphQL evita over/under-fetching
- comunicação entre serviços internos, latência crítica → gRPC
- atualização em tempo real → WebSocket ou SSE. REST em polling é desperdício ([[Pub Sub arquitetura]])
