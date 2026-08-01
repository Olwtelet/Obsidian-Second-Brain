Agent parece complicado até perceber que é basicamente um `while` em volta de function calling ([[5 - Function calling]]).

```javascript
async function agent(objetivo, ferramentas, maxPassos = 10) {
  const mensagens = [{ role: "user", content: objetivo }];

  for (let passo = 0; passo < maxPassos; passo++) {
    const resposta = await modelo.gerar({ mensagens, ferramentas });
    mensagens.push(resposta);

    if (!resposta.chamadasDeFerramenta?.length) {
      return resposta.texto;   // terminou
    }

    const resultados = await Promise.all(
      resposta.chamadasDeFerramenta.map(executar)
    );
    mensagens.push({ role: "user", content: resultados });
  }

  throw new Error("excedeu o número de passos");
}
```

É isso. O que muda de uma chamada normal é que o resultado da ferramenta **volta pro modelo** e ele decide o próximo passo.

A diferença conceitual: numa chamada simples, **eu** defino o caminho. No agent, o **modelo** define o caminho e eu defino as capacidades e os limites.

### ReAct

O padrão mais citado: **Reason + Act**.

```
Pensamento: preciso saber o saldo antes de calcular o desconto
Ação: buscar_saldo(usuarioId="42")
Observação: 500

Pensamento: agora consigo calcular
Ação: calcular_desconto(saldo=500, cupom="X10")
Observação: 50

Pensamento: tenho tudo
Resposta: O desconto é de R$ 50
```

Alternar raciocínio e ação melhora bastante em tarefa de vários passos. Hoje isso está embutido no comportamento dos modelos com tool use — não preciso mais escrever o formato na mão.

### O que dá errado

**Loop infinito.** Chama a mesma ferramenta pra sempre. Precisa de limite de passos, de tempo e de custo. Sempre.

**Erro que se acumula.** Com 90% de acerto por passo, 10 passos dão ~35% de acerto no total. Por isso agent com muitos passos é frágil, e por isso vale quebrar em tarefas menores e verificáveis.

**Contexto que estoura.** Cada passo adiciona chamada + resultado. Resultado grande (uma página inteira, um JSON gigante) enche o contexto rápido. Vale truncar/resumir resultado antes de devolver ([[1 - Tokens e context window]]).

**Custo imprevisível.** N passos × contexto crescente. Um agent solto pode gastar muito sem entregar nada. Orçamento por execução, não só limite de passos.

**Ferramenta demais.** Com 30 ferramentas o modelo escolhe pior. Melhor poucas e bem descritas, ou seleção dinâmica das relevantes pra tarefa.

### Segurança

É aqui que fica sério. O agent lê conteúdo externo (página, e-mail, documento) e esse conteúdo pode conter instrução ([[2 - Como um prompt é montado]]).

A combinação perigosa é: **acesso a dado privado + capacidade de agir + conteúdo não confiável**. Com os três, prompt injection vira exfiltração.

Então:
- ferramenta com a permissão **do usuário**, nunca do sistema
- read-only por padrão; escrita é exceção justificada
- confirmação humana pro que é irreversível
- validar argumento como se viesse de requisição externa
- limitar domínio acessível quando o agent navega
- log de tudo que foi executado

### Quando vale a pena

Agent é caro, lento e imprevisível. Compensa quando:

- o caminho **não é conhecido de antemão**
- o número de passos varia com a entrada
- exige explorar e ajustar (debugar, pesquisar, refatorar)

Não compensa quando o fluxo é fixo. Aí é **workflow**: eu escrevo os passos em código e chamo o modelo nos pontos onde preciso de linguagem.

Workflow é determinístico, testável, barato e debugável. Agent não é nada disso.

Comecei achando que agent era sempre a resposta mais moderna. Hoje penso o contrário: **agent é o último recurso**, quando o problema realmente não cabe num fluxo escrito.

Um pipeline de RAG, por exemplo, é workflow — buscar, rerankear, responder. Não precisa de agent ([[9 - RAG - o pipeline]]).

### Escrever do zero ou usar framework

Escrevi o loop acima em 20 linhas. Framework (LangGraph, agent SDKs) agrega em: persistência de estado, retry, tracing, human-in-the-loop, execução em grafo.

Pra entender, vale escrever na mão primeiro. Depois de ver que é um `while` com function calling, a abstração do framework faz sentido em vez de parecer mágica.
