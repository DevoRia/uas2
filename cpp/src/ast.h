
#ifndef AST_H
#define AST_H

#include <string>
#include <vector>
#include <memory>

enum NodeType {
    PROGRAM,
    FUNCTION_DECL,
    BLOCK_STMT,
    IF_STMT,
    SWITCH_STMT,
    WHILE_STMT,
    RETURN_STMT,
    LET_STMT,
    ASSIGN_STMT,
    EXPR_STMT,
    ASSIGN_EXPR,
    BINARY_EXPR,
    UNARY_EXPR,
    CALL_EXPR,
    LITERAL,
    IDENTIFIER
};

struct Node {
    NodeType type;
    virtual ~Node() {}
};

struct Expression : Node {};
struct Statement : Node {};

struct Program : Node {
    std::vector<std::unique_ptr<Statement>> body;
    Program() { type = PROGRAM; }
};

struct Identifier : Expression {
    std::string name;
    Identifier(std::string n) : name(n) { type = IDENTIFIER; }
};

struct Literal : Expression {
    std::string value; // Store as string for C++ emission simplicity
    std::string valueType; // "int", "float", "bool", "string"
    Literal(std::string v, std::string t) : value(v), valueType(t) { type = LITERAL; }
};

struct BinaryExpr : Expression {
    std::string op;
    std::unique_ptr<Expression> left;
    std::unique_ptr<Expression> right;
    BinaryExpr(std::string o, std::unique_ptr<Expression> l, std::unique_ptr<Expression> r) 
        : op(o), left(std::move(l)), right(std::move(r)) { type = BINARY_EXPR; }
};

struct UnaryExpr : Expression {
    std::string op;
    std::unique_ptr<Expression> right;
    UnaryExpr(std::string o, std::unique_ptr<Expression> r) 
        : op(o), right(std::move(r)) { type = UNARY_EXPR; }
};

struct CallExpr : Expression {
    std::unique_ptr<Expression> callee;
    std::vector<std::unique_ptr<Expression>> args;
    CallExpr(std::unique_ptr<Expression> c, std::vector<std::unique_ptr<Expression>> a)
        : callee(std::move(c)), args(std::move(a)) { type = CALL_EXPR; }
};

struct BlockStmt : Statement {
    std::vector<std::unique_ptr<Statement>> statements;
    BlockStmt() { type = BLOCK_STMT; }
};

struct ReturnStmt : Statement {
    std::unique_ptr<Expression> value;
    ReturnStmt(std::unique_ptr<Expression> v) : value(std::move(v)) { type = RETURN_STMT; }
};

struct WhileStmt : Statement {
    std::unique_ptr<Expression> condition;
    std::unique_ptr<Statement> body;
    WhileStmt(std::unique_ptr<Expression> c, std::unique_ptr<Statement> b)
        : condition(std::move(c)), body(std::move(b)) { type = WHILE_STMT; }
};

struct IfStmt : Statement {
    std::unique_ptr<Expression> condition;
    std::unique_ptr<Statement> thenBranch;
    std::unique_ptr<Statement> elseBranch;
    IfStmt(std::unique_ptr<Expression> c, std::unique_ptr<Statement> t, std::unique_ptr<Statement> e)
        : condition(std::move(c)), thenBranch(std::move(t)), elseBranch(std::move(e)) { type = IF_STMT; }
};

struct SwitchStmt : Statement {
    struct Case {
        std::string patternName; // "_" or variable name
        std::unique_ptr<Expression> value; // nullptr if it's a variable pattern or default
        std::unique_ptr<Expression> guard; // optional "if" condition
        std::unique_ptr<Statement> body;
    };
    std::unique_ptr<Expression> discriminant;
    std::vector<Case> cases;
    SwitchStmt(std::unique_ptr<Expression> d, std::vector<Case> c)
        : discriminant(std::move(d)), cases(std::move(c)) { type = SWITCH_STMT; }
};

struct FunctionDecl : Statement {
    std::string name;
    struct Param {
        std::string name;
        std::string typeName; // "Value" by default
    };
    std::vector<Param> params;
    std::string returnType; // "Value" by default
    std::unique_ptr<BlockStmt> body;
    FunctionDecl(std::string n, std::vector<Param> p, std::string rt, std::unique_ptr<BlockStmt> b)
        : name(n), params(p), returnType(rt), body(std::move(b)) { type = FUNCTION_DECL; }
};

struct LetStmt : Statement {
    std::string name;
    std::string typeName; // "Value" by default
    std::unique_ptr<Expression> initializer;
    LetStmt(std::string n, std::string t, std::unique_ptr<Expression> i)
        : name(n), typeName(t), initializer(std::move(i)) { type = LET_STMT; }
};

struct ExprStmt : Statement {
    std::unique_ptr<Expression> expr;
    ExprStmt(std::unique_ptr<Expression> e) : expr(std::move(e)) { type = EXPR_STMT; }
};

struct AssignStmt : Statement {
    std::string name;
    std::unique_ptr<Expression> value;
    AssignStmt(std::string n, std::unique_ptr<Expression> v)
        : name(n), value(std::move(v)) { type = ASSIGN_STMT; }
};

struct AssignExpr : Expression {
    std::string name;
    std::unique_ptr<Expression> value;
    AssignExpr(std::string n, std::unique_ptr<Expression> v)
        : name(n), value(std::move(v)) { type = ASSIGN_EXPR; }
};

#endif
