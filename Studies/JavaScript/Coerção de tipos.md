Coerção é o JS convertendo tipo sozinho pra conseguir completar uma operação. Não é aleatório, tem regra — o problema é que a regra é meio esquisita.

### Explícita x implícita

Explícita é quando eu peço:

```javascript
Number("42")   // 42
String(42)     // "42"
Boolean(0)     // false
```

Implícita é quando o operador decide por mim:

```javascript
"5" + 1    // "51"   -> + com string vira concatenação
"5" - 1    // 4      -> - só existe pra número, então converte
"5" * "2"  // 10
[] + {}    // "[object Object]"
```

O `+` é o único operador aritmético que também é concatenação. Se qualquer lado for string, ele concatena. Todos os outros (`-`, `*`, `/`, `%`) forçam número.

### == x ===

`===` compara tipo e valor. `==` converte antes de comparar.

```javascript
0 == "0"      // true
0 == false    // true
"" == false   // true
null == undefined  // true
null == false      // false   <- essa quebra a intuição
NaN == NaN         // false
```

Regra prática: uso `===` sempre. A única exceção que eu abro é `x == null`, que pega `null` e `undefined` de uma vez só.

### Truthy e falsy

Os falsy são poucos e vale decorar, porque tudo que não está nessa lista é truthy:

`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`

Reparei que é praticamente a mesma lista do Python (ver [[if_secrets.py]]), com a diferença que em JS array vazio e objeto vazio são **truthy**:

```javascript
if ([]) console.log("entra");   // entra
if ({}) console.log("entra");   // entra
```

Em Python `[]` e `{}` são falsy. Já me pegou.

### O detalhe do objeto virando primitivo

Quando um objeto precisa virar primitivo, o JS chama `valueOf()` e depois `toString()`.

```javascript
[] + []    // ""      -> array vazio vira string vazia
[1,2] + [3] // "1,23"  -> join com vírgula
```

Não é algo que eu vá escrever de propósito, mas explica os memes.

### Na prática

O que realmente importa no dia a dia:

- validar entrada de formulário: o `value` de input é **sempre** string, mesmo em `type="number"`
- `parseInt("10px")` retorna `10`, `Number("10px")` retorna `NaN` — dependendo do caso um dos dois é o certo
- `JSON.parse` não faz coerção, ele respeita o tipo do JSON

[[JavaScript2]]
