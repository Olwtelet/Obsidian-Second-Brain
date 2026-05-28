A decisão que se repete o tempo todo: **embutir ou referenciar?**

### Embutir

```javascript
{
  _id: 1,
  titulo: "Meu post",
  comentarios: [
    { autor: "Alice", texto: "boa!", em: ISODate("...") }
  ]
}
```

- ✅ uma leitura só, escrita atômica
- ❌ documento cresce; duplica dado; array sem limite bate nos 16MB

### Referenciar

```javascript
// posts
{ _id: 1, titulo: "Meu post" }

// comentarios
{ _id: 9, postId: 1, autor: "Alice", texto: "boa!" }
```

- ✅ documento pequeno, cresce sem limite, dado em um lugar só
- ❌ duas queries (ou `$lookup`/`populate`)

### O critério

Três perguntas, nessa ordem:

1. **É lido junto?** Se toda vez que leio A eu preciso de B, embutir.
2. **Cresce sem limite?** Se sim, referenciar. Sempre.
3. **É acessado sozinho?** Se preciso listar B sem A, referenciar.

E a cardinalidade ajuda:

- **1 : poucos** (usuário → endereços) → embutir
- **1 : muitos** (post → comentários) → referenciar, ou embutir os N mais recentes
- **1 : milhões** (produto → visualizações) → referenciar, com o pai guardando só o contador
- **muitos : muitos** (aluno ↔ curso) → referenciar dos dois lados, ou coleção de ligação se a relação tiver dados próprios (nota, data de matrícula)

### O padrão híbrido

O que eu mais uso na prática: referencia **e** embute um pedacinho.

```javascript
{
  _id: 1,
  titulo: "Meu post",
  autor: { id: ObjectId("..."), nome: "Alice", avatar: "..." },  // subset
  totalComentarios: 12,
  ultimosComentarios: [ /* 3 mais recentes */ ]
}
```

A listagem renderiza direto do documento, sem populate. Quem abrir o post busca o resto.

O preço é manter isso sincronizado quando a Alice trocar de nome. Duas saídas:
- atualizar em massa (`updateMany({ "autor.id": x }, { $set: { "autor.nome": novo } })`) — barato porque troca de nome é raro
- aceitar desatualizado quando faz sentido (nome do comprador na nota fiscal deve ser o da época)

Isso é **desnormalizar de propósito**: troco espaço e complexidade de escrita por velocidade de leitura. Faz sentido porque leitura costuma ser 100x mais frequente.

### O bucket pattern

Pra série temporal, um documento por medição desperdiça espaço (`_id` + índice em cada). Agrupar por hora resolve:

```javascript
{
  sensorId: "abc",
  hora: ISODate("2026-05-27T14:00:00Z"),
  medicoes: [
    { min: 0, valor: 22.5 },
    { min: 1, valor: 22.7 }
  ],
  contagem: 60
}
```

60x menos documentos, e o array tem teto conhecido.

### Extended reference e o array sem teto

O erro que eu vejo (e cometi): array que só cresce.

```javascript
{ _id: 1, nome: "post", curtidasDeUsuarios: [ /* 400 mil ids */ ] }
```

Além do limite de 16MB, o documento inteiro é reescrito a cada `$push` e o Mongo precisa realocar. Fica lento muito antes de estourar.

O certo é coleção separada + contador no pai:

```javascript
// posts
{ _id: 1, totalCurtidas: 400000 }

// curtidas
{ postId: 1, usuarioId: 9 }  // índice único no par
```

### Regra final

No relacional eu modelo pelos dados. No Mongo eu modelo pelas **consultas**.

Antes de desenhar a collection, escrevo a lista de perguntas que a aplicação vai fazer ao banco. O modelo sai daí. Se eu descobrir a query depois, o modelo vai estar errado — e migrar dado em produção é caro ([[1 - Relacional x documental]]).
