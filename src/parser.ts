// Parser for UaScript 2.0 - Recursive Descent

import { Token, TokenType } from './tokens.js';
import * as AST from './ast.js';

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST.Program {
    const statements: AST.Statement[] = [];
    
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    
    return { kind: 'Program', body: statements };
  }

  // ===================== Statements =====================

  private parseStatement(): AST.Statement {
    // Variable declarations
    if (this.check(TokenType.LET) || this.check(TokenType.CONST)) {
      return this.parseLetStatement();
    }
    if (this.check(TokenType.VAR)) {
      return this.parseVarStatement();
    }
    
    // Function declaration
    if (this.check(TokenType.FUN) || (this.check(TokenType.ASYNC) && this.checkNext(TokenType.FUN))) {
      return this.parseFunctionDecl();
    }
    
    // Class declaration
    if (this.check(TokenType.CLASS)) {
      return this.parseClassDecl();
    }
    
    // Data declaration
    if (this.check(TokenType.DATA)) {
      return this.parseDataDecl();
    }
    
    // Trait declaration
    if (this.check(TokenType.TRAIT)) {
      return this.parseTraitDecl();
    }
    
    // Control flow
    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }
    if (this.check(TokenType.WHILE)) {
      return this.parseWhileStatement();
    }
    if (this.check(TokenType.FOR)) {
      return this.parseForStatement();
    }
    if (this.check(TokenType.MATCH)) {
      return this.parseMatchStatement();
    }
    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }
    if (this.check(TokenType.BREAK)) {
      this.advance();
      return { kind: 'BreakStatement' };
    }
    if (this.check(TokenType.CONTINUE)) {
      this.advance();
      return { kind: 'ContinueStatement' };
    }
    
    // Block
    if (this.check(TokenType.LBRACE)) {
      return this.parseBlock();
    }
    
    // Expression statement
    return this.parseExpressionStatement();
  }

  private parseLetStatement(): AST.LetStatement {
    this.advance(); // consume 'let'/'нехай'
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    
    let typeAnnotation: AST.TypeAnnotation | undefined;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.parseTypeAnnotation();
    }
    
    this.consume(TokenType.ASSIGN, 'Expected "=" in variable declaration');
    const value = this.parseExpression();
    
    return { kind: 'LetStatement', name, typeAnnotation, value };
  }

  private parseVarStatement(): AST.VarStatement {
    this.advance(); // consume 'var'/'змінна'
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    
    let typeAnnotation: AST.TypeAnnotation | undefined;
    if (this.match(TokenType.COLON)) {
      typeAnnotation = this.parseTypeAnnotation();
    }
    
    this.consume(TokenType.ASSIGN, 'Expected "=" in variable declaration');
    const value = this.parseExpression();
    
    return { kind: 'VarStatement', name, typeAnnotation, value };
  }

  private parseFunctionDecl(): AST.FunctionDecl {
    const isAsync = this.match(TokenType.ASYNC);
    this.consume(TokenType.FUN, 'Expected "fun" or "функція"');
    
    const name = this.consume(TokenType.IDENTIFIER, 'Expected function name').value;
    this.consume(TokenType.LPAREN, 'Expected "(" after function name');
    
    const params = this.parseParameters();
    this.consume(TokenType.RPAREN, 'Expected ")" after parameters');
    
    let returnType: AST.TypeAnnotation | undefined;
    if (this.match(TokenType.ARROW)) {
      returnType = this.parseTypeAnnotation();
    }
    
    const body = this.parseBlock();
    
    return { kind: 'FunctionDecl', name, params, returnType, body, isAsync };
  }

  private parseParameters(): AST.Parameter[] {
    const params: AST.Parameter[] = [];
    
    if (!this.check(TokenType.RPAREN)) {
      do {
        const name = this.consume(TokenType.IDENTIFIER, 'Expected parameter name').value;
        let type: AST.TypeAnnotation | undefined;
        let defaultValue: AST.Expression | undefined;
        
        if (this.match(TokenType.COLON)) {
          type = this.parseTypeAnnotation();
        }
        if (this.match(TokenType.ASSIGN)) {
          defaultValue = this.parseExpression();
        }
        
        params.push({ name, type, defaultValue });
      } while (this.match(TokenType.COMMA));
    }
    
    return params;
  }

  private parseClassDecl(): AST.ClassDecl {
    this.advance(); // consume 'class'
    const name = this.consume(TokenType.IDENTIFIER, 'Expected class name').value;
    
    // Constructor params
    let params: AST.Parameter[] = [];
    if (this.match(TokenType.LPAREN)) {
      params = this.parseParameters();
      this.consume(TokenType.RPAREN, 'Expected ")" after class parameters');
    }
    
    // Traits
    const traits: string[] = [];
    // Could add 'extends'/'походить' support here
    
    this.consume(TokenType.LBRACE, 'Expected "{" before class body');
    
    const methods: AST.FunctionDecl[] = [];
    const fields: AST.LetStatement[] = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.FUN) || this.check(TokenType.ASYNC)) {
        methods.push(this.parseFunctionDecl());
      } else if (this.check(TokenType.LET) || this.check(TokenType.CONST)) {
        fields.push(this.parseLetStatement());
      } else {
        throw this.error(this.peek(), 'Expected method or field in class');
      }
    }
    
    this.consume(TokenType.RBRACE, 'Expected "}" after class body');
    
    return { kind: 'ClassDecl', name, params, traits, body: { methods, fields } };
  }

  private parseDataDecl(): AST.DataDecl {
    this.advance(); // consume 'data'
    const name = this.consume(TokenType.IDENTIFIER, 'Expected data class name').value;
    
    this.consume(TokenType.LPAREN, 'Expected "(" after data class name');
    const fields = this.parseParameters();
    this.consume(TokenType.RPAREN, 'Expected ")" after data class fields');
    
    return { kind: 'DataDecl', name, fields };
  }

  private parseTraitDecl(): AST.TraitDecl {
    this.advance(); // consume 'trait'
    const name = this.consume(TokenType.IDENTIFIER, 'Expected trait name').value;
    
    this.consume(TokenType.LBRACE, 'Expected "{" before trait body');
    
    const methods: AST.FunctionSignature[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      this.consume(TokenType.FUN, 'Expected function signature in trait');
      const methodName = this.consume(TokenType.IDENTIFIER, 'Expected method name').value;
      this.consume(TokenType.LPAREN, 'Expected "("');
      const params = this.parseParameters();
      this.consume(TokenType.RPAREN, 'Expected ")"');
      
      let returnType: AST.TypeAnnotation | undefined;
      if (this.match(TokenType.ARROW)) {
        returnType = this.parseTypeAnnotation();
      }
      
      methods.push({ name: methodName, params, returnType });
    }
    
    this.consume(TokenType.RBRACE, 'Expected "}" after trait body');
    
    return { kind: 'TraitDecl', name, methods };
  }

  private parseIfStatement(): AST.IfStatement {
    this.advance(); // consume 'if'
    const condition = this.parseExpression();
    const thenBranch = this.parseBlock();
    
    let elseBranch: AST.BlockStatement | AST.IfStatement | undefined;
    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        elseBranch = this.parseIfStatement();
      } else {
        elseBranch = this.parseBlock();
      }
    }
    
    return { kind: 'IfStatement', condition, thenBranch, elseBranch };
  }

  private parseWhileStatement(): AST.WhileStatement {
    this.advance(); // consume 'while'
    const condition = this.parseExpression();
    const body = this.parseBlock();
    return { kind: 'WhileStatement', condition, body };
  }

  private parseForStatement(): AST.ForStatement {
    this.advance(); // consume 'for'
    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name').value;
    this.consume(TokenType.IN, 'Expected "in" or "в"');
    const iterable = this.parseExpression();
    const body = this.parseBlock();
    return { kind: 'ForStatement', variable, iterable, body };
  }

  private parseMatchStatement(): AST.MatchStatement {
    this.advance(); // consume 'match'
    const subject = this.parseExpression();
    this.consume(TokenType.LBRACE, 'Expected "{"');
    
    const arms: AST.MatchArm[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      arms.push(this.parseMatchArm());
      this.match(TokenType.COMMA); // Optional comma between arms
    }
    
    this.consume(TokenType.RBRACE, 'Expected "}"');
    return { kind: 'MatchStatement', subject, arms };
  }

  private parseMatchArm(): AST.MatchArm {
    const pattern = this.parsePattern();
    
    let guard: AST.Expression | undefined;
    if (this.match(TokenType.IF)) {
      guard = this.parseExpression();
    }
    
    this.consume(TokenType.FAT_ARROW, 'Expected "=>" in match arm');
    const body = this.parseExpression();
    
    return { pattern, guard, body };
  }

  private parsePattern(): AST.Pattern {
    if (this.match(TokenType.UNDERSCORE)) {
      return { kind: 'WildcardPattern' };
    }
    
    // Check for range pattern
    if (this.check(TokenType.INTEGER) || this.check(TokenType.FLOAT)) {
      const start = this.parseLiteral();
      if (this.match(TokenType.RANGE)) {
        const endExpr = this.parseLiteral();
        return { kind: 'RangePattern', start, end: endExpr };
      }
      return { kind: 'LiteralPattern', value: start };
    }
    
    if (this.check(TokenType.STRING) || this.check(TokenType.TRUE) || this.check(TokenType.FALSE)) {
      const lit = this.parseLiteral();
      return { kind: 'LiteralPattern', value: lit };
    }
    
    if (this.check(TokenType.IDENTIFIER)) {
      const name = this.advance().value;
      // Could be constructor pattern or identifier
      if (this.match(TokenType.LPAREN)) {
        const args: AST.Pattern[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parsePattern());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, 'Expected ")"');
        return { kind: 'ConstructorPattern', name, args };
      }
      return { kind: 'IdentifierPattern', name };
    }
    
    throw this.error(this.peek(), 'Expected pattern');
  }

  private parseReturnStatement(): AST.ReturnStatement {
    this.advance(); // consume 'return'
    let value: AST.Expression | undefined;
    
    // If not at end of statement, parse return value
    if (!this.check(TokenType.RBRACE) && !this.check(TokenType.EOF) && !this.check(TokenType.SEMICOLON)) {
      value = this.parseExpression();
    }
    
    return { kind: 'ReturnStatement', value };
  }

  private parseExpressionStatement(): AST.ExpressionStatement {
    const expression = this.parseExpression();
    return { kind: 'ExpressionStatement', expression };
  }

  private parseBlock(): AST.BlockStatement {
    this.consume(TokenType.LBRACE, 'Expected "{"');
    const statements: AST.Statement[] = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.parseStatement());
    }
    
    this.consume(TokenType.RBRACE, 'Expected "}"');
    return { kind: 'BlockStatement', statements };
  }

  // ===================== Expressions =====================

  private parseExpression(): AST.Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): AST.Expression {
    const expr = this.parsePipe();
    
    if (this.match(TokenType.ASSIGN)) {
      const value = this.parseAssignment(); // Right associative
      
      if (expr.kind === 'Identifier') {
        return { kind: 'AssignExpr', target: expr, value };
      } else if (expr.kind === 'MemberExpr') {
        return { kind: 'AssignExpr', target: expr, value };
      } else if (expr.kind === 'IndexExpr') {
        return { kind: 'AssignExpr', target: expr, value };
      }
      
      throw this.error(this.previous(), 'Invalid assignment target');
    }
    
    return expr;
  }

  private parsePipe(): AST.Expression {
    let left = this.parseOr();
    
    while (this.match(TokenType.PIPE)) {
      const right = this.parseOr();
      left = { kind: 'PipeExpr', left, right };
    }
    
    return left;
  }

  private parseOr(): AST.Expression {
    let left = this.parseAnd();
    
    while (this.match(TokenType.OR)) {
      const right = this.parseAnd();
      left = { kind: 'BinaryExpr', operator: '||', left, right };
    }
    
    return left;
  }

  private parseAnd(): AST.Expression {
    let left = this.parseEquality();
    
    while (this.match(TokenType.AND)) {
      const right = this.parseEquality();
      left = { kind: 'BinaryExpr', operator: '&&', left, right };
    }
    
    return left;
  }

  private parseEquality(): AST.Expression {
    let left = this.parseComparison();
    
    while (this.check(TokenType.EQ) || this.check(TokenType.NE)) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }
    
    return left;
  }

  private parseComparison(): AST.Expression {
    let left = this.parseAdditive();
    
    while (
      this.check(TokenType.LT) || this.check(TokenType.GT) ||
      this.check(TokenType.LE) || this.check(TokenType.GE)
    ) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }
    
    return left;
  }

  private parseAdditive(): AST.Expression {
    let left = this.parseMultiplicative();
    
    while (this.check(TokenType.PLUS) || this.check(TokenType.MINUS)) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }
    
    return left;
  }

  private parseMultiplicative(): AST.Expression {
    let left = this.parsePower();
    
    while (
      this.check(TokenType.STAR) || this.check(TokenType.SLASH) || this.check(TokenType.PERCENT)
    ) {
      const op = this.advance().value;
      const right = this.parsePower();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }
    
    return left;
  }

  private parsePower(): AST.Expression {
    let left = this.parseUnary();
    
    if (this.match(TokenType.POWER)) {
      const right = this.parsePower(); // Right associative
      left = { kind: 'BinaryExpr', operator: '**', left, right };
    }
    
    return left;
  }

  private parseUnary(): AST.Expression {
    if (this.check(TokenType.NOT) || this.check(TokenType.MINUS)) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { kind: 'UnaryExpr', operator: op, operand };
    }
    
    return this.parsePostfix();
  }

  private parsePostfix(): AST.Expression {
    let expr = this.parsePrimary();
    
    while (true) {
      if (this.match(TokenType.LPAREN)) {
        // Function call
        const args: AST.Expression[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, 'Expected ")" after arguments');
        expr = { kind: 'CallExpr', callee: expr, args };
      } else if (this.match(TokenType.DOT)) {
        // Member access
        const property = this.consume(TokenType.IDENTIFIER, 'Expected property name').value;
        expr = { kind: 'MemberExpr', object: expr, property };
      } else if (this.match(TokenType.LBRACKET)) {
        // Index access
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, 'Expected "]"');
        expr = { kind: 'IndexExpr', object: expr, index };
      } else {
        break;
      }
    }
    
    return expr;
  }

  private parsePrimary(): AST.Expression {
    // Literals
    if (
      this.check(TokenType.INTEGER) || this.check(TokenType.FLOAT) ||
      this.check(TokenType.STRING) || this.check(TokenType.TRUE) ||
      this.check(TokenType.FALSE) || this.check(TokenType.NONE)
    ) {
      return this.parseLiteral();
    }
    
    // Parenthesized expression or lambda
    if (this.check(TokenType.LPAREN)) {
      return this.parseParenOrLambda();
    }
    
    // List literal
    if (this.match(TokenType.LBRACKET)) {
      const elements: AST.Expression[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, 'Expected "]"');
      return { kind: 'ListExpr', elements };
    }
    
    // New expression
    if (this.match(TokenType.NEW)) {
      const className = this.consume(TokenType.IDENTIFIER, 'Expected class name').value;
      this.consume(TokenType.LPAREN, 'Expected "("');
      const args: AST.Expression[] = [];
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN, 'Expected ")"');
      return { kind: 'NewExpr', className, args };
    }
    
    // Await
    if (this.match(TokenType.AWAIT)) {
      const expression = this.parseExpression();
      return { kind: 'AwaitExpr', expression };
    }
    
    // Print (built-in)
    if (this.match(TokenType.PRINT)) {
      this.consume(TokenType.LPAREN, 'Expected "(" after print');
      const args: AST.Expression[] = [];
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.parseExpression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RPAREN, 'Expected ")"');
      return { kind: 'CallExpr', callee: { kind: 'Identifier', name: '__print__' }, args };
    }
    
    // Self (себе/self)
    if (this.match(TokenType.SELF)) {
      return { kind: 'Identifier', name: 'self' };
    }
    
    // Identifier
    if (this.check(TokenType.IDENTIFIER)) {
      return { kind: 'Identifier', name: this.advance().value };
    }
    
    throw this.error(this.peek(), 'Expected expression');
  }

  private parseLiteral(): AST.Literal {
    const token = this.advance();
    
    switch (token.type) {
      case TokenType.INTEGER:
        return { kind: 'Literal', value: parseInt(token.value), type: 'integer' };
      case TokenType.FLOAT:
        return { kind: 'Literal', value: parseFloat(token.value), type: 'float' };
      case TokenType.STRING:
        return { kind: 'Literal', value: token.value, type: 'string' };
      case TokenType.TRUE:
        return { kind: 'Literal', value: true, type: 'boolean' };
      case TokenType.FALSE:
        return { kind: 'Literal', value: false, type: 'boolean' };
      case TokenType.NONE:
        return { kind: 'Literal', value: null, type: 'none' };
      default:
        throw this.error(token, 'Expected literal');
    }
  }

  private parseParenOrLambda(): AST.Expression {
    this.consume(TokenType.LPAREN, 'Expected "("');
    
    // Empty parens - could be () -> lambda or unit
    if (this.check(TokenType.RPAREN)) {
      this.advance();
      if (this.check(TokenType.ARROW) || this.check(TokenType.FAT_ARROW)) {
        // Lambda with no params
        return this.parseLambdaBody([]);
      }
      // Unit/empty tuple - return as empty list for now
      return { kind: 'ListExpr', elements: [] };
    }
    
    // Try to parse as parameter list for lambda
    const startPos = this.pos;
    try {
      const params = this.parseParameters();
      this.consume(TokenType.RPAREN, 'Expected ")"');
      if (this.check(TokenType.ARROW) || this.check(TokenType.FAT_ARROW)) {
        return this.parseLambdaBody(params);
      }
      // Not a lambda, reset and parse as expression
      this.pos = startPos;
    } catch {
      this.pos = startPos;
    }
    
    // Parse as grouped expression
    const expr = this.parseExpression();
    this.consume(TokenType.RPAREN, 'Expected ")"');
    return expr;
  }

  private parseLambdaBody(params: AST.Parameter[]): AST.LambdaExpr {
    this.advance(); // consume -> or =>
    
    if (this.check(TokenType.LBRACE)) {
      const body = this.parseBlock();
      return { kind: 'LambdaExpr', params, body };
    }
    
    const body = this.parseExpression();
    return { kind: 'LambdaExpr', params, body };
  }

  private parseTypeAnnotation(): AST.TypeAnnotation {
    const name = this.consume(TokenType.IDENTIFIER, 'Expected type name').value;
    
    let generics: AST.TypeAnnotation[] | undefined;
    if (this.match(TokenType.LT)) {
      generics = [];
      do {
        generics.push(this.parseTypeAnnotation());
      } while (this.match(TokenType.COMMA));
      this.consume(TokenType.GT, 'Expected ">" after generic types');
    }
    
    return { kind: 'TypeAnnotation', name, generics };
  }

  // ===================== Helpers =====================

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.pos + 1 >= this.tokens.length) return false;
    return this.tokens[this.pos + 1].type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): Error {
    return new Error(`[${token.line}:${token.column}] Error at '${token.value}': ${message}`);
  }
}
