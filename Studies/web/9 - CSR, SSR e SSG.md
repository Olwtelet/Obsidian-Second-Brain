A pergunta é sempre a mesma: **onde e quando o HTML é gerado?**

### CSR — Client Side Rendering

O servidor manda um HTML praticamente vazio:

```html
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
```

O JS baixa, executa, busca dados e monta a tela.

- ✅ navegação interna instantânea, servidor barato (só arquivo estático)
- ❌ tela branca até o JS carregar, ruim pra SEO, sofre em celular fraco

Cascata típica: HTML → JS → render → fetch → render de novo. Quatro idas e voltas antes do conteúdo aparecer.

Serve bem pra dashboard atrás de login, onde SEO não importa e a sessão é longa.

### SSR — Server Side Rendering

O servidor monta o HTML **a cada requisição** e manda pronto.

- ✅ conteúdo já no primeiro byte, SEO ok, dado sempre atual
- ❌ servidor trabalha em toda requisição (TTFB maior, custo maior)

Serve pra página com dado personalizado ou que muda a todo momento — feed, carrinho, painel do usuário.

### SSG — Static Site Generation

O HTML é gerado **no build**. Cada rota vira um arquivo servido pela CDN.

- ✅ o mais rápido que existe, o mais barato, quase impossível de derrubar
- ❌ conteúdo só muda com novo build; build fica lento com muitas páginas

Serve pra blog, documentação, landing page. É o que o Astro faz por padrão.

### ISR — o meio termo

Estático, mas com prazo de validade. Serve do cache e regenera em background depois de N segundos.

```javascript
export const revalidate = 60;
```

Ou sob demanda, quando o conteúdo muda de verdade:

```javascript
revalidatePath("/blog/meu-post");
```

Velocidade de estático com dado razoavelmente fresco. É o padrão pra e-commerce e blog com CMS.

### Hidratação

Em SSR e SSG o HTML chega pronto, mas ainda é "morto" — nenhum `onClick` funciona. O JS precisa baixar e **hidratar**: reconstruir a árvore de componentes e grudar os eventos no HTML existente.

Entre o HTML aparecer e a hidratação terminar existe uma janela onde a página **parece** pronta e não responde. É frustrante pro usuário e é o que a métrica INP mede.

O erro de hydration mismatch (o servidor renderizou uma coisa, o cliente outra) quase sempre vem de:

```jsx
<span>{new Date().toLocaleString()}</span>   // hora do servidor ≠ hora do cliente
<span>{Math.random()}</span>
{typeof window !== "undefined" && <Algo />}  // condicional que só existe no cliente
```

### Streaming e RSC

Em vez de esperar a página inteira ficar pronta no servidor, manda em pedaços conforme resolvem:

```jsx
<Suspense fallback={<Skeleton />}>
  <ListaDePedidos />
</Suspense>
```

O usuário vê o layout na hora e o conteúdo lento chega depois — sem bloquear o resto.

E os React Server Components mudam a conta: componente que roda **só** no servidor não vai pro bundle, então não tem o que hidratar. Mais sobre isso em [[2 - Server Components x Client Components]].

### Como eu escolho

| Situação | Escolha |
|---|---|
| conteúdo igual pra todos, muda pouco | SSG |
| igual pra todos, muda às vezes | ISR |
| depende do usuário / precisa ser atual | SSR |
| atrás de login, sem SEO | CSR |

E não precisa ser uma escolha só pro app inteiro. Landing SSG, blog ISR, checkout SSR, dashboard CSR — no mesmo projeto. É isso que os frameworks modernos permitem e que antigamente exigia escolher um lado.
