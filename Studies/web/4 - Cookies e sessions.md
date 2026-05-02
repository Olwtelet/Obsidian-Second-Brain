Como HTTP é stateless ([[1 - Anatomia de uma requisição HTTP]]), o servidor precisa de alguma forma de reconhecer que duas requisições vieram da mesma pessoa. Cookie é a resposta mais antiga pra isso.

### Cookie

O servidor manda:

```
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

E o navegador passa a enviar **automaticamente** em toda requisição pro mesmo domínio:

```
Cookie: sessionId=abc123
```

"Automaticamente" é a palavra importante — é o que torna cookie conveniente e é a raiz do CSRF ([[11 - Segurança básica]]).

### Os atributos

- **HttpOnly** — JavaScript não consegue ler (`document.cookie` não vê). Protege contra roubo por XSS. Cookie de sessão **sempre** com isso.
- **Secure** — só viaja em HTTPS.
- **SameSite** — controla envio em requisição vinda de outro site:
  - `Strict` — nunca em navegação externa. Quebra "clicar no link do e-mail e já estar logado".
  - `Lax` — envia em navegação top-level GET, não em POST nem em requisição de sub-recurso. É o padrão hoje e o que uso.
  - `None` — envia sempre; **exige** `Secure`. Necessário em cenário cross-site de verdade.
- **Path** e **Domain** — escopo. `Domain=.exemplo.com` compartilha com subdomínio.
- **Max-Age** / **Expires** — sem isso vira cookie de sessão e morre ao fechar o navegador.

Limite: ~4KB por cookie. E como vai em **toda** requisição, cookie grande é peso em cada chamada.

### Session no servidor

O cookie carrega só um **identificador opaco**. O dado real fica no servidor:

```
cookie: sessionId=abc123
        ↓
servidor: sessions["abc123"] = { usuarioId: 42, papel: "admin", criadaEm: ... }
```

Vantagens:
- **revogação imediata** — apagou do store, o usuário está deslogado agora
- dado sensível nunca sai do servidor
- dá pra mudar permissão e ter efeito na hora

Desvantagem: precisa de estado compartilhado. Com várias instâncias atrás de load balancer, memória local não serve — sessão criada na instância A não existe na B. Aí vai pra Redis ([[Redis - Intro]]) ou banco.

Sticky session (o LB sempre manda o mesmo usuário pra mesma instância) "resolve" e cria outro problema: a instância cair derruba as sessões dela.

### Session x JWT

| | Session | JWT ([[5 - JWT]]) |
|---|---|---|
| onde fica o estado | servidor | no próprio token |
| revogar | imediato | difícil |
| escalar | precisa de store | não precisa |
| tamanho | ~30 bytes | 300B–1KB |
| validar | consulta o store | só verifica assinatura |

A escolha padrão pra aplicação web monolítica é **session**. Revogação imediata vale mais do que economizar uma consulta em Redis, que leva menos de 1ms.

JWT compensa quando tem vários serviços que precisam validar sem consultar um store central, ou quando é API pura pra cliente que não é navegador.

### O que eu evito

- guardar token em `localStorage`: qualquer XSS lê tudo. Cookie `HttpOnly` não é lido por JS
- colocar dado de negócio no cookie (carrinho, preferência complexa) — 4KB em cada requisição
- confiar em cookie sem `SameSite` — o padrão do navegador varia e mudou com o tempo

### Alternativas pra guardar coisa no cliente

- `localStorage` — persiste, síncrono, **não** vai pro servidor, acessível por JS
- `sessionStorage` — igual, morre ao fechar a aba
- `IndexedDB` — assíncrono, aguenta muito dado, bom pra offline

Nenhum dos três é lugar pra credencial.
