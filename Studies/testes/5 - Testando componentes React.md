Com Testing Library a regra é: **teste como o usuário usa**. Nada de acessar state ou instância do componente.

```bash
npm i -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

```javascript
// vitest.config.ts -> environment: "jsdom"
```

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("incrementa ao clicar", async () => {
  const user = userEvent.setup();
  render(<Contador />);

  await user.click(screen.getByRole("button", { name: /incrementar/i }));

  expect(screen.getByText("1")).toBeInTheDocument();
});
```

### Prioridade das queries

Essa ordem é o coração da biblioteca:

1. `getByRole` — como leitor de tela enxerga. **Sempre a primeira opção**
2. `getByLabelText` — campo de formulário
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByTestId` — **último recurso**

O motivo é bom: se não consigo achar o botão por role e nome acessível, provavelmente ele também não é acessível pra quem usa leitor de tela. O teste vira uma checagem de acessibilidade de graça.

`getByTestId` funciona sempre e não prova nada sobre a experiência.

### get, query, find

- `getBy*` — acha ou **lança erro**. Pro que deve existir
- `queryBy*` — acha ou devolve `null`. Pro que **não** deve existir
- `findBy*` — devolve promise, espera aparecer. Pro assíncrono

```javascript
expect(screen.queryByText("Erro")).not.toBeInTheDocument();
expect(await screen.findByText("Salvo")).toBeInTheDocument();
```

Usar `getBy` pra checar ausência não funciona — ele lança antes da asserção.

### userEvent, não fireEvent

```javascript
fireEvent.change(input, { target: { value: "abc" } });  // dispara um evento só
await user.type(input, "abc");                          // focus, keydown, keyup, change...
```

`userEvent` simula a sequência real. Componente que reage a `keydown` ou a `focus` só é testado direito com ele.

E `userEvent` é assíncrono — sempre `await`.

### Assíncrono

```jsx
test("carrega e mostra usuários", async () => {
  render(<ListaUsuarios />);

  expect(screen.getByText("Carregando...")).toBeInTheDocument();

  expect(await screen.findByText("Alice")).toBeInTheDocument();
  expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
});
```

`findBy` já embute o `waitFor`. Evito `waitFor` com asserção manual quando `findBy` resolve.

E nada de `await new Promise(r => setTimeout(r, 1000))` — teste com sleep fixo é flaky garantido.

### Mockar a rede, não o fetch

Com MSW ([[3 - Test doubles]]) o componente faz o fetch de verdade contra um servidor interceptado. Assim eu testo também o tratamento de erro e de loading, que é onde os bugs moram:

```javascript
test("mostra mensagem quando a API falha", async () => {
  server.use(http.get("/api/usuarios", () => HttpResponse.error()));
  render(<ListaUsuarios />);
  expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument();
});
```

### Providers

Componente que depende de Context precisa do provider. Um helper evita repetição:

```jsx
function renderizar(ui, opcoes) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        <TemaProvider>{children}</TemaProvider>
      </QueryClientProvider>
    ),
    ...opcoes
  });
}
```

`new QueryClient()` a cada render pra não vazar cache entre testes.

### O que não testar

- se `useState` funciona
- classe de CSS (`expect(el).toHaveClass("bg-blue-500")`) — muda em qualquer ajuste visual e não prova nada
- estrutura de DOM interna
- Server Component. Ele roda no servidor e não tem interatividade — o que vale testar ali é a função de dados que ele chama, ou um e2e ([[2 - Server Components x Client Components]])

### O que testar

- o usuário vê o que deveria ver depois de cada ação
- estados de loading, erro e vazio
- o formulário valida e mostra a mensagem certa
- o callback é chamado com o valor certo

```jsx
test("chama onSubmit com os dados do formulário", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<FormLogin onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/e-mail/i), "a@b.com");
  await user.type(screen.getByLabelText(/senha/i), "senha123");
  await user.click(screen.getByRole("button", { name: /entrar/i }));

  expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.com", senha: "senha123" });
});
```

Esse teste sobrevive a trocar CSS, trocar de biblioteca de formulário e refatorar o componente inteiro. Só quebra se o **comportamento** mudar — que é exatamente o que eu quero.
