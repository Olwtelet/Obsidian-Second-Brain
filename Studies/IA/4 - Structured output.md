Pra usar LLM dentro de uma aplicação, texto solto não serve. Preciso de dado que o código consiga consumir.

### O jeito frágil

```
Responda em JSON com os campos nome e idade.
```

Funciona na maior parte das vezes e falha o suficiente pra dar problema:

- vem embrulhado em ```` ```json ```` 
- vem com "Claro! Aqui está o JSON:" antes
- vírgula sobrando, aspas erradas
- campo com nome diferente do pedido
- corte no meio por `max_tokens`, gerando JSON inválido ([[1 - Tokens e context window]])

Aí surge aquele código feio de extrair JSON com regex, que quebra do mesmo jeito.

### JSON mode

Alguns provedores garantem **JSON sintaticamente válido**:

```json
{ "response_format": { "type": "json_object" } }
```

Resolve o parse. Não resolve o **schema** — os campos ainda podem vir diferentes do esperado.

### Structured output com schema

O que realmente resolve. Passo um JSON Schema e a geração é **restringida** a ele — o decoder só permite tokens que mantêm a saída válida.

```python
from pydantic import BaseModel

class Produto(BaseModel):
    nome: str
    preco: float
    em_estoque: bool
    categorias: list[str]
```

Ou em TS com zod ([[Tipando a borda da aplicação]]):

```typescript
const Produto = z.object({
  nome: z.string(),
  preco: z.number(),
  emEstoque: z.boolean(),
  categorias: z.array(z.string())
});
```

Isso não é o modelo "tentando obedecer" — é uma restrição na geração. Token que quebraria o schema tem probabilidade zerada.

### Tool use como saída estruturada

Antes de existir structured output, o truque era declarar uma tool com o schema desejado e forçar o modelo a chamá-la ([[5 - Function calling]]). O argumento da chamada era o dado estruturado. Ainda funciona e é útil quando o provedor não tem structured output nativo.

### Validar mesmo assim

Schema garante formato, **não** garante semântica:

```typescript
const resultado = Produto.safeParse(saida);
if (!resultado.success) { /* retry ou fallback */ }

if (resultado.data.preco < 0) { /* formato válido, valor absurdo */ }
```

Preço negativo, data no futuro, categoria que não existe no meu catálogo — tudo isso passa no schema. A saída do modelo é entrada não confiável, sempre ([[2 - Como um prompt é montado]]).

Restringir com `enum` ajuda bastante:

```python
class Classificacao(BaseModel):
    sentimento: Literal["positivo", "negativo", "neutro"]
    confianca: float
```

Sem o `Literal`, aparece "levemente positivo", "misto", "positive" — e o `switch` no meu código não trata nenhum deles.

### Detalhes práticos

- **temperature 0** ([[3 - Temperature e amostragem]])
- **campos com nome descritivo.** `data_de_vencimento` funciona melhor que `dt`. O nome do campo é instrução
- **description no schema** é lido pelo modelo. Uso pra explicar formato: `"data no formato YYYY-MM-DD"`
- **campo de raciocínio primeiro.** Como o modelo gera em ordem, um campo `raciocinio` antes de `resposta` melhora a qualidade — ele "pensa" antes de decidir. Ordem importa
- **opcional é armadilha.** Se o campo pode faltar, o modelo tende a omitir. Melhor obrigatório com valor explícito pra ausência (`null`, `"nao_informado"`)

### Onde uso

- extrair dado de documento (nota fiscal, currículo, contrato)
- classificar com rótulo fixo
- gerar filtro de busca a partir de linguagem natural
- decidir o próximo passo num agent ([[13 - Agents - o loop]])

Nesse último é o que torna agent viável: sem saída estruturada confiável, não dá pra rotear a decisão do modelo pro código.
