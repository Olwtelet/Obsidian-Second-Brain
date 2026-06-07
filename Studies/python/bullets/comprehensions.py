# Comprehension é a forma "pythonica" de construir lista/dict/set a partir de outro iterável.
# Vindo do JS, é basicamente map + filter numa sintaxe só.

numeros = [1, 2, 3, 4, 5, 6]

# JS:      numeros.map(n => n * 2)
dobrados = [n * 2 for n in numeros]

# JS:      numeros.filter(n => n % 2 == 0)
pares = [n for n in numeros if n % 2 == 0]

# os dois juntos
dobro_dos_pares = [n * 2 for n in numeros if n % 2 == 0]  # [4, 8, 12]

# A ordem de leitura é meio ao contrário: primeiro o QUE eu quero (n * 2),
# depois de onde vem (for n in numeros), depois o filtro (if ...).


# if/else vai ANTES do for, porque aí é expressão ternária, não filtro
rotulos = ["par" if n % 2 == 0 else "impar" for n in numeros]

# Comparando:
# [x for x in lista if cond]           -> filtra (deixa de fora)
# [a if cond else b for x in lista]    -> transforma (mantém todos)


# ---------- dict comprehension ----------
quadrados = {n: n ** 2 for n in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

usuarios = [{"id": 1, "nome": "Alice"}, {"id": 2, "nome": "Sofia"}]
por_id = {u["id"]: u for u in usuarios}
# vira um índice em memória, lookup O(1) - mesma ideia do Map em JS

# inverter chave e valor
invertido = {v: k for k, v in quadrados.items()}


# ---------- set comprehension ----------
tags = ["js", "python", "js", "go"]
unicas = {t for t in tags}  # {'js', 'python', 'go'}


# ---------- aninhada ----------
matriz = [[1, 2, 3], [4, 5, 6]]

# achatar
plana = [item for linha in matriz for item in linha]  # [1,2,3,4,5,6]
# a ordem dos for é a MESMA de um for aninhado normal, só escrita em linha:
# for linha in matriz:
#     for item in linha:

# lista de listas
tabuleiro = [[0 for _ in range(3)] for _ in range(3)]
# NÃO usar [[0] * 3] * 3 -> isso cria 3 referências pra MESMA lista,
# mudar tabuleiro[0][0] muda as três linhas. Já caí nessa.


# ---------- quando NÃO usar ----------
# Se ficou difícil de ler, o for normal é melhor. Comprehension com 2 ifs e 2 fors
# é código que eu não vou entender daqui um mês.

# ruim:
# resultado = [f(x) for sub in dados if sub for x in sub if x.ativo and x.valor > 10]

# E comprehension é pra CONSTRUIR coleção. Se eu só quero efeito colateral,
# o certo é for normal:
# [print(n) for n in numeros]   <- constrói uma lista de None à toa
for n in numeros:
    print(n)


# ---------- generator expression ----------
# Mesma sintaxe com parênteses -> não constrói a lista, produz sob demanda.

soma = sum(n * 2 for n in range(1_000_000))
# não cria uma lista de 1 milhão de itens na memória
# ver generators.py
