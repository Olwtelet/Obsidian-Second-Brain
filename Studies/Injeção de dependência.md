Nome grande, ideia pequena: em vez de o módulo **criar** o que precisa, ele **recebe**.

```javascript
// cria -> preso
function criarUsuario(dados) {
  const db = new MongoClient(process.env.DATABASE_URL);
  const email = new SendGrid(process.env.SG_KEY);
  // ...
}

// recebe -> livre
function criarServicoUsuario({ repo, notificador }) {
  return {
    async criar(dados) {
      const usuario = await repo.inserir(dados);
      await notificador.boasVindas(usuario);
      return usuario;
    }
  };
}
```

É isso. Não precisa de framework, não precisa de container, não precisa de decorator.

### O que isso resolve

**Teste.** Sem DI, testar `criarUsuario` exige um Mongo rodando e o SendGrid mockado por módulo. Com DI:

```javascript
const servico = criarServicoUsuario({
  repo: new RepositorioEmMemoria(),
  notificador: { boasVindas: vi.fn() }
});
```

Milissegundos, sem infraestrutura ([[3 - Test doubles]]).

**Trocar implementação.** Mongo em produção, em memória no teste, Postgres depois. O serviço não muda.

**Deixar a dependência explícita.** A assinatura diz tudo que o módulo precisa. Sem DI, isso está escondido dentro do corpo e só se descobre lendo.

### O "D" do SOLID

Dependency Inversion ([[3 - Solid]]): módulo de alto nível não deve depender do de baixo nível; os dois dependem de abstração.

Sem inversão:

```
ServicoPedido  ->  MongoRepository
```

Com:

```
ServicoPedido  ->  [interface Repositorio]  <-  MongoRepository
```

A seta do repositório **inverteu**. Quem define o contrato agora é o domínio, e a infraestrutura é que se adapta. É a base de clean architecture, hexagonal e ports & adapters — todas a mesma ideia com nomes diferentes.

Em TypeScript a "interface" pode ser literalmente uma `interface`; em JS puro é só um objeto com os métodos certos (duck typing).

### Composition root

Se ninguém cria nada, alguém tem que criar. Esse lugar é o **composition root**: um ponto só, na entrada da aplicação.

```javascript
// container.js
const db = await conectar(env.DATABASE_URL);

const usuarioRepo = criarUsuarioRepo(db);
const pedidoRepo  = criarPedidoRepo(db);
const notificador = criarNotificador(env.SG_KEY);

export const pedidoService = criarPedidoService({ pedidoRepo, usuarioRepo, notificador });
```

```javascript
// index.js
import { pedidoService } from "./container.js";
app.use("/pedidos", criarRotasPedido(pedidoService));
```

Toda a "fiação" num arquivo. O resto do código só recebe.

### Precisa de framework?

Em JS/TS, quase nunca. Passar objeto pra função resolve.

Framework de DI (NestJS, tsyringe, Inversify) agrega quando o grafo de dependências fica grande, quando tem escopo por requisição, ou quando o time já usa esse estilo. Em projeto médio, o container manual é mais simples de ler e não tem mágica de decorator.

Em Python, `FastAPI` tem `Depends` embutido, e resolve bem escopo de requisição.

### Onde eu exagerei

Criar interface pra tudo. Se existe uma implementação só e não vai mudar, a abstração é peso morto — mais arquivo, mais indireção, e ninguém consegue seguir o código até o fim.

Também não vale injetar `path`, `crypto` ou lodash. Injeto o que **atravessa a fronteira**: banco, serviço externo, tempo, aleatoriedade, filesystem.

Esses três últimos merecem destaque, porque são o que torna teste imprevisível:

```javascript
function criarToken({ agora = () => Date.now(), aleatorio = crypto.randomUUID }) {
  return { id: aleatorio(), criadoEm: agora() };
}
```

Agora dá pra fixar tempo e id no teste sem fake timer nem mock de módulo.

Relacionado: [[Coesão e acoplamento]], [[8 - Camadas de uma API]].
