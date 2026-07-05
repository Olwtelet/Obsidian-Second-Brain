Nota curta, mas é um assunto onde é fácil se enganar.

```bash
vitest run --coverage
```

```
File          | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|--------
pedido.js     |   92.3  |   78.5   |  100    |  91.8
```

### As métricas

- **Statements** — linhas executadas
- **Branch** — caminhos de `if`, `? :`, `&&`, `??`
- **Functions** — funções chamadas
- **Lines** — parecido com statements

**Branch é a que importa.** Statement coverage alto com branch baixo significa que o código roda mas os caminhos alternativos nunca foram exercitados — e é no caminho alternativo que mora o bug.

```javascript
function desconto(valor, cupom) {
  if (cupom?.ativo) return valor * (1 - cupom.taxa);
  return valor;
}

test("aplica desconto", () => {
  expect(desconto(100, { ativo: true, taxa: 0.1 })).toBe(90);
});
```

100% de linhas e funções. Mas `cupom` null e `cupom.ativo === false` nunca foram testados.

### Cobertura não mede qualidade

Isso é o principal:

```javascript
test("não quebra", () => {
  calcularFreteCompleto(pedido);   // sem nenhum expect
});
```

Cobre tudo e não verifica nada. Cobertura mede **execução**, não **verificação**.

O que ela é boa pra fazer é apontar o que **não** foi testado. Um arquivo com 20% de cobertura é um fato objetivo. Um arquivo com 95% não prova nada.

### A meta e o efeito colateral

Quando cobertura vira meta obrigatória, aparece o de sempre:

- teste de getter e de `console.log` pra subir o número
- `/* istanbul ignore next */` no que é difícil
- teste sem asserção

Lei de Goodhart: quando a medida vira meta, ela deixa de ser boa medida.

O que eu acho razoável:

- não fixar número mágico global
- exigir cobertura alta onde há **risco**: cálculo, regra de negócio, autenticação
- não perseguir cobertura em código de configuração, tipo e boilerplate
- usar cobertura de **diff** no PR: "o código novo está testado?" é uma pergunta muito melhor que "o projeto tem 80%?"

```javascript
coverage: {
  provider: "v8",
  exclude: ["**/*.config.*", "**/types/**", "**/*.d.ts"],
  thresholds: {
    "src/dominio/**": { branches: 90 }   // só onde importa
  }
}
```

### Mutation testing

A ferramenta que mede o que cobertura não mede. Ela **altera o código** de propósito (troca `>` por `>=`, `&&` por `||`, remove linha) e verifica se algum teste falha.

Se o teste continua verde com o código quebrado, o teste é inútil — mesmo com 100% de cobertura.

Em JS é o Stryker. É lento (roda a suíte inteira por mutação), então uso pontual: no módulo crítico, uma vez, pra descobrir onde a suíte está mentindo.

### O que eu levo

Cobertura é **um sinal**, não um objetivo. Serve pra achar buraco, não pra provar qualidade.

A pergunta que realmente vale: *se eu quebrar essa função de propósito, algum teste falha?* Se não, cobertura alta é só ilusão de segurança.
