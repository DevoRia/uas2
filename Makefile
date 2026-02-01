# UaScript 2.0 AOT Compiler Makefile

CXX = /usr/bin/clang++
CXXFLAGS = -std=c++17 -O3
RUNTIME_DIR = cpp/runtime
SRC_DIR = cpp/src
BUILD_DIR = build

# Main compiler binary
COMPILER = $(BUILD_DIR)/uas

.PHONY: all clean test examples benchmark

all: $(COMPILER)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(COMPILER): $(SRC_DIR)/cli.cpp $(SRC_DIR)/*.h | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) -o $@ $(SRC_DIR)/cli.cpp

# Compile a .uas file to native executable
# Usage: make run FILE=examples/01_hello.uas
compile:
	@if [ -z "$(FILE)" ]; then echo "Usage: make compile FILE=file.uas"; exit 1; fi
	@echo "Transpiling $(FILE)..."
	@$(COMPILER) $(FILE) > $(BUILD_DIR)/temp.cpp
	@echo "Compiling to native..."
	@$(CXX) $(CXXFLAGS) -o $(BUILD_DIR)/output -I$(RUNTIME_DIR) $(BUILD_DIR)/temp.cpp
	@echo "Done! Binary: $(BUILD_DIR)/output"

# Run a .uas file
run: compile
	@echo "Running..."
	@$(BUILD_DIR)/output

# Test main examples
test: $(COMPILER)
	@echo "=== Testing 01_hello.uas ==="
	@$(COMPILER) examples/01_hello.uas > $(BUILD_DIR)/01.cpp
	@$(CXX) $(CXXFLAGS) -o $(BUILD_DIR)/01 -I$(RUNTIME_DIR) $(BUILD_DIR)/01.cpp
	@$(BUILD_DIR)/01
	@echo ""
	@echo "=== Testing 02_calculator.uas ==="
	@$(COMPILER) examples/02_calculator.uas > $(BUILD_DIR)/02.cpp
	@$(CXX) $(CXXFLAGS) -o $(BUILD_DIR)/02 -I$(RUNTIME_DIR) $(BUILD_DIR)/02.cpp
	@$(BUILD_DIR)/02

# Run performance benchmark
benchmark: $(COMPILER)
	@echo "=== Performance Benchmark: fib(30) ==="
	@$(COMPILER) benchmarks/benchmark.uas > $(BUILD_DIR)/bench.cpp
	@$(CXX) $(CXXFLAGS) -o $(BUILD_DIR)/bench -I$(RUNTIME_DIR) $(BUILD_DIR)/bench.cpp
	@echo ""
	@echo "UaScript AOT (with types):"
	@time $(BUILD_DIR)/bench
	@echo ""
	@echo "Node.js (for comparison):"
	@time node benchmarks/benchmark.js

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)
	@echo "Build directory cleaned"

# Install compiler to system (optional)
install: $(COMPILER)
	cp $(COMPILER) /usr/local/bin/uas
	@echo "Installed to /usr/local/bin/uas"
