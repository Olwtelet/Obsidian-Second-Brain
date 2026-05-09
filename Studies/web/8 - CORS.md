CORS é a coisa que mais me fez perder tempo sem entender o motivo. A confusão vem de pensar que é o servidor bloqueando. **Não é** — é o **navegador**.

### Same-origin policy

Origem = **protocolo + domínio + porta**. Diferente em qualquer um dos três = origem diferente.

```
https://app.com        vs  http://app.com         (protocolo)
https://app.com        vs  https://api.app.com    (subdomínio conta)
https://app.com        vs  https://app.com:8080   (porta)
```

Por padrão, JS de uma origem não pode **ler** a resposta de outra. Isso existe porque cookie vai automático ([[4 - Cookies e sessions]]): sem a regra, `site-malicioso.com` faria `fetch("https://meubanco.com/saldo")` no seu navegador, com seus cookies, e leria o resultado.

CORS é o mecanismo pro servidor dizer "pode, esses aqui eu autorizo".

### O que realmente acontece

A requisição **sai** e o servidor **processa**. O navegador só esconde a resposta do JS se faltar o header.

Isso tem consequência: um `POST` cross-origin sem CORS **cria o registro** no banco e ainda assim dá erro no console. Já vi gente achar que não tinha salvado.

E é por isso que `curl` e Postman nunca dão erro de CORS — não são navegadores, não aplicam a política.

### Simple request

Não dispara preflight se:
- método for `GET`, `HEAD` ou `POST`
- `Content-Type` for `text/plain`, `multipart/form-data` ou `application/x-www-form-urlencoded`
- não tiver header customizado

Resposta precisa de:

```
Access-Control-Allow-Origin: https://app.com
```

### Preflight

Qualquer coisa fora disso — `PUT`, `DELETE`, `Content-Type: application/json`, header `Authorization` — dispara um `OPTIONS` antes:

```
OPTIONS /api/usuarios
Origin: https://app.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type, authorization
```

Resposta:

```
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

Ou seja: **quase toda API JSON dispara preflight**, porque `Content-Type: application/json` já basta.

`Max-Age` faz o navegador cachear a permissão. Sem isso, é um OPTIONS a mais em cada requisição — latência dobrada à toa.

### Credenciais

Pra cookie viajar cross-origin:

```javascript
fetch(url, { credentials: "include" })
```

E o servidor precisa de:

```
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Credentials: true
```

**Com credenciais, `*` não é aceito.** Tem que ser a origem exata. Faz sentido: `*` + cookie seria voltar ao problema que a same-origin policy resolve.

### Configuração

```javascript
import cors from "cors";

app.use(cors({
  origin: ["https://app.com", "https://admin.app.com"],
  credentials: true,
  maxAge: 86400
}));
```

Em dev eu uso `origin: true`, que reflete a origem que chegou. Em produção, **lista fixa**.

O antipadrão perigoso:

```javascript
res.setHeader("Access-Control-Allow-Origin", req.headers.origin); // reflete qualquer coisa
res.setHeader("Access-Control-Allow-Credentials", "true");
```

Isso é `*` com credenciais disfarçado — qualquer site passa a poder ler respostas autenticadas.

### O que CORS não é

- **não protege a API.** Só protege o *usuário* de um site malicioso usar o navegador dele. Quem quiser bater direto na API usa curl
- **não substitui autenticação**
- **não tem nada a ver com CSRF** — CSRF explora a requisição *sair* (o que CORS permite); CORS impede é a resposta ser *lida* ([[11 - Segurança básica]])

### O jeito de não ter CORS

Servir front e API na mesma origem. Um proxy reverso mandando `/api/*` pro backend e o resto pro front elimina o problema — e é o que Next.js com route handlers faz naturalmente ([[3 - Route handlers]]).

Em dev, o `proxy` do Vite faz o mesmo.
