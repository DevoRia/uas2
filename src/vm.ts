// Virtual Machine for UaScript 2.0

import {
  OpCode,
  Instruction,
  CompiledFunction,
  CompiledModule,
  Value,
  Val,
  isTruthy,
  valueToString,
  ClassDef,
} from './bytecode.js';
import { STDLIB } from './stdlib.js';

import type { UpvalueCell } from './bytecode.js';

interface CallFrame {
  fn: CompiledFunction;
  ip: number;          // Instruction pointer
  stackBase: number;   // Base of this frame's stack
  locals: Value[];
  upvalues: UpvalueCell[];  // Captured variables
}

export class VM {
  private stack: Value[] = [];
  private globals: Map<string, Value> = new Map();
  private frames: CallFrame[] = [];
  private constants: Value[] = [];
  private globalNames: string[] = [];
  
  // Output callback for print
  public onOutput: (text: string) => void = console.log;

  run(module: CompiledModule): Value {
    this.constants = module.constants;
    this.globalNames = module.globals;
    
    // Load standard library
    for (const [name, value] of STDLIB) {
      this.globals.set(name, value);
    }
    
    // Register functions as globals
    for (const fn of module.functions) {
      this.globals.set(fn.name, { type: 'function', value: fn });
    }
    
    // Create main frame
    const mainFn: CompiledFunction = {
      name: '__main__',
      arity: 0,
      localCount: 0,
      upvalueCount: 0,
      upvalues: [],
      code: module.mainCode,
    };
    
    this.frames.push({
      fn: mainFn,
      ip: 0,
      stackBase: 0,
      locals: [],
      upvalues: [],
    });
    
    return this.execute();
  }

  private execute(): Value {
    while (this.frames.length > 0) {
      const frame = this.currentFrame();
      
      if (frame.ip >= frame.fn.code.length) {
        // End of function without return
        this.frames.pop();
        if (this.frames.length === 0) {
          return this.stack.length > 0 ? this.stack.pop()! : Val.none();
        }
        continue;
      }
      
      const instruction = frame.fn.code[frame.ip++];
      
      try {
        const result = this.executeInstruction(instruction);
        if (result !== undefined) {
          return result;
        }
      } catch (e) {
        throw new Error(`Runtime error at ${frame.fn.name}:${frame.ip - 1}: ${e}`);
      }
    }
    
    return this.stack.length > 0 ? this.stack.pop()! : Val.none();
  }

  private executeInstruction(instr: Instruction): Value | undefined {
    const { op, arg } = instr;
    
    switch (op) {
      case OpCode.NOP:
        break;
        
      case OpCode.HALT:
        return this.stack.length > 0 ? this.stack.pop()! : Val.none();
        
      case OpCode.LOAD_CONST:
        this.push(this.constants[arg!]);
        break;
        
      case OpCode.LOAD_VAR:
        this.push(this.currentFrame().locals[arg!] ?? Val.none());
        break;
        
      case OpCode.STORE_VAR: {
        const value = this.pop();
        const frame = this.currentFrame();
        while (frame.locals.length <= arg!) {
          frame.locals.push(Val.none());
        }
        frame.locals[arg!] = value;
        break;
      }
        
      case OpCode.LOAD_GLOBAL: {
        const name = this.globalNames[arg!];
        this.push(this.globals.get(name) ?? Val.none());
        break;
      }
        
      case OpCode.STORE_GLOBAL: {
        const name = this.globalNames[arg!];
        const value = this.pop();
        this.globals.set(name, value);
        break;
      }
        
      case OpCode.POP:
        this.pop();
        break;
        
      case OpCode.DUP:
        this.push(this.peek());
        break;
        
      // Arithmetic
      case OpCode.ADD: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.add(a, b));
        break;
      }
        
