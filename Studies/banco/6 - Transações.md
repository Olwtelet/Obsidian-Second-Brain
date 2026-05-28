Nota curta. Vi ACID na faculdade ([[7 - Administracao banco de dados]]) mas nunca tinha parado pra pensar no caso do Mongo.

### ACID

- **Atomicidade** — tudo ou nada
- **Consistência** — as regras do banco continuam válidas no fim
- **Isolamento** — transações concorrentes não enxergam o meio do caminho uma da outra
- **Durabilidade** — depois do commit, sobrevive a queda

### O caso clássico

```
debita 100 da conta A
credita 100 na conta B
```

Se o processo morre no meio, o dinheiro sumiu. Precisa ser atômico.

### No Mongo

Escrita em **um documento** já é atômica, sem transação nenhuma. Isso é de propósito: o modelo documental tenta fazer com que "o que muda junto fique junto" ([[5 - Modelar relações no Mongo]]).

```javascript
await Pedido.updateOne(
  { _id: id, status: "pendente" },
  { $set: { status: "pago" }, $inc: { tentativas: 1 } }
);
```

Os dois operadores aplicam juntos ou nenhum aplica.

Reparar no filtro: `status: "pendente"` faz parte da condição. Se outro processo já pagou, o `matchedCount` vem 0 e eu sei que perdi a corrida. Isso é **update condicional** e resolve boa parte dos casos sem transação — é otimistic locking na prática.

### Quando precisa de transação mesmo

```javascript
const sessao = await mongoose.startSession();

try {
  await sessao.withTransaction(async () => {
    await Conta.updateOne({ _id: a }, { $inc: { saldo: -100 } }, { session: sessao });
    await Conta.updateOne({ _id: b }, { $inc: { saldo:  100 } }, { session: sessao });
  });
} finally {
  await sessao.endSession();
}
```

Requisitos: replica set (não funciona em standalone) e Mongo 4.0+. Atlas já vem assim; local exige subir como replica set, mesmo com um nó só.

`withTransaction` faz retry automático em erro transitório, que é o motivo de preferir ele a `startTransaction`/`commitTransaction` na mão.

### Custos

Transação no Mongo é mais cara que no Postgres. Ela segura recursos, tem limite de 60 segundos por padrão e pode abortar por conflito de escrita.

Então:
- transação curta, só o necessário dentro
- **nada de chamada HTTP dentro** de transação (mandar e-mail, chamar gateway). Isso segura a transação por segundos e ainda não é revertível — se der rollback, o e-mail já foi
- se estou usando transação toda hora, provavelmente modelei relacional dentro do Mongo

### O que fazer no lugar

Pra fluxo distribuído (pagamento + estoque + notificação), transação não resolve mesmo — são sistemas diferentes. Aí o caminho é:

- **outbox pattern** — grava o evento na mesma escrita do dado, e um worker publica depois. Assim "salvou" e "vai notificar" são atômicos entre si
- **saga** — sequência de passos com compensação (estornar, repor estoque) quando um falha
- **idempotência** — cada passo pode ser repetido sem duplicar efeito ([[3 - REST na prática]])

Isso é consistência eventual: em algum momento tudo converge, mas não instantaneamente. Pra muito caso de negócio isso é aceitável — e pra dinheiro, geralmente não é, o que me leva de volta a "esse dado talvez devesse estar em Postgres".
