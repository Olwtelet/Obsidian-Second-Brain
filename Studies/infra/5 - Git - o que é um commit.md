Usava Git no automático (`add`, `commit`, `push`) até parar pra entender o modelo por baixo. Depois disso, quase todo comando "estranho" fez sentido.

### Não é diff, é snapshot

Eu achava que commit guardava as mudanças. **Não guarda.** Cada commit aponta pra uma árvore completa do projeto naquele momento.

Arquivo que não mudou não é duplicado — a árvore nova aponta pro mesmo blob. Git é content-addressable: o nome do objeto é o SHA-1 do conteúdo. Conteúdo igual = mesmo objeto, automaticamente.

O `git diff` é **calculado** na hora, comparando duas árvores. Não está armazenado.

### Os objetos

- **blob** — conteúdo de um arquivo (sem nome!)
- **tree** — diretório: lista de nomes → blobs e outras trees
- **commit** — aponta pra uma tree + pai(s) + autor + mensagem
- **tag** — ponteiro nomeado

```bash
git cat-file -p HEAD          # ver o commit cru
git cat-file -p HEAD^{tree}   # ver a árvore
```

Fazer isso uma vez esclarece mais que qualquer tutorial.

Como o commit inclui o hash do pai, mudar qualquer coisa no histórico muda **todos** os hashes dali pra frente. É isso que torna o histórico à prova de adulteração — e é por isso que rebase reescreve tudo.

### As três áreas

```
working directory  ->  staging (index)  ->  repositório
      git add              git commit
```

O staging é a parte que mais gente ignora e que é a mais útil. Ele deixa escolher **o que** entra no commit:

```bash
git add -p     # revisa hunk por hunk e escolhe
```

Uso isso sempre. Trabalhei em duas coisas ao mesmo tempo, `add -p` separa em dois commits coerentes. Isso é o que permite ter histórico limpo mesmo com trabalho bagunçado.

### Branch é um ponteiro

Branch é um arquivo com 40 caracteres dentro. É só isso.

```bash
cat .git/refs/heads/main   # o hash do último commit
```

Por isso criar branch é instantâneo e não custa nada. E `HEAD` é um ponteiro pro branch atual.

### Merge x rebase

```bash
git merge feature    # cria um commit de merge com dois pais
git rebase main      # reaplica meus commits em cima de main
```

- **merge** preserva a história como aconteceu. Grafo com bifurcação
- **rebase** reescreve pra parecer linear. Commits **novos** (hashes diferentes)

A regra: **nunca rebase em branch compartilhado**. Como os hashes mudam, quem já puxou fica com histórico divergente e o próximo `pull` vira um inferno.

O que eu faço: rebase no meu branch local pra atualizar com a main, merge pra integrar na main.

`git pull --rebase` evita aqueles commits "Merge branch 'main' of..." que não dizem nada.

### Nada se perde

```bash
git reflog
```

Registra **todo** movimento de HEAD, inclusive o que foi "apagado" por reset, rebase ou branch deletado. Objeto órfão fica no repositório uns 30 dias antes do gc.

Então quase tudo é recuperável:

```bash
git reflog
git reset --hard HEAD@{3}
```

Depois de descobrir o reflog, Git deixou de dar medo.

### Os três resets

```bash
git reset --soft HEAD~1    # desfaz o commit, mantém tudo no staging
git reset HEAD~1           # desfaz o commit e o staging, mantém arquivos
git reset --hard HEAD~1    # desfaz tudo. o único perigoso
```

`--soft` é o que uso pra refazer a mensagem ou juntar commits.

E pra desfazer algo **já enviado**, `revert`, que cria um commit novo em vez de reescrever:

```bash
git revert <hash>
```

### Mensagem de commit

O commit responde **por que**, não **o quê** — o quê está no diff.

```
ruim:  "correções"  /  "update"  /  "wip"
bom:   "corrige cálculo de frete quando o CEP não é encontrado"
```

Conventional commits (`feat:`, `fix:`, `chore:`) ajudam porque permitem gerar changelog e derivar a próxima versão automaticamente ([[7 - Semantic versioning e tags]]).

### .gitignore

```
node_modules/
.env
dist/
*.log
.DS_Store
```

Detalhe: `.gitignore` só vale pra arquivo **não rastreado**. Se já foi commitado, precisa tirar do índice:

```bash
git rm --cached .env
```

E se um segredo já foi commitado, tirar num commit novo **não resolve** — ele continua no histórico. O certo é rotacionar a chave. Reescrever histórico (filter-repo) só resolve se ninguém tiver clonado.
