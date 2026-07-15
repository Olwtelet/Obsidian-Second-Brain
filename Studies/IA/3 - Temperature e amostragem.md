Nota curta. O modelo não escolhe "a" próxima palavra — ele produz uma **distribuição de probabilidade** sobre todos os tokens do vocabulário. Os parâmetros de amostragem decidem como sortear a partir dela.

```
"O céu está" ->  azul     42%
                 nublado  18%
                 limpo    11%
                 escuro    7%
                 ...
```

### Temperature

Achata ou afia a distribuição antes do sorteio.

- `0` — sempre o mais provável. Determinístico (quase — ver abaixo)
- `0.7` — padrão da maioria das APIs, equilíbrio
- `1.5+` — achata muito, começa a sair coisa incoerente

Como eu uso:

| Tarefa | Temperature |
|---|---|
| extração, classificação, JSON | 0 |
| resposta de RAG | 0 – 0.3 |
| escrita, brainstorm | 0.7 – 1.0 |

Temperature 0 **não garante** saída idêntica. Batching no servidor e aritmética de ponto flutuante em GPU introduzem variação. Pra reprodutibilidade real, alguns provedores oferecem `seed` — e ainda assim é "best effort".

### top_p

Nucleus sampling: considera só os tokens que somam `p` de probabilidade acumulada.

`top_p = 0.9` → pega os candidatos do topo até somar 90% e ignora a cauda.

A diferença pra temperature: top_p **corta** opções ruins, temperature **reescala** as chances. Top_p se adapta — quando o modelo está confiante, sobram poucos candidatos; quando está incerto, sobram muitos.

A recomendação de todo provedor é **mexer em um dos dois**, não nos dois juntos, senão a interação fica imprevisível.

### Os outros

- **top_k** — só os k mais prováveis. Mais grosseiro, menos usado hoje
- **frequency_penalty** — penaliza token pela quantidade de vezes que já apareceu
- **presence_penalty** — penaliza por ter aparecido, independente de quantas vezes
- **stop** — sequências que interrompem a geração (útil pra formato estruturado)
- **max_tokens** — teto de saída; se bater, corta no meio ([[1 - Tokens e context window]])

As penalties servem pra evitar repetição em texto longo. Valor alto começa a forçar o modelo a evitar palavras necessárias, e o texto fica esquisito.

### Um erro que eu cometia

Temperature alta pra "ficar mais criativo" numa tarefa de extração de dados. Resultado: JSON com campo inventado, formato variando entre chamadas, e um bug que só aparecia às vezes.

Se a tarefa tem **uma resposta certa**, temperature 0. Criatividade ali é ruído.

### O contrário também

Temperature 0 em geração de texto deixa a saída repetitiva e sem graça — o modelo pega sempre o caminho mais provável, que é o mais genérico.

E pra gerar N alternativas, temperature 0 devolve N vezes a mesma coisa.

### Modelo de raciocínio

Os modelos com raciocínio estendido normalmente **ignoram** temperature, ou recomendam deixar no padrão. O controle ali é o esforço de raciocínio, não a amostragem. Vale ler a doc do modelo específico antes de assumir que os parâmetros de sempre valem.
