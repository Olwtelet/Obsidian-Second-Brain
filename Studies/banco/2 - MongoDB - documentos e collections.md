### O vocabulário

| Relacional | Mongo |
|---|---|
| database | database |
| tabela | collection |
| linha | documento |
| coluna | campo |
| JOIN | `$lookup` (ou embutir) |

Documento é BSON — JSON binário, com tipos que o JSON não tem: `ObjectId`, `Date`, `Decimal128`, `Binary`.

Limite de 16MB por documento. Parece muito, mas é o que impede array que cresce pra sempre (histórico de log, lista de likes).

### _id

Todo documento tem `_id`. Se eu não fornecer, o Mongo gera um `ObjectId` de 12 bytes:

```
507f1f77 bcf86cd7 99439011
timestamp | random | contador
```

Como começa com timestamp, ordenar por `_id` já ordena aproximadamente por data de criação. Dá pra extrair: `objectId.getTimestamp()`.

Pegadinha constante: `ObjectId("...")` **não** é igual à string `"..."`.

```javascript
db.usuarios.findOne({ _id: "507f1f77bcf86cd799439011" }); // null
db.usuarios.findOne({ _id: new ObjectId("507f1f77bcf86cd799439011") }); // ok
```

O parâmetro da URL vem como string, então precisa converter. O Mongoose faz cast automático, o driver puro não.

### CRUD

```javascript
await db.collection("usuarios").insertOne({ nome: "Alice", idade: 28 });
await db.collection("usuarios").insertMany([...]);

await db.collection("usuarios").findOne({ email: "a@b.com" });
await db.collection("usuarios").find({ idade: { $gte: 18 } }).toArray();

await db.collection("usuarios").updateOne(
  { _id: id },
  { $set: { idade: 29 } }
);

await db.collection("usuarios").deleteOne({ _id: id });
```

`find` devolve **cursor**, não array. Sem `toArray()` ou `for await`, não vem nada. E `toArray()` em coleção grande carrega tudo na memória — iterar é melhor ([[6 - Streams]]).

### Operadores que eu uso sempre

Comparação: `$eq $ne $gt $gte $lt $lte $in $nin`
Lógicos: `$and $or $not $nor`
Existência: `$exists $type`
Array: `$all $elemMatch $size`

```javascript
db.produtos.find({
  preco: { $gte: 100, $lte: 500 },
  categoria: { $in: ["eletronicos", "informatica"] },
  estoque: { $gt: 0 }
});
```

Update:

```javascript
{ $set: { nome: "X" } }              // define
{ $unset: { campoAntigo: "" } }      // remove
{ $inc: { visualizacoes: 1 } }       // incrementa (atômico)
{ $push: { tags: "novo" } }          // adiciona no array
{ $addToSet: { tags: "novo" } }      // adiciona se não existir
{ $pull: { tags: "velho" } }         // remove do array
```

**Sem operador, o update SUBSTITUI o documento inteiro:**

```javascript
updateOne({ _id: id }, { nome: "X" });          // erro no driver moderno
updateOne({ _id: id }, { $set: { nome: "X" } }); // certo
```

`$inc` é atômico no servidor, então não tem race condition. Ler, somar 1 em JS e gravar de volta tem.

### upsert

```javascript
await db.collection("config").updateOne(
  { chave: "tema" },
  { $set: { valor: "dark" } },
  { upsert: true }
);
```

Atualiza se existir, cria se não. Evita o `findOne` + `if` + `insert`, que tem race condition entre as duas chamadas.

### Aggregation pipeline

Pra tudo que passa de um filtro simples. Cada estágio recebe a saída do anterior:

```javascript
db.pedidos.aggregate([
  { $match: { status: "pago" } },
  { $unwind: "$itens" },
  { $group: {
      _id: "$itens.produto",
      totalVendido: { $sum: "$itens.qtd" },
      receita: { $sum: { $multiply: ["$itens.preco", "$itens.qtd"] } }
  }},
  { $sort: { receita: -1 } },
  { $limit: 10 }
]);
```

Regra de ouro: **`$match` primeiro**. Filtrar antes de agrupar reduz o volume e permite usar índice. `$match` depois de `$group` percorre tudo à toa.

`$lookup` faz join, mas é o estágio mais caro. Se estou usando muito, provavelmente modelei errado ([[1 - Relacional x documental]]).

### Detalhes que me pegaram

- comparação de campo dentro de array funciona no elemento: `{ "itens.preco": { $gt: 100 } }` casa se **qualquer** item passar. Pra exigir tudo no mesmo elemento, `$elemMatch`
- `null` e campo ausente são iguais em `{ campo: null }`. Pra separar, `$exists`
- string é case-sensitive por padrão. Busca por nome precisa de índice de texto, collation ou normalizar na escrita
