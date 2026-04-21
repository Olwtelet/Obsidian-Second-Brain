Stream é processar dado **em pedaços**, conforme ele chega, em vez de carregar tudo na memória primeiro.

A diferença fica óbvia com arquivo grande:

```javascript
// carrega o arquivo INTEIRO na RAM antes de mandar
const conteudo = await fs.readFile("video.mp4");
res.end(conteudo);

// manda pedaço por pedaço, memória constante
fs.createReadStream("video.mp4").pipe(res);
```

Com um arquivo de 2GB e 10 usuários simultâneos, a primeira versão pede 20GB de RAM. A segunda usa alguns MB.

### Os quatro tipos

- **Readable** — de onde o dado sai: `fs.createReadStream`, `req`, `process.stdin`
- **Writable** — pra onde o dado vai: `fs.createWriteStream`, `res`, `process.stdout`
- **Duplex** — os dois: socket TCP
- **Transform** — duplex que modifica no caminho: `zlib.createGzip()`, cifra

### pipe

`pipe` conecta readable em writable e cuida do backpressure sozinho:

```javascript
import fs from "node:fs";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";

await pipeline(
  fs.createReadStream("dados.csv"),
  zlib.createGzip(),
  fs.createWriteStream("dados.csv.gz")
);
```

Uso `pipeline` (do `stream/promises`) em vez de `.pipe().pipe()` porque ele propaga erro e fecha os streams direito. Com `.pipe()` encadeado, se o do meio falhar, os outros ficam abertos vazando file descriptor.

### Backpressure

É o conceito central e o que eu mais demorei a entender.

Se eu leio de um disco rápido e escrevo numa rede lenta, o dado se acumula na memória do processo. Backpressure é o writable dizer "para de mandar, eu ainda não vazei o que tenho" e o readable pausar.

`write()` retorna `false` quando o buffer interno encheu:

```javascript
const ok = writable.write(pedaco);
if (!ok) {
  readable.pause();
  writable.once("drain", () => readable.resume());
}
```

`pipe` e `pipeline` fazem isso automaticamente — que é justamente o motivo de não implementar na mão.

### Ler linha a linha

```javascript
import readline from "node:readline";

const rl = readline.createInterface({
  input: fs.createReadStream("gigante.log"),
  crlfDelay: Infinity
});

for await (const linha of rl) {
  if (linha.includes("ERROR")) console.log(linha);
}
```

Processa um log de vários GB com memória constante.

### Onde isso aparece mesmo sem eu perceber

- `req` e `res` do `http` já são streams ([[4 - Servidor HTTP sem framework]])
- upload de arquivo (multer lê o `req` como stream)
- download com `Content-Disposition`
- resposta de LLM em streaming — token a token é exatamente um readable stream, é isso que faz o texto aparecer aos poucos na tela ([[1 - Tokens e context window]])

### Web Streams

Existe outra API, a padrão da web (`ReadableStream`, `TransformStream`), que funciona no navegador, no Node moderno, no Deno e nos runtimes de edge. É a que o `fetch` usa:

```javascript
const res = await fetch(url);
for await (const pedaco of res.body) {
  // ...
}
```

Conversão entre as duas: `Readable.fromWeb()` e `Readable.toWeb()`.

Pra código novo que precisa rodar em edge (Vercel, Cloudflare), a Web Stream é a escolha, porque lá não existe o `stream` do Node.
