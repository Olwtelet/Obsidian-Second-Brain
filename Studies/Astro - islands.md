Nota curta. Astro parte de uma premissa oposta à do Next: **zero JavaScript por padrão**.

O componente roda no build (ou no servidor) e o que vai pro navegador é HTML e CSS. Nada de hidratação, porque não tem nada pra hidratar ([[9 - CSR, SSR e SSG]]).

```astro
---
// isso roda no servidor, nunca no cliente
const posts = await fetch("https://api.exemplo.com/posts").then(r => r.json());
---

<ul>
  {posts.map(p => <li>{p.titulo}</li>)}
</ul>
```

A sintaxe do frontmatter é `---`, e dentro dele é TypeScript com top-level await.

### Islands

Quando alguma parte precisa ser interativa, essa parte vira uma **ilha**:

```astro
<Cabecalho />                          <!-- HTML puro -->
<Carrossel client:visible />           <!-- JS só quando entra na tela -->
<Comentarios client:idle />            <!-- JS quando o browser está ocioso -->
<BuscaAoVivo client:load />            <!-- JS imediatamente -->
```

As diretivas:

- `client:load` — hidrata na hora
- `client:idle` — espera o navegador ficar ocioso
- `client:visible` — só quando entra na viewport. É a mais útil
- `client:media` — condicionado a media query (menu mobile, por exemplo)
- `client:only` — nem renderiza no servidor

Cada ilha carrega **só o próprio JS**. Uma página com três ilhas não sobe um framework inteiro pro cliente.

A diferença pro Next: em RSC o cliente ainda recebe o runtime do React ([[2 - Server Components x Client Components]]). Em Astro, página sem ilha manda **zero** bytes de JS.

### Agnóstico de framework

Dá pra misturar React, Vue e Svelte no mesmo projeto:

```astro
<ComponenteReact client:load />
<ComponenteVue client:visible />
```

Parece truque de marketing, mas tem uso real: aproveitar um design system que já existe em React sem adotar React no site inteiro.

Ilhas não compartilham estado entre si por padrão — cada uma é uma raiz separada. Pra estado global entre ilhas, precisa de um store externo (nanostores).

### Quando faz sentido

**Astro** — conteúdo em primeiro lugar: blog, documentação, landing, portfólio, e-commerce de catálogo. Onde a página é 95% leitura e 5% interação.

**Next** — aplicação: dashboard, painel, produto com fluxo interativo e sessão longa.

O critério: a página é um **documento** com um pouco de interação, ou uma **aplicação** que por acaso tem texto?

Sites que erram nisso são a maioria — blog em SPA que baixa 300KB de JS pra mostrar texto estático.

### Content collections

O que torna Astro bom pra conteúdo:

```typescript
// content.config.ts
const blog = defineCollection({
  schema: z.object({
    titulo: z.string(),
    publicadoEm: z.date(),
    tags: z.array(z.string())
  })
});
```

O frontmatter dos markdowns é **validado com zod** e tipado. Errar o nome de um campo quebra o build em vez de gerar página torta ([[Tipando a borda da aplicação]]).

Pra um vault de markdown como esse aqui, é exatamente o encaixe.

### O que ficou

A ideia que vale além do Astro: **JavaScript é o recurso caro**, e a pergunta certa é "essa parte precisa mesmo de JS?" — não "qual framework eu uso pra tudo".
