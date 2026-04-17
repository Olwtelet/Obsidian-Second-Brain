Antes de usar Express, vale ver o que ele está escondendo. O módulo `http` já sobe um servidor sozinho.

```javascript
import http from "node:http";

const servidor = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
});

servidor.listen(3000, () => console.log("rodando na 3000"));
```

O callback é chamado **a cada requisição**. `req` e `res` são streams (ver [[6 - Streams]]) — `req` é readable, `res` é writable. Por isso o corpo não vem pronto.

### Ler o body na mão

```javascript
const servidor = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/usuarios") {
    let corpo = "";

    for await (const pedaco of req) {
      corpo += pedaco;
    }

    const dados = JSON.parse(corpo);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify(dados));
    return;
  }

  res.writeHead(404);
  res.end();
});
```

Aqui já dá pra ver os problemas:

- o body chega em pedaços, tenho que juntar
- `JSON.parse` pode explodir com body inválido
- nada limita o tamanho — alguém manda 2GB e derruba a memória
- rota é `if` em cima de `req.url`, sem parâmetro dinâmico (`/usuarios/:id` não existe)
- query string vem colada na URL, tenho que parsear
- se eu esquecer o `return`, ele tenta escrever duas vezes na resposta e dá `ERR_HTTP_HEADERS_SENT`

### O que o Express resolve

```javascript
import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/usuarios", (req, res) => {
  res.status(201).json(req.body);
});

app.listen(3000);
```

Basicamente três coisas:
1. **roteamento** — método + caminho com parâmetro (`req.params`, `req.query`)
2. **middleware** — a cadeia de funções antes do handler ([[5 - Middleware]])
3. **açúcar** — `res.json()`, `res.status()`, parse de body, arquivo estático

Nada disso é mágica. É tudo em cima do mesmo `req`/`res` do módulo `http`.

### Detalhe da resposta

O `res` só é enviado quando eu chamo `end()` (ou `json`/`send`, que chamam `end` por dentro). Se eu esquecer, a requisição fica pendurada até dar timeout no cliente. É o bug mais comum em handler assíncrono com `if` sem `else`.

### Sobre a porta

```javascript
servidor.listen(process.env.PORT || 3000);
```

Em plataforma gerenciada (Vercel, Render, Cloud Run) a porta vem da variável de ambiente e **não** posso fixar. Ver [[7 - Variáveis de ambiente]].
