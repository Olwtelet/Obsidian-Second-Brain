Node não é uma linguagem nem um framework. É um **runtime**: pega o V8 (a engine de JS do Chrome) e coloca em volta dele tudo que o navegador não dá — acesso a arquivo, rede, processo, sistema operacional.

### O que compõe

- **V8** — compila e executa o JavaScript
- **libuv** — biblioteca em C que cuida de I/O assíncrono, thread pool e o event loop propriamente dito
- **APIs do Node** — `fs`, `http`, `path`, `os`, `crypto`, `process`, etc

O JS que roda ali é o mesmo. O que muda é o que está disponível em volta. No navegador tem `window`, `document`, `localStorage`. No Node tem `process`, `Buffer`, `__dirname`, `require`.

### Single thread, mas nem tanto

O **meu** código roda em uma thread só, com o mesmo event loop de [[Event loop]]. Mas o libuv mantém uma thread pool (4 por padrão) pra coisas que não têm versão assíncrona no sistema operacional:

- filesystem (`fs`)
- `crypto.pbkdf2`, `bcrypt`
- compressão (`zlib`)
- DNS lookup

Já operação de rede (socket TCP, HTTP) não usa a pool — o sistema operacional já oferece isso de forma assíncrona nativamente (epoll no Linux, kqueue no Mac).

Ou seja: quando eu leio um arquivo com `fs.readFile`, uma thread da pool faz a leitura e devolve o resultado via callback pro event loop. Meu código nunca sai da thread principal.

### Onde o Node é bom e onde é ruim

Bom em I/O: milhares de conexões esperando banco, API externa ou disco custam quase nada, porque esperar não ocupa CPU.

Ruim em CPU: um cálculo pesado bloqueia **tudo**.

```javascript
app.get("/relatorio", (req, res) => {
  let total = 0;
  for (let i = 0; i < 1e10; i++) total += i; // trava o servidor inteiro
  res.json({ total });
});
```

Enquanto esse `for` roda, nenhuma outra requisição é atendida. Não é lentidão daquela rota — é o processo inteiro parado.

Saídas quando precisa de CPU:
- `worker_threads` pra rodar em outra thread de verdade
- fila (BullMQ, RabbitMQ) e processar fora do ciclo da requisição
- `cluster` / PM2 pra usar os outros núcleos da máquina

### Fases do event loop no Node

O event loop do Node tem fases, o do navegador não tem essa divisão:

1. **timers** — `setTimeout`, `setInterval`
2. **pending callbacks** — callbacks de I/O adiados
3. **poll** — busca I/O novo, executa os callbacks (é onde fica a maior parte do tempo)
4. **check** — `setImmediate`
5. **close callbacks** — `socket.on("close")`

Entre cada fase ele esvazia microtasks e o `process.nextTick`, que tem prioridade até em cima das promises.

Na prática isso só importa em dois casos: quando eu quero rodar algo "depois do I/O atual" (`setImmediate`) e quando alguém pergunta em entrevista.

### Preciso lembrar

- `node -v` e o `engines` do package.json existem porque API nova quebra em versão antiga
- desde a v18 tem `fetch`, `test runner` e `--watch` nativos, então nem sempre preciso de dependência
- todo `require`/`import` de módulo nativo tem versão sync e async — a sync (`readFileSync`) é aceitável no boot, nunca dentro de um handler
