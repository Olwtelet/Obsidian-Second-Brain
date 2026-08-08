Anotação rápida, sempre esqueço a diferença.

```typescript
const cores = {
  primaria: "#0055ff",
  erro: "#ff0033"
} satisfies Record<string, string>;
```

- **`: Tipo`** (anotação) — checa **e alarga**. `cores.primaria` vira `string`.
- **`as Tipo`** (assertion) — não checa nada, só manda o TS calar a boca.
- **`satisfies Tipo`** — checa **e mantém** o tipo literal inferido. `cores.primaria` continua `"#0055ff"`.

Ou seja: valida sem perder informação. É isso que eu queria e não sabia pedir.

Onde mais uso:

```typescript
const rotas = {
  home: "/",
  perfil: "/perfil"
} satisfies Record<string, `/${string}`>;

type Rota = typeof rotas[keyof typeof rotas];  // "/" | "/perfil"
```

Com `: Record<string, string>` isso viraria só `string` e eu perderia a união literal.
