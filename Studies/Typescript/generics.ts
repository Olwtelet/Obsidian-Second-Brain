// Generic é um tipo que eu deixo em aberto e quem usa preenche.
// O objetivo é não perder informação de tipo, coisa que any joga fora.

function primeiroRuim(lista: any[]): any {
    return lista[0];
}
const a = primeiroRuim([1, 2, 3]); // a é any -> perdi que era number

function primeiro<T>(lista: T[]): T {
    return lista[0];
}
const b = primeiro([1, 2, 3]);        // b é number
const c = primeiro(["a", "b"]);       // c é string
// Nem precisei escrever primeiro<number>([...]) -> o TS infere pelo argumento.


// Generic em interface / type

interface Resposta<T> {
    dados: T;
    status: number;
    erro?: string;
}

type Usuario = { id: string; nome: string };

const respostaUsuario: Resposta<Usuario> = {
    dados: { id: "1", nome: "Alice" },
    status: 200
};

const respostaLista: Resposta<Usuario[]> = {
    dados: [],
    status: 200
};

// Esse é o padrão que eu mais repito em API: um envelope só, conteúdo variável.


// Constraint com extends -> "T pode ser qualquer coisa DESDE QUE tenha isso"

function pegarNome<T extends { nome: string }>(item: T): string {
    return item.nome;
}

pegarNome({ nome: "Alice", idade: 28 }); // ok
// pegarNome({ idade: 28 });             // erro: falta nome

// Sem o extends, item.nome nem compila, porque T poderia ser number.


// Dois generics amarrados um no outro -> keyof

function pegarCampo<T, K extends keyof T>(obj: T, chave: K): T[K] {
    return obj[chave];
}

const usuario = { id: "1", nome: "Alice", idade: 28 };

const nome = pegarCampo(usuario, "nome");   // string
const idade = pegarCampo(usuario, "idade"); // number
// pegarCampo(usuario, "email");            // erro: "email" não é chave de usuario

// keyof T = união literal das chaves -> "id" | "nome" | "idade"
// T[K] = indexed access, o tipo do valor daquela chave
// Isso é o que faz o retorno mudar de acordo com a string passada. Achei genial.


// Valor padrão de generic

interface Paginado<T = unknown> {
    itens: T[];
    total: number;
}


// Generic em class

class Repositorio<T extends { id: string }> {
    private itens = new Map<string, T>();

    salvar(item: T): void {
        this.itens.set(item.id, item);
    }

    buscar(id: string): T | undefined {
        return this.itens.get(id);
    }

    listar(): T[] {
        return [...this.itens.values()];
    }
}

const repoUsuarios = new Repositorio<Usuario>();
repoUsuarios.salvar({ id: "1", nome: "Alice" });
const encontrado = repoUsuarios.buscar("1"); // Usuario | undefined

/*
Preciso lembrar:
- generic não é "aceita qualquer coisa", é "preserva o que veio"
- se eu não uso o T em mais de um lugar (parâmetro e retorno, ou dois parâmetros),
  provavelmente eu não precisava de generic
- T, K, V são só convenção. Em código de verdade nome descritivo ajuda: <TEntidade>
*/
