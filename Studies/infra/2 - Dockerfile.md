O Dockerfile é a receita. O detalhe que muda tudo é entender **cache de camada**.

### Uma versão ingênua

```dockerfile
FROM node:22
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "src/index.js"]
```

Funciona e é ruim: qualquer mudança em **qualquer** arquivo invalida o `COPY . .`, e aí o `npm install` roda de novo. Um typo no README custa 2 minutos de build.

### Ordenar do menos volátil pro mais volátil

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci                 # só refaz se o package.json/lock mudou

COPY . .                   # o código muda toda hora, mas fica por último

CMD ["node", "src/index.js"]
```

A regra é essa: **o que muda menos vem primeiro**. Como cada camada só é reconstruída se ela ou alguma anterior mudou, dependências ficam em cache entre builds.

`npm ci` e não `npm install`, porque instala exatamente o lock e falha se estiver dessincronizado ([[3 - package.json e npm]]).

### .dockerignore

Tão importante quanto o Dockerfile:

```
node_modules
.git
.env
dist
*.log
```

Sem isso, o `COPY . .` manda o `node_modules` local (que pode ter binário compilado pra outro SO) e o `.git` inteiro pro contexto de build. Já vi build de 800MB virar 40MB só com isso.

E `.env` no ignore evita que segredo entre na imagem por descuido ([[7 - Variáveis de ambiente]]).

### Multi-stage

O truque pra imagem pequena: buildar num estágio e copiar só o resultado pro outro.

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS producao
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

A imagem final não tem TypeScript, nem devDependencies, nem código-fonte. Só o build e o runtime.

Em projeto TS isso costuma tirar 60–70% do tamanho. Menos peso = deploy mais rápido, e menos superfície de ataque.

### Escolher a base

- `node:22` — Debian completo, ~1GB
- `node:22-slim` — Debian mínimo, ~200MB
- `node:22-alpine` — Alpine, ~130MB
- `distroless` — só o runtime, sem shell

Alpine usa musl no lugar da glibc, o que quebra algumas libs nativas (`sharp`, `bcrypt`, `canvas`). Quando começar erro estranho de binário, `slim` resolve.

Distroless é o mais seguro (sem shell, não dá pra abrir sessão dentro) e o mais chato de debugar — pelo mesmo motivo.

### Coisas que eu esquecia

**Rodar como root.** Todo container roda como root por padrão. `USER node` (a imagem oficial já tem esse usuário) resolve.

**CMD x ENTRYPOINT.** `CMD` é o comando padrão, sobrescrevível. `ENTRYPOINT` é fixo, e o `CMD` vira argumento dele.

**Forma exec x shell.** `CMD ["node", "app.js"]` roda o node como PID 1 e ele **recebe o SIGTERM**. `CMD node app.js` roda dentro de um shell, e o sinal não chega — o container leva 10s pra morrer no timeout e não faz shutdown gracioso ([[9 - Tratamento de erros]]). Sempre a forma de array.

**ARG x ENV.** `ARG` só existe no build, `ENV` fica na imagem. Segredo em `ARG` ainda aparece no `docker history` — pra isso existe `RUN --mount=type=secret`.

**Healthcheck:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1
```

Sem isso o orquestrador só sabe se o processo está vivo, não se ele está **funcionando**.

### Verificar

```bash
docker history minha-api    # o que pesa em cada camada
docker image ls
dive minha-api              # explorar camada por camada
```

Quando a imagem está grande sem motivo, `dive` mostra onde.
