# Python Fibonacci Benchmark

def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Starting Python benchmark...")
print(f"Calculating fib(30)...")
result = fibonacci(30)
print(f"Result: {result}")
