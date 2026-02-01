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
        return statement();
        // Wait, main code might be just statements?
        // UaScript allows top level statements.
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
    
    std::unique_ptr<Statement> letDecl() {
        Token name = consume(TOK_IDENTIFIER, "Expected variable name");
        std::string typeName = "Value";
        if (match(TOK_COLON)) {
            typeName = consume(TOK_IDENTIFIER, "Expected type name").text;
        }
        
        consume(TOK_EQ, "Expected =");
        auto init = expression();
        if (check(TOK_SEMICOLON)) advance();
        return std::make_unique<LetStmt>(name.text, typeName, std::move(init));
    }
    
    std::unique_ptr<Statement> statement() {
        if (match(TOK_IF)) return ifStmt();
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
        while (check(TOK_LT) || check(TOK_GT)) {
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
        auto expr = primary(); 
        // Factor is * / % **
        while (check(TOK_STAR) || check(TOK_SLASH) || check(TOK_PERCENT) || check(TOK_POWER)) {
             Token op = advance();
             auto right = primary(); 
             expr = std::make_unique<BinaryExpr>(op.text, std::move(expr), std::move(right));
        }
        return expr;
    }

    // Rewrite precedence layers closer to real grammar
    // equality -> comparison -> term -> factor -> unary -> call -> primary
    
    std::unique_ptr<Expression> primary() {
        if (match(TOK_NUMBER)) return std::make_unique<Literal>(previous().text, "float"); // Previous was number
        if (check(TOK_STRING)) return std::make_unique<Literal>(consume(TOK_STRING, "strs").text, "string");
        if (match(TOK_TRUE)) return std::make_unique<Literal>("true", "bool");
        if (match(TOK_FALSE)) return std::make_unique<Literal>("false", "bool");
        if (match(TOK_NONE)) return std::make_unique<Literal>("0", "none"); // Runtime uses 0/none val
        
        if (match(TOK_IDENTIFIER)) {
            std::string name = previous().text;
            // Check for call
            if (match(TOK_LPAREN)) {
                return finishCall(name);
            }
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
    
    std::unique_ptr<Expression> finishCall(std::string name) {
        std::vector<std::unique_ptr<Expression>> args;
        if (!check(TOK_RPAREN)) {
            do {
                args.push_back(expression());
            } while (match(TOK_COMMA));
        }
        consume(TOK_RPAREN, "Expected )");
        return std::make_unique<CallExpr>(std::make_unique<Identifier>(name), std::move(args));
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
        return peek().type == TOK_EOF;
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
    
    void error(const char* msg) {
        std::cerr << "Parser Error: " << msg << " (line ~" << current << ")" << std::endl;
        exit(1);
    }
};

#endif
