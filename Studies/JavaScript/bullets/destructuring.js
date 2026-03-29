// Destructuring é só uma forma curta de tirar valores de dentro de array/objeto.

const numeros = [1, 2, 3, 4, 5];

const [primeiro, segundo] = numeros;
const [, , terceiro] = numeros;        // pulando posições com vírgula
const [cabeca, ...resto] = numeros;    // resto = [2, 3, 4, 5]


const usuario = {
    nome: "Alice",
    idade: 28,
    endereco: { cidade: "Recife" }
};

const { nome, idade } = usuario;
const { nome: nomeUsuario } = usuario;          // renomeando
const { apelido = "sem apelido" } = usuario;    // valor padrão quando é undefined
const { endereco: { cidade } } = usuario;       // aninhado


// Em parâmetro de função é onde mais uso:

function criarCard({ titulo, descricao = "", ativo = true }) {
    console.log(titulo, descricao, ativo);
}

criarCard({ titulo: "Olá" });

// Vantagem: quem chama não precisa lembrar a ORDEM dos argumentos, só o nome.
// Desvantagem: se eu chamar criarCard() sem nada, quebra. Pra proteger:

function criarCard2({ titulo } = {}) { }


// Spread e rest são o mesmo operador (...) em posições diferentes

// SPREAD -> espalha
const a = [1, 2];
const b = [3, 4];
const juntos = [...a, ...b];              // [1,2,3,4]
const copia = { ...usuario, idade: 29 };  // copia e sobrescreve idade

// REST -> junta o que sobrou
function somar(...valores) {
    return valores.reduce((acc, n) => acc + n, 0);
}
somar(1, 2, 3, 4); // 10

const { nome: _, ...semNome } = usuario; // tirando uma chave do objeto


// ATENÇÃO: spread é cópia RASA (shallow)

const original = { config: { tema: "dark" } };
const clone = { ...original };
clone.config.tema = "light";
console.log(original.config.tema); // "light"  <- mudou o original também!

// Porque config continua sendo a MESMA referência nos dois objetos.
// Pra cópia profunda: structuredClone(original)  (ou JSON.parse(JSON.stringify()) no jeito velho)


// Troca de variáveis sem temporária
let x = 1, y = 2;
[x, y] = [y, x];
