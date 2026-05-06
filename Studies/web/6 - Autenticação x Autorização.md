Duas coisas diferentes que o inglês abrevia igual (authn / authz) e que eu já misturei em código.

- **Autenticação** — *quem é você?* Prova de identidade.
- **Autorização** — *você pode fazer isso?* Decisão sobre permissão.

Autenticação vem primeiro, mas não implica autorização. Estar logado não é o mesmo que poder deletar.

No HTTP:
- **401 Unauthorized** — na verdade significa *unauthenticated*. Nome infeliz, está no padrão desde sempre.
- **403 Forbidden** — autenticado, mas sem permissão.

### Autenticação

Fatores:
1. **algo que você sabe** — senha
2. **algo que você tem** — celular, chave física, TOTP
3. **algo que você é** — biometria

MFA = combinar dois de categorias diferentes. Senha + pergunta secreta não é MFA, são dois "algo que você sabe".

Sobre senha, o mínimo:

```javascript
import bcrypt from "bcrypt";

const hash = await bcrypt.hash(senha, 12);      // no cadastro
const ok = await bcrypt.compare(senha, hash);   // no login
```

- **nunca** guardar senha em texto nem com SHA-256 puro. Hash de senha precisa ser **lento** de propósito (bcrypt, argon2, scrypt) pra inviabilizar força bruta. SHA é rápido, e rápido é ruim aqui
- o salt já vem embutido no hash do bcrypt, não preciso guardar separado
- resposta de login errado tem que ser genérica ("credenciais inválidas"). Dizer "esse e-mail não existe" entrega quem tem conta no sistema — isso é user enumeration
- rate limit no login, sempre

### Autorização

Modelos, do mais simples ao mais flexível:

**RBAC** (por papel) — usuário tem papel, papel tem permissões.

```javascript
const permissoes = {
  admin:  ["ler", "escrever", "deletar"],
  editor: ["ler", "escrever"],
  leitor: ["ler"]
};
```

Simples e resolve a maioria dos casos. Fica curto quando aparece "editor pode editar, **mas só o que ele criou**".

**ABAC** (por atributo) — a decisão olha atributos do usuário, do recurso e do contexto.

```javascript
function podeEditar(usuario, post) {
  if (usuario.papel === "admin") return true;
  if (post.autorId === usuario.id && post.status === "rascunho") return true;
  return false;
}
```

**ReBAC** (por relação) — "quem é membro do workspace que contém o documento". É o modelo do Google Docs e do Zanzibar.

### Onde a checagem tem que estar

**No servidor. Sempre.** Esconder o botão no front é UX, não segurança. A rota continua acessível via `curl`.

E a checagem tem que ser no **recurso**, não só na rota:

```javascript
// errado - qualquer usuário logado deleta o post de qualquer outro
app.delete("/posts/:id", autenticar, async (req, res) => {
  await postRepo.deletar(req.params.id);
});

// certo
app.delete("/posts/:id", autenticar, async (req, res) => {
  const post = await postRepo.porId(req.params.id);
  if (!post) return res.sendStatus(404);
  if (!podeEditar(req.usuario, post)) return res.sendStatus(403);
  await postRepo.deletar(post.id);
  res.sendStatus(204);
});
```

Essa falha tem nome: **IDOR** (Insecure Direct Object Reference) / broken object level authorization. É o item nº1 do OWASP API Top 10, e é sempre a mesma história: a rota checou login e esqueceu de checar dono.

Detalhe: devolver 404 em vez de 403 quando o usuário não pode nem saber que o recurso existe evita vazar informação por diferença de resposta.

### Negar por padrão

A checagem deveria ser opt-out, não opt-in. Se eu preciso lembrar de adicionar `autenticar` em cada rota nova, um dia eu esqueço.

```javascript
app.use("/api", autenticar);            // tudo protegido
app.use("/api/publico", pularAuth);     // exceção explícita
```

Rota pública vira exceção declarada, e esquecer passa a falhar pro lado seguro.

Relacionado: [[5 - JWT]], [[4 - Cookies e sessions]], [[7 - OAuth 2]].
