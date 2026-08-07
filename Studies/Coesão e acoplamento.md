Dois conceitos que aparecem em toda discussão de arquitetura e que eu usava sem definir direito.

- **Coesão** — o quanto as coisas *dentro* de um módulo pertencem umas às outras. Quero **alta**.
- **Acoplamento** — o quanto um módulo depende de *outro*. Quero **baixo**.

A frase de sempre é "alta coesão, baixo acoplamento". A parte que faltava pra mim: **os dois estão ligados**. Módulo com coesão baixa faz coisa demais, e por isso precisa conhecer muita gente — ou seja, acopla mais. Melhorar um costuma melhorar o outro.

### Coesão baixa

O clássico é o arquivo `utils.js`:

```
utils.js
  formatarData()
  validarCPF()
  calcularFrete()
  enviarEmail()
  slugify()
```

Nada ali tem relação com nada. O arquivo cresce pra sempre e ninguém sabe o que tem dentro. `helpers`, `common`, `misc` e `shared` são todos o mesmo cheiro.

O teste: consigo descrever o módulo em uma frase sem usar "e"? "Formata e valida e calcula" é coesão baixa.

Reagrupado por assunto:

```
faturamento/frete.js
usuarios/validacao.js
notificacoes/email.js
```

Isso é o mesmo princípio de responsabilidade única do SOLID ([[3 - Solid]]), aplicado no arranjo dos arquivos em vez de na classe.

### Acoplamento alto

```javascript
class ServicoPedido {
  constructor() {
    this.db = new MongoClient(process.env.DATABASE_URL);  // conhece o banco
    this.email = new SendGridClient(process.env.SG_KEY);  // conhece o provedor
  }
}
```

Esse serviço está preso ao Mongo, ao SendGrid e a duas variáveis de ambiente. Não dá pra testar sem os dois, nem trocar nenhum sem editá-lo.

```javascript
class ServicoPedido {
  constructor({ pedidoRepo, notificador }) { /* ... */ }
}
```

Agora depende de **capacidade**, não de implementação ([[Injeção de dependência]], [[8 - Camadas de uma API]]).

### Os graus

Do pior pro melhor:

1. **de conteúdo** — mexe no interno do outro (`obj._cachePrivado`)
2. **comum** — compartilham estado global mutável
3. **de controle** — passa uma flag que muda o comportamento do outro (`salvar(dados, true)` — true o quê?)
4. **de dados** — passa só o que o outro precisa. É o alvo

Uma forma de acoplamento que é fácil de deixar passar é o **temporal**: A tem que ser chamado antes de B, mas nada no código diz isso. `init()` que precisa rodar antes de `processar()` e explode com erro obscuro se esquecer.

### O sinal na prática

Não preciso classificar nada pra perceber. Os sintomas são:

- mudar uma coisa quebra três arquivos não relacionados
- pra entender uma função preciso abrir cinco arquivos
- testar exige montar meio sistema
- dois desenvolvedores não conseguem trabalhar em paralelo sem conflito

O teste de teste é bom: se pra testar uma regra de negócio eu preciso de banco, HTTP e 6 mocks, o acoplamento está alto ([[3 - Test doubles]]). Teste difícil de escrever quase sempre é feedback de design.

### O outro lado

Desacoplar tem custo: mais arquivos, mais indireção, mais abstração pra atravessar.

Acoplamento **zero** também é ruim — vira código genérico demais, com interface pra tudo e nenhuma delas com mais de uma implementação. Isso tem nome: over-engineering.

O critério que eu tento usar: desacoplar no que **realmente muda**. Provedor de e-mail muda; banco raramente muda; a linguagem nunca muda. Criar abstração pra trocar de banco "um dia" é pagar hoje por algo que provavelmente não acontece.

Coisas que costumam valer: acesso a dado, serviço externo, relógio (`Date.now`), aleatoriedade. As três últimas são justamente as que tornam o teste imprevisível.

E o oposto: acoplamento **entre módulos** é caro; dentro de um módulo coeso é normal e barato. Não é pra desacoplar tudo de tudo.
