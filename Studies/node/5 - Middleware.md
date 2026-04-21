Middleware é uma função que fica **no meio** do caminho entre a requisição chegar e o handler responder. A assinatura é sempre a mesma:

```javascript
function meuMiddleware(req, res, next) {
  // faço algo
  next(); // passo pro próximo
}
```

Se eu não chamar `next()`, a cadeia para ali. Ou eu respondo, ou a requisição fica pendurada.

### É uma pipeline, a ordem importa

```javascript
app.use(express.json());        // 1. parseia o body
app.use(logger);                // 2. loga
app.use("/api", autenticar);    // 3. só nas rotas /api
app.get("/api/perfil", handler);// 4. o handler
app.use(tratarErro);            // 5. erro (4 argumentos)
```

Se eu colocasse `express.json()` **depois** da rota, `req.body` seria `undefined` lá dentro. Já perdi tempo com isso.

### Exemplos que eu escrevo sempre

Log com tempo de resposta:

```javascript
function logger(req, res, next) {
  const inicio = Date.now();

  res.on("finish", () => {
    const ms = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });

  next();
}
```

Reparar que eu não meço o tempo no próprio middleware — eu escuto o evento `finish` do `res`. O middleware roda em milissegundos e sai; a resposta só termina depois.

Autenticação:

```javascript
function autenticar(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "token ausente" });
  }

  try {
    req.usuario = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "token inválido" });
  }
}
```

O middleware **enriquece** o `req` (`req.usuario`) e o handler depois só usa. Esse é o padrão: middleware prepara contexto, handler faz o trabalho. Detalhe: 401 é "não sei quem você é", 403 é "sei quem você é e você não pode" — [[6 - Autenticação x Autorização]].

Middleware com parâmetro (na verdade é uma factory, ver [[factory]]):

```javascript
function exigirPapel(papel) {
  return (req, res, next) => {
    if (req.usuario?.papel !== papel) {
      return res.status(403).json({ erro: "sem permissão" });
    }
    next();
  };
}

app.delete("/api/usuarios/:id", autenticar, exigirPapel("admin"), handler);
```

### Middleware de erro

Tem **quatro** parâmetros. O Express identifica pela aridade da função, o que é meio esquisito mas é assim:

```javascript
function tratarErro(err, req, res, next) {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({ erro: err.publico ? err.message : "erro interno" });
}
```

Tem que ser o **último** `app.use`.

### A pegadinha do async

No Express 4, erro dentro de handler `async` **não** cai no middleware de erro sozinho:

```javascript
app.get("/x", async (req, res) => {
  throw new Error("boom"); // promise rejeitada, o Express não vê
});
```

A requisição fica pendurada. As saídas:

```javascript
// 1. try/catch com next
app.get("/x", async (req, res, next) => {
  try { /* ... */ } catch (e) { next(e); }
});

// 2. um wrapper
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get("/x", asyncHandler(async (req, res) => { /* ... */ }));
```

No Express 5 isso foi corrigido e o throw em async é capturado. Fastify também já trata.

### O conceito é maior que o Express

Middleware é basicamente o padrão **Chain of Responsibility**. A mesma ideia aparece em outros lugares:

- interceptor do Axios
- `middleware.ts` do Next.js ([[5 - Middleware e deploy]])
- pipeline do ASP.NET
- decorator em Python (Flask/FastAPI)

Uma vez entendido em um, os outros são só sintaxe diferente.
