/*
A 3D Vector [x, y, z]
 */
export type Vector = [number, number, number]

export function dot(a: Vector, b: Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vector, b: Vector): Vector {
    const i: number = a[1] * b[2] - a[2] * b[1];
    const j: number = a[2] * b[0] - a[0] * b[2];
    const k: number = a[0] * b[1] - a[1] * b[0];

    return [i, j, k];
}

export function add(a: Vector, b: Vector): Vector {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub(a: Vector, b: Vector): Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function mul(vec: Vector, scalar: number): Vector {
    return [vec[0] * scalar, vec[1] * scalar, vec[2] * scalar];
}

export function div(vec: Vector, scalar: number): Vector {
    return [vec[0] / scalar, vec[1] / scalar, vec[2] / scalar];
}

export function abs(vec: Vector): Vector {
    return [Math.abs(vec[0]), Math.abs(vec[1]), Math.abs(vec[2])]
}

export function magnitude(vec: Vector): number {
    return Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2) + Math.pow(vec[2], 2));
}

export function norm(vec: Vector): Vector {
    return div(vec, magnitude(vec))
}