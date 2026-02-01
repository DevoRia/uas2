
// Benchmark: Fibonacci sequence
// JavaScript implementation (Node.js)

function fibonacci(n) {
    if (n < 2) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Starting JavaScript benchmark...");
console.log("Calculating fib(25)...");

const start = Date.now();
const n = 30;
const result = fibonacci(n);
const end = Date.now();

console.log("Result: " + result);
console.log("Time: " + (end - start) + "ms");
