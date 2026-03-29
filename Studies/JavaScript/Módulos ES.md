Antes de módulo, tudo em JS no navegador era global. Dois arquivos declarando `usuario` brigavam entre si. Módulo resolve isso: **cada arquivo é um escopo próprio** e só sai de lá o que eu exportar.

### Named export x default

```javascript
// utils.js
export function formatarData(data) { /* ... */ }
export const MOEDA = "BRL";

export default function calcularTotal(itens) { /* ... */ }
```

```javascript
// app.js
import calcularTotal, { formatarData, MOEDA } from "./utils.js";
import { formatarData as formatar } from "./utils.js";
import * as utils from "./utils.js";
```

Named export obriga a usar o nome certo (o editor autocompleta e o rename funciona). Default deixa quem importa escolher qualquer nome, o que é bom pra componente e ruim pra função utilitária — dois arquivos podem acabar chamando a mesma coisa de nomes diferentes.

Na prática eu uso default só quando o arquivo tem **um** assunto principal (um componente React, uma página) e named pro resto.

### Import é estático

Isso é o que diferencia ESM de CommonJS de verdade:

```javascript
if (precisa) {
  import { algo } from "./x.js"; // erro de sintaxe
}
```

Os imports são resolvidos **antes** do código rodar. É por isso que dá pra fazer tree-shaking: o bundler consegue olhar o arquivo sem executar nada e provar que `MOEDA` nunca foi usada, então corta.

Pra carregar condicional existe o `import()` dinâmico, que devolve promise:

```javascript
const { default: Grafico } = await import("./Grafico.js");
```

É isso que está por trás de code splitting e lazy loading.

### Hoisting dos imports

Import sobe pro topo, independente de onde eu escrevi:

```javascript
console.log("primeiro?"); // não, isso roda DEPOIS
import "./setup.js";      // esse módulo executa antes
```

### Live binding

Detalhe que me surpreendeu: o import não é uma cópia do valor, é uma **referência viva**.

```javascript
// contador.js
export let total = 0;
export function incrementar() { total++; }
```

```javascript
// app.js
import { total, incrementar } from "./contador.js";
console.log(total); // 0
incrementar();
console.log(total); // 1  -> mudou sozinho
```

Mas eu não posso reatribuir `total` do lado de fora — import é read-only.

### Módulo executa uma vez só

Se cinco arquivos importarem `db.js`, ele roda **uma** vez e todos recebem a mesma instância. É basicamente um singleton de graça. Bom pra conexão de banco, perigoso pra estado mutável compartilhado.

A diferença pra CommonJS (`require`) está anotada em [[2 - Módulos - CommonJS x ESM]].
