Revisitando React depois de um tempo, e a coisa que eu realmente não sabia explicar era **quando** um componente re-renderiza.

### As três causas

1. o **state** dele mudou
2. o **context** que ele consome mudou
3. o **pai** re-renderizou

A terceira é a que surpreende: **props não têm nada a ver com isso**. Se o pai re-renderiza, o filho re-renderiza — mesmo com props idênticas, mesmo sem prop nenhuma.

```jsx
function Pai() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>{n}</button>
      <FilhoPesado />   {/* re-renderiza junto, mesmo sem receber nada */}
    </>
  );
}
```

### Render ≠ atualizar o DOM

Aqui estava minha confusão principal. "Render" é o React **executar a função** do componente e produzir a árvore nova. Depois ele compara com a anterior e só toca no DOM no que mudou.

Então re-render não é automaticamente caro. O caro é:
- executar a função do componente (cálculo pesado no corpo)
- reconciliar árvores grandes
- **efeito colateral** disparado à toa

Re-render de um componente simples é irrelevante. Otimizar isso é gastar tempo com o problema errado.

### Composição resolve mais que memo

Antes de `React.memo`, o que costuma resolver é mover o estado pra baixo ou passar como children:

```jsx
// o estado desce pro componente que realmente usa
function Pai() {
  return (
    <>
      <Contador />       {/* o state mora aqui */}
      <FilhoPesado />    {/* não re-renderiza mais */}
    </>
  );
}
```

Ou o padrão de children:

```jsx
function ComEstado({ children }) {
  const [n, setN] = useState(0);
  return <div onClick={() => setN(n + 1)}>{children}</div>;
}

<ComEstado>
  <FilhoPesado />   {/* criado no PAI, o elemento é o mesmo objeto -> não re-renderiza */}
</ComEstado>
```

Isso funciona porque `children` chega como prop já criada. Como a referência não muda, o React reusa.

### React.memo

Pula o re-render se as props forem **superficialmente** iguais.

```jsx
const FilhoPesado = React.memo(function FilhoPesado({ itens }) { /* ... */ });
```

O problema clássico: qualquer objeto, array ou função criada no corpo do pai é **nova a cada render**.

```jsx
<FilhoPesado
  config={{ tema: "dark" }}        // objeto novo toda vez
  onSalvar={() => salvar()}        // função nova toda vez
/>
```

O `memo` nunca acerta. Aí entram `useMemo` e `useCallback` — e é por isso que eles aparecem quase sempre em par com `memo`. Sozinhos, raramente adiantam.

### useMemo e useCallback

```jsx
const filtrados = useMemo(
  () => itens.filter(i => i.ativo),
  [itens]
);

const aoSalvar = useCallback(
  (dados) => salvar(id, dados),
  [id]
);
```

`useCallback(fn, deps)` é literalmente `useMemo(() => fn, deps)`.

Quando vale:
1. cálculo realmente caro (ordenar/filtrar milhares de itens)
2. a referência é dependência de `useEffect` — sem estabilizar, o efeito roda em loop
3. a prop vai pra um componente memoizado

Quando **não** vale: em tudo, por precaução. Memoizar tem custo (guardar o valor, comparar deps a cada render) e polui o código. Memoizar `a + b` é mais caro que recalcular.

E o custo de errar a lista de deps é bug — valor velho preso no closure ([[closures]]).

### O compilador muda a conta

O React Compiler memoiza automaticamente, e a recomendação passa a ser **não** escrever `useMemo`/`useCallback` na mão. Vale saber como funciona (pra debugar), mas escrever menos.

### Chave de lista

Coisa que quebra na prática:

```jsx
{itens.map((item, i) => <Item key={i} />)}    // índice: errado se a lista reordena
{itens.map(item => <Item key={item.id} />)}   // certo
```

Com `key` de índice, remover o primeiro item faz o React achar que **todos** mudaram de conteúdo em vez de um ter sumido. Estado interno (input digitado, checkbox) fica no componente errado. Bug difícil de rastrear e óbvio depois que se sabe.

### Medir antes

`<Profiler>` ou a aba Profiler do React DevTools, com "highlight updates" ligado. Mostra o que re-renderiza e quanto custa.

Otimizar sem medir é otimizar o que não era problema — e cada memoização é código a mais pra manter.

Relacionado: [[Context - React]], [[3.4 - Hooks]].
