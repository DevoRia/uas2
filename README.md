# UaScript 2.0

**A programming language with Ukrainian syntax and AOT compilation to native code**

UaScript 2.0 is a programming language that supports Ukrainian keywords and compiles directly to machine code via C++, achieving **performance that exceeds Node.js**.

## Features

- ✅ **Bilingual** - Write code in Ukrainian or English
- ✅ **AOT Compilation** - UaScript → C++ → Native Code
- ✅ **Optional Static Typing** - For maximum performance
- ✅ **Faster than Node.js** - Thanks to ahead-of-time compilation
- ✅ **Simple and clear syntax**

## Benchmarks

### Fibonacci(30) - Performance Comparison

| Implementation | Execution Time | Performance |
|:---------------|:---------------|:------------|
| **UaScript AOT (with types)** | **~10ms** | **🏆 Fastest** |
| Node.js (V8 JIT) | ~13-18ms | Baseline |
| UaScript VM (interpreter) | ~60ms | 6x slower |

**Result:** UaScript with types is **faster than Node.js** thanks to native code compilation!

## Quick Start

### Installation

```bash
git clone https://github.com/yourusername/uas2.git
cd uas2
make
```

### Example Code

```javascript
// In Ukrainian
функція фібоначчі(n: число): число {
    якщо n < 2 {
        повернути n
    }
    повернути фібоначчі(n - 1) + фібоначчі(n - 2)
}

друк("Result: " + фібоначчі(10))
```

```javascript
// In English
fun fibonacci(n: number): number {
    if n < 2 {
        return n
    }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

print("Result: " + fibonacci(10))
```

### Compile and Run

```bash
# Simple way
make run FILE=myprogram.uas

# Or step by step
build/uas myprogram.uas > output.cpp
clang++ -O3 -o myprogram output.cpp -Icpp/runtime -std=c++17
./myprogram
```

## Documentation

### Supported Features

#### 1. Variables with Types
```javascript
нехай x: число = 42
нехай текст = "Hello"  // type inferred automatically
змінна counter: число = 0  // mutable variable
```

#### 2. Functions
```javascript
функція додати(a: число, b: число): число {
    повернути a + b
}
```

#### 3. Conditionals
```javascript
якщо x > 10 {
    друк("Greater")
} інакше {
    друк("Less")
}
```

#### 4. Loops
```javascript
поки i < 10 {
    друк(i)
    i = i + 1
}
```

#### 5. Operators
- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**` (power)
- Comparison: `<`, `>`, `<=`, `>=`, `==`
- Logical: `так` (true), `ні` (false)

### Keywords

| Ukrainian | English | Description |
|:----------|:--------|:------------|
| `функція` | `fn`, `fun` | Function declaration |
| `нехай`, `змінна` | `let` | Variable |
| `якщо` | `if` | Conditional |
| `інакше` | `else` | Else |
| `поки` | `while` | Loop |
| `повернути` | `return` | Return value |
| `друк` | `print` | Print to console |
| `так` | `true` | True |
| `ні` | `false` | False |
| `нічого` | `null` | Null value |

### Data Types

- `число` / `number` - Numbers (double)
- `стрічка` / `string` - Strings
- `бул` / `bool` - Booleans

## Makefile Commands

```bash
make          # Build compiler
make test     # Run tests
make benchmark # Run benchmarks
make clean    # Clean build directory
make run FILE=file.uas  # Compile and run file
```

## Project Structure

```
uas2/
├── benchmarks/     # Performance benchmarks
│   ├── benchmark.uas
│   └── benchmark.js
├── build/          # Compiled binaries (git ignored)
├── cpp/
│   ├── runtime/    # C++ runtime for UaScript
│   └── src/        # Compiler (lexer, parser, transpiler)
├── examples/       # Code examples
│   ├── 01_hello.uas
│   └── 02_calculator.uas
├── Makefile        # Build system
├── README.md
└── DESIGN.md       # Language design documentation
```

## How It Works

1. **Lexer** - Tokenizes source code
2. **Parser** - Builds AST (Abstract Syntax Tree)
3. **Transpiler** - Generates typed C++ code
4. **Clang++** - Compiles C++ to native machine code
5. **Execution** - Runs as native executable

## Why Faster than Node.js?

1. **Ahead-Of-Time compilation** instead of Just-In-Time
2. **Static types** - compiler knows types in advance
3. **Zero overhead** - generates clean C++ code
4. **Clang++ optimizations** - full optimization at machine code level

## Examples

See `examples/` folder for more:
- `01_hello.uas` - Hello World
- `02_calculator.uas` - Calculator with all operators

## Contributing

Contributions are welcome! Feel free to:
- Add new features
- Improve documentation
- Report bugs
- Suggest ideas

## License

MIT License

## Roadmap

- [ ] Arrays and collections
- [ ] Classes and objects
- [ ] Closures
- [ ] Module system
- [ ] Package manager
- [ ] IDE support (VS Code extension)
- [ ] More optimizations

---

**Built with modern compiler technology**
