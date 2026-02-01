// Lexer for UaScript 2.0

import { Token, TokenType, KEYWORDS } from './tokens.js';

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }
    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      // Single character tokens
      case '(': this.addToken(TokenType.LPAREN, c); break;
      case ')': this.addToken(TokenType.RPAREN, c); break;
      case '{': this.addToken(TokenType.LBRACE, c); break;
      case '}': this.addToken(TokenType.RBRACE, c); break;
      case '[': this.addToken(TokenType.LBRACKET, c); break;
      case ']': this.addToken(TokenType.RBRACKET, c); break;
      case ',': this.addToken(TokenType.COMMA, c); break;
      case ';': this.addToken(TokenType.SEMICOLON, c); break;
      case '%': this.addToken(TokenType.PERCENT, c); break;
      case '_': 
        if (this.isAlphaNumeric(this.peek())) {
          this.identifier(c);
        } else {
          this.addToken(TokenType.UNDERSCORE, c);
        }
        break;

      // Potentially multi-character
      case '+':
        if (this.match('=')) this.addToken(TokenType.PLUS_ASSIGN, '+=');
        else this.addToken(TokenType.PLUS, c);
        break;
      case '-':
        if (this.match('>')) this.addToken(TokenType.ARROW, '->');
        else if (this.match('=')) this.addToken(TokenType.MINUS_ASSIGN, '-=');
        else this.addToken(TokenType.MINUS, c);
        break;
      case '*':
        if (this.match('*')) this.addToken(TokenType.POWER, '**');
        else this.addToken(TokenType.STAR, c);
        break;
      case '/':
        if (this.match('/')) {
          // Single line comment
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('*')) {
          // Multi-line comment
          this.blockComment();
        } else {
          this.addToken(TokenType.SLASH, c);
        }
        break;
      case '=':
        if (this.match('=')) this.addToken(TokenType.EQ, '==');
        else if (this.match('>')) this.addToken(TokenType.FAT_ARROW, '=>');
        else this.addToken(TokenType.ASSIGN, c);
        break;
      case '!':
        if (this.match('=')) this.addToken(TokenType.NE, '!=');
        else this.addToken(TokenType.NOT, c);
        break;
      case '<':
        if (this.match('=')) this.addToken(TokenType.LE, '<=');
        else this.addToken(TokenType.LT, c);
        break;
      case '>':
        if (this.match('=')) this.addToken(TokenType.GE, '>=');
        else this.addToken(TokenType.GT, c);
        break;
      case '&':
        if (this.match('&')) this.addToken(TokenType.AND, '&&');
        break;
      case '|':
        if (this.match('|')) this.addToken(TokenType.OR, '||');
        else if (this.match('>')) this.addToken(TokenType.PIPE, '|>');
        else this.addToken(TokenType.INVALID, c); // For now, bare | is invalid
        break;
      case '.':
        if (this.match('.')) this.addToken(TokenType.RANGE, '..');
        else this.addToken(TokenType.DOT, c);
        break;
      case ':':
        if (this.match(':')) this.addToken(TokenType.DOUBLE_COLON, '::');
        else this.addToken(TokenType.COLON, c);
        break;

      // Whitespace
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        this.column = 1;
        // Optionally emit NEWLINE tokens for statement separation
        // this.addToken(TokenType.NEWLINE, c);
        break;

      // String literals
      case '"':
        this.string('"');
        break;
      case "'":
        this.string("'");
        break;

      default:
        if (this.isDigit(c)) {
          this.number(c);
        } else if (this.isAlpha(c)) {
          this.identifier(c);
        } else {
          this.addToken(TokenType.INVALID, c);
        }
    }
  }

  private string(quote: string): void {
    const startLine = this.line;
    const startCol = this.column;
    let value = '';

    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      if (this.peek() === '\\') {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case 'r': value += '\r'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${startLine}, column ${startCol}`);
    }

    this.advance(); // Closing quote
    this.tokens.push({
      type: TokenType.STRING,
      value: value,
      line: startLine,
      column: startCol,
    });
  }

  private number(first: string): void {
    const startCol = this.column - 1;
    let value = first;
    let isFloat = false;

    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      isFloat = true;
      value += this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    this.tokens.push({
      type: isFloat ? TokenType.FLOAT : TokenType.INTEGER,
      value: value,
      line: this.line,
      column: startCol,
    });
  }

  private identifier(first: string): void {
    const startCol = this.column - 1;
    let value = first;

    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    // Check if it's a keyword (use hasOwn to avoid Object.prototype methods like toString)
    const type = Object.hasOwn(KEYWORDS, value) ? KEYWORDS[value] : TokenType.IDENTIFIER;
    
    this.tokens.push({
      type: type,
      value: value,
      line: this.line,
      column: startCol,
    });
  }

  private blockComment(): void {
    let depth = 1;
    while (depth > 0 && !this.isAtEnd()) {
      if (this.peek() === '/' && this.peekNext() === '*') {
        this.advance();
        this.advance();
        depth++;
      } else if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        depth--;
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
    }
  }

  private advance(): string {
    const c = this.source[this.pos];
    this.pos++;
    this.column++;
    return c;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.pos];
  }

  private peekNext(): string {
    if (this.pos + 1 >= this.source.length) return '\0';
    return this.source[this.pos + 1];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source[this.pos] !== expected) return false;
    this.pos++;
    this.column++;
    return true;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_' ||
           // Ukrainian letters (basic range)
           (c >= '\u0400' && c <= '\u04FF') ||
           // Extended Cyrillic
           (c >= '\u0500' && c <= '\u052F');
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    });
  }
}
