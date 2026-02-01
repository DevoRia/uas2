// Compiler: AST -> Bytecode for UaScript 2.0

import * as AST from './ast.js';
import { OpCode, Instruction, CompiledFunction, CompiledModule, Value, Val, Upvalue } from './bytecode.js';

interface Local {
  index: number;
  isCaptured: boolean;  // Is this variable captured by a nested function?
}

interface UpvalueInfo {
  index: number;      // Index in upvalues array
  isLocal: boolean;   // Is it from parent's locals or parent's upvalues?
  parentIndex: number; // Index in parent's locals or upvalues
}

interface Scope {
  locals: Map<string, Local>;
  upvalues: Map<string, UpvalueInfo>;
  parent?: Scope;
  depth: number;  // Function nesting depth
}

interface FunctionContext {
  code: Instruction[];
  localCount: number;
  upvalues: UpvalueInfo[];
  scope: Scope;
}

export class Compiler {
  private constants: Value[] = [];
  private globals: string[] = [];
  private globalSet: Set<string> = new Set();
  private functions: CompiledFunction[] = [];
  private currentCode: Instruction[] = [];
  private scope: Scope = { locals: new Map(), upvalues: new Map(), depth: 0 };
  private localCount: number = 0;
  private upvalues: UpvalueInfo[] = [];
  private functionDepth: number = 0;

  compile(program: AST.Program): CompiledModule {
    // Compile top-level statements
    for (const stmt of program.body) {
      this.compileStatement(stmt);
    }
    
    // Add halt at end
    this.emit(OpCode.HALT);
    
    return {
      constants: this.constants,
      globals: this.globals,
      functions: this.functions,
      mainCode: this.currentCode,
    };
  }

  private compileStatement(stmt: AST.Statement): void {
    switch (stmt.kind) {
      case 'LetStatement':
        this.compileLetStatement(stmt);
        break;
      case 'VarStatement':
        this.compileVarStatement(stmt);
        break;
      case 'FunctionDecl':
        this.compileFunctionDecl(stmt);
        break;
      case 'ClassDecl':
        this.compileClassDecl(stmt);
        break;
      case 'DataDecl':
        this.compileDataDecl(stmt);
        break;
      case 'IfStatement':
        this.compileIfStatement(stmt);
        break;
      case 'WhileStatement':
        this.compileWhileStatement(stmt);
        break;
      case 'ForStatement':
        this.compileForStatement(stmt);
        break;
      case 'MatchStatement':
        this.compileMatchStatement(stmt);
        break;
      case 'ReturnStatement':
        this.compileReturnStatement(stmt);
        break;
      case 'BreakStatement':
        // TODO: implement break with loop tracking
        break;
      case 'ContinueStatement':
        // TODO: implement continue with loop tracking
        break;
      case 'ExpressionStatement':
        this.compileExpression(stmt.expression);
        this.emit(OpCode.POP); // Discard result
        break;
      case 'BlockStatement':
        this.pushScope();
        for (const s of stmt.statements) {
          this.compileStatement(s);
        }
        this.popScope();
        break;
    }
  }

  private compileLetStatement(stmt: AST.LetStatement): void {
    this.compileExpression(stmt.value);
    
    if (this.scope.parent) {
      // Local variable
      const idx = this.addLocal(stmt.name);
      this.emit(OpCode.STORE_VAR, idx);
    } else {
      // Global variable
      const idx = this.addGlobal(stmt.name);
      this.emit(OpCode.STORE_GLOBAL, idx);
    }
  }

  private compileVarStatement(stmt: AST.VarStatement): void {
    // Same as let for now (mutability is handled at runtime)
    this.compileExpression(stmt.value);
    
    if (this.scope.parent) {
      const idx = this.addLocal(stmt.name);
      this.emit(OpCode.STORE_VAR, idx);
    } else {
      const idx = this.addGlobal(stmt.name);
      this.emit(OpCode.STORE_GLOBAL, idx);
    }
  }

