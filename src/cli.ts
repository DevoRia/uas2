#!/usr/bin/env node

// UaScript 2.0 CLI

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { run, formatValue } from './index.js';

const VERSION = '0.1.0';

const BANNER = `
╔═══════════════════════════════════════════════════════╗
║                    UaScript 2.0                       ║
║      Українська мова програмування з байткод VM       ║
║            Ukrainian Programming Language             ║
╚═══════════════════════════════════════════════════════╝
  Version ${VERSION} | Type "допомога" or "help" for info
  Type "вихід" or "exit" to quit
`;

const HELP = `
UaScript 2.0 - Команди / Commands:
  допомога, help     - показати цю допомогу / show this help
  вихід, exit        - вийти / exit REPL
  приклад, example   - показати приклади / show examples
  очистити, clear    - очистити екран / clear screen

Синтаксис / Syntax:
  нехай x = 10       - immutable variable (let)
  змінна y = 20      - mutable variable (var)
  функція ім'я() {}  - function declaration (fun)
  друк(x)            - print value (print)
  якщо ... { }       - if statement (if)
  поки ... { }       - while loop (while)
  для x в list { }   - for loop (for x in list)
  |>                 - pipe operator
`;

const EXAMPLES = `
// Привіт, світ! / Hello World
друк("Привіт, світ!")
print("Hello, World!")

// Змінні / Variables
нехай x = 10
змінна y = 20
друк(x + y)

// Функції / Functions
функція подвоїти(n) {
    повернути n * 2
}
друк(подвоїти(21))

// Списки / Lists
нехай числа = [1, 2, 3, 4, 5]
друк(числа[0])

// Класи / Classes
клас Точка(x, y) {
    функція показати() {
        друк("(" + себе.x + ", " + себе.y + ")")
    }
}
нехай p = новий Точка(3, 4)

// Pipe operator
// 10 |> подвоїти |> друк
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'repl') {
    await repl();
  } else if (args[0] === '-h' || args[0] === '--help') {
    console.log(`UaScript 2.0 - Ukrainian Programming Language
    
Usage:
  uas2 [file.uas]    Run a UaScript file
  uas2 repl          Start interactive REPL
  uas2 -e "code"     Execute code string
  uas2 -d file.uas   Run with debug output
  uas2 --help        Show this help
  uas2 --version     Show version`);
  } else if (args[0] === '-v' || args[0] === '--version') {
    console.log(`UaScript ${VERSION}`);
  } else if (args[0] === '-e') {
    const code = args.slice(1).join(' ');
    const result = run(code);
    if (!result.success) {
      console.error('Помилка:', result.error);
      process.exit(1);
    }
    if (result.value && result.value.type !== 'none') {
      console.log(formatValue(result.value));
    }
  } else if (args[0] === '-d') {
    const filePath = args[1];
    runFile(filePath, true);
  } else if (args[0] === 'compile' || args[0] === '-c') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Будь ласка, вкажіть файл для компіляції / Please specify file to compile');
      process.exit(1);
    }
    compileFile(filePath);
  } else if (args[0] === 'execute' || args[0] === '-x') {
    const filePath = args[1];
    runBytecodeFile(filePath);
  } else {
    // Check extension
    if (args[0].endsWith('.uasb')) {
      runBytecodeFile(args[0]);
    } else {
      runFile(args[0], false);
    }
  }
}

function compileFile(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Файл не знайдено / File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(resolvedPath, 'utf-8');

  import('./index.js').then(({ compile }) => {
    const result = compile(source);
    if (!result.success || !result.module) {
      console.error('Помилка компіляції / Compilation error:', result.error);
      process.exit(1);
    }

    import('./serializer.js').then(({ Serializer }) => {
      const serializer = new Serializer();
      const buffer = serializer.serialize(result.module!);

      const outputPath = resolvedPath.replace(/\.uas$/, '.uasb');
      fs.writeFileSync(outputPath, buffer);
      console.log(`Скомпільовано в ${outputPath} / Compiled to ${outputPath}`);
    });
  });
}

function runBytecodeFile(filePath: string) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Файл не знайдено / File not found: ${filePath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(resolvedPath);

  import('./deserializer.js').then(({ Deserializer }) => {
    try {
      const deserializer = new Deserializer(buffer);
      const module = deserializer.deserialize();

      import('./index.js').then(({ VM }) => {
        const vm = new VM();
        // Simple output handler
        vm.onOutput = console.log;
        vm.run(module);
      });
    } catch (e: any) {
      console.error('Помилка виконання байткоду / Bytecode execution error:', e.message);
      process.exit(1);
    }
  });
}

function runFile(filePath: string, debug: boolean) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Файл не знайдено / File not found: ${filePath}`);
    process.exit(1);
  }

  const source = fs.readFileSync(resolvedPath, 'utf-8');
  const result = run(source, { debug });

  if (!result.success) {
    console.error('Помилка / Error:', result.error);
    process.exit(1);
  }
}

async function repl() {
  console.log(BANNER);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'uas> ',
  });

  let multilineBuffer = '';
  let braceCount = 0;

  rl.prompt();

  rl.on('line', (line: string) => {
    const trimmed = line.trim();

    // Commands
    if (!multilineBuffer) {
      if (trimmed === 'вихід' || trimmed === 'exit' || trimmed === 'quit') {
        console.log('До побачення! / Goodbye!');
        rl.close();
        return;
      }

      if (trimmed === 'допомога' || trimmed === 'help') {
        console.log(HELP);
        rl.prompt();
        return;
      }

      if (trimmed === 'приклад' || trimmed === 'example' || trimmed === 'examples') {
        console.log(EXAMPLES);
        rl.prompt();
        return;
      }

      if (trimmed === 'очистити' || trimmed === 'clear') {
        console.clear();
        console.log(BANNER);
        rl.prompt();
        return;
      }
    }

    // Track braces for multiline input
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }

    multilineBuffer += line + '\n';

    if (braceCount > 0) {
      rl.setPrompt('... ');
      rl.prompt();
      return;
    }

    // Execute
    const code = multilineBuffer.trim();
    multilineBuffer = '';
    braceCount = 0;
    rl.setPrompt('uas> ');

    if (!code) {
      rl.prompt();
      return;
    }

    const result = run(code);

    if (result.success) {
      if (result.value && result.value.type !== 'none') {
        console.log('→', formatValue(result.value));
      }
    } else {
      console.error('Помилка:', result.error);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main().catch(console.error);
