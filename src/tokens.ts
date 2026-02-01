// Token Types for UaScript 2.0

export enum TokenType {
  // Literals
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  
  // Identifiers
  IDENTIFIER = 'IDENTIFIER',
  
  // Keywords - Variables
  LET = 'LET',           // нехай, let
  VAR = 'VAR',           // змінна, var
  CONST = 'CONST',       // константа, const
  
  // Keywords - Functions
  FUN = 'FUN',           // функція, fun
  RETURN = 'RETURN',     // повернути, return
  
  // Keywords - Control Flow
  IF = 'IF',             // якщо, if
  ELSE = 'ELSE',         // інакше, else
  MATCH = 'MATCH',       // зіставити, match
  WHILE = 'WHILE',       // поки, while
  FOR = 'FOR',           // для, for
  IN = 'IN',             // в, in
  BREAK = 'BREAK',       // припинити, break
  CONTINUE = 'CONTINUE', // продовжити, continue
  
  // Keywords - OOP
  CLASS = 'CLASS',       // клас, class
  TRAIT = 'TRAIT',       // трейт, trait
  DATA = 'DATA',         // дані, data
  IMPL = 'IMPL',         // реалізація, impl
  SELF = 'SELF',         // себе, self
  NEW = 'NEW',           // новий, new
  
  // Keywords - Types
  TYPE_INT = 'TYPE_INT',       // Ціле, Int
  TYPE_FLOAT = 'TYPE_FLOAT',   // Дріб, Float
  TYPE_STRING = 'TYPE_STRING', // Текст, String
  TYPE_BOOL = 'TYPE_BOOL',     // Булеве, Bool
  TYPE_LIST = 'TYPE_LIST',     // Список, List
  TYPE_MAP = 'TYPE_MAP',       // Словник, Map
  TYPE_OPTION = 'TYPE_OPTION', // Можливо, Option
  TYPE_RESULT = 'TYPE_RESULT', // Результат, Result
  
  // Keywords - Async
  ASYNC = 'ASYNC',       // асинх, async
  AWAIT = 'AWAIT',       // чекати, await
  SPAWN = 'SPAWN',       // паралельно, spawn
  
  // Keywords - Other
  TRUE = 'TRUE',         // так, true
  FALSE = 'FALSE',       // ні, false
  NONE = 'NONE',         // нічого, none
  SOME = 'SOME',         // деяке, some
  PRINT = 'PRINT',       // друк, print
  
  // Operators - Arithmetic
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  POWER = 'POWER',       // **
  
  // Operators - Comparison
  EQ = 'EQ',             // ==
  NE = 'NE',             // !=
  LT = 'LT',             // <
  GT = 'GT',             // >
  LE = 'LE',             // <=
  GE = 'GE',             // >=
  
  // Operators - Logical
  AND = 'AND',           // &&, і, and
  OR = 'OR',             // ||, або, or
  NOT = 'NOT',           // !, не, not
  
  // Operators - Assignment
  ASSIGN = 'ASSIGN',     // =
  PLUS_ASSIGN = 'PLUS_ASSIGN',   // +=
  MINUS_ASSIGN = 'MINUS_ASSIGN', // -=
  
  // Operators - Special
  ARROW = 'ARROW',       // ->
  FAT_ARROW = 'FAT_ARROW', // =>
  PIPE = 'PIPE',         // |>
  RANGE = 'RANGE',       // ..
  DOUBLE_COLON = 'DOUBLE_COLON', // ::
  
  // Delimiters
  LPAREN = 'LPAREN',     // (
  RPAREN = 'RPAREN',     // )
  LBRACE = 'LBRACE',     // {
  RBRACE = 'RBRACE',     // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  COMMA = 'COMMA',       // ,
  DOT = 'DOT',           // .
  COLON = 'COLON',       // :
  SEMICOLON = 'SEMICOLON', // ;
  UNDERSCORE = 'UNDERSCORE', // _
  
  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  INVALID = 'INVALID',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// Bilingual keyword mappings
export const KEYWORDS: Record<string, TokenType> = {
  // Variables
  'нехай': TokenType.LET,
  'let': TokenType.LET,
  'змінна': TokenType.VAR,
  'var': TokenType.VAR,
  'константа': TokenType.CONST,
  'const': TokenType.CONST,
  
  // Functions
  'функція': TokenType.FUN,
  'fun': TokenType.FUN,
  'повернути': TokenType.RETURN,
  'return': TokenType.RETURN,
  
  // Control flow
  'якщо': TokenType.IF,
  'if': TokenType.IF,
  'інакше': TokenType.ELSE,
  'else': TokenType.ELSE,
  'зіставити': TokenType.MATCH,
  'match': TokenType.MATCH,
  'поки': TokenType.WHILE,
  'while': TokenType.WHILE,
  'для': TokenType.FOR,
  'for': TokenType.FOR,
  'в': TokenType.IN,
  'in': TokenType.IN,
  'припинити': TokenType.BREAK,
  'break': TokenType.BREAK,
  'продовжити': TokenType.CONTINUE,
  'continue': TokenType.CONTINUE,
  
  // OOP
  'клас': TokenType.CLASS,
  'class': TokenType.CLASS,
  'трейт': TokenType.TRAIT,
  'trait': TokenType.TRAIT,
  'дані': TokenType.DATA,
  'data': TokenType.DATA,
  'реалізація': TokenType.IMPL,
  'impl': TokenType.IMPL,
  'себе': TokenType.SELF,
  'self': TokenType.SELF,
  'новий': TokenType.NEW,
  'new': TokenType.NEW,
  
  // Types
  'Ціле': TokenType.TYPE_INT,
  'Int': TokenType.TYPE_INT,
  'Дріб': TokenType.TYPE_FLOAT,
  'Float': TokenType.TYPE_FLOAT,
  'Текст': TokenType.TYPE_STRING,
  'String': TokenType.TYPE_STRING,
  'Булеве': TokenType.TYPE_BOOL,
  'Bool': TokenType.TYPE_BOOL,
  'Список': TokenType.TYPE_LIST,
  'List': TokenType.TYPE_LIST,
  'Словник': TokenType.TYPE_MAP,
  'Map': TokenType.TYPE_MAP,
  'Можливо': TokenType.TYPE_OPTION,
  'Option': TokenType.TYPE_OPTION,
  'Результат': TokenType.TYPE_RESULT,
  'Result': TokenType.TYPE_RESULT,
  
  // Async
  'асинх': TokenType.ASYNC,
  'async': TokenType.ASYNC,
  'чекати': TokenType.AWAIT,
  'await': TokenType.AWAIT,
  'паралельно': TokenType.SPAWN,
  'spawn': TokenType.SPAWN,
  
  // Booleans & None
  'так': TokenType.TRUE,
  'true': TokenType.TRUE,
  'ні': TokenType.FALSE,
  'false': TokenType.FALSE,
  'нічого': TokenType.NONE,
  'none': TokenType.NONE,
  'деяке': TokenType.SOME,
  'some': TokenType.SOME,
  
  // Logical (word form)
  'і': TokenType.AND,
  'and': TokenType.AND,
  'або': TokenType.OR,
  'or': TokenType.OR,
  'не': TokenType.NOT,
  'not': TokenType.NOT,
  
  // Built-in
  'друк': TokenType.PRINT,
  'print': TokenType.PRINT,
};
