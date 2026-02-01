#ifndef PARSER_H
#define PARSER_H

#include "lexer.h"
#include "ast.h"

class Parser {
    std::vector<Token> tokens;
    size_t current;
    
public:
    Parser(std::vector<Token> t) : tokens(t), current(0) {}
    
    std::unique_ptr<Program> parse() {
        auto prog = std::make_unique<Program>();
        while (!isAtEnd()) {
            prog->body.push_back(declaration());
        }
        return prog;
    }
    
    std::unique_ptr<Statement> declaration() {
        if (match(TOK_FN)) return functionDecl();
        if (match(TOK_LET)) return letDecl();
        
        // Check for Assignment: ID = Expr
        if (isName(peek()) && current + 1 < tokens.size() && tokens[current + 1].type == TOK_EQ) {
            Token name = advance();
            advance(); // consume '='
            auto value = expression();
            if (check(TOK_SEMICOLON)) advance();
            return std::make_unique<AssignStmt>(name.text, std::move(value));
        }
        
        return statement();
    }
    
    std::unique_ptr<Statement> functionDecl() {
        Token name = consume(TOK_IDENTIFIER, "Expected function name");
        consume(TOK_LPAREN, "Expected (");
        std::vector<FunctionDecl::Param> params;
        if (!check(TOK_RPAREN)) {
            do {
                std::string paramName = consume(TOK_IDENTIFIER, "Expected param name").text;
                std::string paramType = "Value";
                if (match(TOK_COLON)) {
                    paramType = consume(TOK_IDENTIFIER, "Expected type name").text;
                }
                params.push_back({paramName, paramType});
            } while (match(TOK_COMMA));
        }
        consume(TOK_RPAREN, "Expected )");
        
        std::string returnType = "Value";
        if (match(TOK_COLON)) {
             returnType = consume(TOK_IDENTIFIER, "Expected return type").text;
        }
        
        consume(TOK_LBRACE, "Expected {");
        auto body = block();
        return std::make_unique<FunctionDecl>(name.text, params, returnType, std::move(body));
    }
    
    bool isName(Token t) {
        return t.type == TOK_IDENTIFIER || t.type == TOK_TRUE || t.type == TOK_FALSE || t.type == TOK_NONE;
    }

    std::unique_ptr<Statement> letDecl() {
        Token name = advance(); // already matched TOK_LET
        if (!isName(name)) {
             name = consume(TOK_IDENTIFIER, "Expected variable name");
        }
        std::string nameStr = name.text;
        
        std::string typeName = "Value";
        if (match(TOK_COLON)) {
            typeName = consume(TOK_IDENTIFIER, "Expected type name").text;
        }
        
        consume(TOK_EQ, "Expected =");
        auto init = expression();
        if (check(TOK_SEMICOLON)) advance();
        return std::make_unique<LetStmt>(nameStr, typeName, std::move(init));
    }
    
    std::unique_ptr<Statement> statement() {
        if (match(TOK_IF)) return ifStmt();
        if (match(TOK_SWITCH)) return switchStmt();
        if (match(TOK_WHILE)) return whileStmt();
        if (match(TOK_RETURN)) return returnStmt();
        if (match(TOK_LBRACE)) {
            auto blk = block();
            std::vector<std::unique_ptr<Statement>> stmts;
            // Wrap block in statement wrapper? 
            // BlockStmt is Statement.
            return blk;
        }
        return exprStmt();

    }
    
    std::unique_ptr<BlockStmt> block() {
        auto blk = std::make_unique<BlockStmt>();
        while (!check(TOK_RBRACE) && !isAtEnd()) {
            blk->statements.push_back(declaration());
        }
        consume(TOK_RBRACE, "Expected }");
        return blk;
    }
    
    std::unique_ptr<Statement> ifStmt() {
        // Do not manualy consume parens, let expression parser handle grouping if present.
        auto cond = expression();
        consume(TOK_LBRACE, "Expected { after condition"); 
        auto thenBranch = block();
        std::unique_ptr<Statement> elseBranch = nullptr;
        if (match(TOK_ELSE)) {
            consume(TOK_LBRACE, "Expected { after else");
            elseBranch = block();
        }
        return std::make_unique<IfStmt>(std::move(cond), std::move(thenBranch), std::move(elseBranch));
    }
    
    std::unique_ptr<Statement> switchStmt() {
        auto discriminant = expression();
        consume(TOK_LBRACE, "Expected { after switch discriminant");
        std::vector<SwitchStmt::Case> cases;
        while (!check(TOK_RBRACE) && !isAtEnd()) {
            if (match(TOK_CASE)) {
                std::string patternName = "";
                std::unique_ptr<Expression> val = nullptr;
                std::unique_ptr<Expression> guard = nullptr;
                
                // Pattern
                if (check(TOK_NUMBER) || check(TOK_STRING) || check(TOK_TRUE) || check(TOK_FALSE)) {
                    // Literal pattern
                    val = primary(); 
                } else if (isName(peek())) {
                    Token t = advance();
                    patternName = t.text;
                    if (patternName != "_") {
                        // It's a variable binding pattern or just a name
                    }
                } else {
                    error("Expected pattern after case/варіант");
                }
                
                // Optional Guard: якщо ...
                if (match(TOK_IF)) {
                    guard = expression();
                }
                
                // Separator: => or :
                if (!match(TOK_ARROW) && !match(TOK_COLON)) {
                    error("Expected => or : after pattern");
                }
                
                auto body = declaration();
                cases.push_back({patternName, std::move(val), std::move(guard), std::move(body)});
            } else if (match(TOK_DEFAULT)) {
                consume(TOK_COLON, "Expected : after default");
                auto body = declaration();
                cases.push_back({"_", nullptr, nullptr, std::move(body)});
            } else {
                error("Expected case or default in switch block");
            }
        }
        consume(TOK_RBRACE, "Expected } at end of switch");
        return std::make_unique<SwitchStmt>(std::move(discriminant), std::move(cases));
    }
    
