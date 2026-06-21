Vi gestão de branches na pós ([[6 - Gestao de Branchs]]). Essa nota é pra fixar a parte que eu uso de verdade.

### Estratégias

**Git Flow** — `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`. Foi feito pra software com versão e release agendado (desktop, mobile). Pra web com deploy contínuo é cerimônia demais.

**GitHub Flow** — só `main` + branches curtos. Merge = deploy. Simples e é o que faz sentido pra aplicação web.

**Trunk-based** — todo mundo commita na main, branch dura horas. Exige feature flag e teste automatizado bom.

O que eu uso: GitHub Flow. Branch curto, PR, merge, deploy.

### Branch curto é o ponto

Quanto mais tempo o branch vive, pior o conflito. Branch de duas semanas é sofrimento garantido: o resto do time mexeu nos mesmos arquivos.

Se a feature é grande, quebrar em PRs pequenos que fazem sentido sozinhos. Feature flag permite mergear código incompleto sem ativar:

```javascript
if (flags.novoCheckout) { /* ... */ }
```

Melhor um flag temporário do que um branch de um mês.

### Rebase pra atualizar, merge pra integrar

```bash
git fetch origin
git rebase origin/main     # meu branch, ainda não compartilhado
```

Isso mantém meus commits em cima do que já está na main, e o PR fica com um diff limpo.

Se der conflito no meio do rebase:

```bash
# resolve os arquivos
git add .
git rebase --continue
# ou git rebase --abort pra desistir
```

Rebase resolve conflito **commit por commit**, o que pode significar resolver a mesma coisa várias vezes. Merge resolve uma vez só. Em conflito grande, merge é menos doloroso.

### Interativo pra limpar

```bash
git rebase -i HEAD~5
```

```
pick a1b2c3 adiciona validação
squash d4e5f6 corrige typo
squash 7g8h9i corrige typo de novo
reword j1k2l3 mensagem ruim
drop  m4n5o6 console.log esquecido
```

Aquele histórico de "wip", "wip 2", "agora vai" vira dois commits que contam a história de verdade. Faço isso antes de abrir o PR.

(Só no meu branch. Nunca no que já é compartilhado — [[5 - Git - o que é um commit]].)

### Pull Request

O PR não é burocracia, é onde a decisão fica registrada. Daqui a um ano, o `git blame` leva na linha → commit → PR → discussão que explica o **porquê**.

O que eu tento fazer:

- **pequeno**. Acima de ~400 linhas a revisão vira "LGTM" sem leitura de verdade
- **descrição com contexto** — o que muda, por quê, como testar
- **auto-review antes** — reler o próprio diff no GitHub pega debug esquecido e arquivo que não devia estar ali
- **um assunto por PR**. Refatoração + feature no mesmo PR é impossível de revisar

### Merge, squash ou rebase

- **merge commit** — preserva tudo, histórico com bifurcação
- **squash** — tudo vira um commit na main. É o que uso: main linear, um commit por feature, e o detalhe fica no PR
- **rebase merge** — reaplica os commits sem merge commit; só vale se cada commit for bom sozinho

### Code review

O que aprendi a olhar, em ordem:

1. resolve o problema descrito?
2. tem teste?
3. tem caso não tratado (null, lista vazia, erro de rede)?
4. algum risco de segurança? ([[11 - Segurança básica]])
5. dá pra entender daqui seis meses?

Estilo e formatação **não** entram — isso é trabalho de linter e formatter, não de humano. Discussão sobre ponto e vírgula em PR é desperdício puro.

E revisar é pedir, não mandar: "o que acontece se `itens` vier vazio aqui?" funciona melhor que "isso está errado". Quem revisa também erra.

### Proteger a main

- exigir PR (sem push direto)
- exigir CI verde ([[8 - CI-CD]])
- exigir pelo menos uma aprovação

Sem isso, um push distraído na main de sexta à noite é questão de tempo.
