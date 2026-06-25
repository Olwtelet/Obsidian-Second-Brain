Nota curta.

```
MAJOR . MINOR . PATCH
  2   .   4   .   1
```

- **MAJOR** — mudança que **quebra** quem usa
- **MINOR** — funcionalidade nova, compatível
- **PATCH** — correção, compatível

A pergunta que decide: *quem já usa a versão anterior precisa mexer no código?* Se sim, é major.

### O que quebra

- remover ou renomear função, campo ou parâmetro
- tornar parâmetro opcional em obrigatório
- mudar tipo de retorno
- mudar comportamento padrão

O que **não** quebra: adicionar função nova, adicionar campo opcional, corrigir bug.

Esse último tem exceção: se alguém já depende do comportamento errado, corrigir quebra. É o [Hyrum's Law](https://www.hyrumslaw.com/) — com usuários suficientes, todo comportamento observável vira contrato de alguém.

### 0.x

`0.x.y` significa "instável, pode quebrar a qualquer momento". Por convenção, em `0.x` o **minor** faz o papel de major.

Por isso `^0.3.1` no npm **não** aceita `0.4.0` — o npm trata 0.x de forma especial ([[3 - package.json e npm]]).

### Pré-lançamento

```
1.0.0-alpha.1  <  1.0.0-beta.1  <  1.0.0-rc.1  <  1.0.0
```

Pré-release tem precedência **menor** que a versão final.

### Tag no Git

```bash
git tag -a v1.2.0 -m "versão 1.2.0"
git push origin v1.2.0
```

`-a` cria tag anotada (objeto com autor, data e mensagem). Tag leve é só um ponteiro. Pra release, sempre anotada.

Tag é imutável por convenção. Se saiu errado, publica `v1.2.1`, não move a tag — alguém já pode ter baixado.

A tag é o que costuma disparar o pipeline de release ([[8 - CI-CD]]):

```yaml
on:
  push:
    tags: ["v*"]
```

### Conventional commits fecham o ciclo

```
feat: adiciona busca por tag        -> minor
fix: corrige cálculo de frete       -> patch
feat!: remove endpoint /v1/legado   -> major
```

Com isso, `semantic-release` ou `changesets` calculam a versão, geram o CHANGELOG e publicam sozinhos. A mensagem de commit deixa de ser só documentação e vira entrada de processo.

### Onde isso aparece pra mim

- **publicar lib** — obrigatório, é o contrato com quem usa
- **API** — `/v1/`, `/v2/`. Mesma lógica de "quebra ou não quebra" ([[3 - REST na prática]])
- **imagem Docker** — `minha-api:1.4.2` além de `:latest`. Usar só `latest` em produção é impossível de auditar e de reverter ([[2 - Dockerfile]])
- **schema de banco** — migration numerada é a versão do schema

### O bom de saber isso

Quando vejo `^` no package.json, sei exatamente o risco que estou correndo: aceito qualquer minor/patch, confiando que o autor respeita semver.

E quando algo quebra depois de um `npm update`, a primeira pergunta é: alguém publicou breaking change em minor? Acontece mais do que deveria.
