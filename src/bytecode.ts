// Bytecode definitions for UaScript 2.0 VM

export enum OpCode {
  // Stack operations
  LOAD_CONST = 0x01,      // Push constant onto stack
  LOAD_VAR = 0x02,        // Load variable by index
  STORE_VAR = 0x03,       // Store top of stack in variable
  LOAD_GLOBAL = 0x04,     // Load global by name index
  STORE_GLOBAL = 0x05,    // Store global by name index
  POP = 0x06,             // Pop top of stack
  DUP = 0x07,             // Duplicate top of stack
  
  // Arithmetic
  ADD = 0x10,
  SUB = 0x11,
  MUL = 0x12,
  DIV = 0x13,
  MOD = 0x14,
  POW = 0x15,
  NEG = 0x16,             // Unary negation
  
  // Comparison
  EQ = 0x20,
  NE = 0x21,
  LT = 0x22,
  GT = 0x23,
  LE = 0x24,
  GE = 0x25,
  
  // Logical
  AND = 0x30,
  OR = 0x31,
  NOT = 0x32,
  
  // Control flow
  JUMP = 0x40,            // Unconditional jump
  JUMP_IF_FALSE = 0x41,   // Jump if top is falsy
  JUMP_IF_TRUE = 0x42,    // Jump if top is truthy
  
  // Functions
  CALL = 0x50,            // Call function with N args
  RETURN = 0x51,          // Return from function
  MAKE_FUNCTION = 0x52,   // Create function object
  MAKE_CLOSURE = 0x53,    // Create closure with upvalues
  LOAD_UPVALUE = 0x54,    // Load captured variable
  STORE_UPVALUE = 0x55,   // Store to captured variable
  
  // Objects & Collections
  MAKE_LIST = 0x60,       // Create list with N elements
  MAKE_MAP = 0x61,        // Create map with N pairs
  GET_INDEX = 0x62,       // Get element by index
  SET_INDEX = 0x63,       // Set element by index
  GET_ATTR = 0x64,        // Get attribute by name
  SET_ATTR = 0x65,        // Set attribute by name
  MAKE_CLASS = 0x66,      // Create class
  NEW_INSTANCE = 0x67,    // Create instance
  
  // Pattern Matching
  MATCH_VALUE = 0x70,     // Match against value
  MATCH_TYPE = 0x71,      // Match against type
  MATCH_RANGE = 0x72,     // Match against range
  
  // Built-ins
  PRINT = 0x80,           // Print N values
  
  // Special
  NOP = 0x00,
  HALT = 0xFF,
}

// Bytecode instruction
export interface Instruction {
  op: OpCode;
  arg?: number;
}

// Upvalue descriptor - describes how to capture a variable
export interface Upvalue {
  isLocal: boolean;  // true = capture from parent's locals, false = from parent's upvalues
  index: number;     // index in parent's locals or upvalues array
}

// Compiled function
export interface CompiledFunction {
  name: string;
  arity: number;           // Number of parameters
  localCount: number;      // Number of local variables
  upvalueCount: number;    // Number of upvalues (captured variables)
  upvalues: Upvalue[];     // How to capture each upvalue
  code: Instruction[];
}

// Compiled module/program
export interface CompiledModule {
  constants: Value[];
  globals: string[];       // Global variable names
  functions: CompiledFunction[];
  mainCode: Instruction[]; // Top-level code
}

// Runtime values
export type Value =
  | { type: 'int'; value: number }
  | { type: 'float'; value: number }
  | { type: 'string'; value: string }
  | { type: 'bool'; value: boolean }
  | { type: 'none' }
  | { type: 'list'; value: Value[] }
  | { type: 'map'; value: Map<string, Value> }
  | { type: 'function'; value: CompiledFunction | BuiltinFunction }
  | { type: 'closure'; value: Closure }
  | { type: 'boundMethod'; value: BoundMethod }
  | { type: 'class'; value: ClassDef }
  | { type: 'instance'; value: Instance };

// Upvalue cell - shared mutable reference for closures
export interface UpvalueCell {
  value: Value;
}

export interface Closure {
  fn: CompiledFunction;
  cells: UpvalueCell[];  // Shared mutable cells for captured variables
}

export interface BoundMethod {
  receiver: Value;
  method: CompiledFunction;
}

export interface BuiltinFunction {
  name: string;
  arity: number;
  fn: (...args: Value[]) => Value;
}

export interface ClassDef {
  name: string;
  fields: string[];
  methods: Map<string, CompiledFunction>;
}

export interface Instance {
  classDef: ClassDef;
  fields: Map<string, Value>;
}

// Helper to create values
export const Val = {
  int: (n: number): Value => ({ type: 'int', value: n }),
  float: (n: number): Value => ({ type: 'float', value: n }),
  string: (s: string): Value => ({ type: 'string', value: s }),
  bool: (b: boolean): Value => ({ type: 'bool', value: b }),
  none: (): Value => ({ type: 'none' }),
  list: (arr: Value[]): Value => ({ type: 'list', value: arr }),
};

// Check truthiness
export function isTruthy(v: Value): boolean {
  switch (v.type) {
    case 'bool': return v.value;
    case 'none': return false;
    case 'int': return v.value !== 0;
    case 'float': return v.value !== 0;
    case 'string': return v.value.length > 0;
    case 'list': return v.value.length > 0;
    default: return true;
  }
}

// Value to string for display
export function valueToString(v: Value): string {
  switch (v.type) {
    case 'int':
    case 'float':
      return String(v.value);
    case 'string':
      return v.value;
    case 'bool':
      return v.value ? 'true' : 'false';
    case 'none':
      return 'none';
    case 'list':
      return '[' + v.value.map(valueToString).join(', ') + ']';
    case 'map': {
      const entries = [...v.value.entries()].map(([k, val]) => `${k}: ${valueToString(val)}`);
      return '{' + entries.join(', ') + '}';
    }
    case 'function':
      return `<функція ${typeof v.value === 'function' ? 'builtin' : v.value.name}>`;
    case 'closure':
      return `<замикання ${v.value.fn.name}>`;
    case 'boundMethod':
      return `<метод ${v.value.method.name}>`;
    case 'class':
      return `<клас ${v.value.name}>`;
    case 'instance':
      return `<${v.value.classDef.name} instance>`;
    default:
      return '<unknown>';
  }
}
