/*
\*Do Not Use* This is a failed experiment, it is slower and less accurate than regular sin
 */
export function QuickSin(x: number): number {
    // Use a constant for 2π (6.283185307179586) to avoid recalculating it
    const TWO_PI = 6.283185307179586;
    const PI = 3.141592653589793;
    const HALF_PI = 1.5707963267948966;
    const SPLIT = 0.623;

    // Normalize x to the range [0, 2π)
    x = x % TWO_PI;
    if (x < 0) x += TWO_PI; // Handle negative inputs

    let reference = x;
    let sign = 1;

    // Use fewer comparisons for quadrant detection
    if (x > HALF_PI && x <= PI) {
        reference = PI - x; // Second quadrant
    } else if (x > PI && x <= 3 * HALF_PI) {
        reference = x - PI; // Third quadrant
        sign = -1;
    } else if (x > 3 * HALF_PI) {
        reference = TWO_PI - x; // Fourth quadrant
        sign = -1;
    }

    // Simplified series evaluation
    const ref2 = reference * reference;
    if (reference < SPLIT) {
        return (reference - ref2 * reference / 6) * sign; // Maclaurin series
    } else {
        const offset = reference - HALF_PI;
        const offset2 = offset * offset;
        return (1 - offset2 / 2 + offset2 * offset2 / 24) * sign; // Taylor series
    }
}