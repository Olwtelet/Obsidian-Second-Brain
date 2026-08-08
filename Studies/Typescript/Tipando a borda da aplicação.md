Uma coisa que demorei pra entender: **TypeScript só existe em tempo de compilação**. Depois do build não sobra nada. Então tipo não valida dado que vem de fora — ele só descreve o que eu *acredito* que vai vir.

```typescript
const res = await fetch("/api/usuarios");
const usuarios: Usuario[] = await res.json();
```

Isso compila lindamente e não garante absolutamente nada. `res.json()` devolve `any`. Eu só escrevi uma mentira que o compilador aceitou.

### Onde ficam as bordas

Todo lugar onde dado entra no sistema sem passar pelo compilador:

- resposta de API externa
- body de requisição
- `process.env`
- `localStorage`
- query params da URL
- retorno do banco
- arquivo JSON lido do disco

Dentro do sistema eu confio nos tipos. Na borda eu tenho que **validar em runtime**.

### O jeito manual

Type predicate resolve pra caso simples (anotei em [[narrowing.ts]]):

```typescript
function ehUsuario(v: unknown): v is Usuario {
  return typeof v === "object" && v !== null && "id" in v && "nome" in v;
}
```

O problema é que isso não escala. Com 10 campos, campos aninhados e array, vira um monte de código chato e fácil de errar. E se eu errar, o TS não avisa — ele confia no predicate.

### O jeito com schema

Com zod eu escrevo o schema uma vez e **tiro o tipo dele**, em vez do contrário:

```typescript
import { z } from "zod";

const UsuarioSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1),
  email: z.string().email(),
  criadoEm: z.coerce.date()
});

type Usuario = z.infer<typeof UsuarioSchema>;
```

Aí na borda:

```typescript
const res = await fetch("/api/usuarios");
const json = await res.json();

const resultado = z.array(UsuarioSchema).safeParse(json);

if (!resultado.success) {
  console.error(resultado.error.issues);
  throw new Error("resposta da API fora do formato esperado");
}

const usuarios = resultado.data; // aqui sim é Usuario[] de verdade
```

`safeParse` devolve `{ success, data }` ou `{ success, error }` — que é exatamente uma discriminated union, então o narrowing funciona sozinho.

### O ponto que ficou claro

Uma definição só serve pras duas coisas: valida em runtime **e** gera o tipo. Se eu escrevesse o `type` na mão *e* o schema separado, eles iam divergir com o tempo.

O `env` é o caso onde isso mais salva:

```typescript
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"])
});

export const env = EnvSchema.parse(process.env);
```

Se faltar variável, a aplicação morre **no start** com mensagem clara, e não três horas depois numa rota qualquer com `undefined` no meio da connection string. Isso conecta com [[7 - Variáveis de ambiente]].

### Preciso lembrar

- tipo = promessa; validação = prova
- `any` desliga o compilador, `unknown` obriga a provar antes de usar — na borda o certo é `unknown`
- `as Usuario` é eu mandando o TS calar a boca. Às vezes precisa, mas não é validação

[[Typescript4]]