  private compileFunctionDecl(decl: AST.FunctionDecl): void {
    const savedCode = this.currentCode;
    const savedScope = this.scope;
    const savedLocalCount = this.localCount;
    const savedUpvalues = this.upvalues;
    const savedFunctionDepth = this.functionDepth;
    
    this.currentCode = [];
    this.localCount = 0;
    this.upvalues = [];
    this.functionDepth++;
    this.scope = { 
      locals: new Map(), 
      upvalues: new Map(),
      parent: savedScope,
      depth: this.functionDepth
    };
    
    // Add parameters as locals
    for (const param of decl.params) {
      this.addLocal(param.name);
    }
    
    // Compile function body
    for (const stmt of decl.body.statements) {
      this.compileStatement(stmt);
    }
    
    // Implicit return none
    this.emitConstant(Val.none());
    this.emit(OpCode.RETURN);
    
    const upvalueDescriptors: import('./bytecode.js').Upvalue[] = this.upvalues.map(uv => ({
      isLocal: uv.isLocal,
      index: uv.parentIndex
    }));
    
    const fn: CompiledFunction = {
      name: decl.name,
      arity: decl.params.length,
      localCount: this.localCount,
      upvalueCount: this.upvalues.length,
      upvalues: upvalueDescriptors,
      code: this.currentCode,
    };
    
    this.functions.push(fn);
    
    // Restore context
    this.currentCode = savedCode;
    this.scope = savedScope;
    this.localCount = savedLocalCount;
    this.upvalues = savedUpvalues;
    this.functionDepth = savedFunctionDepth;
    
    // Store function/closure as global
    const globalIdx = this.addGlobal(decl.name);
    
    if (fn.upvalueCount > 0) {
      // Create closure with upvalues
      this.emitConstant({ type: 'function', value: fn });
      this.emit(OpCode.MAKE_CLOSURE, fn.upvalueCount);
    } else {
      // Simple function without captures
      this.emitConstant({ type: 'function', value: fn });
    }
    this.emit(OpCode.STORE_GLOBAL, globalIdx);
  }

  private compileClassDecl(decl: AST.ClassDecl): void {
    // Simplified class compilation
    const fieldNames = decl.params.map(p => p.name);
    const methods = new Map<string, CompiledFunction>();
    
    // Compile methods
    for (const method of decl.body.methods) {
      const savedCode = this.currentCode;
      const savedScope = this.scope;
      const savedLocalCount = this.localCount;
      const savedUpvalues = this.upvalues;
      const savedFunctionDepth = this.functionDepth;
      
      this.currentCode = [];
      this.localCount = 0;
      this.upvalues = [];
      this.functionDepth++;
      this.scope = { 
        locals: new Map(), 
        upvalues: new Map(),
        parent: savedScope,
        depth: this.functionDepth
      };
      
      // 'self' is first local (both Ukrainian and English names point to same index)
      const selfIdx = this.addLocal('self');
      this.scope.locals.set('себе', { index: selfIdx, isCaptured: false });
      
      for (const param of method.params) {
        this.addLocal(param.name);
      }
      
      for (const stmt of method.body.statements) {
        this.compileStatement(stmt);
      }
      
      this.emitConstant(Val.none());
      this.emit(OpCode.RETURN);
      
      const fn: CompiledFunction = {
        name: method.name,
        arity: method.params.length + 1, // +1 for self
        localCount: this.localCount,
        upvalueCount: 0,
        upvalues: [],
        code: this.currentCode,
      };
      
      methods.set(method.name, fn);
      
      this.currentCode = savedCode;
      this.scope = savedScope;
      this.localCount = savedLocalCount;
      this.upvalues = savedUpvalues;
      this.functionDepth = savedFunctionDepth;
    }
    
    const classDef = { name: decl.name, fields: fieldNames, methods };
    const globalIdx = this.addGlobal(decl.name);
    this.emitConstant({ type: 'class', value: classDef });
    this.emit(OpCode.STORE_GLOBAL, globalIdx);
  }

  private compileDataDecl(decl: AST.DataDecl): void {
    // Data class is just a class with auto fields
    const fieldNames = decl.fields.map(f => f.name);
    const classDef = { name: decl.name, fields: fieldNames, methods: new Map() };
    const globalIdx = this.addGlobal(decl.name);
    this.emitConstant({ type: 'class', value: classDef });
    this.emit(OpCode.STORE_GLOBAL, globalIdx);
  }

