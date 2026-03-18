// O this no JS não é definido por ONDE a função foi escrita, e sim por COMO ela foi chamada.
// Isso é o oposto do que eu esperava vindo de outras linguagens.

// 1. Chamada como método -> this é o objeto antes do ponto

const jogador = {
    nome: "Alice",
    saudacao() {
        console.log(`Olá, eu sou ${this.nome}`);
    }
}

jogador.saudacao(); // "Olá, eu sou Alice"  -> this = jogador


// 2. Chamada solta -> this é undefined (strict mode) ou o global

const funcaoSolta = jogador.saudacao;
funcaoSolta(); // this.nome é undefined
// A função é a MESMA. O que mudou foi a chamada. Isso é o ponto todo.


// 3. Arrow function não tem this proprio -> ela pega do escopo de fora

const inimigo = {
    nome: "Goblin",
    atacarNormal: function () {
        setTimeout(function () {
            console.log(`${this.nome} atacou`); // undefined -> o this do setTimeout não é o inimigo
        }, 100);
    },
    atacarArrow: function () {
        setTimeout(() => {
            console.log(`${this.nome} atacou`); // "Goblin" -> a arrow herdou o this de atacarArrow
        }, 100);
    }
}

inimigo.atacarNormal();
inimigo.atacarArrow();


// 4. bind / call / apply -> forçar o this na mão

function apresentar(nivel) {
    console.log(`${this.nome} está no nível ${nivel}`);
}

apresentar.call(jogador, 99);     // argumentos soltos
apresentar.apply(jogador, [99]);  // argumentos em array
const apresentarJogador = apresentar.bind(jogador); // devolve uma função nova com o this fixo
apresentarJogador(99);


// 5. new -> this vira o objeto recém criado

function Personagem(nome) {
    this.nome = nome; // this = o objeto novo
}
const p = new Personagem("Sofia");
console.log(p.nome);

/*
Ordem de precedência quando eu ficar em dúvida:
new  >  bind/call/apply  >  chamada como método (obj.fn())  >  chamada solta

Arrow function fica fora dessa lista: ela nunca cria this proprio,
então essas regras não se aplicam a ela.
*/
