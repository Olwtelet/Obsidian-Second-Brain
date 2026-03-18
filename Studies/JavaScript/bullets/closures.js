// Closure é quando uma função "lembra" do escopo onde ela foi criada, mesmo depois que esse escopo terminou.
// A parte que confunde: a função não guarda uma cópia do valor, ela guarda a referência à variável.

function criarContador() {
    let contagem = 0; // essa variavel deveria "morrer" quando criarContador termina

    return function () {
        contagem++;
        return contagem;
    }
}

const contador = criarContador();
console.log(contador()); // 1
console.log(contador()); // 2
console.log(contador()); // 3

// contagem continua viva porque a função interna ainda aponta pra ela.
// E ninguem de fora consegue mexer no valor direto -> isso é encapsulamento sem class.


// Cada chamada cria um escopo NOVO:

const contadorA = criarContador();
const contadorB = criarContador();

contadorA(); // 1
contadorA(); // 2
contadorB(); // 1  <- não é 3, é um closure separado


// O caso classico de erro (var no loop):

for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// imprime 3, 3, 3
// var é function-scoped, então só existe UM i. Quando o timeout roda, o loop já acabou e i === 3.

for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100);
}
// imprime 0, 1, 2
// let é block-scoped -> cada iteração cria um i novo, e cada callback fecha em cima do seu próprio i.


// Uso pratico: guardar configuração sem repetir

function criarRequisicao(baseUrl) {
    return function (rota) {
        return fetch(`${baseUrl}${rota}`);
    }
}

const api = criarRequisicao("https://api.exemplo.com");
api("/usuarios");
api("/produtos");

// baseUrl fica preso no closure. Não preciso passar de novo toda vez.

/*
Resumo do que preciso lembrar:
- closure = função + o escopo onde ela nasceu
- guarda referência, não cópia
- é a base de factory function, módulo, currying e de quase todo hook do React
*/
