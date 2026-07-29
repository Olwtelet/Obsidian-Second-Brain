O problema de trabalhar com LLM: não existe "passou/falhou" óbvio. Duas respostas diferentes podem estar as duas certas.

Sem avaliação, mexer no prompt vira chute — melhora um caso e piora três que eu não olhei ([[2 - Como um prompt é montado]]).

### Conjunto de testes primeiro

Antes de otimizar qualquer coisa, montar 30–50 casos reais com o resultado esperado. Não precisa ser sofisticado; um JSON já serve:

```json
[
  {
    "pergunta": "Como cancelo minha assinatura?",
    "resposta_esperada": "Acessar Configurações > Assinatura > Cancelar",
    "fontes_esperadas": ["manual-faturamento#cancelamento"]
  },
  {
    "pergunta": "Qual o CNPJ da empresa?",
    "resposta_esperada": "ABSTENÇÃO",
    "fontes_esperadas": []
  }
]
```

O segundo caso é o que eu esquecia: perguntas que **não** têm resposta no corpus. É fácil montar um conjunto onde tudo tem resposta e concluir que o sistema é ótimo. O que revela a qualidade real é ver se ele admite não saber ([[11 - Alucinação]]).

### Avaliar as duas etapas separado

No RAG são dois sistemas empilhados, e misturar as métricas esconde qual quebrou:

**Recuperação** (tem verdade objetiva, então dá pra medir direito):
- **recall@k** — o chunk certo veio no top-k?
- **MRR** — em que posição?
- **precisão** — quanto do que veio era relevante?

**Geração**:
- **groundedness / faithfulness** — as afirmações estão no contexto?
- **relevância** — responde o que foi perguntado?
- **completude** — cobre a resposta inteira?
- **formato** — respeita o que foi pedido?

Se o recall está baixo, mexer no prompt não adianta. Se o recall está alto e a resposta está ruim, o problema é a geração. Métrica única não distingue.

### LLM como juiz

Pra critério subjetivo, usar um modelo pra avaliar:

```
Contexto: {contexto}
Pergunta: {pergunta}
Resposta: {resposta}

A resposta é sustentada APENAS pelo contexto?
Responda em JSON: { "sustentada": true|false, "trechos_nao_sustentados": [...] }
```

Funciona razoavelmente, com ressalvas conhecidas:

- **viés de posição** — em comparação A/B, tende a preferir a primeira. Alternar a ordem e rodar duas vezes
- **viés de tamanho** — prefere resposta longa
- **viés de auto-preferência** — modelo prefere texto gerado por ele mesmo
- **critério vago dá nota vaga.** "avalie de 0 a 10" é inútil; rubrica binária e específica é confiável

Por isso: várias perguntas binárias em vez de uma nota. `sustentada: true/false` é bem mais estável que `qualidade: 7.5`.

E o juiz precisa ser **calibrado** contra julgamento humano em uma amostra. Se ele discorda do humano em 30% dos casos, a métrica não vale nada.

### Métricas determinísticas quando dá

Nem tudo precisa de juiz. Onde existe resposta objetiva, teste normal ([[1 - Pirâmide de testes]]):

```javascript
test("extrai o CNPJ da nota", async () => {
  const r = await extrair(notaExemplo);
  expect(r.cnpj).toBe("12.345.678/0001-90");
});
```

Extração, classificação e structured output se testam assim, com asserção comum. Bem mais barato e confiável que juiz.

### Regressão

Todo bug vira caso de teste. Prompt novo roda contra o conjunto inteiro antes de subir.

Como a saída é não-determinística, o critério não é "idêntico", é **agregado**:

```
antes:  groundedness 0.87 | recall@5 0.72 | abstenção correta 0.60
depois: groundedness 0.91 | recall@5 0.71 | abstenção correta 0.85
```

Aqui eu aceitaria: recall caiu 1 ponto (ruído) e abstenção subiu 25.

### Em produção

Offline não pega tudo. Vale instrumentar:

- **tracing** de cada etapa (query, chunks recuperados, prompt final, resposta, tokens, latência). Sem isso, debugar é impossível — LangSmith, Langfuse ou até log estruturado próprio
- **feedback do usuário** (👍/👎) — barato e é o sinal mais honesto
- **amostragem pra revisão manual** — ler 20 conversas por semana ensina mais que qualquer dashboard
- **taxa de abstenção** — se despencou, algo quebrou na recuperação

### O que eu levo

O trabalho de verdade em aplicação de IA não é escolher o modelo. É construir o loop de avaliação que permite saber se uma mudança melhorou.

Sem isso, é opinião — e opinião não escala nem sobrevive a uma troca de modelo.
