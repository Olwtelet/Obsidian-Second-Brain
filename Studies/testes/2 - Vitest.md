Vitest é o runner que eu uso. API compatível com Jest, mas roda em cima do Vite — usa a mesma config, o mesmo transform e o mesmo resolver do projeto. Na prática: TypeScript, ESM e alias funcionam sem configurar nada.

```bash
npm i -D vitest
```

```json
{ "scripts": { "test": "vitest", "test:run": "vitest run" } }
```

`vitest` fica em watch (padrão em dev). `vitest run` roda uma vez e sai — é o que vai no CI ([[8 - CI-CD]]).

### O básico

```javascript
import { describe, test, expect, beforeEach, vi } from "vitest";

describe("calcularFrete", () => {
  test("cobra frete grátis acima de 200", () => {
    expect(calcularFrete(250, "SP")).toBe(0);
  });

  test("cobra 20 para o sudeste", () => {
    expect(calcularFrete(100, "SP")).toBe(20);
  });

  test("lança erro para UF inválida", () => {
    expect(() => calcularFrete(100, "XX")).toThrow("UF inválida");
  });
});
```

Com função assíncrona a asserção precisa de `rejects`:

```javascript
await expect(buscarUsuario("inexistente")).rejects.toThrow("não encontrado");
```

Esquecer o `await` aqui faz o teste passar mesmo quando deveria falhar. É o erro mais silencioso de todos.

### Matchers que uso

```javascript
expect(x).toBe(1);                    // Object.is - primitivo
expect(obj).toEqual({ a: 1 });        // estrutura profunda
expect(obj).toStrictEqual({ a: 1 });  // igual, mas checa undefined e classe
expect(lista).toHaveLength(3);
expect(lista).toContain("js");
expect(obj).toHaveProperty("user.nome");
expect(fn).toHaveBeenCalledWith(1, "a");
expect(x).toBeCloseTo(0.3);           // float: 0.1 + 0.2 !== 0.3
```

`toBe` com objeto compara **referência** e quase sempre é o que eu não quero. Pra objeto é `toEqual`.

### Isolamento

```javascript
beforeEach(() => {
  repositorio = new RepositorioEmMemoria();
});
```

Cada teste com estado limpo. Teste que depende de outro ter rodado antes é bug esperando — e o Vitest roda arquivos em paralelo, então ordem não é garantida.

Módulo com estado no topo é a fonte clássica disso, porque o cache de módulo é compartilhado ([[2 - Módulos - CommonJS x ESM]]). `vi.resetModules()` resolve quando precisa.

### Tempo

```javascript
vi.useFakeTimers();
vi.setSystemTime(new Date("2026-01-15"));

expect(estaExpirado(token)).toBe(false);
vi.advanceTimersByTime(3600_000);
expect(estaExpirado(token)).toBe(true);

vi.useRealTimers();
```

Sem isso, testar expiração significa `setTimeout` de verdade. E teste que depende de `Date.now()` real quebra sozinho no dia seguinte.

### Concorrência e watch

```javascript
test.concurrent("roda junto com os outros", async () => {});
test.skip("desligado temporariamente", () => {});
test.only("só esse", () => {});
test.each([
  [100, "SP", 20],
  [250, "SP", 0]
])("frete de %i para %s = %i", (valor, uf, esperado) => {
  expect(calcularFrete(valor, uf)).toBe(esperado);
});
```

`test.each` evita copiar o mesmo teste cinco vezes mudando um número.

Cuidado com `.only` esquecido — o CI passa com um teste só e ninguém percebe. Vale uma regra de lint (`no-only-tests`).

### Config

```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,              // describe/test sem import
    environment: "node",        // ou "jsdom" pra componente
    setupFiles: ["./test/setup.ts"],
    coverage: { provider: "v8" }
  }
});
```

`environment: "jsdom"` simula DOM, necessário pra testar componente ([[5 - Testando componentes React]]).

Dá pra separar por projeto: `node` pro backend, `jsdom` pro front, no mesmo repositório.

### Node tem runner nativo

```javascript
import { test } from "node:test";
import assert from "node:assert";

test("soma", () => assert.strictEqual(1 + 1, 2));
```

Sem dependência nenhuma. Serve bem pra lib pequena. Pra aplicação, Vitest ganha em watch, UI, coverage e mocking.
