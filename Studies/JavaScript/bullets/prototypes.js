// JS não tem herança de classe de verdade por baixo. Tem PROTOTYPE.
// Todo objeto tem um link interno pra outro objeto (o prototype dele).
// Quando eu peço uma propriedade e ela não existe, o JS sobe por esse link até achar ou chegar em null.
// Isso é a "prototype chain".

const animal = {
    respirar() {
        console.log("respirando...");
    }
}

const cachorro = Object.create(animal); // o prototype de cachorro é animal
cachorro.latir = function () {
    console.log("au au");
}

cachorro.latir();    // achou direto no objeto
cachorro.respirar(); // não achou -> subiu pro animal -> achou lá

console.log(Object.getPrototypeOf(cachorro) === animal); // true


// A cadeia sempre termina do mesmo jeito:
// cachorro -> animal -> Object.prototype -> null


// Function constructor (jeito antigo, mas é o que explica o resto)

function Personagem(nome, vida) {
    this.nome = nome;
    this.vida = vida;
}

// Se eu colocasse o método dentro do constructor, cada instância teria uma CÓPIA da função.
// Colocando no prototype, existe uma função só, compartilhada por todas as instâncias.
Personagem.prototype.status = function () {
    console.log(`${this.nome}: ${this.vida} de vida`);
}

const heroi = new Personagem("Alice", 100);
const vilao = new Personagem("Goblin", 40);

heroi.status();
vilao.status();

console.log(heroi.status === vilao.status); // true -> é a mesma função


// class é açúcar sintático em cima disso

class Personagem2 {
    constructor(nome, vida) {
        this.nome = nome;
        this.vida = vida;
    }
    status() {
        console.log(`${this.nome}: ${this.vida} de vida`);
    }
}

// status continua morando no prototype:
console.log(Object.getOwnPropertyNames(Personagem2.prototype)); // [ 'constructor', 'status' ]

// Ou seja: class não trouxe um modelo novo de herança pro JS, só uma sintaxe melhor
// pra montar a mesma prototype chain que já existia.

/*
Duas coisas que eu sempre confundo:

- __proto__ (ou getPrototypeOf) é o link do OBJETO pro prototype dele.
- .prototype é uma propriedade que só FUNÇÕES têm. É o objeto que vai virar
  o prototype das instâncias criadas com new.

heroi.__proto__ === Personagem.prototype  // true
*/
