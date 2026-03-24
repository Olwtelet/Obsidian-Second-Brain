// Promise é um objeto que representa um valor que ainda não existe.
// Três estados: pending -> fulfilled OU rejected. Uma vez resolvida, não muda mais.

const promessa = new Promise((resolve, reject) => {
    const deuCerto = true;
    if (deuCerto) {
        resolve("valor final");
    } else {
        reject(new Error("deu ruim"));
    }
});

promessa
    .then(valor => console.log(valor))
    .catch(erro => console.error(erro.message))
    .finally(() => console.log("roda dos dois jeitos"));


// O ponto do .then é que ele RETORNA outra promise -> por isso encadeia.

fetch("/api/usuarios")
    .then(res => res.json())      // devolve promise
    .then(dados => dados.filter(u => u.ativo))
    .then(ativos => console.log(ativos))
    .catch(erro => console.error(erro));

// Se eu esquecer de dar return dentro de um .then, o próximo recebe undefined.
// Já perdi tempo com isso.


// async/await é a mesma coisa com cara de código síncrono

async function buscarUsuarios() {
    try {
        const res = await fetch("/api/usuarios");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const dados = await res.json();
        return dados.filter(u => u.ativo);
    } catch (erro) {
        console.error(erro.message);
        return [];
    }
}

// Detalhe: fetch só rejeita em erro de REDE. 404 e 500 são "sucesso" pro fetch.
// Por isso o if (!res.ok) precisa estar lá.


// Sequencial x paralelo -> o erro mais comum com await

async function lento() {
    const a = await buscarA(); // espera
    const b = await buscarB(); // só começa depois de A terminar
    return [a, b];
}
// tempo total = A + B

async function rapido() {
    const [a, b] = await Promise.all([buscarA(), buscarB()]); // as duas disparam juntas
    return [a, b];
}
// tempo total = o mais lento dos dois

// Se A e B não dependem um do outro, Promise.all é sempre melhor.


// Os combinadores

Promise.all([p1, p2]);        // falha se QUALQUER uma falhar
Promise.allSettled([p1, p2]); // nunca falha, devolve {status, value|reason} de cada
Promise.race([p1, p2]);       // a primeira a resolver OU rejeitar
Promise.any([p1, p2]);        // a primeira a dar CERTO, ignora falhas

// allSettled é o que eu quero quando estou chamando várias APIs e uma cair não pode
// derrubar as outras. Já race serve bem pra timeout:

function comTimeout(promise, ms) {
    const estouro = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ms)
    );
    return Promise.race([promise, estouro]);
}
