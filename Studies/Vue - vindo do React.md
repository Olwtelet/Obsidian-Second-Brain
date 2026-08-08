Primeiras anotações de Vue 3 com Composition API, olhando pelo que já sei de React. Não é um guia — é o mapa mental da tradução.

### A diferença de fundo

**React** — re-executa a função do componente inteira quando algo muda, e reconcilia ([[Re-render - React]]).

**Vue** — rastreia **qual** dado cada parte do template usou, e atualiza só aquilo. Reatividade fina, via proxy.

Consequência: em Vue não existe o problema de "o pai re-renderizou então o filho re-renderiza". Não precisa de `memo`, `useMemo` nem `useCallback`. O sistema sabe exatamente o que depende de quê.

O preço é mágica: o dado é um `Proxy`, e às vezes a reatividade se perde de formas que não são óbvias.

### Estado

```javascript
import { ref, reactive, computed, watch } from "vue";

const contador = ref(0);              // primitivo
contador.value++;                     // precisa do .value no script

const usuario = reactive({ nome: "Alice" });
usuario.nome = "Sofia";               // sem .value, é proxy direto

const dobro = computed(() => contador.value * 2);
```

No template o `.value` é desembrulhado sozinho — `{{ contador }}`. No script é obrigatório. Esquecer isso é o erro nº1 de quem começa.

Comparando:

| React | Vue |
|---|---|
| `useState` | `ref` / `reactive` |
| `useMemo` | `computed` |
| `useEffect` | `watch` / `watchEffect` |
| `useContext` | `provide` / `inject` |
| `useRef` (DOM) | `ref` em template |
| hook customizado | composable |

`computed` é cacheado e só recalcula quando a dependência muda — o `useMemo` que sempre funciona, sem lista de deps escrita à mão.

E as dependências de `watchEffect` são **detectadas automaticamente**. Nada de array de deps, e nada de bug por dependência esquecida.

### SFC

```vue
<script setup>
import { ref } from "vue";
const nome = ref("");
</script>

<template>
  <input v-model="nome" />
  <p v-if="nome">Olá, {{ nome }}</p>
  <ul>
    <li v-for="item in itens" :key="item.id">{{ item.nome }}</li>
  </ul>
</template>

<style scoped>
p { color: teal; }
</style>
```

Três coisas que me chamaram atenção:

**`v-model`** — two-way binding pronto. Em React eu escrevo `value` + `onChange` toda vez. Aqui é uma diretiva.

**`<style scoped>`** — CSS isolado por componente, nativo, sem CSS-in-JS nem convenção de nome.

**Template em vez de JSX** — o template é mais restrito, e é justamente isso que permite ao compilador otimizar (ele sabe estaticamente o que é dinâmico). Em contrapartida, lógica de renderização complexa fica mais desconfortável que em JSX.

### O que eu gostei

- `computed` e `watchEffect` sem array de dependências
- reatividade fina resolve performance por padrão, sem eu pensar nisso
- `scoped` CSS
- a separação `<script>`/`<template>`/`<style>` é agradável de ler
- a documentação oficial é excelente

### O que me incomodou

- `.value` sim no script, não no template
- `ref` x `reactive` — duas formas pra mesma coisa, com regras diferentes
- perder reatividade ao desestruturar um `reactive` (precisa de `toRefs`)
- é magia demais quando quebra. Em React, se algo não atualiza, eu sigo o fluxo de dados; em Vue tenho que entender por que o proxy não disparou

### O que ficou claro

Os conceitos são os mesmos: estado, derivado, efeito, composição, props pra baixo, evento pra cima. Muda a **sintaxe** e o **mecanismo** de detectar mudança.

O que eu aprendi de arquitetura de componente ([[Coesão e acoplamento]], lifting state, composição) vale igual nos dois. Isso vale mais que a API específica.
