# Generator é uma função que PAUSA e continua depois, em vez de rodar até o fim e retornar.
# Quem faz isso é o yield.

def contar_ate(n):
    i = 1
    while i <= n:
        yield i     # entrega o valor e CONGELA o estado aqui
        i += 1

for numero in contar_ate(3):
    print(numero)  # 1, 2, 3

# Chamar contar_ate(3) não executa nada. Devolve um objeto generator.
# O corpo só roda quando alguém pede o próximo valor.

g = contar_ate(3)
print(next(g))  # 1
print(next(g))  # 2
print(next(g))  # 3
# print(next(g))  # StopIteration


# ---------- o motivo real: memória ----------

def ler_linhas_ruim(caminho):
    with open(caminho) as f:
        return f.readlines()   # arquivo INTEIRO na RAM

def ler_linhas(caminho):
    with open(caminho) as f:
        for linha in f:
            yield linha.strip()   # uma linha por vez

# Com um log de 5GB, o primeiro estoura a memória e o segundo nem sente.
# É a mesma ideia dos streams do Node (ver [[6 - Streams]]).


# ---------- pipeline ----------
# Generators encaixam um no outro e nada é materializado no meio.

def ler(caminho):
    with open(caminho) as f:
        for linha in f:
            yield linha.strip()

def apenas_erros(linhas):
    for linha in linhas:
        if "ERROR" in linha:
            yield linha

def extrair_timestamp(linhas):
    for linha in linhas:
        yield linha.split(" ")[0]

# nada rodou ainda:
pipeline = extrair_timestamp(apenas_erros(ler("app.log")))

# só agora o arquivo começa a ser lido, uma linha de cada vez atravessando
# os três estágios:
for ts in pipeline:
    print(ts)


# ---------- lazy: cuidado ----------

g = (n * 2 for n in range(5))
print(list(g))  # [0, 2, 4, 6, 8]
print(list(g))  # []  <- ESGOTOU. generator só percorre uma vez.

# Se eu preciso iterar duas vezes, ou guardo em lista, ou crio outro generator.
# Isso já me deu bug: passei um generator pra uma função que iterava duas vezes.


# ---------- yield from ----------

def numeros():
    yield from range(3)
    yield from ["a", "b"]

list(numeros())  # [0, 1, 2, 'a', 'b']


# ---------- generator infinito ----------

def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
primeiros_10 = list(islice(fibonacci(), 10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

# Só é possível porque nada é calculado antes de ser pedido.


# ---------- itertools ----------
# Vale conhecer, é tudo lazy:
# chain, islice, groupby, tee, count, cycle, batched (3.12+)

from itertools import batched

# processar em lotes sem carregar tudo - útil pra insert em banco
# ou pra mandar em batch pra uma API de embeddings
for lote in batched(range(100), 10):
    print(lote)  # tuplas de 10


"""
Resumo:
- lista  -> quando preciso do tamanho, de índice, ou vou percorrer mais de uma vez
- generator -> quando é grande, infinito, ou vou percorrer uma vez só

Regra prática: se estou dando return numa lista que o chamador só percorre
em um for, provavelmente cabia um yield.
"""
