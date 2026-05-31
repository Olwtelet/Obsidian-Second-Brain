No App Router a **estrutura de pastas é o roteamento**. Não existe arquivo de configuração de rotas.

```
app/
  layout.tsx          -> layout raiz (obrigatório)
  page.tsx            -> /
  loading.tsx         -> fallback de Suspense
  error.tsx           -> error boundary
  not-found.tsx       -> 404
  blog/
    page.tsx          -> /blog
    [slug]/
      page.tsx        -> /blog/meu-post
  (marketing)/        -> grupo, NÃO entra na URL
    sobre/page.tsx    -> /sobre
```

Só `page.tsx` e `route.ts` viram URL acessível. O resto da pasta pode ter componente, teste, helper — nada disso vira rota. Isso resolveu o incômodo do Pages Router, onde qualquer arquivo em `pages/` virava rota e eu tinha que jogar componente pra fora.

### Os arquivos especiais

- **layout** — envolve as páginas filhas e **não remonta** na navegação entre elas. É onde vai header, sidebar, providers. O estado dele sobrevive à troca de página
- **template** — igual ao layout mas **remonta** a cada navegação. Uso quando preciso de animação de entrada ou resetar estado
- **loading** — açúcar pra `<Suspense>` em volta da página
- **error** — error boundary; precisa ser client component e recebe `reset()`
- **not-found** — renderizado por `notFound()`

Layouts aninham: o layout de `/blog` fica dentro do layout raiz.

### Rotas dinâmicas

```
[slug]      -> /blog/meu-post          params.slug = "meu-post"
[...tudo]   -> /docs/a/b/c             params.tudo = ["a","b","c"]
[[...tudo]] -> /docs e /docs/a/b       catch-all opcional
```

```tsx
export default async function Page({ params, searchParams }) {
  const { slug } = await params;   // no Next 15 params é Promise
  // ...
}
```

Isso me pegou na migração: `params` e `searchParams` viraram assíncronos.

### Convenções de pasta

- `(grupo)` — organiza sem afetar a URL. Serve pra ter dois layouts raiz diferentes (site e app, por exemplo)
- `_pasta` — privada, o roteador ignora. Uso `_components` pra componente que só aquela rota usa
- `@slot` — parallel routes, renderiza várias páginas no mesmo layout (dashboard com painéis independentes)
- `(.)pasta` — intercepting routes; é o que faz o "abrir foto em modal sem sair da lista" e manter a URL compartilhável

Parallel e intercepting são poderosos e eu ainda acho difícil de ler — quem chega no projeto não adivinha o que `@modal/(.)foto/[id]` faz.

### Navegação

```tsx
import Link from "next/link";
<Link href="/blog" prefetch>Blog</Link>
```

`Link` faz prefetch do que está visível na tela, então a navegação parece instantânea. Usar `<a>` puro força reload completo e perde isso.

Programático:

```tsx
"use client";
import { useRouter } from "next/navigation";  // não é next/router

const router = useRouter();
router.push("/blog");
router.refresh();  // rebusca os server components sem perder estado do cliente
```

`router.refresh()` é o que uso depois de uma mutação: revalida os dados do servidor mantendo o estado dos client components.

### Metadata

```tsx
export const metadata = { title: "Blog", description: "..." };

// ou dinâmico
export async function generateMetadata({ params }) {
  const post = await buscarPost((await params).slug);
  return { title: post.titulo };
}
```

Substituiu o `next/head`. Como roda no servidor, o SEO funciona de verdade ([[9 - CSR, SSR e SSG]]).

### generateStaticParams

É o SSG do App Router:

```tsx
export async function generateStaticParams() {
  const posts = await listarPosts();
  return posts.map(p => ({ slug: p.slug }));
}
```

O Next gera um HTML por slug no build. Slug que não estiver na lista é renderizado sob demanda na primeira visita e cacheado (a menos que eu desligue com `dynamicParams = false`).
