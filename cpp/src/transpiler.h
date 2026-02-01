#ifndef TRANSPILER_H
#define TRANSPILER_H

#include "ast.h"
#include <sstream>

class Transpiler {
    std::stringstream ss;
    int indentLevel = 0;
    
public:
    std::string mapType(std::string uaType) {
        if (uaType == "Value") return "Value";
        if (uaType == "число" || uaType == "int" || uaType == "number") return "double";
        if (uaType == "стрічка" || uaType == "string") return "std::string";
        if (uaType == "бул" || uaType == "bool") return "bool";
        return "Value";
    }

    std::string transpile(Program* program) {
        ss.str("");
        ss << "#include \"runtime.h\"\n\n";
        
        // Forward decls
        for (const auto& stmt : program->body) {
            if (stmt->type == FUNCTION_DECL) {
                FunctionDecl* fn = (FunctionDecl*)stmt.get();
                ss << mapType(fn->returnType) << " " << fn->name << "(";
                for (size_t i = 0; i < fn->params.size(); i++) {
                    if (i > 0) ss << ", ";
                    ss << mapType(fn->params[i].typeName) << " " << fn->params[i].name;
                }
                ss << ");\n";
            }
        }
        ss << "\n";
        
        // Definitions
        for (const auto& stmt : program->body) {
             if (stmt->type == FUNCTION_DECL) {
                 visit(stmt.get());
             }
        }
        
        // Main
        ss << "\nint main() {\n";
        indentLevel++;
        
        for (const auto& stmt : program->body) {
            if (stmt->type != FUNCTION_DECL) {
                visit(stmt.get());
            }
        }
        
        indent(); ss << "return 0;\n";
        indentLevel--;
        ss << "}\n";
        
        return ss.str();
    }
    
    void visit(Node* node) {
        switch (node->type) {
            case FUNCTION_DECL: visitFunction((FunctionDecl*)node); break;
            case BLOCK_STMT: visitBlock((BlockStmt*)node); break;
            case IF_STMT: visitIf((IfStmt*)node); break;
            case WHILE_STMT: visitWhile((WhileStmt*)node); break;
            case RETURN_STMT: visitReturn((ReturnStmt*)node); break;
            case LET_STMT: visitLet((LetStmt*)node); break;
            case EXPR_STMT: visitExprStmt((ExprStmt*)node); break;
            case BINARY_EXPR: visitBinary((BinaryExpr*)node); break;
            case CALL_EXPR: visitCall((CallExpr*)node); break;
            case LITERAL: visitLiteral((Literal*)node); break;
            case IDENTIFIER: visitIdentifier((Identifier*)node); break;
            default: break;
        }
    }
    
    void visitFunction(FunctionDecl* fn) {
        ss << mapType(fn->returnType) << " " << fn->name << "(";
        for (size_t i = 0; i < fn->params.size(); i++) {
            if (i > 0) ss << ", ";
            ss << mapType(fn->params[i].typeName) << " " << fn->params[i].name;
        }
        ss << ") ";
        visitBlock(fn->body.get());
        ss << "\n\n";
    }

    void visitBlock(BlockStmt* blk) {
        ss << "{\n";
        indentLevel++;
        for (const auto& stmt : blk->statements) {
            visit(stmt.get());
        }
        indentLevel--;
        indent(); ss << "}\n";
    }
    
    void visitIf(IfStmt* stmt) {
        indent(); ss << "if (isTruthy(";
        visit(stmt->condition.get());
        ss << ")) ";
        visit(stmt->thenBranch.get());
        if (stmt->elseBranch) {
            ss << " else ";
            visit(stmt->elseBranch.get());
        }
    }
    
    void visitWhile(WhileStmt* stmt) {
        indent(); ss << "while (isTruthy(";
        visit(stmt->condition.get());
        ss << ")) ";
        visit(stmt->body.get());
    }
    
    void visitReturn(ReturnStmt* stmt) {
        indent(); ss << "return ";
        if (stmt->value) visit(stmt->value.get());
        else ss << "NONE_VAL";
        ss << ";\n";
    }

    void visitLet(LetStmt* stmt) {
        indent(); ss << mapType(stmt->typeName) << " " << stmt->name << " = ";
        visit(stmt->initializer.get());
        ss << ";\n";
    }
    
    void visitExprStmt(ExprStmt* stmt) {
        indent();
        visit(stmt->expr.get());
        ss << ";\n";
    }
    
    void visitBinary(BinaryExpr* expr) {
        ss << "(";
        visit(expr->left.get());
        if (expr->op == "**") ss << " ^ "; // Overloaded ^ for power? C++ has ^ for XOR.
        // Better to use a function or overload ^ in Value.
        // I overloaded ^ in Runtime.
        else ss << " " << expr->op << " ";
        visit(expr->right.get());
        ss << ")";
    }
    
    void visitCall(CallExpr* expr) {
        // Special case print
        if (expr->callee->type == IDENTIFIER) {
            Identifier* id = (Identifier*)expr->callee.get();
            if (id->name == "print") {
                ss << "print(";
                for (size_t i = 0; i < expr->args.size(); i++) {
                    if (i > 0) ss << ", ";
                    visit(expr->args[i].get());
                }
                ss << ")";
                return;
            }
        }
        
        visit(expr->callee.get());
        ss << "(";
        for (size_t i = 0; i < expr->args.size(); i++) {
            if (i > 0) ss << ", ";
            visit(expr->args[i].get());
        }
        ss << ")";
    }
    
    void visitLiteral(Literal* lit) {
        if (lit->valueType == "string") ss << "Value(\"" << lit->value << "\")";
        else if (lit->valueType == "bool") ss << (lit->value == "true" ? "true" : "false");
        else ss << lit->value; // Numbers
    }
    
    void visitIdentifier(Identifier* id) {
        ss << id->name;
    }
    
    void indent() {
        for (int i = 0; i < indentLevel; i++) ss << "  ";
    }
};

#endif
