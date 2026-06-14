Vi virtualização na faculdade ([[11 - Virtualização de servidores]]) mas container é outra coisa, e eu misturava os dois.

### Container não é VM

- **VM** — virtualiza o *hardware*. Cada VM tem um sistema operacional completo, com kernel próprio. Sobe em minutos, ocupa GB.
- **Container** — virtualiza o *processo*. Compartilha o kernel do host. Sobe em milissegundos, ocupa MB.

Container é um processo normal do Linux, isolado por duas features do kernel:

- **namespaces** — o que o processo *enxerga* (PID, rede, filesystem, usuário). Dentro do container ele acha que é o PID 1 e que tem a máquina inteira
- **cgroups** — o que o processo *pode usar* (CPU, memória, I/O)

Ou seja: não tem emulação nem hipervisor. É por isso que é tão leve.

Consequência: container Linux precisa de kernel Linux. No Windows e no Mac o Docker roda uma VM Linux por baixo — daí a lentidão de I/O em volume montado nessas plataformas.

### Imagem x container

- **imagem** — o molde, imutável, em camadas. É o "class"
- **container** — a instância rodando, com uma camada de escrita por cima. É o "object"

Uma imagem, N containers. Cada um com seu filesystem de escrita separado.

```bash
docker build -t minha-api .
docker run -p 3000:3000 minha-api
docker ps            # rodando
docker ps -a         # inclusive os parados
docker images
docker logs -f <id>
docker exec -it <id> sh
```

`docker exec -it <id> sh` é o que eu mais uso pra debugar: entra no container e olha por dentro.

### Camadas

Cada instrução do Dockerfile vira uma camada, e camada é **cacheada e compartilhada**. Se 5 imagens usam `node:22-alpine`, o download acontece uma vez.

E camada é **empilhada, nunca apagada**. Isso significa que:

```dockerfile
COPY segredo.txt .
RUN rm segredo.txt
```

O arquivo continua na camada anterior. `docker history` mostra. Segredo que entra na imagem **fica** na imagem — é o motivo de `--secret` no build existir.

### Efêmero

O container morreu, a camada de escrita morreu junto. Todo dado gravado dentro dele some.

Isso não é bug, é o ponto: container tem que ser descartável. Estado vai pra volume ou pra serviço externo ([[3 - Volumes e networks]]).

### Por que isso resolve alguma coisa

O ganho de verdade é acabar com "na minha máquina funciona". A imagem carrega o runtime, as libs do sistema e as dependências. O que roda no meu notebook é bit a bit o que roda em produção.

O segundo ganho é subir dependência sem instalar nada:

```bash
docker run --name meu-redis -p 6379:6379 -d redis
```

Isso é literalmente o que eu fiz pra testar Pub/Sub ([[Redis - Intro]]). Sem instalar Redis, sem sujar a máquina, e `docker rm` desfaz tudo.

### OCI

"Docker" virou sinônimo de container, mas o formato é padronizado (OCI). Podman, containerd e nerdctl rodam a mesma imagem. Kubernetes nem usa Docker por baixo desde a 1.24 ([[kubernets]]).

Na prática o Dockerfile que eu escrevo funciona em qualquer um deles.
