Container é efêmero ([[1 - Container x imagem]]). Volume é como o dado sobrevive.

### Os três tipos

**Volume nomeado** — o Docker gerencia, fica em `/var/lib/docker/volumes`:

```bash
docker run -v dados-postgres:/var/lib/postgresql/data postgres
```

É o certo pra dado de banco. Performance boa em qualquer plataforma e o Docker cuida do ciclo de vida.

**Bind mount** — aponta pra uma pasta do host:

```bash
docker run -v $(pwd):/app node:22
```

É o de desenvolvimento: edito no editor e o container vê na hora. Em Mac e Windows o I/O passa pela VM e fica lento — daí o truque de excluir `node_modules` do mount.

**tmpfs** — só na RAM, some ao parar. Pra dado sensível temporário.

### O truque do node_modules

```yaml
volumes:
  - .:/app
  - /app/node_modules   # volume anônimo, "protege" a pasta
```

Sem a segunda linha, o `node_modules` do host (compilado pro meu SO) sobrescreve o do container (compilado pro Linux). Binário nativo quebra. A segunda linha faz o container manter o dele.

### Networks

Cada container tem stack de rede própria. Numa network do Docker, eles se acham **pelo nome do serviço**:

```
api -> postgres:5432    (não localhost:5432)
```

Isso é o que mais confunde no começo: `localhost` dentro do container é o **próprio container**, não a máquina. Se a API tenta `localhost:5432` e o Postgres está em outro container, não conecta.

Do container pro host existe um DNS especial: `host.docker.internal`.

### Portas

```bash
docker run -p 8080:3000 minha-api
#            host:container
```

`EXPOSE` no Dockerfile é só documentação — não publica nada. Quem publica é o `-p`.

E containers na mesma network se falam pela porta **interna**, sem precisar de `-p`. Publicar porta é só pra acesso vindo de fora.

```bash
docker network create minha-rede
docker network inspect minha-rede
```

### O padrão que uso em dev

Banco em volume nomeado, código em bind mount, tudo na mesma network:

```yaml
services:
  api:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    ports: ["3000:3000"]

  postgres:
    image: postgres:16
    volumes:
      - dados:/var/lib/postgresql/data

volumes:
  dados:
```

`docker compose down` derruba tudo e o banco continua ([[4 - Docker Compose]]). `docker compose down -v` apaga o volume também — esse `-v` é o que me fez perder dado de teste mais de uma vez.

### Backup

```bash
docker run --rm -v dados:/dados -v $(pwd):/backup alpine \
  tar czf /backup/backup.tar.gz /dados
```

Um container temporário que monta o volume e o diretório atual, e faz o tar. Bem melhor que caçar o caminho no host.

### Coisas que ocupam disco sem eu ver

```bash
docker system df       # o que está gastando
docker system prune    # limpa parado, network órfã, cache
docker volume prune    # volume sem container - CUIDADO
```

Cache de build cresce absurdamente. Já vi 40GB. Mas `volume prune` apaga dado de verdade — leio a lista antes de confirmar.
