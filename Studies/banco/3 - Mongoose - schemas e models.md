Mongoose é um ODM: coloca de volta o schema que o Mongo não exige. Como o schema tem que existir em algum lugar ([[1 - Relacional x documental]]), melhor ele estar declarado do que espalhado em `if` pelo código.

### Schema e model

```javascript
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nome:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senhaHash: { type: String, required: true, select: false },
  papel: { type: String, enum: ["usuario", "admin"], default: "usuario" },
  ativo: { type: Boolean, default: true }
}, {
  timestamps: true   // cria createdAt e updatedAt sozinho
});

export const Usuario = mongoose.model("Usuario", usuarioSchema);
```

- **schema** = a forma
- **model** = a classe que fala com a collection

O Mongoose pluraliza e minúsculiza o nome do model pra achar a collection: `"Usuario"` → `usuarios`.

`select: false` no hash de senha é ótimo: ele não vem em query nenhuma a menos que eu peça explicitamente com `.select("+senhaHash")`. Evita vazar por descuido num `res.json(usuario)`.

### unique não é validação

Detalhe que confunde: `unique: true` **não** é um validador, é um atalho pra criar índice único. Consequências:

- o erro vem do banco (código 11000), não do Mongoose, e a mensagem é feia
- se a collection já tinha duplicata, o índice não é criado e nada avisa
- em produção, `autoIndex` costuma ficar desligado — o índice precisa ser criado por migration

### Middleware (hooks)

```javascript
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("senhaHash")) return next();
  this.senhaHash = await bcrypt.hash(this.senhaHash, 12);
  next();
});
```

`this` é o documento — então **não pode ser arrow function** ([[this.js]]).

O `isModified` evita re-hashear a senha toda vez que salvo qualquer campo. Sem ele, o login quebra na segunda edição do usuário e leva um tempo pra descobrir o motivo.

Pegadinha grande: hook de `save` **não roda** em `updateOne`, `findOneAndUpdate` ou `insertMany`. São caminhos diferentes. Se a regra é obrigatória, tem que ter hook em `pre("findOneAndUpdate")` também, ou centralizar a escrita numa camada só ([[8 - Camadas de uma API]]).

### Métodos e virtuals

```javascript
usuarioSchema.methods.senhaConfere = function (senha) {
  return bcrypt.compare(senha, this.senhaHash);
};

usuarioSchema.statics.porEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

usuarioSchema.virtual("primeiroNome").get(function () {
  return this.nome.split(" ")[0];
});
```

- `methods` → na instância
- `statics` → no model
- `virtual` → campo calculado, não vai pro banco (precisa de `toJSON: { virtuals: true }` pra aparecer no `res.json`)

### lean

Por padrão o Mongoose devolve documentos "vivos", com métodos, getters e change tracking. Isso custa.

```javascript
const usuarios = await Usuario.find().lean();
```

`lean()` devolve objeto JS puro. Bem mais rápido e com menos memória. Uso sempre que a query é só pra **ler e devolver** — que é a maioria dos GET. Sem `lean` não dá pra chamar `.save()`, o que nesse caso é justamente o que eu quero.

### Populate

```javascript
const pedidoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
  itens: [{ produto: String, preco: Number, qtd: Number }]
});

const pedido = await Pedido.findById(id).populate("usuario", "nome email");
```

`populate` **não é JOIN**. É o Mongoose fazendo uma segunda query e costurando o resultado no cliente. Numa lista de 50 pedidos, sem cuidado, viram 51 queries — o problema N+1 clássico. O Mongoose agrupa por ids, o que ajuda, mas a segunda ida ao banco continua existindo.

Se eu preciso do nome do usuário em **toda** listagem de pedido, embutir (`{ id, nome }`) resolve melhor que popular sempre ([[5 - Modelar relações no Mongo]]).

### Conexão

```javascript
let conexao = null;

export async function conectar() {
  if (conexao) return conexao;
  conexao = await mongoose.connect(env.DATABASE_URL);
  return conexao;
}
```

O Mongoose já mantém pool interno. Conectar uma vez no boot e reusar. Em serverless isso é crítico: cada invocação abrindo conexão nova estoura o limite do cluster rápido — por isso o padrão de cachear a promise em variável de módulo, que sobrevive entre invocações no mesmo container ([[2 - Módulos - CommonJS x ESM]]).

### Vale a pena?

Se o projeto é TypeScript e eu já uso zod na borda, tem duplicação: schema do zod + schema do Mongoose. Nesses casos o driver puro ou Prisma podem ser mais diretos.

Mongoose ganha quando quero hooks, validação e populate prontos, e não me importo com a camada a mais.