      case OpCode.SUB: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.sub(a, b));
        break;
      }
        
      case OpCode.MUL: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.mul(a, b));
        break;
      }
        
      case OpCode.DIV: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.div(a, b));
        break;
      }
        
      case OpCode.MOD: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.mod(a, b));
        break;
      }
        
      case OpCode.POW: {
        const b = this.pop();
        const a = this.pop();
        this.push(this.pow(a, b));
        break;
      }
        
      case OpCode.NEG: {
        const v = this.pop();
        if (v.type === 'int') this.push(Val.int(-v.value));
        else if (v.type === 'float') this.push(Val.float(-v.value));
        else throw new Error('Cannot negate non-number');
        break;
      }
        
      // Comparison
      case OpCode.EQ: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(this.equals(a, b)));
        break;
      }
        
      case OpCode.NE: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(!this.equals(a, b)));
        break;
      }
        
      case OpCode.LT: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(this.compare(a, b) < 0));
        break;
      }
        
      case OpCode.GT: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(this.compare(a, b) > 0));
        break;
      }
        
      case OpCode.LE: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(this.compare(a, b) <= 0));
        break;
      }
        
      case OpCode.GE: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(this.compare(a, b) >= 0));
        break;
      }
        
      // Logical
      case OpCode.AND: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(isTruthy(a) && isTruthy(b)));
        break;
      }
        
      case OpCode.OR: {
        const b = this.pop();
        const a = this.pop();
        this.push(Val.bool(isTruthy(a) || isTruthy(b)));
        break;
      }
        
      case OpCode.NOT: {
        const v = this.pop();
        this.push(Val.bool(!isTruthy(v)));
        break;
      }
        
      // Control flow
      case OpCode.JUMP:
        this.currentFrame().ip = arg!;
        break;
        
      case OpCode.JUMP_IF_FALSE: {
        const cond = this.pop();
        if (!isTruthy(cond)) {
          this.currentFrame().ip = arg!;
        }
        break;
      }
        
      case OpCode.JUMP_IF_TRUE: {
        const cond = this.pop();
        if (isTruthy(cond)) {
          this.currentFrame().ip = arg!;
        }
        break;
      }
        
      // Functions
      case OpCode.CALL: {
        const argc = arg!;
        const callee = this.pop();
        
        if (callee.type === 'boundMethod') {
          // Method call - prepend receiver as 'self'
          const { receiver, method } = callee.value;
          
          // Pop args
          const args: Value[] = [receiver]; // self is first
          for (let i = 0; i < argc; i++) {
            args.splice(1, 0, this.pop()); // insert after self, in reverse order
          }
          args.splice(1, 0, ...args.splice(1).reverse()); // fix order
          
          if (argc + 1 !== method.arity) {
            throw new Error(`Method expected ${method.arity - 1} args, got ${argc}`);
          }
          
          this.frames.push({
            fn: method,
            ip: 0,
            stackBase: this.stack.length,
            locals: args,
            upvalues: [],
          });
        } else if (callee.type === 'closure') {
          // Closure call - share the upvalue cells from the closure
          const { fn, cells } = callee.value;
          
          if (argc !== fn.arity) {
            throw new Error(`Expected ${fn.arity} args, got ${argc}`);
          }
          
          const args: Value[] = [];
          for (let i = 0; i < argc; i++) {
            args.unshift(this.pop());
          }
          
          // Share the closure's cells (mutations will be visible)
          this.frames.push({
            fn,
            ip: 0,
            stackBase: this.stack.length,
            locals: args,
            upvalues: cells,
          });
        } else if (callee.type === 'function') {
          const fn = callee.value;
          
          if ('fn' in fn) {
            // Builtin function
            const args: Value[] = [];
            for (let i = 0; i < argc; i++) {
              args.unshift(this.pop());
            }
            const result = fn.fn(...args);
            this.push(result);
          } else {
            // User function
            if (argc !== fn.arity) {
              throw new Error(`Expected ${fn.arity} args, got ${argc}`);
            }
            
            // Pop args and create new frame
            const args: Value[] = [];
            for (let i = 0; i < argc; i++) {
              args.unshift(this.pop());
            }
            
            this.frames.push({
              fn,
              ip: 0,
              stackBase: this.stack.length,
              locals: args,
              upvalues: [],
            });
          }
        } else {
          throw new Error(`Cannot call ${callee.type}`);
        }
        break;
      }
        
      case OpCode.RETURN: {
        const returnValue = this.pop();
        this.frames.pop();
        
        if (this.frames.length === 0) {
          return returnValue;
        }
        
        this.push(returnValue);
        break;
      }
      
      case OpCode.MAKE_CLOSURE: {
        const upvalueCount = arg!;
        const fnValue = this.pop();
        
        if (fnValue.type !== 'function' || 'fn' in fnValue.value) {
          throw new Error('MAKE_CLOSURE expects a compiled function');
        }
        
        const fn = fnValue.value;
        const cells: UpvalueCell[] = [];
        
        // Capture upvalues from current frame - create cells for sharing
        const currentFrame = this.currentFrame();
        for (let i = 0; i < upvalueCount; i++) {
          const desc = fn.upvalues[i];
          if (desc.isLocal) {
            // Capture from current frame's locals - create a new cell
            // We need to "close over" the local - create a cell and use it
            const value = currentFrame.locals[desc.index] ?? Val.none();
            cells.push({ value });
          } else {
            // Capture from current frame's upvalues - share the existing cell
            cells.push(currentFrame.upvalues[desc.index] ?? { value: Val.none() });
          }
        }
        
        this.push({ type: 'closure', value: { fn, cells } });
        break;
      }
      
      case OpCode.LOAD_UPVALUE: {
        const idx = arg!;
        const frame = this.currentFrame();
        this.push(frame.upvalues[idx]?.value ?? Val.none());
        break;
      }
      
      case OpCode.STORE_UPVALUE: {
        const idx = arg!;
        const value = this.pop();
        const frame = this.currentFrame();
        if (!frame.upvalues[idx]) {
          frame.upvalues[idx] = { value: Val.none() };
        }
        frame.upvalues[idx].value = value;
        break;
      }
        
      // Collections
      case OpCode.MAKE_LIST: {
        const elements: Value[] = [];
        for (let i = 0; i < arg!; i++) {
          elements.unshift(this.pop());
        }
        this.push(Val.list(elements));
        break;
      }
        
      case OpCode.GET_INDEX: {
        const index = this.pop();
        const obj = this.pop();
        
        if (obj.type === 'list' && index.type === 'int') {
          const arr = obj.value;
          const i = index.value;
          if (i < 0 || i >= arr.length) {
            throw new Error(`Index ${i} out of bounds`);
          }
          this.push(arr[i]);
        } else if (obj.type === 'string' && index.type === 'int') {
          const s = obj.value;
          const i = index.value;
          if (i < 0 || i >= s.length) {
            throw new Error(`Index ${i} out of bounds`);
          }
          this.push(Val.string(s[i]));
        } else {
          throw new Error(`Cannot index ${obj.type} with ${index.type}`);
        }
        break;
      }
        
      case OpCode.GET_ATTR: {
        const nameVal = this.constants[arg!];
        if (nameVal.type !== 'string') throw new Error('Attr name must be string');
        const name = nameVal.value;
        const obj = this.pop();
        
        if (obj.type === 'instance') {
          const field = obj.value.fields.get(name);
          if (field !== undefined) {
            this.push(field);
          } else {
            // Check methods
            const method = obj.value.classDef.methods.get(name);
            if (method) {
              // Return a bound method that includes the receiver
              this.push({ type: 'boundMethod', value: { receiver: obj, method } });
            } else {
              throw new Error(`Unknown field/method: ${name}`);
            }
          }
        } else if (obj.type === 'list') {
          // List methods
          if (name === 'length' || name === 'довжина') {
            this.push(Val.int(obj.value.length));
          } else {
            throw new Error(`Unknown list method: ${name}`);
          }
        } else if (obj.type === 'string') {
          if (name === 'length' || name === 'довжина') {
            this.push(Val.int(obj.value.length));
          } else {
            throw new Error(`Unknown string method: ${name}`);
          }
        } else {
          throw new Error(`Cannot get attr from ${obj.type}`);
        }
        break;
      }
      
      case OpCode.SET_ATTR: {
        const nameVal = this.constants[arg!];
        if (nameVal.type !== 'string') throw new Error('Attr name must be string');
        const name = nameVal.value;
        const obj = this.pop();
        const value = this.pop();
        
        if (obj.type === 'instance') {
          obj.value.fields.set(name, value);
        } else {
          throw new Error(`Cannot set attr on ${obj.type}`);
        }
        break;
      }
      
      case OpCode.SET_INDEX: {
        const index = this.pop();
        const obj = this.pop();
        const value = this.pop();
        
        if (obj.type === 'list' && index.type === 'int') {
          const i = index.value;
          if (i < 0 || i >= obj.value.length) {
            throw new Error(`Index ${i} out of bounds`);
          }
          obj.value[i] = value;
        } else {
          throw new Error(`Cannot set index on ${obj.type}`);
        }
        break;
      }
        
      case OpCode.NEW_INSTANCE: {
        const argc = arg!;
        const classVal = this.pop();
        
        if (classVal.type !== 'class') {
          throw new Error(`Cannot instantiate ${classVal.type}`);
        }
        
        const classDef = classVal.value;
        const args: Value[] = [];
        for (let i = 0; i < argc; i++) {
          args.unshift(this.pop());
        }
        
        // Create instance with fields from constructor args
        const fields = new Map<string, Value>();
        for (let i = 0; i < Math.min(classDef.fields.length, args.length); i++) {
          fields.set(classDef.fields[i], args[i]);
        }
        
        this.push({
          type: 'instance',
          value: { classDef, fields },
        });
        break;
      }
        
      // Built-ins
      case OpCode.PRINT: {
        const argc = arg!;
        const values: string[] = [];
        for (let i = 0; i < argc; i++) {
          values.unshift(valueToString(this.stack[this.stack.length - argc + i]));
        }
        for (let i = 0; i < argc; i++) {
          this.pop();
        }
        this.onOutput(values.join(' '));
        break;
      }
        
      default:
        throw new Error(`Unknown opcode: ${op}`);
    }
    
    return undefined;
  }

  // ===================== Helpers =====================

  private currentFrame(): CallFrame {
    return this.frames[this.frames.length - 1];
  }

  private push(value: Value): void {
    this.stack.push(value);
  }

  private pop(): Value {
    if (this.stack.length === 0) {
      throw new Error('Stack underflow');
    }
    return this.stack.pop()!;
  }

  private peek(): Value {
    if (this.stack.length === 0) {
      throw new Error('Stack is empty');
    }
    return this.stack[this.stack.length - 1];
  }

  private add(a: Value, b: Value): Value {
    if (a.type === 'int' && b.type === 'int') {
      return Val.int(a.value + b.value);
    }
    if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
      return Val.float(a.value + b.value);
    }
    if (a.type === 'string' && b.type === 'string') {
      return Val.string(a.value + b.value);
    }
    if (a.type === 'string' || b.type === 'string') {
      return Val.string(valueToString(a) + valueToString(b));
    }
    if (a.type === 'list' && b.type === 'list') {
      return Val.list([...a.value, ...b.value]);
    }
    throw new Error(`Cannot add ${a.type} and ${b.type}`);
  }

  private sub(a: Value, b: Value): Value {
    if (a.type === 'int' && b.type === 'int') {
      return Val.int(a.value - b.value);
    }
    if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
      return Val.float(a.value - b.value);
    }
    throw new Error(`Cannot subtract ${a.type} and ${b.type}`);
  }

  private mul(a: Value, b: Value): Value {
    if (a.type === 'int' && b.type === 'int') {
      return Val.int(a.value * b.value);
    }
    if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
      return Val.float(a.value * b.value);
    }
    if (a.type === 'string' && b.type === 'int') {
      return Val.string(a.value.repeat(b.value));
    }
    throw new Error(`Cannot multiply ${a.type} and ${b.type}`);
  }

  private div(a: Value, b: Value): Value {
    if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
      if (b.value === 0) throw new Error('Division by zero');
      return Val.float(a.value / b.value);
    }
    throw new Error(`Cannot divide ${a.type} and ${b.type}`);
  }

  private mod(a: Value, b: Value): Value {
    if (a.type === 'int' && b.type === 'int') {
      if (b.value === 0) throw new Error('Modulo by zero');
      return Val.int(a.value % b.value);
    }
    throw new Error(`Cannot mod ${a.type} and ${b.type}`);
  }

  private pow(a: Value, b: Value): Value {
    if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
      const result = Math.pow(a.value, b.value);
      if (a.type === 'int' && b.type === 'int' && b.value >= 0) {
        return Val.int(result);
      }
      return Val.float(result);
    }
    throw new Error(`Cannot pow ${a.type} and ${b.type}`);
  }

  private equals(a: Value, b: Value): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'none') return true;
    if (a.type === 'int' || a.type === 'float' || a.type === 'bool' || a.type === 'string') {
      return a.value === (b as typeof a).value;
    }
    if (a.type === 'list') {
      const bList = b as { type: 'list'; value: Value[] };
      if (a.value.length !== bList.value.length) return false;
      return a.value.every((v, i) => this.equals(v, bList.value[i]));
    }
    return false;
  }

  private compare(a: Value, b: Value): number {
    if ((a.type === 'int' || a.type === 'float') && (b.type === 'int' || b.type === 'float')) {
      return a.value - b.value;
    }
    if (a.type === 'string' && b.type === 'string') {
      return a.value.localeCompare(b.value);
    }
    throw new Error(`Cannot compare ${a.type} and ${b.type}`);
  }
}
