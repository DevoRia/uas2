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
            case SWITCH_STMT: visitSwitch((SwitchStmt*)node); break;
            case WHILE_STMT: visitWhile((WhileStmt*)node); break;
            case RETURN_STMT: visitReturn((ReturnStmt*)node); break;
            case LET_STMT: visitLet((LetStmt*)node); break;
            case ASSIGN_STMT: visitAssign((AssignStmt*)node); break;
            case EXPR_STMT: visitExprStmt((ExprStmt*)node); break;
            case ASSIGN_EXPR: visitAssignExpr((AssignExpr*)node); break;
            case BINARY_EXPR: visitBinary((BinaryExpr*)node); break;
            case UNARY_EXPR: visitUnary((UnaryExpr*)node); break;
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
        ss << ")) {\n";
        indentLevel++;
        visit(stmt->thenBranch.get());
        indentLevel--;
        indent(); ss << "}";
        if (stmt->elseBranch) {
            ss << " else {\n";
            indentLevel++;
            visit(stmt->elseBranch.get());
            indentLevel--;
            indent(); ss << "}";
        }
        ss << "\n";
    }
    
    void visitSwitch(SwitchStmt* stmt) {
        indent(); ss << "{\n";
        indentLevel++;
        indent(); ss << "Value _sw = "; visit(stmt->discriminant.get()); ss << ";\n";
        
        bool first = true;
        for (auto& c : stmt->cases) {
            indent();
            if (!first) ss << "else ";
            
            bool isDefault = (c.patternName == "_" && !c.value);
            
            if (isDefault) {
                ss << "{\n";
            } else {
                ss << "if (";
                bool needsAnd = false;
                if (c.value) {
                    ss << "isTruthy(_sw == ";
                    visit(c.value.get());
                    ss << ")";
                    needsAnd = true;
                }
                
                if (!c.patternName.empty() && c.patternName != "_") {
                    // Variable binding - in simple transpiler we just allow it if guard or body uses it
                }
                
                if (c.guard) {
                    if (needsAnd) ss << " && ";
                    // To support variable name in guard, we'd need a lambda or similar.
                    // For now, let's assume the variable name is just used in the body.
                    // If we want it in guard:
                    ss << "isTruthy([&](){ ";
                    if (!c.patternName.empty() && c.patternName != "_") {
                        ss << "Value " << c.patternName << " = _sw; ";
                    }
                    ss << "return ";
                    visit(c.guard.get());
                    ss << "; }())";
                } else if (!needsAnd) {
                    ss << "true"; 
                }
                
                ss << ") {\n";
            }
            
            indentLevel++;
            if (!c.patternName.empty() && c.patternName != "_") {
                indent(); ss << "Value " << c.patternName << " = _sw;\n";
            }
            visit(c.body.get());
            indentLevel--;
            indent(); ss << "}\n";
            
            first = false;
            if (isDefault) break; // nothing after default
        }
        
        indentLevel--;
        indent(); ss << "}\n";
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
    
    void visitAssign(AssignStmt* stmt) {
        indent(); ss << stmt->name << " = ";
        visit(stmt->value.get());
        ss << ";\n";
    }
    
    void visitExprStmt(ExprStmt* stmt) {
        indent();
        visit(stmt->expr.get());
        ss << ";\n";
    }

    void visitAssignExpr(AssignExpr* expr) {
        ss << "(" << expr->name << " = ";
        visit(expr->value.get());
        ss << ")";
    }
    
    void visitBinary(BinaryExpr* expr) {
        if (expr->op == "%") {
            ss << "fmod(";
            visit(expr->left.get());
            ss << ", ";
            visit(expr->right.get());
            ss << ")";
            return;
        }
        if (expr->op == "**") {
            ss << "pow(";
            visit(expr->left.get());
            ss << ", ";
            visit(expr->right.get());
            ss << ")";
            return;
        }
        ss << "(";
        visit(expr->left.get());
        // Original comment: if (expr->op == "**") ss << " ^ "; // Overloaded ^ for power? C++ has ^ for XOR.
        // Original comment: // Better to use a function or overload ^ in Value.
        // Original comment: // I overloaded ^ in Runtime.
        ss << " " << expr->op << " "; // Now ** is handled by pow, so no special ^ mapping here.
        visit(expr->right.get());
        ss << ")";
    }
    
    void visitUnary(UnaryExpr* expr) {
        ss << expr->op;
        visit(expr->right.get());
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
