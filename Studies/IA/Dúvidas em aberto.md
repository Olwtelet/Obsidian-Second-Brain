Coisas que ficaram sem resposta enquanto eu estudava. Deixando registrado pra não esquecer de voltar.

- Qual o tamanho de chunk que realmente funciona **em português**? Todo benchmark que vi é em inglês, e a tokenização é diferente ([[8 - Chunking]]). Suspeito que os números recomendados não traduzem direto.

- Vale a pena manter um índice **por idioma** ou um só multilíngue? Embedding multilíngue coloca "cancel subscription" e "cancelar assinatura" perto, o que é bom pra recall e talvez ruim pra precisão.

- Como medir se o **reranker** compensa sem montar um conjunto de teste grande? A intuição diz que compensa, mas isso é exatamente o tipo de coisa que eu deveria medir em vez de achar ([[12 - Avaliação de respostas]]).

- Quando o RAG deveria **desistir** e dizer "não sei" em vez de responder com o melhor chunk disponível? Existe threshold confiável ou tem que ser um classificador separado? O score de similaridade sozinho não serve ([[7 - Similaridade e busca vetorial]]).

- Reindexar quando o documento muda: dá pra fazer incremental de verdade, ou na prática todo mundo reprocessa tudo? Se o chunking é contextual, mudar um parágrafo pode mudar chunks vizinhos.

- **Prompt injection** — li várias mitigações e nenhuma resolve. Existe alguma abordagem estrutural em desenvolvimento, tipo canal separado pra instrução e dado? Ou o consenso é mesmo "limite o dano" ([[2 - Como um prompt é montado]])?

- Custo de agent em produção: como as pessoas limitam isso? Orçamento por execução parece o mínimo, mas o que acontece quando estoura no meio de uma tarefa útil ([[13 - Agents - o loop]])?

- Fine-tuning pequeno (LoRA) vale a pena pra **formato** de saída, agora que structured output resolve boa parte? Parece que o caso de uso encolheu.

- Cache de resposta de LLM: dá pra cachear por similaridade de pergunta em vez de match exato? Parece perigoso — duas perguntas parecidas podem exigir respostas diferentes.

---

Pra revisitar depois de montar um pipeline de verdade e ter dado pra olhar. Metade dessas provavelmente se responde sozinha na hora de implementar.
