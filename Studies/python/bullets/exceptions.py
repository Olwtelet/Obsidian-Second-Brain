# Em Python a cultura é EAFP: "easier to ask forgiveness than permission".
# Tenta e trata o erro, em vez de checar antes (LBYL - look before you leap).

# LBYL (jeito que eu trazia do JS)
import os
if os.path.exists("config.json"):
    with open("config.json") as f:
        dados = f.read()

# EAFP (jeito pythonico)
try:
    with open("config.json") as f:
        dados = f.read()
except FileNotFoundError:
    dados = "{}"

# O EAFP não tem race condition: no LBYL o arquivo pode sumir entre o exists e o open.


# ---------- a estrutura completa ----------

try:
    resultado = 10 / int(entrada)
except ValueError:
    print("não era número")
except ZeroDivisionError:
    print("divisão por zero")
except (TypeError, KeyError) as e:
    print(f"outro erro: {e}")
else:
    print(f"deu certo: {resultado}")   # só roda se NÃO houve exceção
finally:
    print("sempre roda")               # cleanup


# O else é a parte que quase ninguém usa e é útil: separa "o que pode dar erro"
# do "o que fazer quando deu certo". Sem ele, o código de sucesso fica dentro do try
# e pode disparar uma exceção que o except captura por engano.


# ---------- não capturar Exception genérica ----------

# ruim - engole KeyboardInterrupt, bug de digitação, tudo
try:
    processar()
except:
    pass

# ruim também - esconde bug
try:
    processar()
except Exception:
    pass

# Se eu preciso pegar tudo, no mínimo logo:
import logging
try:
    processar()
except Exception:
    logging.exception("falha ao processar")   # exception() já inclui o traceback
    raise


# ---------- exceções próprias ----------

class ErroDeNegocio(Exception):
    """Base pros erros esperados da aplicação."""

class SaldoInsuficiente(ErroDeNegocio):
    def __init__(self, saldo, valor):
        self.saldo = saldo
        self.valor = valor
        super().__init__(f"saldo {saldo} insuficiente para {valor}")

# Herdar de uma base própria deixa capturar por categoria:
# except ErroDeNegocio -> pega todas as minhas
# Mesma separação de erro esperado x inesperado que anotei em [[9 - Tratamento de erros]]


# ---------- raise from ----------

try:
    conectar_banco()
except OSError as e:
    raise ErroDeNegocio("banco indisponível") from e
    # o traceback mostra os dois: "The above exception was the direct cause of..."
    # equivale ao { cause: e } do JS


# ---------- context manager ----------
# O with garante o cleanup mesmo com exceção. É o finally embrulhado.

from contextlib import contextmanager
import time

@contextmanager
def cronometro(nome):
    inicio = time.perf_counter()
    try:
        yield
    finally:
        print(f"{nome}: {time.perf_counter() - inicio:.3f}s")

with cronometro("processamento"):
    processar()

# O yield marca onde o bloco with roda. Antes = setup, depois (no finally) = teardown.
# Escrever isso com classe exige __enter__ e __exit__; com o decorator fica bem menor.


# ---------- suppress ----------

from contextlib import suppress

with suppress(FileNotFoundError):
    os.remove("temp.txt")

# mais limpo que try/except/pass, e deixa explícito que ignorar é intencional


"""
O que eu levo daqui:
- exceção em Python é barata e faz parte do fluxo normal (StopIteration é uma exceção!)
- capturar específico, sempre
- exceção própria por categoria facilita tratar na borda
- with pra qualquer recurso: arquivo, conexão, lock, transação
"""
