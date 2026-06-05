Buscar dado em server component é só `await`:

```tsx
export default async function Pagina() {
  const posts = await fetch("https://api.exemplo.com/posts").then(r => r.json());
  return <Lista posts={posts} />;
}
```

Sem `useEffect`, sem estado de loading, sem `isLoading`. Isso sozinho já apaga metade do código que eu escrevia antes.

### As camadas de cache

Aqui é onde eu me perdia. São **quatro** coisas diferentes:

1. **Request memoization** — o mesmo `fetch` chamado em vários componentes na mesma renderização vira uma requisição só. Escopo: uma render. Isso é o que permite cada componente buscar o que precisa sem precisar de prop drilling ou de um fetch único no topo.
2. **Data Cache** — persiste entre requisições e deploys. É controlado pelas opções do `fetch`.
3. **Full Route Cache** — o HTML/RSC da rota inteira, gerado no build.
4. **Router Cache** — cache no cliente durante a navegação.

Quando algo "não atualiza", é uma dessas quatro. Descobrir qual é metade do trabalho.

### Controlar o Data Cache

```tsx
fetch(url)                                    // padrão: não cacheia (Next 15)
fetch(url, { cache: "force-cache" })          // cacheia indefinidamente
fetch(url, { next: { revalidate: 60 } })      // ISR: revalida a cada 60s
fetch(url, { next: { tags: ["posts"] } })     // marca pra invalidar por tag
```

No Next 14 o padrão era `force-cache`, o que causava aquele bug clássico de "meus dados nunca atualizam em produção mas em dev sim". No 15 inverteram pro padrão sem cache, que é menos surpreendente.

Na rota inteira:

```tsx
export const revalidate = 3600;
export const dynamic = "force-dynamic";  // desliga cache de tudo na rota
```

### Invalidar sob demanda

```tsx
"use server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function publicarPost(dados) {
  await db.post.create({ data: dados });
  revalidateTag("posts");       // tudo marcado com "posts"
  revalidatePath("/blog");      // aquela rota
}
```

Tag é melhor que path: um post novo pode afetar `/blog`, `/`, `/autor/[id]` e o feed. Uma tag pega todos.

### unstable_cache pra não-fetch

`fetch` tem cache embutido. Query direta no banco não:

```tsx
import { unstable_cache } from "next/cache";

const listarPosts = unstable_cache(
  async () => db.post.findMany(),
  ["posts-lista"],
  { revalidate: 60, tags: ["posts"] }
);
```

### Paralelo x cascata

O erro mais fácil de cometer:

```tsx
const usuario = await buscarUsuario(id);      // 200ms
const pedidos = await buscarPedidos(id);      // + 200ms = 400ms
```

Se um não depende do outro:

```tsx
const [usuario, pedidos] = await Promise.all([
  buscarUsuario(id),
  buscarPedidos(id)
]);  // 200ms
```

Mesma ideia de [[promises]]. Em server component isso é ainda mais importante porque o usuário está esperando o HTML.

E existe a cascata **entre componentes**: componente pai que faz await e só então renderiza o filho, que faz outro await. A saída é `Suspense`.

### Streaming com Suspense

```tsx
export default function Pagina() {
  return (
    <>
      <Cabecalho />                        {/* aparece na hora */}
      <Suspense fallback={<Skeleton />}>
        <PedidosLentos />                  {/* chega depois */}
      </Suspense>
    </>
  );
}
```

O usuário vê o layout imediatamente e o pedaço lento chega quando resolve. Não bloqueia o resto da página.

O `loading.tsx` é exatamente isso aplicado na página toda ([[1 - App Router]]).

### O que quebra o cache sem eu perceber

Usar `cookies()`, `headers()` ou `searchParams` torna a rota **dinâmica**. Faz sentido — não dá pra cachear algo que depende do usuário — mas é fácil um componente lá no fundo chamar `cookies()` e a página inteira deixar de ser estática sem nenhum aviso.

`next build` mostra o símbolo de cada rota (○ estático, ƒ dinâmico). Vale conferir depois de mexer em qualquer coisa.

### Debugar

```js
// next.config.js
module.exports = { logging: { fetches: { fullUrl: true } } };
```

Mostra no terminal cada fetch e se veio do cache. Foi assim que eu entendi de verdade o que estava acontecendo — antes eu só chutava.
