# UAS (UaScript 2.0) Design Specification

**UAS** (pronounced "U-A-S") is a high-performance, AOT-compiled programming language designed as the evolutionary successor to UaScript.

Taking the best from:
- **Kotlin/Scala** — elegant syntax, null-safety, data classes
- **Go** — simplicity, fast compilation, goroutines/channels
- **Rust** — pattern matching, Result/Option, ownership ideas (light)
- **F#/OCaml** — FP first, pipe operators, immutability by default

## Key Principles

1. **Immutable by default** — `var` for mutable, `let` for immutable (default)
2. **Null-safety** — no null, uses `Option<T>`
3. **Expression-based** — everything returns a value
4. **Bilingual** — every keyword has EN and UA variant
5. **Fast** — compilation to bytecode, JIT in the future

---

## Syntax

### Variables
```
// Immutable (default)
let x = 10
нехай x = 10

// Mutable
var y = 20
змінна y = 20
```

### Types
```
Int / Ціле
Float / Дріб
String / Текст
Bool / Булеве
List<T> / Список<T>
Map<K, V> / Словник<K, V>
Option<T> / Можливо<T>
Result<T, E> / Результат<T, E>
```

### Functions
```
fun add(a: Int, b: Int) -> Int {
    a + b
}

функція додати(a: Ціле, b: Ціле) -> Ціле {
    a + b
}

// Lambdas
let double = |x| x * 2
нехай подвоїти = |x| x * 2

// Pipe operator
10 |> double |> print
10 |> подвоїти |> друк
```

### Pattern Matching
```
match value {
    0 => "zero",
    1..10 => "small", 
    n if n > 100 => "large",
    _ => "other"
}

зіставити значення {
    0 => "нуль",
    1..10 => "мале",
    n якщо n > 100 => "велике",
    _ => "інше"
}
```

### Classes and Traits
```
class Point(x: Int, y: Int) {
    fun distance() -> Float {
        (x * x + y * y).sqrt()
    }
}

клас Точка(x: Ціле, y: Ціле) {
    функція відстань() -> Дріб {
        (x * x + y * y).корінь()
    }
}

trait Displayable {
    fun show() -> String
}

трейт Показуваний {
    функція показати() -> Текст
}
```

### Data Classes (automatic equals, hash, copy)
```
data User(name: String, age: Int)
дані Користувач(імя: Текст, вік: Ціле)
```

### Option/Result
```
fun find(id: Int) -> Option<User> {
    // ...
}

let user = find(1) 
    |> map(|u| u.name)
    |> or("unknown")
```

### Async/Channels (Go-style)
```
async fun load(url: String) -> Result<Data, Error> {
    // ...
}

// Channels
let ch = channel<Int>()
spawn {
    ch.send(42)
}
let value = ch.recv()
```

### Reactive Streams
```
let stream = flow(1, 2, 3, 4, 5)
    |> filter(|x| x > 2)
    |> map(|x| x * 2)
    |> collect()
```

---

## Bytecode Architecture

### VM Instructions
```
LOAD_CONST <idx>     - load constant
LOAD_VAR <idx>       - load variable
STORE_VAR <idx>      - store variable
BINARY_OP <op>       - +, -, *, /, etc
COMPARE <op>         - ==, !=, <, >, etc
JUMP <addr>          - unconditional jump
JUMP_IF_FALSE <addr> - conditional jump
CALL <argc>          - function call
RETURN               - return
MAKE_LIST <size>     - create list
MAKE_MAP <size>      - create map
GET_ATTR <name>      - get attribute
SET_ATTR <name>      - set attribute
PATTERN_MATCH        - pattern matching
SPAWN                - spawn goroutine
CHAN_SEND            - send to channel
CHAN_RECV            - receive from channel
```

### File Format .uabc (UaScript ByteCode)
```
Magic: "UABC"
Version: u16
Constants Pool: [...]
Functions: [...]  
Code: [...]
```

---

## Implementation Stages

### v0.1 (MVP) ✅ Current
- [ ] Lexer (tokenization, UA+EN)
- [ ] Parser (AST)
- [ ] Basic types (Int, Float, String, Bool)
- [ ] Variables, functions
- [ ] Bytecode compiler
- [ ] VM interpreter
- [ ] REPL

### v0.2
- [ ] Pattern matching
- [ ] Option/Result
- [ ] Classes
- [ ] Traits

### v0.3
- [ ] Generics
- [ ] Async/await
- [ ] Channels

### v0.4
- [ ] Reactive streams
- [ ] Standard library
- [ ] Package manager

