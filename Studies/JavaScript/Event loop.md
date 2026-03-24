JavaScript tem **uma thread só**. Mesmo assim consegue lidar com requisição, timer e clique ao mesmo tempo sem travar. A resposta pra isso é o event loop.

### As peças

- **Call stack** — a pilha de funções que estão executando agora. Uma por vez.
- **Web APIs / libuv** — quem realmente faz o trabalho demorado (timer, rede, filesystem). Isso não é o JS, é o ambiente (navegador ou Node).
- **Task queue (macrotask)** — fila de callbacks prontos: `setTimeout`, eventos de DOM, I/O.
- **Microtask queue** — fila de prioridade: `.then` de promise, `queueMicrotask`, `await`.
- **Event loop** — o loop que fica olhando: "a stack está vazia? então puxa o próximo da fila".

### A ordem que importa

O event loop **esvazia toda a microtask queue** antes de pegar uma única macrotask. Isso explica o exemplo clássico:

```javascript
console.log("1");

setTimeout(() => console.log("2"), 0);

Promise.resolve().then(() => console.log("3"));

console.log("4");
```

Saída: `1, 4, 3, 2`.

O `setTimeout` com 0ms não roda "imediatamente" — ele vai pro fim da fila de macrotask. O `.then` entra na microtask, que tem prioridade. E o código síncrono (`1` e `4`) roda inteiro antes de qualquer fila.

### Por que isso trava a página

Se eu botar um loop pesado, a stack nunca esvazia, o event loop nunca roda, e nada é processado — nem clique, nem render.

```javascript
while (true) {} // a aba morre
```

O mesmo vale no Node: um `for` de 10 milhões de iterações no meio de um handler bloqueia **todas** as outras requisições, porque é a mesma thread.

### Microtask que não deixa a macrotask rodar

Detalhe cruel: se uma microtask agenda outra microtask infinitamente, o loop também trava.

```javascript
function loop() {
  Promise.resolve().then(loop);
}
loop(); // trava igual ao while(true)
```

Porque a regra é *esvaziar a fila de microtask*, e ela nunca esvazia.

### Preciso lembrar

- `setTimeout(fn, 0)` não é "agora", é "assim que der, depois de tudo que já está na frente"
- `await` é açúcar de `.then`, então cai na microtask
- o event loop não deixa o JS ser paralelo, ele deixa o JS ser **não-bloqueante**
- paralelismo de verdade exige outra thread: Web Worker no browser, `worker_threads` ou cluster no Node

Isso conecta direto com [[promises]] e com o motivo do Node ser bom pra I/O e ruim pra CPU ([[1 - O runtime do Node]]).
