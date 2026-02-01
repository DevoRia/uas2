// Standard Library for UaScript 2.0

import { Value, Val, BuiltinFunction, valueToString } from './bytecode.js';

export const STDLIB: Map<string, Value> = new Map();

// Math functions
STDLIB.set('абс', { type: 'function', value: makeBuiltin('абс', 1, (x) => {
  if (x.type === 'int') return Val.int(Math.abs(x.value));
  if (x.type === 'float') return Val.float(Math.abs(x.value));
  throw new Error('абс() expects a number');
})});
STDLIB.set('abs', STDLIB.get('абс')!);

STDLIB.set('корінь', { type: 'function', value: makeBuiltin('корінь', 1, (x) => {
  if (x.type === 'int' || x.type === 'float') return Val.float(Math.sqrt(x.value));
  throw new Error('корінь() expects a number');
})});
STDLIB.set('sqrt', STDLIB.get('корінь')!);

STDLIB.set('мін', { type: 'function', value: makeBuiltin('мін', 2, (a, b) => {
  if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
    const min = Math.min(a.value, b.value);
    return a.type === 'int' && b.type === 'int' ? Val.int(min) : Val.float(min);
  }
  throw new Error('мін() expects numbers');
})});
STDLIB.set('min', STDLIB.get('мін')!);

STDLIB.set('макс', { type: 'function', value: makeBuiltin('макс', 2, (a, b) => {
  if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
    const max = Math.max(a.value, b.value);
    return a.type === 'int' && b.type === 'int' ? Val.int(max) : Val.float(max);
  }
  throw new Error('макс() expects numbers');
})});
STDLIB.set('max', STDLIB.get('макс')!);

STDLIB.set('округлити', { type: 'function', value: makeBuiltin('округлити', 1, (x) => {
  if (x.type === 'int' || x.type === 'float') return Val.int(Math.round(x.value));
  throw new Error('округлити() expects a number');
})});
STDLIB.set('round', STDLIB.get('округлити')!);

STDLIB.set('підлога', { type: 'function', value: makeBuiltin('підлога', 1, (x) => {
  if (x.type === 'int' || x.type === 'float') return Val.int(Math.floor(x.value));
  throw new Error('підлога() expects a number');
})});
STDLIB.set('floor', STDLIB.get('підлога')!);

STDLIB.set('стеля', { type: 'function', value: makeBuiltin('стеля', 1, (x) => {
  if (x.type === 'int' || x.type === 'float') return Val.int(Math.ceil(x.value));
  throw new Error('стеля() expects a number');
})});
STDLIB.set('ceil', STDLIB.get('стеля')!);

// String functions
STDLIB.set('довжина', { type: 'function', value: makeBuiltin('довжина', 1, (x) => {
  if (x.type === 'string') return Val.int(x.value.length);
  if (x.type === 'list') return Val.int(x.value.length);
  throw new Error('довжина() expects string or list');
})});
STDLIB.set('len', STDLIB.get('довжина')!);
STDLIB.set('length', STDLIB.get('довжина')!);

STDLIB.set('верхній', { type: 'function', value: makeBuiltin('верхній', 1, (x) => {
  if (x.type === 'string') return Val.string(x.value.toUpperCase());
  throw new Error('верхній() expects a string');
})});
STDLIB.set('upper', STDLIB.get('верхній')!);

STDLIB.set('нижній', { type: 'function', value: makeBuiltin('нижній', 1, (x) => {
  if (x.type === 'string') return Val.string(x.value.toLowerCase());
  throw new Error('нижній() expects a string');
})});
STDLIB.set('lower', STDLIB.get('нижній')!);

STDLIB.set('обрізати', { type: 'function', value: makeBuiltin('обрізати', 1, (x) => {
  if (x.type === 'string') return Val.string(x.value.trim());
  throw new Error('обрізати() expects a string');
})});
STDLIB.set('trim', STDLIB.get('обрізати')!);

STDLIB.set('розділити', { type: 'function', value: makeBuiltin('розділити', 2, (s, sep) => {
  if (s.type === 'string' && sep.type === 'string') {
    return Val.list(s.value.split(sep.value).map(x => Val.string(x)));
  }
  throw new Error('розділити() expects two strings');
})});
STDLIB.set('split', STDLIB.get('розділити')!);

STDLIB.set('зєднати', { type: 'function', value: makeBuiltin('зєднати', 2, (list, sep) => {
  if (list.type === 'list' && sep.type === 'string') {
    return Val.string(list.value.map(v => valueToString(v)).join(sep.value));
  }
  throw new Error('зєднати() expects list and string');
})});
STDLIB.set('join', STDLIB.get('зєднати')!);

