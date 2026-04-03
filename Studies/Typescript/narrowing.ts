// Narrowing é o TS estreitando um tipo largo conforme eu vou provando coisas sobre ele.
// O compilador acompanha o fluxo do código (control flow analysis).

function processar(valor: string | number) {
    // aqui valor é string | number

    if (typeof valor === "string") {
        valor.toUpperCase(); // aqui é string
    } else {
        valor.toFixed(2);    // aqui é number, o TS deduziu por eliminação
    }
}


// As formas de estreitar:

// 1. typeof -> primitivos
function f1(x: string | number | boolean) {
    if (typeof x === "boolean") return !x;
    return x;
}

// 2. truthiness -> tira null e undefined
function f2(nome?: string) {
    if (!nome) return "anônimo";
    return nome.trim(); // string
}

// 3. igualdade
function f3(a: string | number, b: string | boolean) {
    if (a === b) {
        // só string satisfaz os dois lados -> a e b viram string aqui
        a.toUpperCase();
    }
}

// 4. in -> checa propriedade
type Peixe = { nadar: () => void };
type Passaro = { voar: () => void };

function mover(animal: Peixe | Passaro) {
    if ("nadar" in animal) {
        animal.nadar();
    } else {
        animal.voar();
    }
}

// 5. instanceof -> classes
function tratarErro(e: unknown) {
    if (e instanceof Error) {
        console.log(e.message); // sem isso, e.message não compila
    }
}
// Isso é obrigatório desde que catch passou a tipar como unknown.
// Todo try/catch meu começa assim agora.


// ---------- Discriminated union ----------
// O padrão mais útil disso tudo: uma propriedade literal em comum que serve de etiqueta.

type EstadoRequisicao =
    | { status: "carregando" }
    | { status: "sucesso"; dados: string[] }
    | { status: "erro"; mensagem: string };

function render(estado: EstadoRequisicao) {
    switch (estado.status) {
        case "carregando":
            return "Carregando...";
        case "sucesso":
            return estado.dados.join(", "); // só existe aqui
        case "erro":
            return estado.mensagem;         // só existe aqui
    }
}

// A vantagem grande: é impossível acessar dados quando status é "erro".
// Isso mata aquele padrão feio de { loading, data, error } todos opcionais,
// onde o tipo permite loading=true E data preenchido ao mesmo tempo.


// ---------- Exhaustiveness com never ----------
// never é o tipo que não aceita valor nenhum. Se todos os casos foram tratados,
// o que sobra no default é never.

function renderSeguro(estado: EstadoRequisicao): string {
    switch (estado.status) {
        case "carregando": return "Carregando...";
        case "sucesso": return estado.dados.join(", ");
        case "erro": return estado.mensagem;
        default:
            const naoTratado: never = estado;
            throw new Error(`estado não tratado: ${naoTratado}`);
    }
}

// Se amanhã eu adicionar { status: "vazio" } na union e esquecer do switch,
// o default deixa de ser never e o build quebra. O compilador vira checklist.


// ---------- Type predicate ----------
// Quando a checagem é complexa demais pro TS deduzir sozinho, eu ensino a ele.

function ehUsuario(valor: unknown): valor is { id: string; nome: string } {
    return (
        typeof valor === "object" &&
        valor !== null &&
        "id" in valor &&
        "nome" in valor
    );
}

const resposta: unknown = JSON.parse("{}");
if (ehUsuario(resposta)) {
    resposta.nome; // agora existe
}

// Cuidado: o TS ACREDITA no predicate. Se eu escrever a checagem errada,
// ele não reclama - eu criei um buraco no sistema de tipos na mão.
// Pra validar dado que vem de fora de verdade, zod resolve melhor.
