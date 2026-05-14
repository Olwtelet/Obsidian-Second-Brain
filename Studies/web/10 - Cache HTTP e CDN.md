Cache é a otimização mais barata que existe: a requisição mais rápida é a que não acontece.

### Cache-Control

```
Cache-Control: public, max-age=31536000, immutable
```

As diretivas que importam:

- `max-age=N` — válido por N segundos
- `public` — pode ser guardado por cache compartilhado (CDN, proxy)
- `private` — só no navegador do usuário. **Resposta com dado pessoal tem que ser private**, senão a CDN entrega o perfil de um usuário pra outro
- `no-cache` — pode guardar, mas **revalida** antes de usar (nome péssimo)
- `no-store` — não guarda nada, nem em disco. É esse pra dado sensível
- `immutable` — nem revalida, o conteúdo nunca muda
- `s-maxage=N` — max-age só pro cache compartilhado, ignorado pelo navegador
- `stale-while-revalidate=N` — serve o velho e atualiza em background

### Validação: ETag e Last-Modified

Quando o `max-age` expira, em vez de baixar tudo de novo o navegador pergunta:

```
GET /api/produtos
If-None-Match: "a1b2c3"
```

Se nada mudou:

```
304 Not Modified
```

Sem body. Economiza banda, mas **não** economiza a ida e volta — ainda tem latência e o servidor ainda processou pra saber que não mudou.

### A estratégia que funciona

Dois grupos com tratamento oposto:

**Asset com hash no nome** (`app.a3f9b1.js`):

```
Cache-Control: public, max-age=31536000, immutable
```

Um ano, sem revalidar. Pode, porque se o conteúdo mudar o **nome** muda, e vira outra URL. Isso é cache busting e é o que todo bundler faz sozinho.

**HTML e API**:

```
Cache-Control: no-cache
```

Sempre revalida. O HTML é quem aponta pros assets novos; se ele ficar em cache, o usuário nunca vê o deploy.

Errar isso nos dois sentidos dá problema: HTML cacheado = usuário preso na versão antiga por dias, sem nada que ele possa fazer além de hard refresh. Asset sem cache = deploy rápido, site lento pra sempre.

### stale-while-revalidate

```
Cache-Control: public, max-age=60, stale-while-revalidate=3600
```

- 0–60s: serve do cache
- 60s–1h: serve do cache **e** atualiza em background
- depois de 1h: espera o servidor

Ninguém espera, e o dado nunca fica muito velho. É a mesma ideia do ISR ([[9 - CSR, SSR e SSG]]) e do SWR no front.

### CDN

Servidores espalhados geograficamente. O usuário em Recife pega de São Paulo em vez de Virgínia — 200ms viram 15ms, e isso é limite da física, não de otimização.

Além de latência:
- absorve pico e ataque volumétrico
- comprime (brotli/gzip) e converte imagem
- termina TLS perto do usuário, economizando o handshake longo ([[2 - Do domínio até o servidor]])

**Cache key** é o que a CDN usa pra decidir se duas requisições são "a mesma". Por padrão é a URL. Se a resposta varia por header (idioma, autenticação), preciso do `Vary`:

```
Vary: Accept-Language
```

Sem isso, alguém recebe a versão em inglês porque outra pessoa pediu primeiro.

Cuidado: `Vary: User-Agent` na prática mata o cache, porque existem milhares de user agents distintos.

**Invalidação** — quando o conteúdo muda antes do TTL, dá pra purgar (`revalidatePath` na Vercel, purge por tag no Cloudflare). Purga por tag é o que escala; por URL vira lista infinita.

### Outras camadas de cache

Cache HTTP é só uma delas:

- **navegador** — memória/disco
- **CDN** — borda
- **reverse proxy** — nginx, Varnish
- **aplicação** — Redis, memória do processo ([[Redis - Intro]])
- **banco** — query cache, buffer pool

Cada camada resolve um problema diferente. Redis não substitui cache HTTP: um evita **processamento**, o outro evita a **requisição inteira**.

### A parte difícil

> There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton

Não é piada gratuita. O bug de cache é o pior de debugar porque **só acontece pra algumas pessoas**: quem tem a versão velha guardada. Na minha máquina, com DevTools aberto e "disable cache" marcado, funciona perfeitamente.

Regra que eu adotei: se não tenho certeza de que pode ser cacheado, **não cacheia**. Ganho de performance com dado errado não é ganho.