  private compileIfStatement(stmt: AST.IfStatement): void {
    this.compileExpression(stmt.condition);
    
    const jumpToElse = this.emitJump(OpCode.JUMP_IF_FALSE);
    
    // Then branch
    this.pushScope();
    for (const s of stmt.thenBranch.statements) {
      this.compileStatement(s);
    }
    this.popScope();
    
    if (stmt.elseBranch) {
      const jumpOverElse = this.emitJump(OpCode.JUMP);
      this.patchJump(jumpToElse);
      
      if (stmt.elseBranch.kind === 'IfStatement') {
        this.compileIfStatement(stmt.elseBranch);
      } else {
        this.pushScope();
        for (const s of stmt.elseBranch.statements) {
          this.compileStatement(s);
        }
        this.popScope();
      }
      
      this.patchJump(jumpOverElse);
    } else {
      this.patchJump(jumpToElse);
    }
  }

  private compileWhileStatement(stmt: AST.WhileStatement): void {
    const loopStart = this.currentCode.length;
    
    this.compileExpression(stmt.condition);
    const exitJump = this.emitJump(OpCode.JUMP_IF_FALSE);
    
    this.pushScope();
    for (const s of stmt.body.statements) {
      this.compileStatement(s);
    }
    this.popScope();
    
    this.emitLoop(loopStart);
    this.patchJump(exitJump);
  }

  private compileForStatement(stmt: AST.ForStatement): void {
    // Compile iterable
    this.compileExpression(stmt.iterable);
    
    // Get iterator (simplified - just use index for lists)
    // TODO: proper iterator protocol
    const iterIdx = this.addLocal('__iter__');
    this.emitConstant(Val.int(0));
    this.emit(OpCode.STORE_VAR, iterIdx);
    
    const loopStart = this.currentCode.length;
    
    // Check if done (compare index with length)
    // Simplified: assume it's a list and iterate
    // This is a placeholder - real implementation needs iterator protocol
    
    const exitJump = this.emitJump(OpCode.JUMP_IF_FALSE);
    
    // Get current element
    this.pushScope();
    const varIdx = this.addLocal(stmt.variable);
    
    for (const s of stmt.body.statements) {
      this.compileStatement(s);
    }
    this.popScope();
    
    this.emitLoop(loopStart);
    this.patchJump(exitJump);
  }

  private compileMatchStatement(stmt: AST.MatchStatement): void {
    this.compileExpression(stmt.subject);
    
    const endJumps: number[] = [];
    
    for (const arm of stmt.arms) {
      this.emit(OpCode.DUP); // Keep subject for next comparison
      this.compilePattern(arm.pattern);
      
      const skipArm = this.emitJump(OpCode.JUMP_IF_FALSE);
      
      if (arm.guard) {
        this.compileExpression(arm.guard);
        const skipGuard = this.emitJump(OpCode.JUMP_IF_FALSE);
        this.compileExpression(arm.body);
        endJumps.push(this.emitJump(OpCode.JUMP));
        this.patchJump(skipGuard);
      } else {
        this.compileExpression(arm.body);
        endJumps.push(this.emitJump(OpCode.JUMP));
      }
      
      this.patchJump(skipArm);
    }
    
    // Default: push none if no match
    this.emitConstant(Val.none());
    
    for (const jump of endJumps) {
      this.patchJump(jump);
    }
    
    this.emit(OpCode.POP); // Remove subject copy
  }

  private compilePattern(pattern: AST.Pattern): void {
    switch (pattern.kind) {
      case 'WildcardPattern':
        this.emitConstant(Val.bool(true)); // Always matches
        break;
      case 'LiteralPattern':
        this.compileLiteral(pattern.value);
        this.emit(OpCode.EQ);
        break;
      case 'IdentifierPattern':
        // Bind to variable
        const idx = this.addLocal(pattern.name);
        this.emit(OpCode.DUP);
        this.emit(OpCode.STORE_VAR, idx);
        this.emitConstant(Val.bool(true));
        break;
      case 'RangePattern':
        // Check if value is in range
        this.emit(OpCode.DUP);
        this.compileExpression(pattern.start);
        this.emit(OpCode.GE);
        // Also check upper bound
        // Simplified for now
        break;
      case 'ConstructorPattern':
        // TODO: check constructor and destructure
        this.emitConstant(Val.bool(true));
        break;
    }
  }

  private compileReturnStatement(stmt: AST.ReturnStatement): void {
    if (stmt.value) {
      this.compileExpression(stmt.value);
    } else {
      this.emitConstant(Val.none());
    }
    this.emit(OpCode.RETURN);
  }

