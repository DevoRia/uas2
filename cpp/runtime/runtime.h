
#ifndef RUNTIME_H
#define RUNTIME_H

#include <iostream>
#include <string>
#include <cmath>
#include <variant>
#include <vector>

// Minimal Runtime for Transpiled Code

enum ValueType { VAL_NONE, VAL_BOOL, VAL_NUMBER, VAL_STRING };

struct Value {
    ValueType type;
    double numberVal;
    bool boolVal;
    std::string stringVal;
    
    Value() : type(VAL_NONE), numberVal(0), boolVal(false) {}
    Value(double d) : type(VAL_NUMBER), numberVal(d), boolVal(false) {}
    Value(int i) : type(VAL_NUMBER), numberVal((double)i), boolVal(false) {}
    Value(long l) : type(VAL_NUMBER), numberVal((double)l), boolVal(false) {} // Explicit long support
    Value(bool b) : type(VAL_BOOL), numberVal(0), boolVal(b) {}
    Value(std::string s) : type(VAL_STRING), numberVal(0), boolVal(false), stringVal(s) {}
    Value(const char* s) : type(VAL_STRING), numberVal(0), boolVal(false), stringVal(s) {}
    
    // ... operators ...
    Value operator+(const Value& other) const {
        if (type == VAL_STRING || other.type == VAL_STRING) {
            std::string s1 = (type == VAL_STRING) ? stringVal : (type == VAL_NUMBER ? std::to_string(numberVal) : (boolVal ? "true" : "false"));
            std::string s2 = (other.type == VAL_STRING) ? other.stringVal : (other.type == VAL_NUMBER ? std::to_string(other.numberVal) : (other.boolVal ? "true" : "false"));
            // Clean up number string (remove trailing zeros?)
            return Value(s1 + s2);
        }
        if (type == VAL_NUMBER && other.type == VAL_NUMBER) return Value(numberVal + other.numberVal);
        return Value(0.0);
    }
    
    Value operator-(const Value& other) const { return Value(numberVal - other.numberVal); }
    Value operator*(const Value& other) const { return Value(numberVal * other.numberVal); }
    Value operator/(const Value& other) const { return Value(numberVal / other.numberVal); }
    
    Value operator%(const Value& other) const { 
        return Value((long)numberVal % (long)other.numberVal); 
    }
    
    Value operator^(const Value& other) const {
         return Value(std::pow(numberVal, other.numberVal));
    }

    Value operator<(const Value& other) const { return Value(numberVal < other.numberVal); }
    Value operator>(const Value& other) const { return Value(numberVal > other.numberVal); }
    Value operator<=(const Value& other) const { return Value(numberVal <= other.numberVal); }
    Value operator>=(const Value& other) const { return Value(numberVal >= other.numberVal); }
    
    Value operator==(const Value& other) const {
        if (type != other.type) return Value(false);
        if (type == VAL_NUMBER) return Value(numberVal == other.numberVal);
        return Value(false);
    }
};

const Value NONE_VAL;

bool isTruthy(const Value& v) {
    if (v.type == VAL_BOOL) return v.boolVal;
    if (v.type == VAL_NUMBER) return v.numberVal != 0;
    return false;
}

void print(const Value& v) {
    if (v.type == VAL_NUMBER) std::cout << v.numberVal;
    else if (v.type == VAL_BOOL) std::cout << (v.boolVal ? "true" : "false");
    else if (v.type == VAL_STRING) std::cout << v.stringVal;
    else std::cout << "none";
    std::cout << "\n";
}

// Ukrainian aliases
void друк(const Value& v) { print(v); }
#define повернення return
#define якщо if
#define інакше else
// ... identifiers in C++ code are untouched, so we just need runtime functions.

#endif
