"Test double" é o termo guarda-chuva pra qualquer coisa que substitui uma dependência real no teste. A classificação é do Gerard Meszaros e todo mundo chama tudo de "mock", inclusive eu.

### Os cinco

**Dummy** — só preenche um parâmetro, nunca é usado.

```javascript
criarUsuario(dados, null);
```

**Stub** — devolve resposta pronta. Não verifico nada nele.

```javascript
const repoStub = {
  porId: async () => ({ id: "1", nome: "Alice", saldo: 500 })
};
```

**Spy** — o real, mas registra as chamadas.

```javascript
const spy = vi.spyOn(console, "warn");
processar();
expect(spy).toHaveBeenCalledWith("valor fora do esperado");
```

**Mock** — programado com **expectativa**. O teste falha se não for chamado como esperado.

```javascript
const notificador = { enviar: vi.fn() };
await service.criar(pedido);
expect(notificador.enviar).toHaveBeenCalledWith("alice@ex.com", "Pedido criado");
```

**Fake** — implementação de verdade, simplificada.

```javascript
class RepositorioEmMemoria {
  #itens = new Map();
  async inserir(x) { this.#itens.set(x.id, x); return x; }
  async porId(id) { return this.#itens.get(id) ?? null; }
}
```

### A diferença que importa

**Stub** responde ao *state* — verifico o **resultado**.
**Mock** verifica *interação* — verifico a **chamada**.

Prefiro stub. Verificar interação amarra o teste na implementação: mudei a ordem das chamadas ou o nome do método interno e o teste quebra sem o comportamento ter mudado ([[1 - Pirâmide de testes]]).

Mock faz sentido quando a chamada **é** o comportamento: "ao criar pedido, notifica o usuário". Aí não tem estado pra verificar — o efeito é a chamada em si.

### Fake é subestimado

Fake é o que eu mais gosto e o que menos vejo usarem. Um repositório em memória:

- não tem `vi.fn()` espalhado por 30 testes
- comporta-se como o real (respeita chave duplicada, devolve null quando não acha)
- é reutilizável em toda a suíte
- quando a interface muda, quebra **um** arquivo

Isso só é possível porque o service recebe as dependências em vez de importar — [[Injeção de dependência]].

### vi.fn e vi.mock

```javascript
const fn = vi.fn();
fn.mockReturnValue(42);
fn.mockResolvedValue({ ok: true });
fn.mockRejectedValueOnce(new Error("falhou"));    // só na primeira chamada
fn.mockImplementation(x => x * 2);

expect(fn).toHaveBeenCalledTimes(2);
expect(fn.mock.calls[0]).toEqual([1, "a"]);
```

Mock de módulo inteiro:

```javascript
vi.mock("./emailClient", () => ({
  enviarEmail: vi.fn().mockResolvedValue(true)
}));
```

`vi.mock` é hoisted pro topo do arquivo, antes dos imports. Por isso não dá pra usar variável declarada fora dentro da factory — o erro é confuso quando acontece.

Uso `vi.mock` só quando não consigo injetar. Se estou mockando módulo em todo teste, o design está acoplado demais.

### O que não mockar

**Não mocke o que você não controla.** Mockar o SDK do Stripe testa a minha suposição sobre o Stripe, não o Stripe. Se ele mudar, o teste continua verde e a produção quebra.

O certo é embrulhar numa interface minha e mockar a **minha** interface. Aí um teste de integração de verdade valida a suposição.

**Não mocke o banco.** Mock de banco não sabe de constraint, transação, tipo, índice único. Prefiro banco real em container ([[4 - Testando uma API]]).

### HTTP: MSW

Pra chamada externa, interceptar na camada de rede é melhor que mockar `fetch`:

```javascript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("https://api.externa.com/cotacao", () =>
    HttpResponse.json({ valor: 5.42 })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

O código sob teste faz `fetch` normal e não sabe que está em teste. Funciona igual em backend e front, e não amarra em qual client HTTP eu uso.

### Sinal de alerta

Se pra testar uma função eu preciso de 6 mocks, o problema não é o teste — é a função. Ela depende de coisa demais.

Teste difícil de escrever costuma ser feedback de design ruim, não de ferramenta ruim.
