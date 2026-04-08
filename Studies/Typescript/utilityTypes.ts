// Utility types são tipos genéricos que já vêm no TS pra transformar outros tipos.
// A ideia central: NÃO duplicar a definição. Deriva tudo de uma fonte só.

type Usuario = {
    id: string;
    nome: string;
    email: string;
    senhaHash: string;
    criadoEm: Date;
};


// Partial<T> -> tudo opcional. Uso em update / PATCH.
type AtualizarUsuario = Partial<Usuario>;
function atualizar(id: string, campos: Partial<Usuario>) { }
atualizar("1", { nome: "Alice" }); // não preciso mandar o objeto inteiro

// Required<T> -> o contrário, tira todos os "?"
type UsuarioCompleto = Required<AtualizarUsuario>;

// Readonly<T> -> nada pode ser reatribuído
type UsuarioImutavel = Readonly<Usuario>;

// Pick<T, K> -> escolhe só algumas chaves
type UsuarioPublico = Pick<Usuario, "id" | "nome">;

// Omit<T, K> -> tira algumas chaves. Esse é o que eu mais uso.
type UsuarioSeguro = Omit<Usuario, "senhaHash">;
// Se amanhã eu adicionar "tokenReset" em Usuario, ele aparece automaticamente
// em UsuarioSeguro. Com Pick eu teria que lembrar de incluir na mão.
// Ou seja: Omit é seguro por padrão pra ESCONDER campo, Pick é seguro pra EXPOR campo.
// Na dúvida em resposta de API eu prefiro Pick, porque o risco é vazar dado, não esquecer dado.

// Record<K, V> -> objeto com chaves conhecidas
type Permissao = "leitura" | "escrita" | "admin";
type Politica = Record<Permissao, boolean>;

const politica: Politica = {
    leitura: true,
    escrita: false,
    admin: false
}; // se faltar uma chave, quebra

// Record também serve pra dicionário solto:
type Cache = Record<string, unknown>;


// Exclude / Extract -> mexem em UNION, não em objeto
type Status = "rascunho" | "publicado" | "arquivado";
type StatusVisivel = Exclude<Status, "arquivado">;   // "rascunho" | "publicado"
type SoArquivado = Extract<Status, "arquivado">;     // "arquivado"

// NonNullable -> tira null e undefined
type Texto = NonNullable<string | null | undefined>; // string


// ReturnType / Parameters / Awaited -> extraem tipo de função
function criarSessao(usuario: Usuario, duracaoMin: number) {
    return { token: "abc", expiraEm: new Date() };
}

type Sessao = ReturnType<typeof criarSessao>;        // { token: string; expiraEm: Date }
type ArgsSessao = Parameters<typeof criarSessao>;    // [Usuario, number]

async function buscarUsuario(): Promise<Usuario> {
    return {} as Usuario;
}
type UsuarioResolvido = Awaited<ReturnType<typeof buscarUsuario>>; // Usuario, sem a Promise

// Esse combo é ótimo quando a função é a fonte da verdade e eu não quero
// escrever o tipo do retorno duas vezes.


// Dá pra montar os meus próprios. Mapped type + conditional type:

type Opcional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// "Usuario, mas email pode faltar"
type UsuarioSemEmailObrigatorio = Opcional<Usuario, "email">;


// Um que uso bastante: campos que vêm do banco não existem na hora de criar
type NovoUsuario = Omit<Usuario, "id" | "criadoEm">;

function criar(dados: NovoUsuario): Usuario {
    return {
        ...dados,
        id: crypto.randomUUID(),
        criadoEm: new Date()
    };
}

/*
A regra que eu tiro disso tudo:
escrevo UM tipo (normalmente o da entidade), e derivo os outros.
Quando eu vejo dois types com 80% dos mesmos campos escritos na mão,
é sinal de que faltou um Omit ou um Pick ali.
*/
