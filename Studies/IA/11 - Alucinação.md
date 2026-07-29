O modelo não "mente". Ele foi treinado pra prever o próximo token mais **plausível** — e uma resposta inventada com confiança é estatisticamente plausível.

Isso é o ponto que muda tudo: **alucinação não é bug, é consequência do objetivo de treinamento**. Não tem patch. Só tem mitigação.

Pior ainda: o modelo não tem um sinal interno de "eu não sei". A fluência da resposta é a mesma quando ele sabe e quando ele inventa. É por isso que o texto errado soa tão convincente.

### Os tipos

**Factual** — afirma coisa falsa. Cita um artigo que não existe, atribui uma feature a uma lib que não tem.

**De fidelidade** — no RAG, contradiz o contexto fornecido ou responde com conhecimento próprio ignorando o documento. É a que mais me preocupa, porque parece que o sistema funcionou.

**De formato** — inventa campo de JSON, cita fonte inexistente, gera id que não existe.

### Quando aumenta

- assunto com pouca representação nos dados de treino (nicho, idioma menos comum, evento recente)
- pergunta que **assume** algo falso ("qual o limite de tokens do modelo X?" quando X não existe)
- pedido de precisão que o formato não sustenta: número exato, data, citação, referência bibliográfica
- temperature alta ([[3 - Temperature e amostragem]])
- contexto longo com informação enterrada no meio
- cadeia longa de raciocínio, onde um erro no começo se propaga

### Mitigações que funcionam

**Dar fonte** — é o que RAG faz ([[9 - RAG - o pipeline]]). Reduz muito, não elimina: o modelo ainda pode extrapolar além do contexto.

**Permitir "não sei" explicitamente.** Sem isso, o modelo escolhe inventar, porque o objetivo é produzir uma continuação plausível — e "não sei" raramente é a continuação mais provável:

```
Se a resposta não estiver no contexto, responda exatamente:
"Não encontrei essa informação nos documentos disponíveis."
```

**Citação verificável.** Pedir id do trecho e **conferir** que o id existe e que a afirmação está lá. Modelo inventa citação com a mesma facilidade com que inventa fato.

**Verificação por código.** Quando existe fonte de verdade, checar:

```javascript
const resultado = await modelo.extrair(nota);
const produto = await catalogo.porSku(resultado.sku);
if (!produto) throw new Error("SKU inexistente");
```

Isso é o mais efetivo de todos, e é o que separa demo de produção: usar o LLM pra **extrair/propor** e o código determinístico pra **validar**.

**Decompor.** Uma tarefa por chamada, com verificação entre elas, erra menos que uma chamada gigante fazendo tudo.

**Self-consistency.** Gerar N respostas e ver se convergem. Divergência é sinal de incerteza. Custa N vezes mais.

### O que não funciona

- **"não alucine"** no prompt. Não tem efeito
- **perguntar se ele tem certeza.** O modelo não tem acesso confiável ao próprio estado; ele gera uma resposta plausível sobre a confiança também. Perguntar "tem certeza?" costuma fazer ele mudar de ideia mesmo estando certo
- **usar um LLM pra checar o outro** sem fonte externa. Os dois podem concordar e estar errados
- **confiar no chain-of-thought** como explicação. O raciocínio escrito é uma narrativa; pode não corresponder ao que aconteceu internamente

### Design que assume erro

A conclusão prática que eu tirei: o sistema tem que ser **desenhado sabendo que o modelo erra**.

- LLM propõe, código valida
- ação irreversível exige confirmação humana ([[5 - Function calling]])
- resposta vem com fonte pro usuário conferir
- interface deixa claro que é gerado por IA
- caminho fácil pro usuário reportar erro

Onde o custo de errar é alto (saúde, jurídico, financeiro), o modelo é **assistente**, nunca decisor.

### Medir

Sem medição não dá pra saber se uma mudança melhorou ou piorou:

- **groundedness** — cada afirmação da resposta está no contexto?
- **taxa de abstenção correta** — quando não há resposta, ele admite?
- **precisão de citação** — as fontes existem e sustentam o que foi dito?

Isso é [[12 - Avaliação de respostas]], e é o que transforma "achei que melhorou" em número.
