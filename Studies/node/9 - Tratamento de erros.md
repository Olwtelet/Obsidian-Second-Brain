Nota curta, mas é coisa que eu erro sempre.

### Erro esperado x erro inesperado

- **esperado**: saldo insuficiente, e-mail já cadastrado, recurso não encontrado. Faz parte do fluxo. O cliente precisa saber o motivo.
- **inesperado**: banco caiu, `undefined.map`, timeout. Bug ou infra. O cliente recebe "erro interno" e eu recebo o stack no log.

Misturar os dois é o que gera resposta 500 pra coisa que era 400, e mensagem interna vazando pro usuário.

O jeito que eu resolvo é uma classe de erro própria:

```javascript
export class ErroDeNegocio extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.name = "ErroDeNegocio";
    this.status = status;
    this.publico = true;
  }
}
```

E no middleware de erro ([[5 - Middleware]]):

```javascript
function tratarErro(err, req, res, next) {
  if (err.publico) {
    return res.status(err.status).json({ erro: err.message });
  }
  console.error(err);
  res.status(500).json({ erro: "erro interno" });
}
```

Um lugar só decide o que vaza. As rotas não precisam saber disso.

### catch tipado

Desde o TS 4.4 o `catch` vem como `unknown`, então:

```typescript
try {
  await algo();
} catch (e) {
  if (e instanceof ErroDeNegocio) { /* ... */ }
  if (e instanceof Error) console.error(e.message);
  // e pode ser qualquer coisa: throw "string" é válido em JS
}
```

Chato, mas correto — qualquer valor pode ser jogado com `throw`.

### cause

Detalhe que eu não usava e passei a usar: dá pra encadear erro sem perder o original.

```javascript
try {
  await db.connect();
} catch (e) {
  throw new Error("falha ao conectar no banco", { cause: e });
}
```

O stack do erro original continua acessível em `err.cause`.

### Não engolir erro

O pior padrão de todos:

```javascript
try {
  await salvar();
} catch (e) {
  console.log("erro"); // e a execução continua como se tivesse dado certo
}
```

Se eu não sei o que fazer com o erro, deixo subir. Catch só existe pra quem **consegue tratar**.

### O que derruba o processo

```javascript
process.on("unhandledRejection", (motivo) => {
  console.error("promise rejeitada sem catch:", motivo);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("exceção não capturada:", err);
  process.exit(1);
});
```

Parece contraintuitivo dar `exit(1)` de propósito, mas depois de um `uncaughtException` o processo está em estado indefinido — pode ter conexão pela metade, transação aberta, memória inconsistente. Melhor morrer e deixar o orquestrador (PM2, Docker restart policy, Kubernetes) subir um processo limpo.

Isso é o "let it crash" que o Erlang popularizou.

### Shutdown gracioso

Junto disso vale tratar o sinal de parada, senão o deploy derruba requisição no meio:

```javascript
process.on("SIGTERM", async () => {
  servidor.close();          // para de aceitar conexão nova
  await db.close();          // termina as que estão em andamento
  process.exit(0);
});
```

Sem isso, todo deploy gera alguns erros pro usuário.
