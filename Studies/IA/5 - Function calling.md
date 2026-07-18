O modelo não executa nada. Ele **pede** que eu execute e me diz com quais argumentos. Quem roda o código sou eu.

Isso demorou pra entrar na minha cabeça. "Function calling" soa como se o modelo chamasse a função. Não chama — ele devolve uma intenção estruturada ([[4 - Structured output]]).

### O fluxo

1. Declaro as ferramentas disponíveis, com schema
2. Mando a pergunta do usuário junto
3. O modelo responde com texto **ou** com uma chamada de ferramenta
4. Se for chamada, **eu** executo e devolvo o resultado como mensagem
5. O modelo usa o resultado pra responder

```javascript
const ferramentas = [{
  name: "buscar_clima",
  description: "Retorna o clima atual de uma cidade",
  input_schema: {
    type: "object",
    properties: {
      cidade: { type: "string", description: "Nome da cidade" },
      unidade: { type: "string", enum: ["celsius", "fahrenheit"] }
    },
    required: ["cidade"]
  }
}];
```

Modelo responde:

```json
{
  "type": "tool_use",
  "name": "buscar_clima",
  "input": { "cidade": "Recife", "unidade": "celsius" }
}
```

Eu executo e devolvo:

```json
{ "role": "user", "content": [{ "type": "tool_result", "content": "28°C, parcialmente nublado" }] }
```

E o modelo formula a resposta final.

### A descrição é o prompt

O `description` da ferramenta e de cada parâmetro é o que o modelo lê pra decidir se e como usar. Descrição ruim = ferramenta errada na hora errada.

```javascript
// ruim
{ name: "get_data", description: "pega dados" }

// bom
{
  name: "buscar_pedidos_do_usuario",
  description: "Lista os pedidos de um usuário. Use quando perguntarem sobre histórico de compras, status de pedido ou entregas. Não use para consultar produtos do catálogo."
}
```

Dizer **quando não usar** ajuda tanto quanto dizer quando usar.

### Chamadas em paralelo

O modelo pode pedir várias de uma vez quando são independentes:

```json
[
  { "name": "buscar_clima", "input": { "cidade": "Recife" } },
  { "name": "buscar_clima", "input": { "cidade": "São Paulo" } }
]
```

Executo com `Promise.all` e devolvo todos os resultados juntos ([[promises]]).

### Erro é resultado

Quando a ferramenta falha, devolvo o erro **como conteúdo**, não deixo estourar:

```json
{ "type": "tool_result", "is_error": true, "content": "Cidade não encontrada" }
```

O modelo lê e reage: tenta outra grafia, pergunta ao usuário, ou explica que não conseguiu. Se eu jogar exceção, o loop morre e o usuário vê uma tela de erro genérica.

### Segurança — a parte que importa

Ferramenta é **superfície de ataque**. O que decide chamá-la é um modelo que pode ser manipulado por texto ([[2 - Como um prompt é montado]]).

Então:

**Permissão do usuário, não do sistema.** A tool executa com o mesmo escopo de quem está pedindo. Se o modelo pede `deletar_usuario(id)`, meu código checa se **esse** usuário pode ([[6 - Autenticação x Autorização]]).

**Validar os argumentos.** Eles vieram de um modelo. Tratar como body de requisição: schema, tipo, faixa, whitelist.

```javascript
// nunca
executarSQL(input.query);
executarShell(input.comando);

// sempre: operações fechadas com parâmetro validado
buscarPedidos({ usuarioId: req.usuario.id, status: validarStatus(input.status) });
```

**Confirmação humana** pra irreversível: enviar e-mail, pagar, deletar, publicar.

**Read-only por padrão.** Ferramenta que só lê é infinitamente menos perigosa. Começo por aí.

### MCP

O Model Context Protocol padroniza como expor ferramenta pro modelo. Em vez de cada aplicação implementar a integração do zero, um servidor MCP expõe tools/resources e qualquer cliente compatível consome.

A analogia que uso: MCP está pra ferramenta de LLM como REST está pra integração de sistemas — um contrato comum que evita N×M integrações.

### É a base de agent

Function calling é o mecanismo; agent é o **loop** em volta dele: chama ferramenta, lê resultado, decide o próximo passo, repete até terminar ([[13 - Agents - o loop]]).
