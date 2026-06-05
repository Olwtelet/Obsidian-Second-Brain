### Middleware

Um arquivo só, na raiz, que roda **antes** de qualquer rota casar:

```ts
// middleware.ts
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("sessao")?.value;

  if (!token && req.nextUrl.pathname.startsWith("/painel")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("de", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*", "/api/:path*"]
};
```

Roda no **edge**, antes do cache. Então:

- sem APIs do Node, sem driver de banco
- precisa ser rápido — atrasa **toda** requisição que casar no matcher
- o `matcher` importa: sem ele, roda até em arquivo estático

O que serve bem: redirect, reescrita, geolocalização/idioma, A/B testing, header de segurança, rate limit simples com Upstash.

**Cuidado com auth:** middleware é bom pra *redirecionar* quem não tem cookie, não pra *autorizar*. A verificação de verdade (validar assinatura, checar permissão no banco) tem que estar na rota ou na server action. Middleware é UX; se ele for a única barreira, basta uma rota fora do matcher pra furar. Isso ficou explícito depois do CVE de bypass de middleware no Next em 2025 — quem tinha a autorização só ali ficou exposto ([[6 - Autenticação x Autorização]]).

### Deploy na Vercel

`git push` e pronto — a Vercel detecta Next e configura sozinha. Cada branch vira um preview com URL própria, e o PR ganha o link. Isso muda o review: dá pra **abrir** a mudança em vez de imaginar ([[8 - CI-CD]]).

O que vale saber sobre como ele quebra o app em pedaços:

- página estática → CDN
- página dinâmica e route handler → função serverless
- middleware → edge function
- imagem → otimizada sob demanda e cacheada

Isso é por rota. Uma landing estática e um dashboard dinâmico convivem no mesmo projeto ([[9 - CSR, SSR e SSG]]).

### O que morde em serverless

**Cold start.** Função parada precisa subir. Com Mongoose isso significa conexão nova. Daí o padrão de cachear a conexão em variável de módulo, que sobrevive entre invocações do mesmo container ([[3 - Mongoose - schemas e models]]).

**Limite de conexões.** Cada instância abre um pool. Com escala, o cluster estoura. Saídas: pool pequeno (`maxPoolSize: 1`), pooler (PgBouncer, Prisma Accelerate) ou banco com driver HTTP.

**Sem estado entre requisições.** Cache em memória não é compartilhado; a próxima chamada pode cair em outra instância. Estado vai pra Redis ([[Redis - Intro]]).

**Sem filesystem persistente.** Só `/tmp`, efêmero. Upload vai direto pro S3/Blob.

**Timeout.** Alguns segundos no plano free. Processo longo (relatório, ingestão de embeddings) vai pra fila ou pra background job.

### Variáveis de ambiente

`NEXT_PUBLIC_*` é embutido no **build** e vai pro navegador. O resto fica no servidor.

Isso significa que mudar variável exige **redeploy**, não só restart. E que chave de API nunca leva o prefixo público ([[7 - Variáveis de ambiente]]).

### Não precisa ser Vercel

Next roda em qualquer lugar com Node:

```dockerfile
# next.config: output: "standalone"
FROM node:22-alpine
COPY .next/standalone ./
CMD ["node", "server.js"]
```

`output: "standalone"` gera uma pasta com só o necessário, imagem bem menor ([[2 - Dockerfile]]). Perde otimização de imagem e ISR distribuído por padrão, mas roda em Cloud Run, Fly, VPS.

Vale quando já tenho infra própria ou quando quero evitar dependência de plataforma.
