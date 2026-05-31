A mudança mental maior do App Router: **por padrão tudo é Server Component**. `"use client"` é opt-in.

### Server Component

Roda **só no servidor**. Nunca vai pro bundle do navegador.

```tsx
// sem "use client" -> server component
export default async function ListaPedidos() {
  const pedidos = await db.pedido.findMany();  // acesso direto ao banco
  return <ul>{pedidos.map(p => <li key={p.id}>{p.total}</li>)}</ul>;
}
```

Pode:
- ser `async` e dar `await` direto
- acessar banco, filesystem, variável de ambiente secreta
- importar lib pesada sem custo pro cliente

Não pode:
- `useState`, `useEffect`, nenhum hook de estado
- `onClick`, `onChange`
- `window`, `localStorage`

O ganho concreto: uma lib de markdown de 300KB usada num server component **não vai pro bundle**. Antes, formatar data com date-fns custava peso no cliente; agora custa zero.

### Client Component

```tsx
"use client";
import { useState } from "react";

export function Contador() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

`"use client"` marca a **fronteira**. Tudo que esse arquivo importar também vai pro cliente. Não é "esse arquivo é cliente", é "daqui pra baixo é cliente".

Por isso `"use client"` no layout raiz destrói a arquitetura inteira — o app volta a ser CSR.

### A regra prática

Empurrar o `"use client"` pra **baixo** na árvore, o mais perto possível de onde a interatividade realmente é.

```tsx
// ruim: a página inteira vira cliente por causa de um botão
"use client";
export default function Pagina() {
  const [aberto, setAberto] = useState(false);
  return (
    <div>
      <ConteudoGigante />
      <button onClick={() => setAberto(!aberto)}>abrir</button>
    </div>
  );
}
```

```tsx
// bom: só o botão é cliente
export default function Pagina() {
  return (
    <div>
      <ConteudoGigante />   {/* continua server */}
      <BotaoAbrir />        {/* "use client" mora aqui dentro */}
    </div>
  );
}
```

### Server dentro de client

Client component **não pode importar** server component. Mas pode **receber como children**:

```tsx
// server
<Provider>              {/* client */}
  <ListaPedidos />      {/* server, passado como children */}
</Provider>
```

Isso funciona porque o server component já foi renderizado antes de chegar no client — ele chega pronto, como prop. É o padrão pra usar Context sem perder o resto pro cliente.

### Props precisam ser serializáveis

Server → client passa pela rede, então:

```tsx
<Botao aoClicar={() => salvar()} />   // função não atravessa
<Botao data={new Date()} />           // Date, Map e Set: ok no formato do RSC
<Botao item={classeCustomizada} />    // instância de classe não
```

Exceção importante: **server action** pode ser passada como prop. É uma referência, não a função em si.

### Server Actions

```tsx
// actions.ts
"use server";

export async function criarPost(formData: FormData) {
  const titulo = formData.get("titulo") as string;
  await db.post.create({ data: { titulo } });
  revalidatePath("/blog");
}
```

```tsx
<form action={criarPost}>
  <input name="titulo" />
  <button>Salvar</button>
</form>
```

Sem `fetch`, sem rota de API, sem `useState` de loading. E funciona **sem JavaScript** — é um form HTML de verdade com progressive enhancement.

Por baixo, o Next cria um endpoint POST e o `action` vira a URL dele. Ou seja: **server action é uma rota pública**. Preciso validar entrada e checar permissão dentro dela exatamente como faria numa rota normal ([[6 - Autenticação x Autorização]]). O fato de eu só chamar de um formulário protegido não protege nada — dá pra chamar direto.

### O modelo mental

Antes: o servidor manda HTML + JSON, o cliente monta tudo.
Agora: o servidor manda uma **descrição da UI já renderizada** (RSC payload) e o cliente só hidrata os pedaços interativos.

O resultado é bundle menor e menos cascata de fetch. O custo é uma fronteira nova pra pensar o tempo todo — e erro de "estou tentando usar hook em server component" vira rotina no começo.
