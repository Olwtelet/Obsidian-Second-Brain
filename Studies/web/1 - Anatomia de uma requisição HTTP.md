HTTP é texto. Isso é o que eu não tinha internalizado — a requisição literalmente é uma string com um formato combinado.

```
POST /api/usuarios HTTP/1.1
Host: api.exemplo.com
Content-Type: application/json
Authorization: Bearer eyJhbGc...
Content-Length: 45

{"nome":"Alice","email":"alice@exemplo.com"}
```

Três partes: **linha inicial**, **headers**, linha em branco, **body**.

A resposta tem a mesma cara:

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/usuarios/42

{"id":42,"nome":"Alice"}
```

### Métodos

| Método | Pra quê | Seguro | Idempotente |
|---|---|---|---|
| GET | ler | sim | sim |
| POST | criar / ação | não | não |
| PUT | substituir inteiro | não | sim |
| PATCH | alterar parcial | não | não |
| DELETE | remover | não | sim |

**Seguro** = não muda estado. **Idempotente** = repetir dá o mesmo resultado final.

Isso não é filosofia, tem consequência prática: navegador, proxy e CDN podem repetir ou cachear GET livremente. Se eu fizer um `GET /usuarios/1/deletar`, um prefetch do navegador ou um crawler podem apagar dado sozinhos. Já aconteceu com gente de verdade.

DELETE é idempotente mesmo devolvendo 404 na segunda vez — o que importa é o estado final do servidor, não o código de resposta.

### Status codes

- **2xx** deu certo — 200 ok, 201 criado, 204 sem conteúdo
- **3xx** redireciona — 301 permanente, 302 temporário, 304 não modificado (cache, ver [[10 - Cache HTTP e CDN]])
- **4xx** erro do **cliente** — 400 body inválido, 401 não autenticado, 403 sem permissão, 404 não existe, 409 conflito, 422 semanticamente inválido, 429 rate limit
- **5xx** erro do **servidor** — 500 genérico, 502 gateway ruim, 503 indisponível, 504 timeout

A confusão eterna é 401 x 403: 401 é "não sei quem você é", 403 é "sei e você não pode" ([[6 - Autenticação x Autorização]]).

E o pecado capital: devolver 200 com `{ "erro": "não encontrado" }` no body. Aí monitoramento, retry automático e cache passam a mentir, porque todos eles olham o status.

### Headers que uso sempre

Requisição:
- `Content-Type` — o formato do que **estou mandando**
- `Accept` — o formato que **quero receber**
- `Authorization` — credencial
- `Cookie` — enviado automaticamente pelo navegador

Resposta:
- `Content-Type` — formato do que estou devolvendo
- `Set-Cookie` — [[4 - Cookies e sessions]]
- `Cache-Control`, `ETag` — cache
- `Location` — pra onde ir depois do 201 ou do 302
- `Access-Control-Allow-Origin` — [[8 - CORS]]

### Stateless

HTTP não lembra de nada entre requisições. Cada uma chega "do zero".

Isso é o que força a existência de cookie, sessão e token — o estado precisa viajar de alguma forma em **toda** requisição, ou ser reconstruído do lado do servidor a partir de um identificador.

É também o que faz HTTP escalar: qualquer servidor atrás do load balancer pode responder qualquer requisição, porque nenhum deles guarda contexto.

### HTTP/1.1, 2 e 3

- **1.1** — uma requisição por conexão de cada vez; navegador abre ~6 conexões por domínio pra compensar. É a origem daquele conselho antigo de "junta tudo num arquivo só"
- **2** — multiplexação: várias requisições na mesma conexão, header comprimido, binário. Bundle gigante deixou de ser vantagem
- **3** — troca TCP por QUIC (em cima de UDP), acaba o head-of-line blocking do TCP e a conexão sobrevive a troca de rede (wi-fi → 4G)

Semanticamente é tudo igual: mesmos métodos, mesmos status. Muda só o transporte.