// Type conversion
STDLIB.set('ціле', { type: 'function', value: makeBuiltin('ціле', 1, (x) => {
  if (x.type === 'int') return x;
  if (x.type === 'float') return Val.int(Math.trunc(x.value));
  if (x.type === 'string') {
    const n = parseInt(x.value);
    if (isNaN(n)) throw new Error(`Cannot convert "${x.value}" to int`);
    return Val.int(n);
  }
  if (x.type === 'bool') return Val.int(x.value ? 1 : 0);
  throw new Error('Cannot convert to int');
})});
STDLIB.set('int', STDLIB.get('ціле')!);

STDLIB.set('дріб', { type: 'function', value: makeBuiltin('дріб', 1, (x) => {
  if (x.type === 'int') return Val.float(x.value);
  if (x.type === 'float') return x;
  if (x.type === 'string') {
    const n = parseFloat(x.value);
    if (isNaN(n)) throw new Error(`Cannot convert "${x.value}" to float`);
    return Val.float(n);
  }
  throw new Error('Cannot convert to float');
})});
STDLIB.set('float', STDLIB.get('дріб')!);

STDLIB.set('текст', { type: 'function', value: makeBuiltin('текст', 1, (x) => {
  return Val.string(valueToString(x));
})});
STDLIB.set('str', STDLIB.get('текст')!);
STDLIB.set('string', STDLIB.get('текст')!);

STDLIB.set('булеве', { type: 'function', value: makeBuiltin('булеве', 1, (x) => {
  if (x.type === 'bool') return x;
  if (x.type === 'int') return Val.bool(x.value !== 0);
  if (x.type === 'string') return Val.bool(x.value.length > 0);
  if (x.type === 'none') return Val.bool(false);
  if (x.type === 'list') return Val.bool(x.value.length > 0);
  return Val.bool(true);
})});
STDLIB.set('bool', STDLIB.get('булеве')!);

// List functions
STDLIB.set('діапазон', { type: 'function', value: makeBuiltin('діапазон', -1, (...args) => {
  let start = 0, end = 0, step = 1;
  
  if (args.length === 1) {
    if (args[0].type !== 'int') throw new Error('діапазон() expects integers');
    end = args[0].value;
  } else if (args.length === 2) {
    if (args[0].type !== 'int' || args[1].type !== 'int') throw new Error('діапазон() expects integers');
    start = args[0].value;
    end = args[1].value;
  } else if (args.length === 3) {
    if (args[0].type !== 'int' || args[1].type !== 'int' || args[2].type !== 'int') {
      throw new Error('діапазон() expects integers');
    }
    start = args[0].value;
    end = args[1].value;
    step = args[2].value;
  } else {
    throw new Error('діапазон() expects 1-3 arguments');
  }
  
  if (step === 0) throw new Error('step cannot be 0');
  
  const result: Value[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(Val.int(i));
  } else {
    for (let i = start; i > end; i += step) result.push(Val.int(i));
  }
  return Val.list(result);
})});
STDLIB.set('range', STDLIB.get('діапазон')!);

STDLIB.set('сума', { type: 'function', value: makeBuiltin('сума', 1, (list) => {
  if (list.type !== 'list') throw new Error('сума() expects a list');
  let sum = 0;
  let isFloat = false;
  for (const item of list.value) {
    if (item.type === 'int') sum += item.value;
    else if (item.type === 'float') { sum += item.value; isFloat = true; }
    else throw new Error('сума() expects list of numbers');
  }
  return isFloat ? Val.float(sum) : Val.int(sum);
})});
STDLIB.set('sum', STDLIB.get('сума')!);

// I/O
STDLIB.set('ввід', { type: 'function', value: makeBuiltin('ввід', 1, (prompt) => {
  // Note: This is synchronous and only works in Node.js REPL context
  // For now, return empty string
  if (prompt.type === 'string') {
    process.stdout.write(prompt.value);
  }
  // TODO: implement actual input
  return Val.string('');
})});
STDLIB.set('input', STDLIB.get('ввід')!);

// Type checking
STDLIB.set('тип', { type: 'function', value: makeBuiltin('тип', 1, (x) => {
  return Val.string(x.type);
})});
STDLIB.set('type', STDLIB.get('тип')!);
STDLIB.set('typeof', STDLIB.get('тип')!);

// Helper function
function makeBuiltin(name: string, arity: number, fn: (...args: Value[]) => Value): BuiltinFunction {
  return { name, arity, fn };
}
