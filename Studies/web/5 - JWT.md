JWT é um token que **carrega os dados dentro dele**, assinado pra provar que não foi adulterado.

Três partes separadas por ponto:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsImV4cCI6MTcxOTh9.4Xk2p...
    header                payload                    assinatura
```

### Header e payload são só base64

Isso é o ponto que mais gera erro de entendimento: **base64 não é criptografia**. Qualquer um cola o token no jwt.io e lê o conteúdo.

```javascript
JSON.parse(atob(token.split(".")[1])); // { sub: "42", exp: 1719800000 }
```

Ou seja: **JWT não esconde nada**. Nunca colocar senha, CPF, dado sensível.

O que a assinatura garante é **integridade**: se alguém mudar `"papel":"user"` pra `"admin"`, a assinatura deixa de bater e o servidor rejeita. Adulterar sem a chave é inviável.

### Claims padrão

```json
{
  "sub": "42",              // subject, quem é
  "iat": 1719800000,        // issued at
  "exp": 1719803600,        // expiration
  "iss": "api.exemplo.com", // issuer
  "aud": "app-web"          // audience
}
```

`exp` é obrigatório na prática. Token sem expiração é credencial eterna.

### HS256 x RS256

- **HS256** — simétrico, uma chave só. Quem valida também consegue **emitir**. Serve quando emissor e validador são o mesmo sistema.
- **RS256** — par de chaves. O emissor assina com a privada, qualquer serviço valida com a pública. É o que faz sentido em microsserviços e é o que Auth0/Cognito/Google usam.

### O ataque do alg: none

O bug histórico: a lib lia o `alg` **do header do próprio token** e, se fosse `"none"`, aceitava sem assinatura. Atacante montava o payload que quisesse.

Por isso a validação tem que fixar o algoritmo:

```javascript
jwt.verify(token, chave, {
  algorithms: ["HS256"],   // nunca deixar o token escolher
  issuer: "api.exemplo.com",
  audience: "app-web"
});
```

Libs modernas já protegem, mas continuo passando explícito.

### O problema real: revogação

Como o servidor não guarda nada, ele não tem como "cancelar" um token. Se demitirem alguém, o token continua válido até `exp`.

As saídas, todas com custo:

1. **expiração curta** (5–15 min) + refresh token. Reduz a janela, não elimina.
2. **denylist** de tokens revogados. Funciona, mas volta a precisar de estado — que era o motivo de usar JWT.
3. **versão do token** no usuário: guardo `tokenVersion` no banco, coloco no payload, e comparo na validação. Incrementar desloga em todos os dispositivos de uma vez. Consulta o banco, mas é uma leitura barata e resolve o caso que mais importa.

### Access token e refresh token

O padrão que uso:

- **access token** — JWT curto (15 min), vai no header `Authorization: Bearer`
- **refresh token** — string opaca longa (7–30 dias), **guardada no banco**, entregue em cookie `HttpOnly`

Quando o access expira, o front chama `/refresh`, que valida o refresh no banco e emite um access novo. Aí a revogação existe de verdade: apaga o refresh do banco.

Rotação: cada uso do refresh emite um refresh novo e invalida o anterior. Se um refresh já usado aparecer de novo, é sinal de roubo — aí invalido a família inteira e forço login.

### Onde guardar no cliente

- `localStorage` — **não**. Qualquer XSS lê ([[11 - Segurança básica]])
- cookie `HttpOnly; Secure; SameSite=Lax` — JS não acessa, mas atenção a CSRF ([[4 - Cookies e sessions]])
- memória (variável JS) pro access + cookie `HttpOnly` pro refresh — mais chato, mais seguro. Perde o access ao dar F5 e pega outro no refresh

### Quando JWT não vale a pena

Aplicação web monolítica com um servidor e um banco: sessão é mais simples e revoga na hora. JWT nesse caso é complexidade sem ganho.

JWT brilha quando **vários serviços** precisam validar de forma independente, ou o cliente não é navegador.

---

Voltando aqui depois de mexer em refresh de verdade. Duas coisas que só aparecem na prática:

**Race no refresh.** Se três requisições expiram ao mesmo tempo, as três chamam `/refresh` juntas. Com rotação, a primeira invalida o token e as outras duas falham — e o usuário é deslogado sem motivo aparente. A correção é guardar a promise em andamento e fazer todas esperarem a mesma:

```javascript
let refreshEmAndamento = null;

function renovar() {
  refreshEmAndamento ??= fetch("/refresh", { credentials: "include" })
    .finally(() => { refreshEmAndamento = null; });
  return refreshEmAndamento;
}
```

É o mesmo padrão de deduplicação de [[promises.js]] — uma promise compartilhada em vez de N chamadas.

**Clock skew.** Servidor com relógio alguns segundos adiantado rejeita token recém-emitido por causa do `iat`/`nbf`. As libs aceitam tolerância (`clockTolerance: 5`).
