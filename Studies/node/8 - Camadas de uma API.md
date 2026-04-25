Toda API que eu comecei jogando tudo dentro da rota virou uma bola de lama depois de umas 15 rotas. Separar em camadas é o que resolve — e é a mesma ideia de coesão e acoplamento de [[Coesão e acoplamento]], só que aplicada no arranjo de arquivos.

### O problema

```javascript
app.post("/pedidos", async (req, res) => {
  const { itens, usuarioId } = req.body;
  if (!itens?.length) return res.status(400).json({ erro: "sem itens" });

  const usuario = await db.collection("usuarios").findOne({ _id: usuarioId });
  if (!usuario) return res.status(404).json({ erro: "usuário não existe" });

  const total = itens.reduce((acc, i) => acc + i.preco * i.qtd, 0);
  if (usuario.saldo < total) return res.status(400).json({ erro: "saldo insuficiente" });

  await db.collection("pedidos").insertOne({ usuarioId, itens, total });
  await db.collection("usuarios").updateOne({ _id: usuarioId }, { $inc: { saldo: -total } });
  await emailClient.send(usuario.email, "Pedido criado");

  res.status(201).json({ total });
});
```

Funciona. Mas: não dá pra testar a regra de saldo sem subir servidor HTTP **e** banco **e** mockar e-mail. E se amanhã surgir um comando de CLI que também cria pedido, eu copio tudo.

### As camadas

```
rota (controller)  -> fala HTTP
service            -> fala regra de negócio
repository         -> fala banco
```

A regra de ouro: **cada camada só conhece a de baixo**. Service nunca importa `req`/`res`, repository nunca conhece regra de negócio.

```javascript
// repositories/pedidoRepository.js
export function criarPedidoRepo(db) {
  return {
    inserir: (pedido) => db.collection("pedidos").insertOne(pedido),
    porUsuario: (id) => db.collection("pedidos").find({ usuarioId: id }).toArray()
  };
}
```

```javascript
// services/pedidoService.js
export function criarPedidoService({ pedidoRepo, usuarioRepo, notificador }) {
  return {
    async criar({ usuarioId, itens }) {
      if (!itens?.length) throw new ErroDeNegocio("pedido sem itens", 400);

      const usuario = await usuarioRepo.porId(usuarioId);
      if (!usuario) throw new ErroDeNegocio("usuário não existe", 404);

      const total = itens.reduce((acc, i) => acc + i.preco * i.qtd, 0);
      if (usuario.saldo < total) throw new ErroDeNegocio("saldo insuficiente", 400);

      const pedido = await pedidoRepo.inserir({ usuarioId, itens, total });
      await usuarioRepo.debitar(usuarioId, total);
      await notificador.pedidoCriado(usuario, pedido);

      return pedido;
    }
  };
}
```

```javascript
// routes/pedidos.js
router.post("/", asyncHandler(async (req, res) => {
  const pedido = await pedidoService.criar({
    usuarioId: req.usuario.id,
    itens: req.body.itens
  });
  res.status(201).json(pedido);
}));
```

A rota ficou com três linhas: **traduzir HTTP pra chamada de função e de volta**. É só isso que ela deveria fazer desde o começo.

### O que eu ganhei de concreto

- testar a regra de saldo agora é chamar `service.criar()` com dois objetos fake. Sem servidor, sem banco, milissegundos ([[3 - Test doubles - mock, stub e spy]])
- trocar Mongo por Postgres mexe só no repository
- a mesma regra serve pra rota HTTP, worker de fila e comando de CLI

Reparar que o service **recebe** as dependências em vez de importar. Isso é [[Injeção de dependência]] — é o que torna o teste possível sem mock de módulo.

### Onde eu erro

Criar as três camadas pra um CRUD de 4 rotas que só faz `findOne` e `insertOne`. Aí o service vira só um repasse:

```javascript
// isso não agrega nada
criar: (dados) => repo.inserir(dados)
```

Se não tem regra, não precisa de service. Começo com rota + repository e crio a camada do meio **quando a regra aparecer**. Camada sem conteúdo é só arquivo a mais pra abrir.

### Sobre onde validar

Validação de **formato** (é string? é e-mail? o campo veio?) fica na borda, na rota, com schema. Validação de **regra** (tem saldo? o pedido pode ser cancelado nesse status?) fica no service. Misturar as duas é o que faz o service começar a conhecer detalhe de HTTP.
