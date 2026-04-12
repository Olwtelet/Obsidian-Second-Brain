O Node nasceu com CommonJS (`require`) porque o JS não tinha sistema de módulos na época. Depois o ESM (`import`) virou padrão da linguagem. Hoje os dois convivem e é aí que dá confusão.

### CommonJS

```javascript
// utils.js
function formatar(x) { return String(x); }
module.exports = { formatar };

// app.js
const { formatar } = require("./utils");
```

Características:
- `require` é **síncrono** e roda em tempo de execução
- posso chamar dentro de um `if`, dentro de função, com caminho montado por variável
- `module.exports` é um objeto normal, dá pra reatribuir a qualquer momento
- tenho `__dirname` e `__filename` de graça

### ESM

```javascript
// utils.js
export function formatar(x) { return String(x); }

// app.js
import { formatar } from "./utils.js";
```

Características:
- estático, resolvido antes de executar (por isso permite tree-shaking — ver [[Módulos ES]])
- a **extensão é obrigatória** no import relativo. `"./utils"` não funciona, tem que ser `"./utils.js"`. Isso me pega toda vez vindo do CJS
- não tem `__dirname`; precisa reconstruir:

```javascript
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

- top-level `await` funciona (em CJS não)

### Como o Node decide qual é qual

- `.mjs` → sempre ESM
- `.cjs` → sempre CommonJS
- `.js` → depende do `"type"` no `package.json` mais próximo:
  - `"type": "module"` → ESM
  - ausente ou `"type": "commonjs"` → CommonJS

### Misturar

- ESM **pode** importar CommonJS: `import express from "express"` funciona. Mas só o default; named export de um CJS às vezes não é detectado e aí precisa de `const { algo } = pacote`.
- CommonJS **não pode** `require` um ESM. Porque `require` é síncrono e ESM pode ter top-level await. A saída é `await import("./modulo.mjs")`, que devolve promise.

Essa assimetria é a origem do erro `ERR_REQUIRE_ESM`, que aparece quando uma lib migra pra ESM puro (foi o caso do `chalk` e do `node-fetch`).

### O que eu faço hoje

Projeto novo: `"type": "module"` e ESM, porque é o padrão da linguagem e é o mesmo que uso no front. Consistência já vale.

Se for publicar uma lib, aí sim vale gerar os dois formatos com `exports` no package.json:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

Isso é o "dual package". Dá trabalho, e é por isso que ferramenta de build (tsup, unbuild) existe.

### Detalhe do cache

Nos dois sistemas o módulo é avaliado **uma vez** por processo e o resultado fica em cache. Se dois arquivos importam `db.js`, ambos recebem a mesma instância. É singleton de graça, ótimo pra pool de conexão — e uma pegadinha se o módulo guardar estado mutável, porque em teste esse estado vaza de um caso pro outro.