  private compileExpression(expr: AST.Expression): void {
    switch (expr.kind) {
      case 'Literal':
        this.compileLiteral(expr);
        break;
      case 'Identifier':
        this.compileIdentifier(expr);
        break;
      case 'BinaryExpr':
        this.compileBinaryExpr(expr);
        break;
      case 'UnaryExpr':
        this.compileUnaryExpr(expr);
        break;
      case 'CallExpr':
        this.compileCallExpr(expr);
        break;
      case 'MemberExpr':
        this.compileMemberExpr(expr);
        break;
      case 'IndexExpr':
        this.compileIndexExpr(expr);
        break;
      case 'ListExpr':
        this.compileListExpr(expr);
        break;
      case 'LambdaExpr':
        this.compileLambdaExpr(expr);
        break;
      case 'PipeExpr':
        this.compilePipeExpr(expr);
        break;
      case 'NewExpr':
        this.compileNewExpr(expr);
        break;
      case 'AssignExpr':
        this.compileAssignExpr(expr);
        break;
      default:
        throw new Error(`Unknown expression kind: ${(expr as any).kind}`);
    }
  }

  private compileLiteral(lit: AST.Literal): void {
    switch (lit.type) {
      case 'integer':
        this.emitConstant(Val.int(lit.value as number));
        break;
      case 'float':
        this.emitConstant(Val.float(lit.value as number));
        break;
      case 'string':
        this.emitConstant(Val.string(lit.value as string));
        break;
      case 'boolean':
        this.emitConstant(Val.bool(lit.value as boolean));
        break;
      case 'none':
        this.emitConstant(Val.none());
        break;
    }
  }

  private compileIdentifier(id: AST.Identifier): void {
    const resolved = this.resolveVariable(id.name);
    
    switch (resolved.type) {
      case 'local':
        this.emit(OpCode.LOAD_VAR, resolved.index);
        break;
      case 'upvalue':
        this.emit(OpCode.LOAD_UPVALUE, resolved.index);
        break;
      case 'global':
        this.emit(OpCode.LOAD_GLOBAL, resolved.index);
        break;
    }
  }

  private compileBinaryExpr(expr: AST.BinaryExpr): void {
    this.compileExpression(expr.left);
    this.compileExpression(expr.right);
    
    switch (expr.operator) {
      case '+': this.emit(OpCode.ADD); break;
      case '-': this.emit(OpCode.SUB); break;
      case '*': this.emit(OpCode.MUL); break;
      case '/': this.emit(OpCode.DIV); break;
      case '%': this.emit(OpCode.MOD); break;
      case '**': this.emit(OpCode.POW); break;
      case '==': this.emit(OpCode.EQ); break;
      case '!=': this.emit(OpCode.NE); break;
      case '<': this.emit(OpCode.LT); break;
      case '>': this.emit(OpCode.GT); break;
      case '<=': this.emit(OpCode.LE); break;
      case '>=': this.emit(OpCode.GE); break;
      case '&&': this.emit(OpCode.AND); break;
      case '||': this.emit(OpCode.OR); break;
      default:
        throw new Error(`Unknown operator: ${expr.operator}`);
    }
  }

  private compileUnaryExpr(expr: AST.UnaryExpr): void {
    this.compileExpression(expr.operand);
    
    switch (expr.operator) {
      case '-': this.emit(OpCode.NEG); break;
      case '!':
      case 'не':
      case 'not': this.emit(OpCode.NOT); break;
      default:
        throw new Error(`Unknown unary operator: ${expr.operator}`);
    }
  }

  private compileCallExpr(expr: AST.CallExpr): void {
    // Special handling for print
    if (expr.callee.kind === 'Identifier' && expr.callee.name === '__print__') {
      for (const arg of expr.args) {
        this.compileExpression(arg);
      }
      this.emit(OpCode.PRINT, expr.args.length);
      this.emitConstant(Val.none()); // print returns none
      return;
    }
    
    // Compile arguments first
    for (const arg of expr.args) {
      this.compileExpression(arg);
    }
    
    // Compile callee
    this.compileExpression(expr.callee);
    
    // Call
    this.emit(OpCode.CALL, expr.args.length);
  }

  private compileMemberExpr(expr: AST.MemberExpr): void {
    this.compileExpression(expr.object);
    const nameIdx = this.addConstant(Val.string(expr.property));
    this.emit(OpCode.GET_ATTR, nameIdx);
  }

