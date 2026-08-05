Quando um agent só não dá conta, a ideia é dividir em vários especializados. Cada um com system prompt, ferramentas e escopo próprios.

O argumento a favor: separação de responsabilidades ([[Coesão e acoplamento]]) aplicada a prompt. Um agent com 30 ferramentas e 5 objetivos escolhe pior que três agents focados.

### Os arranjos

**Supervisor** — um orquestrador decide quem chama e junta o resultado.

```
        supervisor
       /     |     \
  pesquisa  código  revisão
```

É o mais comum e o mais fácil de raciocinar. O supervisor vira gargalo, mas o fluxo fica compreensível.

**Sequencial (pipeline)** — a saída de um é a entrada do próximo. Determinístico, testável. Na verdade é workflow, não multi-agent, e isso é uma vantagem.

**Paralelo + agregação** — vários atacam o mesmo problema, um consolida. Serve pra pesquisa ampla e pra reduzir variância.

**Debate** — agents argumentam entre si. Melhora em tarefa de raciocínio e custa muito.

**Hierárquico** — supervisor de supervisores. Cara e difícil de debugar.

### O que aprendi lendo sobre isso

A parte mais difícil não é o modelo, é o **handoff**. Passar contexto entre agents perde informação:

- se passo o contexto inteiro, o custo multiplica e o contexto estoura
- se passo só um resumo, o próximo perde detalhe e refaz trabalho

Regra que faz sentido: **contexto compartilhado, decisão distribuída**. Todos veem o histórico relevante, cada um decide na sua alçada. Handoff só com resumo estruturado quando o volume não deixa alternativa.

E os erros compõem: 3 agents com 90% de acerto dão ~73% no fim ([[13 - Agents - o loop]]).

### Quando NÃO usar

A resposta honesta é: quase sempre.

Multi-agent adiciona:
- custo (cada agent tem contexto próprio)
- latência (sequencial soma)
- complexidade de debug (qual dos cinco errou?)
- pontos de falha novos

Antes de multi-agent eu tentaria, nessa ordem:

1. **melhorar o prompt** do agent único
2. **reduzir as ferramentas** — menos opção, escolha melhor
3. **workflow em código** com o modelo em pontos específicos
4. **um agent com sub-tarefas** em vez de vários agents

Só depois disso, multi-agent.

O critério que uso: multi-agent vale quando as tarefas são **realmente independentes e paralelizáveis** (pesquisar 10 fontes ao mesmo tempo) ou quando exigem **contextos incompatíveis** (um escreve, outro critica sem viés do primeiro).

Se é só "seria mais organizado", provavelmente é abstração à toa.

### Orquestração de verdade

Em produção, o que sustenta isso é infraestrutura, não prompt:

- **estado durável** — a execução pode levar minutos; queda não pode perder tudo
- **retry com backoff** — API de LLM falha e dá rate limit
- **timeout e orçamento** por execução
- **human-in-the-loop** — pausar, esperar aprovação, retomar
- **tracing** — sem ver a árvore de execução, debugar é impossível ([[12 - Avaliação de respostas]])

É basicamente o mesmo conjunto de problemas de sistema distribuído ([[SistemasDistribuidos]], [[Pub Sub arquitetura]]), com um componente não-determinístico no meio. Nada aqui é específico de IA — é engenharia normal.

### O que eu concluo

"Multi-agent" soa mais avançado do que costuma ser útil. A maior parte do que vejo descrito assim é um workflow com passos nomeados.

E workflow explícito é melhor: determinístico, barato, testável e debugável. Se eu consigo desenhar o fluxo num papel, ele deveria estar em código, não sendo decidido por um modelo a cada execução.
