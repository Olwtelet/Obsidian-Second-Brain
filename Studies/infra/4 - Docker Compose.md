Compose é pra descrever **vários containers juntos**. Em vez de decorar cinco `docker run` com flags, um arquivo.

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mongodb://mongo:27017/app
      REDIS_URL: redis://redis:6379
    env_file: .env
    depends_on:
      mongo:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  mongo:
    image: mongo:7
    volumes:
      - dados-mongo:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine

volumes:
  dados-mongo:
```

```bash
docker compose up -d
docker compose logs -f api
docker compose exec api sh
docker compose down
```

O ganho real: quem clona o repositório roda `docker compose up` e tem o ambiente inteiro. Sem "instala o Mongo, instala o Redis, cria o banco".

### depends_on não é o que parece

`depends_on` sozinho só garante a **ordem de start**, não que o serviço esteja **pronto**. O Mongo pode estar subindo enquanto a API já tenta conectar — e a API morre.

Por isso o `condition: service_healthy` junto do `healthcheck`. Sem isso, a alternativa é a aplicação ter retry na conexão, o que aliás é uma boa ideia de qualquer forma: em produção o banco pode reiniciar e a app precisa aguentar.

### Nome do serviço é o hostname

`mongodb://mongo:27017` — `mongo` é o nome do serviço, e o DNS interno resolve. Não é `localhost` ([[3 - Volumes e networks]]).

O Compose cria uma network pros serviços do arquivo automaticamente.

### Override pra dev e prod

```
docker-compose.yml           # base
docker-compose.override.yml  # dev, aplicado automaticamente
docker-compose.prod.yml      # produção, explícito
```

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

No dev: bind mount, hot reload, porta de debug exposta.
Em prod: imagem buildada, sem mount, réplicas, limite de recurso.

### Profiles

Pra não subir tudo sempre:

```yaml
  mailhog:
    image: mailhog/mailhog
    profiles: ["dev"]
```

```bash
docker compose --profile dev up
```

### Compose x Kubernetes

Compose é **uma máquina**. Não faz auto-scaling, self-healing distribuído nem rolling update de verdade.

Isso cobre: desenvolvimento local, CI, e aplicação pequena num VPS. É honestamente o suficiente pra maioria dos projetos que eu faço.

K8s ([[kubernets]], [[2 - Clusters]]) entra quando precisa de várias máquinas, escala automática e alta disponibilidade. Complexidade muito maior — não vale antes de precisar.

### O que uso quase sempre

- API + banco + Redis pra desenvolver
- subir dependência isolada pra testar uma coisa só ([[Redis - Intro]])
- ambiente de teste de integração no CI, com banco real em vez de mock ([[4 - Testando uma API]])

Esse último é o que mais mudou minha forma de testar: com Compose, banco de verdade no teste é barato.