  private compileIndexExpr(expr: AST.IndexExpr): void {
    this.compileExpression(expr.object);
    this.compileExpression(expr.index);
    this.emit(OpCode.GET_INDEX);
  }

  private compileListExpr(expr: AST.ListExpr): void {
    for (const el of expr.elements) {
      this.compileExpression(el);
    }
    this.emit(OpCode.MAKE_LIST, expr.elements.length);
  }

  private compileLambdaExpr(expr: AST.LambdaExpr): void {
    const savedCode = this.currentCode;
    const savedScope = this.scope;
    const savedLocalCount = this.localCount;
    const savedUpvalues = this.upvalues;
    const savedFunctionDepth = this.functionDepth;
    
    this.currentCode = [];
    this.localCount = 0;
    this.upvalues = [];
    this.functionDepth++;
    this.scope = { 
      locals: new Map(), 
      upvalues: new Map(),
      parent: savedScope,
      depth: this.functionDepth
    };
    
    for (const param of expr.params) {
      this.addLocal(param.name);
    }
    
    if ('kind' in expr.body && expr.body.kind === 'BlockStatement') {
      for (const stmt of expr.body.statements) {
        this.compileStatement(stmt);
      }
      this.emitConstant(Val.none());
    } else {
      this.compileExpression(expr.body as AST.Expression);
    }
    
    this.emit(OpCode.RETURN);
    
    const upvalueDescriptors: import('./bytecode.js').Upvalue[] = this.upvalues.map(uv => ({
      isLocal: uv.isLocal,
      index: uv.parentIndex
    }));
    
    const fn: CompiledFunction = {
      name: '<lambda>',
      arity: expr.params.length,
      localCount: this.localCount,
      upvalueCount: this.upvalues.length,
      upvalues: upvalueDescriptors,
      code: this.currentCode,
    };
    
    this.currentCode = savedCode;
    this.scope = savedScope;
    this.localCount = savedLocalCount;
    const capturedUpvalues = this.upvalues;  // Save before restoring
    this.upvalues = savedUpvalues;
    this.functionDepth = savedFunctionDepth;
    
    this.functions.push(fn);
    
    if (fn.upvalueCount > 0) {
      this.emitConstant({ type: 'function', value: fn });
      this.emit(OpCode.MAKE_CLOSURE, fn.upvalueCount);
    } else {
      this.emitConstant({ type: 'function', value: fn });
    }
  }

  private compilePipeExpr(expr: AST.PipeExpr): void {
    // left |> right => right(left)
    this.compileExpression(expr.left);
    this.compileExpression(expr.right);
    this.emit(OpCode.CALL, 1);
  }

  private compileNewExpr(expr: AST.NewExpr): void {
    // Compile constructor args first
    for (const arg of expr.args) {
      this.compileExpression(arg);
    }
    
    // Load class (will be on top of stack)
    const classIdx = this.globals.indexOf(expr.className);
    if (classIdx === -1) {
      // Class might not be defined yet, add it
      const newIdx = this.addGlobal(expr.className);
      this.emit(OpCode.LOAD_GLOBAL, newIdx);
    } else {
      this.emit(OpCode.LOAD_GLOBAL, classIdx);
    }
    
    this.emit(OpCode.NEW_INSTANCE, expr.args.length);
  }

  private compileAssignExpr(expr: AST.AssignExpr): void {
    // Compile the value
    this.compileExpression(expr.value);
    
    // Duplicate so the assignment expression returns the value
    this.emit(OpCode.DUP);
    
    const target = expr.target;
    
    if (target.kind === 'Identifier') {
      const resolved = this.resolveVariable(target.name);
      
      switch (resolved.type) {
        case 'local':
          this.emit(OpCode.STORE_VAR, resolved.index);
          break;
        case 'upvalue':
          this.emit(OpCode.STORE_UPVALUE, resolved.index);
          break;
        case 'global':
          this.emit(OpCode.STORE_GLOBAL, resolved.index);
          break;
      }
    } else if (target.kind === 'MemberExpr') {
      this.compileExpression(target.object);
      const nameIdx = this.addConstant(Val.string(target.property));
      this.emit(OpCode.SET_ATTR, nameIdx);
    } else if (target.kind === 'IndexExpr') {
      this.compileExpression(target.object);
      this.compileExpression(target.index);
      this.emit(OpCode.SET_INDEX);
    }
  }

