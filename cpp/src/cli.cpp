
#include <iostream>
#include <fstream>
#include <sstream>
#include "lexer.h"
#include "parser.h"
#include "transpiler.h"

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: uas_transpiler <file.uas>" << std::endl;
        return 1;
    }
    
    std::string path = argv[1];
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "Could not open file " << path << std::endl;
        return 1;
    }
    
    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string source = buffer.str();
    
    Lexer lexer(source);
    auto tokens = lexer.tokenize();
    
    // For debug, list tokens?
    // for (auto& t : tokens) {
    //      std::cout << t.text << "(" << t.type << ") ";
    // }
    // std::cout << std::endl;
    
    Parser parser(tokens);
    auto program = parser.parse();
    
    Transpiler transpiler;
    std::string cppCode = transpiler.transpile(program.get());
    
    std::cout << cppCode;
    
    return 0;
}
