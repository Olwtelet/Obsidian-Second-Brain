OAuth 2 é sobre **delegar acesso** sem entregar senha. É o que acontece no "Entrar com o Google".

A pergunta que ele responde: como o app X consegue acessar meus dados no serviço Y sem que eu dê minha senha do Y pro X?

### Os papéis

- **Resource Owner** — eu, o usuário
- **Client** — o app que quer acesso (meu app)
- **Authorization Server** — quem autentica e emite token (Google)
- **Resource Server** — quem guarda os dados (API do Google)

### Authorization Code + PKCE

É o fluxo que se usa hoje pra praticamente tudo — web, SPA e mobile.

1. Meu app redireciona o usuário pro Google:

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=123
  &redirect_uri=https://meuapp.com/callback
  &response_type=code
  &scope=openid email profile
  &state=xyz789
  &code_challenge=BASE64URL(SHA256(verifier))
  &code_challenge_method=S256
```

2. O usuário se autentica **no Google** (minha aplicação nunca vê a senha) e aprova os escopos.
3. O Google redireciona de volta com um `code` de uso único e curto.
4. Meu **backend** troca o code por token:

```
POST https://oauth2.googleapis.com/token
  code=...
  client_id=...
  client_secret=...
  code_verifier=...
```

5. Recebo `access_token`, `refresh_token` e (com OIDC) `id_token`.

### Por que dois passos

O `code` viaja pela URL do navegador — fica no histórico, no log do servidor, no header `Referer`. Se o token viesse direto ali, estaria exposto.

O code sozinho não serve: pra trocar é preciso o `client_secret` (que só o backend tem) ou o `code_verifier` do PKCE. E ele expira em segundos e só pode ser usado uma vez.

### PKCE

Criado pra app que **não consegue guardar segredo** — SPA e mobile, onde qualquer "segredo" está no bundle e é público.

1. O client sorteia um `code_verifier` aleatório e guarda localmente
2. Manda o `code_challenge` = SHA256 do verifier na primeira etapa
3. Ao trocar o code, manda o `code_verifier` original
4. O servidor confere se o hash bate

Assim, quem interceptar o code não consegue trocá-lo — falta o verifier, que nunca trafegou.

Hoje a recomendação é PKCE **sempre**, inclusive com backend.

### state

Valor aleatório que eu mando e confiro na volta. Protege contra CSRF no login: sem ele, um atacante pode forçar o navegador da vítima a completar um fluxo e ligar a conta dela à conta dele.

### Fluxos que morreram

- **Implicit** (`response_type=token`) — token vinha direto na URL. Era a gambiarra pra SPA antes do PKCE. **Não usar mais**.
- **Password grant** — o app pedia a senha do usuário e trocava por token. Anula o propósito inteiro do OAuth. Depreciado.

### OAuth ≠ autenticação

Esse é o ponto que mais me confundia. OAuth 2 é **autorização**: ele diz "esse app pode acessar tais recursos". Ele não diz *quem* é o usuário de forma padronizada.

**OpenID Connect** é a camada em cima do OAuth que adiciona isso: o `id_token`, um JWT ([[5 - JWT]]) com `sub`, `email`, `name` e afins.

Então:
- "acessar o Google Drive do usuário" → OAuth 2
- "entrar com o Google" → OIDC (que usa OAuth por baixo)

Usar `access_token` como prova de identidade é um erro clássico — ele é opaco pro client, pode ser de outro app, e não tem `audience` amarrada a mim. O `id_token` tem.

### Escopos

`scope=openid email profile` é o princípio do menor privilégio: peço só o que preciso. Pedir escopo demais assusta o usuário na tela de consentimento e aumenta o estrago se meu token vazar.

### Na prática

Implementar OAuth do zero raramente vale. Uso NextAuth/Auth.js, Clerk ou o SDK do provedor. Mas entender o fluxo importa pra debugar — `redirect_uri` que não bate exatamente com o cadastrado é o erro nº1, e a mensagem do provedor costuma ser inútil.
