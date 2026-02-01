// UaScript 2.0 - Main Entry Point

export { Lexer } from './lexer.js';
export { Parser } from './parser.js';
export { Compiler } from './compiler.js';
export { VM } from './vm.js';
export * from './tokens.js';
export * from './ast.js';
export * from './bytecode.js';
export { Serializer } from './serializer.js';
export { Deserializer } from './deserializer.js';
export { STDLIB } from './stdlib.js';

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Compiler } from './compiler.js';
import { VM } from './vm.js';
import { valueToString, Value, CompiledModule } from './bytecode.js';

/**
 * Compile UaScript code to bytecode
 */
export function compile(source: string): { success: boolean, module?: CompiledModule, error?: string } {
  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const compiler = new Compiler();
    const module = compiler.compile(ast);
    return { success: true, module };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compile and run UaScript code
 */
export function run(source: string, options: RunOptions = {}): RunResult {
  const { debug = false, onOutput = console.log } = options;

  try {
    // Lexer
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    if (debug) {
      console.log('=== Tokens ===');
      tokens.forEach(t => console.log(`  ${t.type}: ${JSON.stringify(t.value)}`));
    }

    // Parser
    const parser = new Parser(tokens);
    const ast = parser.parse();

    if (debug) {
      console.log('\n=== AST ===');
      console.log(JSON.stringify(ast, null, 2));
    }

    // Compiler
    const compiler = new Compiler();
    const module = compiler.compile(ast);

    if (debug) {
      console.log('\n=== Bytecode ===');
      console.log('Constants:', module.constants);
      console.log('Globals:', module.globals);
      console.log('Main code:', module.mainCode);
      console.log('Functions:', module.functions.map(f => f.name));
    }

    // VM
    const vm = new VM();
    vm.onOutput = onOutput;
    const result = vm.run(module);

    return { success: true, value: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export interface RunOptions {
  debug?: boolean;
  onOutput?: (text: string) => void;
}

export interface RunResult {
  success: boolean;
  value?: Value;
  error?: string;
}

/**
 * Format a value for display
 */
export function formatValue(value: Value): string {
  return valueToString(value);
}