    std::unique_ptr<Statement> whileStmt() {
        auto cond = expression();
        consume(TOK_LBRACE, "Expected { after while condition");
        auto body = block();
        return std::make_unique<WhileStmt>(std::move(cond), std::move(body));
    }

    std::unique_ptr<Statement> returnStmt() {
        auto value = expression();
        // Semicolon?
        if (check(TOK_SEMICOLON)) advance();
        return std::make_unique<ReturnStmt>(std::move(value));
    }
    
    std::unique_ptr<Statement> exprStmt() {
        auto expr = expression();
        if (check(TOK_SEMICOLON)) advance();
        return std::make_unique<ExprStmt>(std::move(expr));
    }
    
    std::unique_ptr<Expression> expression() {
        if (isName(peek()) && current + 1 < tokens.size() && tokens[current + 1].type == TOK_EQ) {
            Token name = advance();
            advance(); // consume '='
            auto value = expression();
            return std::make_unique<AssignExpr>(name.text, std::move(value));
        }
        return equality();
    }
    
    std::unique_ptr<Expression> equality() {
        auto expr = comparison();
        while (match(TOK_EQ_EQ)) {
            auto right = comparison();
            expr = std::make_unique<BinaryExpr>("==", std::move(expr), std::move(right));
        }
        return expr;
    }
    
    std::unique_ptr<Expression> comparison() {
        auto expr = term();
        while (check(TOK_LT) || check(TOK_GT) || check(TOK_LE) || check(TOK_GE)) {
            Token op = advance();
            auto right = term();
            expr = std::make_unique<BinaryExpr>(op.text, std::move(expr), std::move(right));
        }
        return expr;
    }
    
    std::unique_ptr<Expression> term() {
        auto expr = factor();
        while (check(TOK_PLUS) || check(TOK_MINUS)) {
             Token op = advance();
             auto right = factor();
             expr = std::make_unique<BinaryExpr>(op.text, std::move(expr), std::move(right));
        }
        return expr;
    }
    
    std::unique_ptr<Expression> factor() {
        auto expr = unary(); 
        // Factor is * / % **
        while (check(TOK_STAR) || check(TOK_SLASH) || check(TOK_PERCENT) || check(TOK_POWER)) {
             Token op = advance();
             auto right = unary(); 
             expr = std::make_unique<BinaryExpr>(op.text, std::move(expr), std::move(right));
        }
        return expr;
    }
    
    std::unique_ptr<Expression> unary() {
        if (match(TOK_MINUS)) {
            Token op = previous();
            auto right = unary();
            return std::make_unique<UnaryExpr>(op.text, std::move(right));
        }
        return call();
    }
    
    std::unique_ptr<Expression> call() {
        auto expr = primary();
        while (match(TOK_LPAREN)) {
            expr = finishCall(std::move(expr));
        }
        return expr;
    }

    // Rewrite precedence layers closer to real grammar
    // equality -> comparison -> term -> factor -> unary -> call -> primary
    
    std::unique_ptr<Expression> primary() {
        if (match(TOK_NUMBER)) return std::make_unique<Literal>(previous().text, "float");
        if (check(TOK_STRING)) return std::make_unique<Literal>(consume(TOK_STRING, "strs").text, "string");
        
        // Handle keywords as literals OR identifiers
        if (check(TOK_TRUE) || check(TOK_FALSE) || check(TOK_NONE) || check(TOK_IDENTIFIER)) {
            Token t = advance();
            std::string name = t.text;
            
            // If just the token, is it a boolean literal or an identifier?
            if (t.type == TOK_TRUE) return std::make_unique<Literal>("true", "bool");
            if (t.type == TOK_FALSE) return std::make_unique<Literal>("false", "bool");
            if (t.type == TOK_NONE) return std::make_unique<Literal>("0", "none");
            
            return std::make_unique<Identifier>(name);
        }
        if (match(TOK_LPAREN)) {
            auto expr = expression();
            consume(TOK_RPAREN, "Expected )");
            return expr;
        }
        
        // Error handling
        std::cerr << "Parser Error: Unexpected token " << peek().text << " in expression." << std::endl;
        exit(1);
    }
    
    std::unique_ptr<Expression> finishCall(std::unique_ptr<Expression> callee) {
        std::vector<std::unique_ptr<Expression>> args;
        if (!check(TOK_RPAREN)) {
            do {
                args.push_back(expression());
            } while (match(TOK_COMMA));
        }
        consume(TOK_RPAREN, "Expected ) after arguments");
        return std::make_unique<CallExpr>(std::move(callee), std::move(args));
    }

    bool match(TokenType type) {
        if (check(type)) {
            advance();
            return true;
        }
        return false;
    }
    
    bool check(TokenType type) {
        if (isAtEnd()) return false;
        return peek().type == type;
    }
    
    Token advance() {
        if (!isAtEnd()) current++;
        return previous();
    }
    
    bool isAtEnd() {
        return current >= tokens.size() || tokens[current].type == TOK_EOF;
    }
    
    Token peek() {
        return tokens[current];
    }
    
    Token previous() {
        return tokens[current - 1];
    }
    
    Token consume(TokenType type, const char* msg) {
        if (check(type)) return advance();
        std::cerr << "Parser Error: " << msg << " at " << peek().text << " (line ~" << current << ")" << std::endl;
        exit(1);
    }
    
    void error(std::string message) {
        Token t = peek();
        std::cerr << "Parser Error: " << message << " at '" << t.text << "' (line ~" << current << ")" << std::endl;
        exit(1);
    }
};

#endif
