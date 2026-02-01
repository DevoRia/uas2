#ifndef LEXER_H
#define LEXER_H

#include <iostream>
#include <vector>
#include <string>
#include <cctype>

enum TokenType {
    TOK_FN, TOK_LET, TOK_IF, TOK_ELSE, TOK_RETURN, TOK_WHILE,
    TOK_SWITCH, TOK_CASE, TOK_DEFAULT,
    TOK_TRUE, TOK_FALSE, TOK_NONE,
    TOK_IDENTIFIER, TOK_NUMBER, TOK_STRING,
    TOK_LPAREN, TOK_RPAREN, TOK_LBRACE, TOK_RBRACE,
    TOK_PLUS, TOK_MINUS, TOK_STAR, TOK_SLASH, TOK_PERCENT, TOK_POWER,
    TOK_LT, TOK_GT, TOK_LE, TOK_GE, TOK_EQ_EQ, TOK_EQ, TOK_ARROW, TOK_COMMA, TOK_COLON, TOK_SEMICOLON,
    TOK_EOF, TOK_UNKNOWN
};

struct Token {
    TokenType type;
    std::string text;
};

class Lexer {
    std::string source;
    size_t pos;
    
public:
    Lexer(std::string src) : source(src), pos(0) {}
    
    std::vector<Token> tokenize() {
        std::vector<Token> tokens;
        while (pos < source.length()) {
            char c = source[pos];
            if (isspace(c)) {
                pos++;
                continue;
            }
            
            if (isalpha(c) || (uint8_t)c > 127 || c == '_') { // Support Unicode letters roughly
                tokens.push_back(identifier());
            } else if (isdigit(c)) {
                tokens.push_back(number());
            } else {
                switch (c) {
                    case '(': tokens.push_back({TOK_LPAREN, "("}); pos++; break;
                    case ')': tokens.push_back({TOK_RPAREN, ")"}); pos++; break;
                    case '{': tokens.push_back({TOK_LBRACE, "{"}); pos++; break;
                    case '}': tokens.push_back({TOK_RBRACE, "}"}); pos++; break;
                    case '+': tokens.push_back({TOK_PLUS, "+"}); pos++; break;
                    case '-': tokens.push_back({TOK_MINUS, "-"}); pos++; break;
                    case '*': 
                        if (match('*')) { tokens.push_back({TOK_POWER, "**"}); }
                        else { tokens.push_back({TOK_STAR, "*"}); }
                        pos++; 
                        break;
                    case '%': tokens.push_back({TOK_PERCENT, "%"}); pos++; break;
                    case '/': 
                        if (match('/')) {
                             // Comment
                             while (pos < source.length() && source[pos] != '\n') pos++;
                        } else {
                            tokens.push_back({TOK_SLASH, "/"}); pos++;
                        }
                        break;
                    case '<': 
                        if (match('=')) tokens.push_back({TOK_LE, "<="});
                        else tokens.push_back({TOK_LT, "<"}); 
                        pos++;
                        break;
                    case '>': 
                        if (match('=')) tokens.push_back({TOK_GE, ">="});
                        else tokens.push_back({TOK_GT, ">"}); 
                        pos++;
                        break;
                    case '=': 
                        if (match('=')) tokens.push_back({TOK_EQ_EQ, "=="});
                        else if (match('>')) tokens.push_back({TOK_ARROW, "=>"});
                        else tokens.push_back({TOK_EQ, "="});
                        pos++;
                        break;
                    case ',': tokens.push_back({TOK_COMMA, ","}); pos++; break;
                    case ':': tokens.push_back({TOK_COLON, ":"}); pos++; break;
                    case ';': tokens.push_back({TOK_SEMICOLON, ";"}); pos++; break;
                    case '"': tokens.push_back(string_lit()); break;
                    default: 
                        pos++; // skip unknown
                        break;
                }
            }
        }
        tokens.push_back({TOK_EOF, ""});
        return tokens;
    }
    
    bool match(char expected) {
        if (pos + 1 < source.length() && source[pos + 1] == expected) {
            pos++;
            return true;
        }
        return false;
    }
    
    Token string_lit() {
        pos++; // Skip opening quote
        size_t start = pos;
        while (pos < source.length() && source[pos] != '"') {
            pos++;
        }
        std::string text = source.substr(start, pos - start);
        if (pos < source.length()) pos++; // Skip closing quote
        return {TOK_STRING, text};
    }

    Token identifier() {
        size_t start = pos;
        while (pos < source.length() && (isalnum(source[pos]) || source[pos] == '_' || (uint8_t)source[pos] > 127)) {
            pos++;
        }
        std::string text = source.substr(start, pos - start);
        TokenType type = TOK_IDENTIFIER;
        if (text == "fn" || text == "функція" || text == "fun") type = TOK_FN;
        else if (text == "let" || text == "нехай" || text == "змінна") type = TOK_LET;
        else if (text == "if" || text == "якщо") type = TOK_IF;
        else if (text == "else" || text == "інакше") type = TOK_ELSE;
        else if (text == "return" || text == "повернути") type = TOK_RETURN;
        else if (text == "while" || text == "поки") type = TOK_WHILE;
        else if (text == "true" || text == "так" || text == "істина") type = TOK_TRUE;
        else if (text == "false" || text == "ні" || text == "хиба") type = TOK_FALSE;
        else if (text == "null" || text == "нічого") type = TOK_NONE;
        else if (text == "switch" || text == "вибір" || text == "співпадіння") type = TOK_SWITCH;
        else if (text == "case" || text == "варіант") type = TOK_CASE;
        else if (text == "default" || text == "типово") type = TOK_DEFAULT;
        
        return {type, text};
    }
    
    Token number() {
        size_t start = pos;
        while (pos < source.length() && (isdigit(source[pos]) || source[pos] == '.')) {
            pos++;
        }
        return {TOK_NUMBER, source.substr(start, pos - start)};
    }
};

#endif
