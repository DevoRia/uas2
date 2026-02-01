# UaScript 2.0

**Programming language with bytecode compilation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🌍 **Bilingual Syntax** — write in English or Ukrainian
- ⚡ **Bytecode VM** — fast execution via virtual machine
- 🎯 **FP + OOP** — functional and object-oriented programming
- 📦 **Data classes** — automatic data classes
- 🔗 **Pipe operator** — elegant function composition
- 🔄 **Pattern matching** — powerful pattern matching
- 🛡️ **Null-safety** — Option types instead of null

## Installation

```bash
# Clone the repository
git clone https://github.com/user/uascript2.git
cd uascript2

# Install dependencies
npm install

# Build
npm run build

# Run REPL
npm run repl
```

## Quick Start

### Hello World

```
// In English
print("Hello, World!")

// In Ukrainian
друк("Привіт, світ!")
```

### Variables

```
// Immutable
let x = 10
let y = 20

// Mutable
var count = 0
counter = counter + 1
```

### Functions

```
fun factorial(n) {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}

print(factorial(5))  // 120
```

### Classes

```
class Point(x, y) {
    fun distance() {
        return (self.x ** 2 + self.y ** 2) ** 0.5
    }
}

let p = new Point(3, 4)
print(p.x)           // 3
print(p.distance())  // 5
```

### Data Classes

```
data User(name, age, email)

let user = new User("Taras", 25, "taras@example.com")
print(user.name)  // Taras
```

### Lists

```
let numbers = [1, 2, 3, 4, 5]
print(numbers[0])        // 1
print(numbers.length)   // 5
```

### Conditionals

```
let x = 42

if x > 100 {
    print("large")
} else if x > 10 {
    print("medium")
} else {
    print("small")
}
```

### Loops

```
// While loop
var i = 0
while i < 5 {
    print(i)
    i = i + 1
}

// For loop (coming soon)
for x in [1, 2, 3] {
    print(x)
}
```

### Pipe Operator

```
fun double(x) { return x * 2 }
fun addOne(x) { return x + 1 }

// 10 -> double -> 20 -> addOne -> 21
let result = 10 |> double |> addOne
print(result)  // 21
```

## Keywords

| Ukrainian | English | Description |
|------------|---------|------|
| нехай | let | Immutable variable |
| змінна | var | Mutable variable |
| функція | fun | Function |
| повернути | return | Return value |
| якщо | if | Condition |
| інакше | else | Else condition |
| поки | while | While loop |
| для | for | For loop |
| в | in | In (for loops) |
| клас | class | Class |
| дані | data | Data class |
| новий | new | Create instance |
| себе | self | Self reference |
| так | true | Boolean True |
| ні | false | Boolean False |
| друк | print | Output |

## CLI

```bash
# Run a file
uas2 program.uas

# Execute code directly
uas2 -e 'print("Hello!")'

# Start REPL
uas2 repl

# Debug mode
uas2 -d program.uas
```

## Architecture

```
Source Code (.uas)
       ↓
    Lexer (Tokenization)
       ↓
    Parser (AST)
       ↓
    Compiler (Bytecode)
       ↓
    VM (Execution)
```

## Roadmap

- [x] v0.1 — Basic language (variables, functions, classes, loops)
- [ ] v0.2 — Pattern matching, Option/Result
- [ ] v0.3 — Generics, Async/Await
- [ ] v0.4 — Modules, Package manager
- [ ] v0.5 — Standard library
- [ ] v1.0 — Production ready

## License

MIT License — free for any purpose.

## Authors

- UaScript Team
