// ?.  e  ??  -> dois operadores curtos que eu uso o tempo todo e sempre confundo com ||

const usuario = { perfil: { nome: "Alice" } };

usuario.endereco.cidade;    // TypeError
usuario.endereco?.cidade;   // undefined, para a avaliação e não quebra

usuario.salvar?.();         // só chama se existir
lista?.[0];                 // funciona em índice também


// ?? (nullish) só cai no padrão se for null ou undefined
// || cai no padrão pra QUALQUER falsy

const qtd = 0;
qtd || 10;    // 10   <- errado, 0 é um valor válido
qtd ?? 10;    // 0    <- certo

const nome = "";
nome || "anônimo";   // "anônimo"
nome ?? "anônimo";   // ""

// Ou seja: pra número e string, ?? quase sempre é o que eu quero.
// || só quando "vazio" e "ausente" devem ter o mesmo tratamento.


// ??= atribui só se for null/undefined
let config = {};
config.tema ??= "dark";


// Não dá pra misturar ?? com || ou && sem parênteses -> erro de sintaxe de propósito,
// justamente porque a precedência seria ambígua:
// a || b ?? c        // SyntaxError
// (a || b) ?? c      // ok
