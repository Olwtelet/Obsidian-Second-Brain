A metáfora é do Ward Cunningham: escolher uma solução mais rápida agora é como pegar empréstimo. Dá velocidade hoje e cobra **juros** — cada mudança futura naquela área custa mais caro.

O detalhe que geralmente se perde: na formulação original, dívida técnica é uma decisão **consciente e justificada**. Código ruim por descuido não é dívida, é só código ruim.

### Nem toda dívida é ruim

O quadrante do Martin Fowler ajuda:

|  | Deliberada | Inadvertida |
|---|---|---|
| **Prudente** | "entregamos agora e refatoramos depois" | "agora entendo como deveria ter sido" |
| **Imprudente** | "não temos tempo pra design" | "o que é camada?" |

Deliberada + prudente é estratégia legítima: lançar antes vale mais que a arquitetura perfeita, principalmente quando ainda não sei se o produto se sustenta.

Inadvertida + prudente é aprendizado. Acontece sempre e não é culpa de ninguém.

O problema é o imprudente — e a dívida prudente que **nunca é paga**.

### Onde ela aparece

- **código** — duplicação, função de 300 linhas, acoplamento ([[Coesão e acoplamento]])
- **teste** — sem cobertura no que importa, teste flaky
- **dependência** — versão travada há dois anos, lib abandonada
- **infra** — deploy manual, sem ambiente de staging
- **dado** — schema que não representa mais o domínio. A mais cara de todas, porque migrar dado em produção é caro
- **documentação** — README que descreve um sistema que não existe mais
- **conhecimento** — uma pessoa só entende aquele módulo

### O sinal

Não é código feio. É **custo de mudança subindo**.

- estimativa que era 1 dia virou 3
- ninguém quer mexer naquele arquivo
- bug corrigido volta
- toda feature nova exige "só um ajuste" em cinco lugares
- onboarding leva meses

Se um trecho é feio mas ninguém encosta nele há dois anos e ele funciona, os juros são **zero**. Refatorar ali é gastar sem retorno.

Por isso a prioridade é: **dívida em código que muda com frequência**. `git log` mostra isso melhor que opinião — arquivo com muitos commits e muitos bugs é onde pagar rende.

### Como pagar

**Regra do escoteiro** — deixar o código um pouco melhor do que encontrou. Melhoria contínua embutida no trabalho normal, sem precisar de aprovação.

**Refatorar junto com a feature.** Vou mexer nesse módulo mesmo; aproveito e arrumo. É o que mais funciona, porque não compete com entrega.

**Não misturar no mesmo commit.** Refatoração e mudança de comportamento separadas — senão o diff fica ilegível e o review não acontece de verdade ([[6 - Branches e pull requests]]).

**Refatoração grande precisa de justificativa concreta.** "Está feio" não convence ninguém. "Toda alteração aqui leva 3 dias e gera bug; com 1 semana isso cai pra meio dia" convence.

**Strangler fig** pra reescrita: em vez de parar tudo e reescrever, o código novo vai envolvendo o velho por partes, com os dois convivendo. Reescrita big bang costuma falhar — o sistema velho continua evoluindo enquanto o novo é escrito.

### O pré-requisito

Refatorar sem teste é apostar. O teste é o que permite mudar a estrutura sabendo que o comportamento continua o mesmo ([[1 - Pirâmide de testes]]).

Por isso a ordem é: cobrir com teste **primeiro**, refatorar depois. Se não dá pra testar porque está acoplado demais, aí é caracterização — teste que documenta o comportamento atual, inclusive os bugs, só pra ter uma rede.

### O que eu levo

Dívida zero é impossível e nem é o objetivo. Um sistema com dívida zero provavelmente foi over-engineered e demorou demais pra sair.

O que importa é **saber onde ela está** e que ela seja uma escolha, não uma surpresa. Dívida documentada com um `// TODO: aqui assumimos X porque Y` vale muito mais que dívida silenciosa.
