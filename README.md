# UAS (UaScript 2) 🚀

**A high-performance programming language with Ukrainian syntax and AOT compilation**

UAS is the successor to [UaScript](https://github.com/DevoRia/UaScript), redesigned from the ground up for maximum performance and native execution. Unlike the original UaScript which transpiled to JavaScript, **UAS** compiles directly to machine code via C++ (AOT), achieving performance that matches native C++ and significantly exceeds Node.js and Python.

## 🌟 Key Differences from UaScript (v1)

| Feature | UaScript (v1) | UAS (v2) |
|:---|:---|:---|
| **Engine** | Node.js (JavaScript) | C++ (AOT Compilation) |
| **Performance** | Slow (Interpreted/JS) | **Native (matching C++)** |
| **Types** | Dynamic only | **Optional Static Typing** |
| **Operators** | Standard JS | Added `**` (power), `%` (modulo) |
| **Execution** | Needs Node.js | **Native Binary** |

## 🚀 Performance Benchmarks

### Fibonacci(30) - Recursive Test

| Implementation | Time (ms) | Speedup |
|:---| :--- |:---|
| **UAS2 (AOT)** | **~2 ms** | **🏆 1.0x (Baseline)** |
| Node.js (V8) | ~11 ms | 5.5x slower |
| **UaScript v1** | **~29 ms** | **14.5x slower** |
| Python 3 | ~232 ms | 116x slower |

*UAS is ~15x faster than the original UaScript and ~5x faster than Node.js.*

## 🛠 Features

- ✅ **Bilingual** - Write and mix code in Ukrainian or English.
- ✅ **AOT Compilation** - Generates highly optimized C++17 code compiled with Clang/GCC.
- ✅ **Static Typing** - Optional type hints (`: number`, `: string`, `: bool`) for zero-overhead execution.
- ✅ **Native Binaries** - Distribute your programs as small, fast executables with no dependencies.
- ✅ **Clean Syntax** - Modern, readable syntax inspired by JavaScript/TypeScript but optimized for AOT.

## 🚦 Quick Start

### Build the Compiler

```bash
git clone https://github.com/DevoRia/uas2.git
cd uas2
make
```

### Write Your First Code (`hello.uas`)

```javascript
// Function with type hints for performance
функція привітання(ім'я: стрічка) {
    друк("Привіт, " + ім'я + "!")
}

привітання("Світ")
```

### Compile and Run

```bash
# Simple one-command execution
./uas hello.uas
```


## 📖 Language Syntax

### Variable Declarations
```javascript
нехай x: число = 10      // Typed constant
змінна y = "текст"       // Inferred mutable variable
let z = так              // English keyword support
```

### Functions
```javascript
функція додати(а: число, б: число): число {
    повернути а + б
}
```

### Control Flow
```javascript
якщо x > 0 {
    друк("Positive")
} інакше {
    друк("Negative")
}

поки x > 0 {
    друк(x)
    x = x - 1
}
```

## 📂 Project Structure

- `benchmarks/` — Performance tests and comparison scripts.
- `build/` — Compiler binaries and build artifacts.
- `cpp/`
  - `runtime/` — The C++ header-only runtime library.
  - `src/` — Compiler source code (Lexer, Parser, Transpiler).
- `examples/` — Comprehensive code examples in Ukrainian.
- `UaScript_v1/` — Legace version 1 for compatibility/benchmarking.

## ⚙️ Makefile Commands

- `make` — Compile the `uas` compiler.
- `make run FILE=path.uas` — Compile and execute a UAS file in one go.
- `make benchmark` — Run the performance comparison suite.
- `make test` — Run automated tests on examples.
- `make clean` — Remove all build artifacts.

## 🛣 Roadmap

- [ ] Lists/Arrays and Map support.
- [ ] Object-Oriented Programming (Classes).
- [ ] Standard Library (File I/O, Networking).
- [ ] VS Code Extension with syntax highlighting.
- [ ] Standalone package manager.

---

**UAS** — The next level of Ukrainian programming. High speed, native power, native language.