  // ===================== Helpers =====================

  private emit(op: OpCode, arg?: number): void {
    this.currentCode.push({ op, arg });
  }

  private emitConstant(value: Value): void {
    const idx = this.addConstant(value);
    this.emit(OpCode.LOAD_CONST, idx);
  }

  private addConstant(value: Value): number {
    // Check for existing equal constant
    for (let i = 0; i < this.constants.length; i++) {
      if (this.valuesEqual(this.constants[i], value)) {
        return i;
      }
    }
    this.constants.push(value);
    return this.constants.length - 1;
  }

  private valuesEqual(a: Value, b: Value): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'none') return true;
    if ('value' in a && 'value' in b) {
      return a.value === b.value;
    }
    return false;
  }

  private addGlobal(name: string): number {
    if (this.globalSet.has(name)) {
      return this.globals.indexOf(name);
    }
    this.globals.push(name);
    this.globalSet.add(name);
    return this.globals.length - 1;
  }

  private emitJump(op: OpCode): number {
    this.emit(op, 0); // Placeholder
    return this.currentCode.length - 1;
  }

  private patchJump(idx: number): void {
    this.currentCode[idx].arg = this.currentCode.length;
  }

  private emitLoop(loopStart: number): void {
    this.emit(OpCode.JUMP, loopStart);
  }

  private pushScope(): void {
    this.scope = { 
      locals: new Map(), 
      upvalues: this.scope.upvalues,  // Share upvalues within same function
      parent: this.scope,
      depth: this.scope.depth
    };
  }

  private popScope(): void {
    if (this.scope.parent) {
      this.scope = this.scope.parent;
    }
  }

  private addLocal(name: string): number {
    const idx = this.localCount++;
    this.scope.locals.set(name, { index: idx, isCaptured: false });
    return idx;
  }
  
  // Resolve a variable - returns how to access it
  private resolveVariable(name: string): { type: 'local' | 'upvalue' | 'global'; index: number } {
    // Check locals in current and parent scopes (within same function)
    let scope: Scope | undefined = this.scope;
    while (scope && scope.depth === this.functionDepth) {
      const local = scope.locals.get(name);
      if (local) {
        return { type: 'local', index: local.index };
      }
      scope = scope.parent;
    }
    
    // Check upvalues (already captured)
    const upvalue = this.scope.upvalues.get(name);
    if (upvalue) {
      return { type: 'upvalue', index: upvalue.index };
    }
    
    // Check if we need to capture from enclosing function
    if (scope && this.functionDepth > 0) {
      const captured = this.captureUpvalue(name, scope);
      if (captured !== null) {
        return { type: 'upvalue', index: captured };
      }
    }
    
    // Must be global
    let globalIdx = this.globals.indexOf(name);
    if (globalIdx === -1) {
      globalIdx = this.addGlobal(name);
    }
    return { type: 'global', index: globalIdx };
  }
  
  // Capture a variable from an enclosing function
  private captureUpvalue(name: string, outerScope: Scope): number | null {
    // Look for the variable in outer scopes
    let scope: Scope | undefined = outerScope;
    while (scope) {
      const local = scope.locals.get(name);
      if (local) {
        // Mark as captured
        local.isCaptured = true;
        
        // Add to our upvalues
        const upvalueIdx = this.upvalues.length;
        const info: UpvalueInfo = {
          index: upvalueIdx,
          isLocal: true,
          parentIndex: local.index
        };
        this.upvalues.push(info);
        this.scope.upvalues.set(name, info);
        return upvalueIdx;
      }
      
      // Check if it's already an upvalue in the outer function
      const outerUpvalue = scope.upvalues.get(name);
      if (outerUpvalue) {
        const upvalueIdx = this.upvalues.length;
        const info: UpvalueInfo = {
          index: upvalueIdx,
          isLocal: false,
          parentIndex: outerUpvalue.index
        };
        this.upvalues.push(info);
        this.scope.upvalues.set(name, info);
        return upvalueIdx;
      }
      
      scope = scope.parent;
    }
    
    return null;  // Not found
  }

  private getLocalCount(): number {
    return this.localCount;
  }

  private resetLocalCount(): void {
    this.localCount = 0;
  }
}
