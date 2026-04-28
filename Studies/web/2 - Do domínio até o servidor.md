O que acontece entre eu digitar a URL e a página aparecer. Fiz essa nota porque é uma pergunta clássica e porque toda vez que algo quebra em produção, é em uma dessas etapas.

### 1. DNS — nome vira IP

`api.exemplo.com` não significa nada pra rede. Precisa virar `192.0.2.10`.

A busca vai subindo até achar:

1. cache do navegador
2. cache do sistema operacional (e `/etc/hosts`)
3. resolver recursivo (do provedor, ou 8.8.8.8 / 1.1.1.1)
4. root server → "quem cuida de `.com`?"
5. TLD server → "quem cuida de `exemplo.com`?"
6. nameserver autoritativo → "`api` é 192.0.2.10"

Tipos de registro que eu mexo na prática:

- **A** — nome → IPv4
- **AAAA** — nome → IPv6
- **CNAME** — nome → outro nome (é o que a Vercel pede pra apontar domínio)
- **MX** — servidor de e-mail
- **TXT** — verificação de domínio, SPF, DKIM

**TTL** é por quanto tempo o resolver guarda a resposta. Por isso mudança de DNS "demora pra propagar" — não é propagação, é cache velho expirando. Antes de migrar servidor, baixar o TTL uns dias antes economiza dor de cabeça.

### 2. TCP — abrir a conexão

Three-way handshake: `SYN` → `SYN-ACK` → `ACK`. Uma ida e volta antes de qualquer byte útil.

TCP garante entrega, ordem e retransmissão. Por isso é a base de HTTP. O preço é latência: pacote perdido segura todos os que vieram depois (head-of-line blocking) — o problema que o QUIC/HTTP3 resolve.

UDP não garante nada, e é justamente por isso que serve pra DNS, vídeo e jogo, onde um pacote perdido é menos ruim que esperar retransmissão.

### 3. TLS — criptografar

Mais uma ida e volta (ou zero no TLS 1.3 com sessão retomada):

- servidor manda o certificado
- cliente valida a cadeia até uma CA em que confia
- os dois combinam uma chave simétrica de sessão

O certificado prova **identidade** (esse servidor é mesmo `exemplo.com`) além de dar criptografia. Certificado expirado derruba o site inteiro — e é o incidente mais bobo e mais comum que existe. Let's Encrypt + renovação automática existe pra isso.

Detalhe: o SNI vai em texto claro no handshake, então o **domínio** que estou acessando é visível na rede. Só o conteúdo é cifrado.

### 4. HTTP — a requisição

Aí sim vai o texto de [[1 - Anatomia de uma requisição HTTP]].

### 5. O que tem no meio do caminho

Raramente a requisição bate direto no meu servidor. Normalmente passa por:

**CDN** → **load balancer** → **reverse proxy** → **aplicação**

- **CDN** (Cloudflare, Vercel Edge) — servidor perto do usuário; se for asset estático em cache, responde ali e nunca chega em mim ([[10 - Cache HTTP e CDN]])
- **load balancer** — distribui entre várias instâncias
- **reverse proxy** (nginx) — termina TLS, comprime, serve estático, repassa o resto

Cada camada dessas pode devolver erro por conta própria. 502 e 504 quase sempre são o proxy dizendo que **quem está atrás** não respondeu — o problema não é o nginx, é a aplicação.

### Debug na ordem certa

Quando "o site caiu", eu vou nessa ordem, porque cada passo elimina uma camada:

```bash
dig api.exemplo.com          # o DNS resolve?
ping 192.0.2.10              # o host responde?
curl -v https://api.exemplo.com/health   # TLS ok? status? headers?
```

`curl -v` mostra handshake, headers e status de uma vez, e diz se o erro é de rede, de certificado ou de aplicação. Na maioria das vezes resolve o diagnóstico sozinho.
