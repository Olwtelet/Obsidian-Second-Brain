```
        /\
       /e2e\        poucos, lentos, caros, alta confiança
      /------\
     /integr. \     alguns
    /----------\
   /   unit     \   muitos, rápidos, baratos
  /--------------\
```

A ideia: quanto mais alto, mais realista e mais caro. Então a base tem que ser larga.

### Unit

Testa uma unidade isolada. Milissegundos.

```javascript
test("calcula o total com desconto", () => {
  expect(calcularTotal([{ preco: 100, qtd: 2 }], 0.1)).toBe(180);
});
```

Rápido de escrever e de rodar, e aponta exatamente onde quebrou. Mas passa mesmo quando as peças não se encaixam.

### Integração

Duas ou mais partes juntas, normalmente com banco de verdade.

```javascript
test("cria pedido e debita o saldo", async () => {
  const usuario = await criarUsuarioTeste({ saldo: 500 });
  await pedidoService.criar({ usuarioId: usuario.id, itens: [...] });
  const atualizado = await usuarioRepo.porId(usuario.id);
  expect(atualizado.saldo).toBe(250);
});
```

É onde eu acho que está o melhor custo-benefício. Pega erro de query, de constraint, de transação — coisa que mock nunca pega ([[4 - Testando uma API]]).

Com Docker Compose ou Testcontainers, banco real em teste ficou barato ([[4 - Docker Compose]]).

### E2E

O sistema inteiro pelo navegador (Playwright, Cypress).

```javascript
test("usuário faz login e vê o painel", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", "teste@exemplo.com");
  await page.fill("[name=senha]", "senha123");
  await page.click("text=Entrar");
  await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
});
```

É o único que prova que **funciona de verdade**. Também é o mais lento e o mais frágil.

Uso pros fluxos críticos: login, checkout, cadastro. Uns 5–10 no projeto inteiro, não 200.

### O que testar

Não é sobre cobertura ([[6 - Coverage]]). É sobre **risco**:

- lógica de negócio (cálculo, regra, validação)
- caminho de erro (o que acontece quando falha)
- bug já corrigido — teste de regressão pra não voltar
- borda: lista vazia, null, zero, valor negativo, string gigante

O que **não** testar:
- getter/setter trivial
- código de framework (o React funciona, não preciso provar)
- detalhe de implementação. Se renomear um método privado quebra 15 testes, esses testes estão testando a coisa errada

### Detalhe x comportamento

O erro que mais atrapalha:

```javascript
// testa implementação - quebra em qualquer refatoração
expect(componente.state.contador).toBe(1);
expect(servico._cacheInterno.size).toBe(3);

// testa comportamento - sobrevive
expect(screen.getByText("1 item")).toBeVisible();
```

Teste que testa comportamento permite refatorar com segurança — que é o objetivo. Teste que testa implementação vira **peso**: cada mudança interna exige reescrever o teste, e aí o time começa a odiar a suíte.

Sinal claro: refatorei sem mudar comportamento e vários testes quebraram → os testes estão errados, não o código.

### AAA

```javascript
test("descreve o comportamento esperado", () => {
  const carrinho = novoCarrinho();          // Arrange
  carrinho.adicionar({ preco: 100 });       // Act
  expect(carrinho.total).toBe(100);         // Assert
});
```

O nome descreve **comportamento**, não método. `"devolve 403 quando o usuário não é dono do post"` diz o que quebrou só de ler a saída do CI. `"testa deletePost"` não diz nada.

### Outros tipos

- **snapshot** — congela a saída. Bom pra detectar mudança não intencional; ruim porque é fácil dar `-u` sem olhar
- **contract** — garante que provider e consumer concordam no formato
- **property-based** — gera centenas de entradas aleatórias e verifica invariantes (fast-check). Acha borda que eu não pensaria

### Por que escrever teste

O motivo que me convenceu não foi "achar bug". Foi **poder mexer no código sem medo**.

Sem teste, refatorar é apostar. Com teste, é uma operação verificável. Isso vale mais que a detecção de bug em si — e é o que torna dívida técnica pagável ([[Dívida técnica]]).
