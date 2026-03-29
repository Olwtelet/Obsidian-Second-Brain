// Map e Set existem desde o ES6 e eu quase nunca uso, mas em alguns casos eles resolvem
// melhor do que objeto e array.

// ---------- MAP ----------
// Parecido com objeto, mas:
// - a chave pode ser QUALQUER coisa (objeto, função, número), não só string
// - mantém a ordem de inserção
// - tem .size (objeto precisa de Object.keys().length)
// - iterar é direto

const cache = new Map();

cache.set("usuario:1", { nome: "Alice" });
cache.set(42, "chave numérica de verdade");

const chaveObjeto = { id: 1 };
cache.set(chaveObjeto, "valor amarrado a um objeto");

cache.get("usuario:1");
cache.has(42);        // true
cache.delete(42);
cache.size;

for (const [chave, valor] of cache) {
    console.log(chave, valor);
}

// Em objeto normal, a chave 42 viraria a string "42". No Map não.
const obj = {};
obj[42] = "a";
Object.keys(obj); // ["42"]  <- virou string


// ---------- SET ----------
// Coleção de valores ÚNICOS.

const tags = new Set(["js", "node", "js", "react"]);
console.log(tags.size); // 3 -> o "js" duplicado sumiu sozinho

tags.add("ts");
tags.has("node"); // true
tags.delete("js");

// O uso que mais aparece: remover duplicata de array em uma linha
const numeros = [1, 2, 2, 3, 3, 3];
const unicos = [...new Set(numeros)]; // [1, 2, 3]

// Cuidado: a comparação é por referência pra objeto.
const s = new Set();
s.add({ id: 1 });
s.add({ id: 1 });
console.log(s.size); // 2 -> são dois objetos diferentes, mesmo com conteúdo igual


// ---------- Quando usar o que ----------
/*
Objeto  -> registro com formato conhecido e fixo (config, resposta de API, props)
Map     -> dicionário dinâmico, chave que não é string, precisa de ordem ou de size
Array   -> lista ordenada onde repetição faz sentido
Set     -> conjunto onde só importa "está ou não está"

Um detalhe de performance: checar existência em array é O(n) (includes percorre tudo),
em Set e Map é O(1) na média, porque por baixo é hash table (ver [[2 - Hash tables]]).
Em lista pequena não muda nada, em loop com muitos itens muda bastante.
*/

// exemplo do problema O(n²) escondido:
function filtrarLento(lista, bloqueados) {
    return lista.filter(item => !bloqueados.includes(item)); // includes é O(n) dentro de um filter O(n)
}

function filtrarRapido(lista, bloqueados) {
    const setBloqueados = new Set(bloqueados);
    return lista.filter(item => !setBloqueados.has(item)); // agora é O(n)
}
