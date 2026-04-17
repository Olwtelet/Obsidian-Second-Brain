O `package.json` é o manifesto do projeto. Quem chega no código lê ele primeiro pra saber o que o projeto é (anotei isso em [[Arqueólogo de código]] também).

### Campos que importam

```json
{
  "name": "minha-api",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "dev": "node --watch src/index.js",
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^4.19.2"
  },
  "devDependencies": {
    "typescript": "~5.4.5"
  },
  "engines": {
    "node": ">=20"
  }
}
```

`dependencies` x `devDependencies`: o que a aplicação precisa **rodando** vs o que só é usado pra desenvolver/buildar. Isso importa de verdade no Docker — `npm ci --omit=dev` corta metade da imagem final.

### Os símbolos de versão

Isso amarra com [[7 - Semantic versioning e tags]]:

| Símbolo | Exemplo | Aceita |
|---|---|---|
| `^` | `^4.19.2` | 4.x.x — minor e patch |
| `~` | `~4.19.2` | 4.19.x — só patch |
| exato | `4.19.2` | só essa |
| `*` | `*` | qualquer (nunca use) |

O `^` é o padrão do npm. Ele confia que o autor respeita semver — o que nem sempre é verdade.

### package-lock.json

O `package.json` diz "aceito 4.x". O lock diz "hoje está instalado exatamente 4.19.2, com esse hash". É o lock que garante que a máquina do colega e o CI instalem **a mesma árvore**.

Por isso:
- lock vai pro Git, sempre
- `npm install` pode atualizar o lock
- `npm ci` **não** atualiza: apaga `node_modules` e instala exatamente o que está no lock, e falha se o lock estiver dessincronizado do package.json

Regra prática: `npm install` na minha máquina quando estou mexendo em dependência, `npm ci` no CI e no Docker.

### Scripts

`npm run <nome>` roda com `node_modules/.bin` no PATH, por isso `"test": "vitest"` funciona sem instalar nada global.

`start`, `test` e `restart` são especiais e rodam sem o `run`. O resto precisa: `npm run dev`.

Tem hook automático por prefixo:

```json
{
  "scripts": {
    "prebuild": "rm -rf dist",
    "build": "tsc",
    "postbuild": "cp .env.example dist/"
  }
}
```

`pre` e `post` rodam sozinhos em volta do script de mesmo nome.

### npx

`npx` executa um binário sem instalar permanente. `npx create-next-app` baixa, roda, descarta. Se o pacote já estiver em `node_modules`, ele usa o local em vez de baixar.

### Coisas que aprendi na marra

- `npm ls <pacote>` mostra quem trouxe aquela dependência transitiva
- `npm outdated` lista o que está atrás; `npm audit` lista vulnerabilidade conhecida
- `"overrides"` força a versão de uma dependência de dependência quando a lib de cima não atualizou
- apagar `node_modules` e o lock pra "resolver" um problema costuma trocar um problema por outro — o lock existe justamente pra evitar isso
