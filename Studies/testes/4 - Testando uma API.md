O tipo de teste que mais me dá confiança por linha escrita.

### Sem subir servidor

```javascript
import request from "supertest";
import { app } from "../src/app.js";

test("POST /usuarios cria e devolve 201", async () => {
  const res = await request(app)
    .post("/usuarios")
    .send({ nome: "Alice", email: "alice@ex.com", senha: "senha12345" });

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({ nome: "Alice" });
  expect(res.body.senhaHash).toBeUndefined();   // não pode vazar
});
```

O supertest sobe o app numa porta efêmera. Pra isso o `app` precisa estar separado do `listen`:

```javascript
// app.js -> exporta o app configurado
// index.js -> importa e chama app.listen(PORT)
```

Separação simples que faz diferença.

### Banco real

```javascript
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  for (const c of Object.values(mongoose.connection.collections)) {
    await c.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
```

Limpar entre testes, não recriar o banco — recriar é lento e não é necessário.

Alternativa melhor pra fidelidade: Testcontainers, que sobe o Mongo/Postgres real em Docker. `mongodb-memory-server` é mais rápido mas não é exatamente o mesmo servidor.

E no CI, `services:` no workflow resolve ([[8 - CI-CD]]).

### O que testar em cada rota

Não é só o caminho feliz. Pra cada endpoint:

```javascript
describe("POST /pedidos", () => {
  test("201 com dados válidos", async () => {});
  test("400 sem itens", async () => {});
  test("401 sem token", async () => {});
  test("403 quando não é o dono", async () => {});
  test("404 quando o usuário não existe", async () => {});
  test("409 quando já existe pedido pendente", async () => {});
});
```

Os testes de **autorização** são os que mais valem. É exatamente onde mora o IDOR ([[6 - Autenticação x Autorização]]):

```javascript
test("não deixa deletar post de outro usuário", async () => {
  const alice = await criarUsuario();
  const bob = await criarUsuario();
  const post = await criarPost({ autorId: alice.id });

  const res = await request(app)
    .delete(`/posts/${post.id}`)
    .set("Authorization", `Bearer ${tokenDe(bob)}`);

  expect(res.status).toBe(403);
  expect(await Post.findById(post.id)).not.toBeNull();  // continua lá
});
```

Reparar na última asserção: verificar o **estado**, não só o status. Uma rota pode devolver 403 e ter deletado assim mesmo.

### Factories

Sem isso o teste vira 20 linhas de setup:

```javascript
export async function criarUsuario(dados = {}) {
  return Usuario.create({
    nome: "Usuário Teste",
    email: `teste-${crypto.randomUUID()}@ex.com`,
    senhaHash: await bcrypt.hash("senha12345", 4),   // rounds baixo no teste
    ...dados
  });
}
```

Só sobrescrevo o que importa pro caso. `bcrypt` com 4 rounds em vez de 12 corta segundos da suíte — 12 é pra produção.

E-mail com UUID evita colisão de índice único entre testes paralelos.

### Autenticação nos testes

```javascript
function tokenDe(usuario) {
  return jwt.sign({ sub: usuario.id, papel: usuario.papel }, env.JWT_SECRET);
}
```

Gerar o token de verdade em vez de mockar o middleware. Assim o teste também exercita a validação ([[5 - JWT]]).

### O que eu evito

- **testar através da API o que é regra pura.** Cálculo de frete se testa direto na função, em milissegundos. Pela API é lento e o erro fica difícil de localizar
- **depender da ordem dos testes.** Cada um cria o que precisa
- **snapshot de resposta inteira.** Um campo `createdAt` quebra tudo. Melhor `toMatchObject` com os campos que importam

### A conta

Teste de integração é ~10x mais lento que unit e pega muito mais coisa. Numa API, é onde eu concentro o esforço.

Unit pra lógica de negócio pura, integração pras rotas, e-2-e só pros fluxos críticos ([[1 - Pirâmide de testes]]).
