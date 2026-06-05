Route handler é a API dentro do Next. Substituiu o `pages/api`.

```ts
// app/api/usuarios/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pagina = Number(searchParams.get("pagina") ?? 1);

  const usuarios = await listarUsuarios(pagina);
  return NextResponse.json({ dados: usuarios });
}

export async function POST(req: Request) {
  const body = await req.json();
  const resultado = UsuarioSchema.safeParse(body);

  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues }, { status: 400 });
  }

  const usuario = await criarUsuario(resultado.data);
  return NextResponse.json(usuario, { status: 201 });
}
```

Uma função exportada por método HTTP. Sem `if (req.method === ...)` como era no `pages/api`.

O `Request` e o `Response` aqui são os padrões da **Web API**, os mesmos do navegador e do Cloudflare Workers — não é o `req`/`res` do Node. Então `req.body` não existe, é `await req.json()`. E `res.status(200).json()` vira `NextResponse.json(x, { status: 200 })`.

No começo é estranho, depois fica bom: o mesmo conhecimento vale em qualquer runtime moderno.

### Rota dinâmica

```ts
// app/api/usuarios/[id]/route.ts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await buscarUsuario(id);
  if (!usuario) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  return NextResponse.json(usuario);
}
```

### Quando usar route handler e quando usar server action

Foi a dúvida que mais me travou:

**Server action** ([[2 - Server Components x Client Components]]) — mutação vinda da minha própria UI. Formulário, botão de deletar, toggle. Menos código, tipagem de ponta a ponta.

**Route handler** — quando preciso de uma **URL de verdade**:
- webhook de terceiro (Stripe, GitHub)
- app mobile ou outro cliente consumindo
- upload/download com streaming
- endpoint público documentado
- `/api/health` pra monitoramento
- OG image, sitemap, RSS

Resumo: action pro meu front, handler pro mundo externo.

### Webhook

O caso onde route handler é obrigatório, e tem um detalhe importante:

```ts
export async function POST(req: Request) {
  const assinatura = req.headers.get("stripe-signature")!;
  const corpo = await req.text();   // TEXT, não json

  let evento;
  try {
    evento = stripe.webhooks.constructEvent(corpo, assinatura, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("assinatura inválida", { status: 400 });
  }

  // processa
  return new Response(null, { status: 200 });
}
```

Tem que ser `req.text()` porque a assinatura é calculada em cima do **corpo cru**. Se eu fizer `json()` e depois `JSON.stringify()`, a formatação muda e a assinatura nunca bate. Isso é uma armadilha clássica.

Verificar a assinatura não é opcional: sem isso a rota é pública e qualquer um pode postar "pagamento confirmado".

### Cache

Por padrão, `GET` em route handler **não** é cacheado no Next 15 (mudou em relação ao 14, onde era estático por padrão e gerava confusão). Pra cachear:

```ts
export const revalidate = 60;
```

Rota que usa `cookies()`, `headers()` ou lê `searchParams` é dinâmica de qualquer forma.

### Runtime

```ts
export const runtime = "edge";   // ou "nodejs" (padrão)
```

Edge roda perto do usuário e sobe rápido, mas não tem APIs do Node — sem `fs`, sem driver TCP de banco, sem lib nativa. Então Mongoose e `pg` não funcionam; precisa de HTTP driver (Neon, Upstash, Turso).

Uso edge pra coisa leve: redirect, geolocalização, A/B, proxy simples.

### Streaming de LLM

Um caso onde route handler é a escolha natural:

```ts
export async function POST(req: Request) {
  const { mensagens } = await req.json();
  const stream = await modelo.stream(mensagens);
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

Como o retorno é um `Response` padrão, dá pra devolver um `ReadableStream` direto e o texto aparece token a token ([[6 - Streams]], [[1 - Tokens e context window]]).
