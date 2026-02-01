function fibonacci(n) {
    if (n < 2) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const start = Date.now();
console.log("Starting Node.js benchmark...");
console.log("Calculating fib(30)...");
const result = fibonacci(30);
const end = Date.now();
console.log("Result:", result);
console.log("Time:", end - start, "ms");
