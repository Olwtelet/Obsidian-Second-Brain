O modelo não guarda nada entre chamadas. "Memória" é sempre algo que **eu** construo e reenvio ([[1 - Tokens e context window]]).

### Os tipos

**Working memory** — o contexto da execução atual. A lista de mensagens. Some ao terminar.

**Short-term** — o histórico da conversa. Persiste na sessão.

**Long-term** — o que sobrevive entre sessões: preferências, fatos sobre o usuário, decisões passadas.

**Episódica** — registro de execuções anteriores ("da última vez que tentei isso, deu erro X").

**Procedural** — como fazer as coisas. Na prática mora no system prompt e nas descrições de ferramenta.

### O problema do histórico

A conversa cresce, o contexto estoura, o custo sobe. As estratégias:

**Janela deslizante** — manter as N últimas mensagens. Simples, e perde o começo (que costuma ter a informação mais importante).

**Resumo progressivo** — quando passa de um limite, pedir ao modelo pra resumir o trecho antigo e substituir:

```
[resumo dos 20 primeiros turnos]
+ últimas 10 mensagens completas
```

Funciona bem. O risco é o resumo do resumo do resumo — detalhe some progressivamente.

**Recuperação** — guardar tudo, indexar, e trazer só os trechos relevantes pra pergunta atual. É RAG aplicado ao histórico ([[9 - RAG - o pipeline]]).

**Híbrido** — resumo do antigo + últimas N completas + recuperação sob demanda. É o que sistemas sérios fazem.

### Memória de longo prazo

Aqui aparecem duas decisões difíceis:

**O que guardar?** Guardar tudo vira ruído. O modelo precisa decidir o que é digno de memória, e ele erra:

```json
{ "tipo": "preferencia", "conteudo": "prefere respostas curtas e em português" }
{ "tipo": "fato", "conteudo": "trabalha com TypeScript e Node" }
```

**Quando atualizar?** Se hoje eu digo "prefiro Vue" e ano passado disse "prefiro React", o certo é substituir, não acumular as duas. Memória contraditória é pior que memória nenhuma, porque o modelo escolhe uma ao acaso.

Isso exige um passo de reconciliação — ler as memórias existentes, decidir se a nova substitui, complementa ou contradiz.

### Implementação simples

```javascript
async function montarContexto(usuarioId, pergunta) {
  const [perfil, relevantes, recentes] = await Promise.all([
    memoria.perfil(usuarioId),                        // fatos estáveis
    memoria.buscar(usuarioId, pergunta, { k: 3 }),    // por similaridade
    conversa.ultimasMensagens(usuarioId, 10)
  ]);

  return [
    { role: "system", content: `${promptBase}\n\nSobre o usuário:\n${perfil}` },
    { role: "system", content: `Contexto relevante:\n${relevantes.join("\n")}` },
    ...recentes
  ];
}
```

A memória vira **montagem de prompt**. Não tem mágica: é decidir o que entra no contexto desta chamada.

### Estado x memória

Duas coisas que eu misturava:

- **estado** — dado estruturado que a aplicação controla (passo atual, itens do carrinho, ids). Fica em banco, é preciso, o código lê e escreve
- **memória** — texto não estruturado que ajuda o modelo a se situar

Estado **não** deveria estar na memória do modelo. "Quantos itens tem no carrinho" se responde consultando o banco por ferramenta, não confiando no que o modelo lembra. Confiar no modelo pra manter estado é fonte garantida de bug.

### Privacidade

Memória de longo prazo é dado pessoal armazenado:

- o usuário precisa poder **ver** e **apagar** o que foi guardado
- memória de um usuário **nunca** pode vazar pro contexto de outro — isolamento por tenant na busca é obrigatório, não opcional ([[7 - Similaridade e busca vetorial]])
- não guardar o que não precisa (senha, cartão, dado de saúde)
- retenção com prazo

Um bug de filtro aqui é vazamento de dado pessoal, não só resposta errada.

### O que eu levo

Memória parece feature de modelo e é **engenharia de contexto**. O trabalho é decidir o que entra no prompt, quando, e como não deixar crescer pra sempre.

Quem resolve isso bem tem um sistema que parece lembrar. Quem não resolve tem um sistema caro que esquece do jeito errado.
