Nota rápida, mais pra não esquecer os comandos do que pra entender conceito.

### O problema

Python instala pacote **global** por padrão. Aí projeto A precisa de `pandas 1.5`, projeto B de `pandas 2.1`, e um quebra o outro. Sem contar que instalar global suja o Python do sistema — no Linux isso chega a quebrar ferramenta do sistema operacional.

Venv é uma pasta com um Python isolado e seus próprios pacotes.

### venv

```bash
python -m venv .venv

source .venv/bin/activate      # linux/mac
.venv\Scripts\activate         # windows

pip install requests
pip freeze > requirements.txt

deactivate
```

`.venv` no `.gitignore`, sempre. O que vai pro Git é o `requirements.txt`.

O problema do `pip freeze` é que ele mistura o que eu instalei com todas as dependências transitivas, sem distinguir. Fica impossível saber o que é direto.

### pyproject.toml

O padrão moderno. Um arquivo só, com metadados e dependências separadas:

```toml
[project]
name = "meu-projeto"
requires-python = ">=3.11"
dependencies = ["requests>=2.31", "pydantic>=2.0"]

[project.optional-dependencies]
dev = ["pytest", "ruff"]
```

### uv

Substitui venv + pip + pip-tools, escrito em Rust e absurdamente mais rápido:

```bash
uv init
uv add requests
uv add --dev pytest
uv run python main.py    # cria o venv e sincroniza sozinho
uv sync                  # instala exatamente o uv.lock
```

O `uv.lock` faz o mesmo papel do `package-lock.json` ([[3 - package.json e npm]]): trava a árvore inteira pra que minha máquina e o CI instalem igual.

Depois de acostumar com npm, ficar sem lockfile em Python parecia errado. `uv` resolve isso.

### Analogia com Node

| Node | Python |
|---|---|
| `node_modules` (por projeto) | `.venv` |
| `package.json` | `pyproject.toml` |
| `package-lock.json` | `uv.lock` / `requirements.txt` fixado |
| `npm install` | `uv sync` / `pip install -r` |
| `npx` | `uvx` / `pipx run` |

A diferença conceitual: no Node o isolamento é automático (`node_modules` é sempre local). Em Python eu preciso **lembrar** de ativar o venv, senão instalo global sem perceber.

### No Docker

Dentro do container o isolamento já existe — o container **é** o ambiente. Ainda assim vale usar venv pra multi-stage build, copiando só o `.venv` pronto pra imagem final ([[2 - Dockerfile]]).

### Coisas que me pegaram

- esquecer de ativar e instalar global. Sinal: `pip list` cheio de coisa que não é do projeto
- `python` x `python3` — no Windows tem o launcher `py`
- editor apontando pro interpretador errado; no VS Code é "Python: Select Interpreter" e escolher o `.venv`
