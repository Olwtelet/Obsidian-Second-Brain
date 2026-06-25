- **CI** (Continuous Integration) — todo push é integrado e **verificado** automaticamente
- **CD** — Delivery (pronto pra deploy, com aprovação manual) ou Deployment (vai sozinho)

O objetivo do CI não é "rodar teste". É **encurtar o feedback**. Bug encontrado em 3 minutos custa uma fração do que custa encontrado em produção uma semana depois.

### Um pipeline básico

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verificar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

A ordem importa: o mais rápido e mais provável de falhar primeiro. Lint quebra em 10s, teste e2e em 5 minutos. Falhar cedo economiza tempo de máquina e de espera.

`npm ci` e não `install` ([[3 - package.json e npm]]).

### Teste com serviço de verdade

```yaml
    services:
      mongo:
        image: mongo:7
        ports: ["27017:27017"]
```

Bem melhor que mock de banco. O teste de integração roda contra o Mongo de verdade e pega coisa que mock nunca pegaria — comportamento de índice único, tipo de dado, erro do driver ([[4 - Testando uma API]]).

### Cache

Sem cache, cada run baixa tudo de novo. `cache: npm` no setup-node resolve dependência. Pra Docker, cache de camada:

```yaml
      - uses: docker/build-push-action@v5
        with:
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Pipeline lento é pipeline que as pessoas contornam. Acima de ~10 minutos, começa a aparecer `--no-verify` e merge sem esperar.

### Matriz

```yaml
    strategy:
      matrix:
        node: [20, 22]
```

Roda tudo em cada versão. Útil pra lib, exagero pra aplicação que roda numa versão só.

### CD

```yaml
  deploy:
    needs: verificar
    if: github.ref == 'refs/heads/main'
    environment: producao
    steps:
      - run: ./deploy.sh
```

`needs` garante que só deploya se o CI passou. `environment` permite exigir aprovação manual e guardar secrets separados.

### Estratégias de deploy

- **recreate** — derruba e sobe. Tem downtime. Só pra ambiente interno
- **rolling** — troca instância por instância. É o padrão do K8s
- **blue-green** — dois ambientes completos, troca o tráfego de uma vez. Rollback instantâneo, custa o dobro
- **canary** — 5% do tráfego na versão nova, observa métrica, aumenta. O mais seguro e o mais complexo

Preview por branch (Vercel, Netlify) é praticamente canary de graça pra review — cada PR tem URL própria ([[5 - Middleware e deploy]]).

### Migration de banco

A parte que mais dá problema. Deploy de código é reversível; migration nem sempre.

A prática que evita dor: **migration compatível pra trás**. Nunca fazer `DROP COLUMN` no mesmo deploy que remove o uso — em rolling update, versão velha e nova convivem por alguns minutos.

Expand/contract:
1. deploy 1 — adiciona a coluna nova, escreve nas duas
2. deploy 2 — passa a ler da nova
3. deploy 3 — remove a antiga

Três deploys pra uma mudança, e é o preço de não derrubar nada.

### Secrets

Nunca no repositório. GitHub Secrets, e no log eles aparecem como `***`.

Mas: PR de fork **não** recebe secrets, de propósito — senão qualquer um abriria um PR que imprime as chaves.

### Sinais de pipeline saudável

- roda em menos de 10 minutos
- não tem teste flaky (teste que falha aleatoriamente destrói a confiança; "roda de novo" vira reflexo e aí o CI perdeu a função)
- vermelho na main é emergência, não rotina
- dá pra reverter rápido — na prática isso importa mais que nunca errar
