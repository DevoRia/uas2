// AST Node Types for UaScript 2.0

export type ASTNode =
  | Program
  | Statement
  | Expression;

// Program is the root
export interface Program {
  kind: 'Program';
  body: Statement[];
}

// Statements
export type Statement =
  | LetStatement
  | VarStatement
  | FunctionDecl
  | ClassDecl
  | TraitDecl
  | DataDecl
  | IfStatement
  | WhileStatement
  | ForStatement
  | MatchStatement
  | ReturnStatement
  | BreakStatement
  | ContinueStatement
  | ExpressionStatement
  | BlockStatement;

export interface LetStatement {
  kind: 'LetStatement';
  name: string;
  typeAnnotation?: TypeAnnotation;
  value: Expression;
}

export interface VarStatement {
  kind: 'VarStatement';
  name: string;
  typeAnnotation?: TypeAnnotation;
  value: Expression;
}

export interface FunctionDecl {
  kind: 'FunctionDecl';
  name: string;
  params: Parameter[];
  returnType?: TypeAnnotation;
  body: BlockStatement;
  isAsync: boolean;
}

export interface Parameter {
  name: string;
  type?: TypeAnnotation;
  defaultValue?: Expression;
}

export interface ClassDecl {
  kind: 'ClassDecl';
  name: string;
  params: Parameter[];  // Constructor params
  traits: string[];     // Implemented traits
  body: ClassBody;
}

export interface ClassBody {
  methods: FunctionDecl[];
  fields: LetStatement[];
}

export interface TraitDecl {
  kind: 'TraitDecl';
  name: string;
  methods: FunctionSignature[];
}

export interface FunctionSignature {
  name: string;
  params: Parameter[];
  returnType?: TypeAnnotation;
}

export interface DataDecl {
  kind: 'DataDecl';
  name: string;
  fields: Parameter[];
}

export interface IfStatement {
  kind: 'IfStatement';
  condition: Expression;
  thenBranch: BlockStatement;
  elseBranch?: BlockStatement | IfStatement;
}

export interface WhileStatement {
  kind: 'WhileStatement';
  condition: Expression;
  body: BlockStatement;
}

export interface ForStatement {
  kind: 'ForStatement';
  variable: string;
  iterable: Expression;
  body: BlockStatement;
}

export interface MatchStatement {
  kind: 'MatchStatement';
  subject: Expression;
  arms: MatchArm[];
}

export interface MatchArm {
  pattern: Pattern;
  guard?: Expression;
  body: Expression;
}

export type Pattern =
  | LiteralPattern
  | IdentifierPattern
  | WildcardPattern
  | RangePattern
  | ConstructorPattern;

export interface LiteralPattern {
  kind: 'LiteralPattern';
  value: Literal;
}

export interface IdentifierPattern {
  kind: 'IdentifierPattern';
  name: string;
}

export interface WildcardPattern {
  kind: 'WildcardPattern';
}

export interface RangePattern {
  kind: 'RangePattern';
  start: Expression;
  end: Expression;
}

export interface ConstructorPattern {
  kind: 'ConstructorPattern';
  name: string;
  args: Pattern[];
}

export interface ReturnStatement {
  kind: 'ReturnStatement';
  value?: Expression;
}

export interface BreakStatement {
  kind: 'BreakStatement';
}

export interface ContinueStatement {
  kind: 'ContinueStatement';
}

export interface ExpressionStatement {
  kind: 'ExpressionStatement';
  expression: Expression;
}

export interface BlockStatement {
  kind: 'BlockStatement';
  statements: Statement[];
}

// Expressions
export type Expression =
  | Literal
  | Identifier
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | MemberExpr
  | IndexExpr
  | AssignExpr
  | LambdaExpr
  | ListExpr
  | MapExpr
  | PipeExpr
  | IfExpr
  | MatchExpr
  | NewExpr
  | AwaitExpr
  | SpawnExpr;

export interface Literal {
  kind: 'Literal';
  value: number | string | boolean | null;
  type: 'integer' | 'float' | 'string' | 'boolean' | 'none';
}

export interface Identifier {
  kind: 'Identifier';
  name: string;
}

export interface BinaryExpr {
  kind: 'BinaryExpr';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpr {
  kind: 'UnaryExpr';
  operator: string;
  operand: Expression;
}

export interface CallExpr {
  kind: 'CallExpr';
  callee: Expression;
  args: Expression[];
}

export interface MemberExpr {
  kind: 'MemberExpr';
  object: Expression;
  property: string;
}

export interface IndexExpr {
  kind: 'IndexExpr';
  object: Expression;
  index: Expression;
}

export interface AssignExpr {
  kind: 'AssignExpr';
  target: Identifier | MemberExpr | IndexExpr;
  value: Expression;
}

export interface LambdaExpr {
  kind: 'LambdaExpr';
  params: Parameter[];
  body: Expression | BlockStatement;
}

export interface ListExpr {
  kind: 'ListExpr';
  elements: Expression[];
}

export interface MapExpr {
  kind: 'MapExpr';
  entries: [Expression, Expression][];
}

export interface PipeExpr {
  kind: 'PipeExpr';
  left: Expression;
  right: Expression;
}

export interface IfExpr {
  kind: 'IfExpr';
  condition: Expression;
  thenBranch: Expression;
  elseBranch: Expression;
}

export interface MatchExpr {
  kind: 'MatchExpr';
  subject: Expression;
  arms: MatchArm[];
}

export interface NewExpr {
  kind: 'NewExpr';
  className: string;
  args: Expression[];
}

export interface AwaitExpr {
  kind: 'AwaitExpr';
  expression: Expression;
}

export interface SpawnExpr {
  kind: 'SpawnExpr';
  body: Expression | BlockStatement;
}

// Type Annotations
export interface TypeAnnotation {
  kind: 'TypeAnnotation';
  name: string;
  generics?: TypeAnnotation[];
}
