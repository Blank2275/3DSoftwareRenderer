import { QuickSin } from './QuickMath.ts';

// Generate random numbers in a range
function generateRandomNumbers(count: number, min: number, max: number): number[] {
    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
        numbers.push(Math.random() * (max - min) + min);
    }
    return numbers;
}

// Compare QuickSin and Math.sin
function compareSinFunctions(rangeStart: number, rangeEnd: number, step: number): void {
    let maxDifference = 0;

    for (let x = rangeStart; x <= rangeEnd; x += step) {
        const quickSinValue = QuickSin(x);
        const mathSinValue = Math.sin(x);
        const difference = Math.abs(quickSinValue - mathSinValue);

        if (difference > maxDifference) {
            maxDifference = difference;
        }
    }

    console.log(`Max difference between QuickSin and Math.sin: ${maxDifference}`);
}

// Benchmark a function
function benchmark(func: (x: number) => number, inputs: number[], label: string): void {
    const startTime = performance.now();

    for (const input of inputs) {
        func(input);
    }

    const endTime = performance.now();
    console.log(`${label} took ${(endTime - startTime).toFixed(2)} ms`);
}

// Main test
function main(): void {
    // Compare QuickSin and Math.sin across a range
    console.log('Comparing QuickSin and Math.sin...');
    compareSinFunctions(-1000, 1000, 0.01);

    // Benchmark both functions
    const randomInputs1k = generateRandomNumbers(1000, -1000, 1000);
    const randomInputs1M = generateRandomNumbers(1000000, -1000, 1000);
    // const randomInputs1B = generateRandomNumbers(1000000000, -1000, 1000); // Optional due to runtime constraints

    console.log('\nBenchmarking QuickSin:');
    benchmark(QuickSin, randomInputs1k, 'QuickSin (1,000 numbers)');
    benchmark(QuickSin, randomInputs1M, 'QuickSin (1,000,000 numbers)');
    // Uncomment if your system can handle 1 billion numbers
    // benchmark(QuickSin, randomInputs1B, 'QuickSin (1,000,000,000 numbers)');

    console.log('\nBenchmarking Math.sin:');
    benchmark(Math.sin, randomInputs1k, 'Math.sin (1,000 numbers)');
    benchmark(Math.sin, randomInputs1M, 'Math.sin (1,000,000 numbers)');
    // Uncomment if your system can handle 1 billion numbers
    // benchmark(Math.sin, randomInputs1B, 'Math.sin (1,000,000,000 numbers)');
}

main();
