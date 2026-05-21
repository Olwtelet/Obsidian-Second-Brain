Vi bastante modelo relacional na faculdade ([[BancoDados]], [[3 - Modelo entidade relacionamento]], [[5 - Normalização]]). Essa nota é pra fixar a **comparação**, porque é a decisão que eu tomo no começo de projeto e é cara de reverter.

### A diferença de fundo

Não é "tabela x JSON". É **onde mora o schema**.

- **Relacional** — o schema está no banco. Ele recusa dado fora do formato.
- **Documental** — o schema está na aplicação. O banco aceita quase tudo.

Isso muda quem é o responsável pela consistência. No Mongo, se meu código tiver um bug, o dado ruim entra e fica lá.

### Normalizado x embutido

Relacional normaliza: cada fato em um lugar só, junta com JOIN na hora de ler.

```sql
SELECT p.*, u.nome
FROM pedidos p
JOIN usuarios u ON u.id = p.usuario_id;
```

Documental embute: o documento já vem com o que costuma ser lido junto.

```javascript
{
  _id: ObjectId("..."),
  usuario: { id: "...", nome: "Alice" },  // duplicado de propósito
  itens: [
    { produto: "Teclado", preco: 250, qtd: 1 }
  ],
  total: 250
}
```

Uma leitura, sem join. Em troca, o nome da Alice está copiado em todo pedido dela — se ela mudar o nome, ou eu atualizo tudo, ou aceito que o pedido guarda o nome **da época**.

E, no caso de pedido, guardar o valor da época é o comportamento **certo**: a nota fiscal não pode mudar porque o preço do produto subiu. Isso me fez ver que duplicação nem sempre é erro — às vezes é snapshot histórico.

### Transação

Relacional tem ACID entre tabelas há décadas. É o motivo de dinheiro morar em Postgres.

O Mongo tem transação multi-documento desde a 4.0, mas o modelo dele é pensado pra **não precisar**: se tudo que muda junto está no mesmo documento, a escrita já é atômica de graça.

### Quando eu escolho o quê

**Relacional** quando:
- os dados têm relações fortes e são consultados de muitas formas diferentes
- integridade importa mais que velocidade de escrita (financeiro, estoque, matrícula)
- vai ter relatório e agregação em cima de várias entidades
- o modelo é estável e conhecido

**Documental** quando:
- os dados são lidos quase sempre no mesmo formato (o documento é o "shape" da tela)
- o schema varia entre registros (catálogo com atributos diferentes por categoria)
- prototipagem rápida, modelo ainda mudando
- hierarquia natural (post com comentários, formulário com respostas)

### Onde eu já errei

Usar Mongo por achar que era "mais fácil por não ter schema", e depois descobrir que preciso de JOIN em quatro coleções pra montar uma tela. `$lookup` existe, mas é lento e desconfortável — é o banco fazendo o que ele foi feito pra evitar.

O sinal de que escolhi errado: estou modelando **tabelas** dentro do Mongo. Se todo documento tem só ids apontando pra outros documentos, eu queria um relacional.

### Regra que eu tirei disso

No relacional eu modelo pelos **dados** (o que é verdade sobre o domínio) e as consultas se viram.
No documental eu modelo pelas **consultas** (o que a tela precisa) e a estrutura segue.

Modelar Mongo do jeito relacional é o erro mais comum, e eu cometi.

### E dá pra usar os dois

Postgres tem coluna `jsonb` com índice, que resolve bem a parte "flexível" sem abrir mão de transação e JOIN. Pra muito caso de "preciso de um pouco de schema livre", isso basta e evita um segundo banco.

O caminho contrário — Mongo tentando ser relacional — não funciona tão bem.

[[2 - MongoDB - documentos e collections]]
