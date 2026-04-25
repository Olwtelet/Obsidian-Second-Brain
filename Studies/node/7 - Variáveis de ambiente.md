A ideia é do 12-factor: **configuração não mora no código**. O mesmo build precisa rodar em dev, staging e produção mudando só o ambiente.

```javascript
process.env.DATABASE_URL
```

Tudo em `process.env` é **string**. `process.env.PORT` é `"3000"`, não `3000`. E `process.env.DEBUG === "false"` é uma string truthy — `if (process.env.DEBUG)` entra mesmo com `"false"`. Essa me pegou.

### .env

Arquivo local, nunca versionado:

```
DATABASE_URL=mongodb://localhost:27017/app
JWT_SECRET=segredo-de-dev
PORT=3000
```

`.gitignore` tem que ter `.env`, e o repositório tem que ter um `.env.example` com as chaves e valores falsos, senão quem clonar não sabe o que precisa configurar.

Desde o Node 20.6 dá pra carregar sem dependência:

```bash
node --env-file=.env src/index.js
```

Antes disso era `dotenv`.

### Validar no start

Isso mudou minha vida. Sem validação, uma variável faltando vira `undefined` que só explode três horas depois, numa rota específica, com mensagem sem sentido.

```javascript
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32)
});

export const env = EnvSchema.parse(process.env);
```

Agora a aplicação **não sobe** com config errada, e a mensagem diz exatamente qual chave falta. O `z.coerce.number()` ainda resolve o problema da string. Mais sobre isso em [[Tipando a borda da aplicação]].

Depois disso eu importo `env` no resto do código e nunca mais toco em `process.env` direto.

### Onde as variáveis realmente vêm de

Em produção não existe `.env`. Vem de:

- Vercel / Netlify → painel do projeto
- Docker → `-e`, `env_file` ou `environment` no compose ([[4 - Docker Compose]])
- Kubernetes → ConfigMap (não sensível) e Secret (sensível)
- Cloud Run / GCP → Secret Manager montado como env

### Segredo não é variável de ambiente comum

Variável de ambiente é *conveniente*, não *segura*:

- aparece em `docker inspect`
- vaza em log de crash que despeja o `process.env`
- fica no histórico do shell
- é herdada por processo filho

Pra segredo de verdade (chave de API, credencial de banco) o certo é um gerenciador (Secret Manager, Vault, Doppler) que entrega em runtime e permite rotação. Variável de ambiente serve pro resto.

### Frontend não tem segredo

No Next/Vite tudo que tem prefixo público (`NEXT_PUBLIC_`, `VITE_`) é **embutido no bundle** em tempo de build. Vai pro navegador. Qualquer pessoa lê no DevTools.

```javascript
NEXT_PUBLIC_API_URL=https://api.exemplo.com   // ok, é público mesmo
NEXT_PUBLIC_OPENAI_KEY=sk-...                  // chave vazada pro mundo inteiro
```

Chave de API de terceiro **sempre** fica no servidor, e o front chama uma rota minha que faz o proxy. Sem exceção.

### Preciso lembrar

- variável de build ≠ variável de runtime. No Docker, `ARG` é build e `ENV` é runtime; se eu injetar `NEXT_PUBLIC_*` só em runtime, o valor não entra no bundle
- mudar variável em plataforma gerenciada quase sempre exige **redeploy**, não só restart
